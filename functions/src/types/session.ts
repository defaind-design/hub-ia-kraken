import { Timestamp } from 'firebase-admin/firestore';

/**
 * Tipos para o sistema de sessões baseado em Blackboard Pattern
 * Todos os agentes compartilham o mesmo documento de sessão como contexto
 */

export interface Session {
  id: string;
  organizationId: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Blackboard: contexto compartilhado entre agentes
  blackboard: {
    [key: string]: any;
  };
  
  // Último delta do streaming Gemini
  lastDelta: string;
  lastDeltaTimestamp: Timestamp;
  
  // Estado da sessão
  status: 'active' | 'completed' | 'error';
  
  // Metadados opcionais
  metadata?: {
    [key: string]: any;
  };
}

export interface OnTickRequest {
  sessionId: string;
  prompt: string;
  organizationId: string;
  userId: string;
  context?: {
    [key: string]: any;
  };
}

export interface OnTickResponse {
  success: boolean;
  sessionId: string;
  message?: string;
  error?: string;
}

/**
 * Estrutura do documento no Firestore
 * sessions/{sessionId}
 */
export interface SessionDocument {
  organizationId: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  blackboard: {
    [key: string]: any;
  };
  lastDelta: string;
  lastDeltaTimestamp: Timestamp;
  status: 'active' | 'completed' | 'error';
  metadata?: {
    [key: string]: any;
  };
}
