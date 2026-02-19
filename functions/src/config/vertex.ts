import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Configuração do Google AI Studio (Gemini API)
 * Usa GEMINI_API_KEY (configurada como Secret no Cloud Functions)
 */
let genAI: GoogleGenerativeAI | null = null;

export function getGenAI(): GoogleGenerativeAI {
  if (genAI) {
    return genAI;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY environment variable is required. Configure it as a Secret in Cloud Functions.'
    );
  }

  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

export function getModelName(): string {
  return 'gemini-1.5-flash';
}

