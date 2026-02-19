import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getVertexAI, getModelName } from './config/vertex';
import { OnTickRequest, OnTickResponse, SessionDocument } from './types/session';
import * as logger from 'firebase-functions/logger';

// Inicializar Firebase Admin
initializeApp();
const db = getFirestore();

/**
 * Função onTick - Processa prompts com streaming do Gemini
 * 
 * Características:
 * - Streaming em tempo real do Gemini
 * - Atualização incremental do Firestore (lastDelta)
 * - Padrão Blackboard: contexto compartilhado via Firestore
 * - Otimizado para Spark plan (timeout 60s, processamento eficiente)
 */
export const onTick = onRequest(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
    maxInstances: 10,
    cors: true,
  },
  async (request, response) => {
    // Configurar CORS
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    if (request.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const body = request.body as OnTickRequest;
      const { sessionId, prompt, organizationId, userId, context } = body;

      // Validação básica
      if (!sessionId || !prompt || !organizationId || !userId) {
        response.status(400).json({
          success: false,
          error: 'Missing required fields: sessionId, prompt, organizationId, userId',
        } as OnTickResponse);
        return;
      }

      logger.info('onTick called', {
        sessionId,
        organizationId,
        userId,
        promptLength: prompt.length,
      });

      // Referência do documento de sessão (Blackboard)
      const sessionRef = db.collection('sessions').doc(sessionId);

      // Verificar se a sessão existe e pertence à organização
      const sessionDoc = await sessionRef.get();
      if (!sessionDoc.exists) {
        // Criar nova sessão se não existir
        const newSession: SessionDocument = {
          organizationId,
          userId,
          createdAt: FieldValue.serverTimestamp() as any,
          updatedAt: FieldValue.serverTimestamp() as any,
          blackboard: context || {},
          lastDelta: '',
          lastDeltaTimestamp: FieldValue.serverTimestamp() as any,
          status: 'active',
        };
        await sessionRef.set(newSession);
      } else {
        const existingSession = sessionDoc.data() as SessionDocument;
        // Verificar organização
        if (existingSession.organizationId !== organizationId) {
          response.status(403).json({
            success: false,
            error: 'Session does not belong to this organization',
          } as OnTickResponse);
          return;
        }
        // Atualizar blackboard com contexto adicional se fornecido
        if (context) {
          await sessionRef.update({
            blackboard: { ...existingSession.blackboard, ...context },
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      // Obter contexto atual do blackboard
      const currentSession = (await sessionRef.get()).data() as SessionDocument;
      const blackboardContext = currentSession.blackboard || {};

      // Preparar prompt com contexto do blackboard
      const contextualPrompt = buildContextualPrompt(prompt, blackboardContext);

      // Inicializar Vertex AI
      const vertexAI = getVertexAI();
      const model = vertexAI.getGenerativeModel({
        model: getModelName(),
      });

      // Configurar streaming
      let accumulatedText = '';
      let chunkCount = 0;

      // Iniciar streaming
      const stream = await model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: contextualPrompt }] }],
      });

      // Processar chunks do stream
      for await (const chunk of stream.stream) {
        const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (chunkText) {
          accumulatedText += chunkText;
          chunkCount++;

          // Atualizar Firestore com cada chunk (lastDelta)
          await sessionRef.update({
            lastDelta: chunkText,
            lastDeltaTimestamp: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          logger.debug('Chunk processed', {
            sessionId,
            chunkCount,
            chunkLength: chunkText.length,
          });
        }
      }

      // Atualizar blackboard com resposta completa
      await sessionRef.update({
        blackboard: {
          ...blackboardContext,
          lastResponse: accumulatedText,
          lastPrompt: prompt,
        },
        updatedAt: FieldValue.serverTimestamp(),
        status: 'active',
      });

      logger.info('onTick completed', {
        sessionId,
        totalChunks: chunkCount,
        totalLength: accumulatedText.length,
      });

      // Resposta de sucesso
      response.status(200).json({
        success: true,
        sessionId,
        message: 'Streaming completed successfully',
      } as OnTickResponse);

    } catch (error: any) {
      logger.error('onTick error', {
        error: error.message,
        stack: error.stack,
      });

      // Tentar atualizar status da sessão em caso de erro
      try {
        const sessionId = (request.body as OnTickRequest).sessionId;
        if (sessionId) {
          await db.collection('sessions').doc(sessionId).update({
            status: 'error',
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      } catch (updateError) {
        logger.error('Failed to update session status', { error: updateError });
      }

      response.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      } as OnTickResponse);
    }
  }
);

/**
 * Constrói prompt contextualizado usando dados do blackboard
 */
function buildContextualPrompt(userPrompt: string, blackboard: { [key: string]: any }): string {
  const contextEntries = Object.entries(blackboard)
    .filter(([key]) => key !== 'lastResponse' && key !== 'lastPrompt')
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');

  if (!contextEntries) {
    return userPrompt;
  }

  return `Context from blackboard:
${contextEntries}

User prompt: ${userPrompt}`;
}
