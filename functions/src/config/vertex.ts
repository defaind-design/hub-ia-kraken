import { VertexAI } from '@google-cloud/vertexai';

/**
 * Configuração do Vertex AI para Gemini
 * Otimizado para Spark plan - usa Application Default Credentials
 */
let vertexAI: VertexAI | null = null;

export function getVertexAI(): VertexAI {
  if (vertexAI) {
    return vertexAI;
  }

  const projectId = process.env.GCP_PROJECT_ID || process.env.GCLOUD_PROJECT;
  const location = process.env.VERTEX_AI_REGION || 'us-central1';
  const model = 'gemini-1.5-flash';

  if (!projectId) {
    throw new Error('GCP_PROJECT_ID or GCLOUD_PROJECT environment variable is required');
  }

  vertexAI = new VertexAI({
    project: projectId,
    location: location,
  });

  return vertexAI;
}

export function getModelName(): string {
  return 'gemini-1.5-flash';
}

export function getVertexAIConfig() {
  const projectId = process.env.GCP_PROJECT_ID || process.env.GCLOUD_PROJECT;
  const location = process.env.VERTEX_AI_REGION || 'us-central1';
  
  return {
    projectId,
    location,
    model: getModelName(),
  };
}
