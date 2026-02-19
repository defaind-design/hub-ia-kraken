import { Timestamp } from 'firebase/firestore';

export interface SessionData {
  organizationId: string;
  userId: string;
  lastDelta: string;
  lastDeltaTimestamp: Timestamp;
  status: 'active' | 'completed' | 'error';
  blackboard?: {
    [key: string]: any;
  };
}

export interface SessionViewerProps {
  sessionId?: string;
  organizationId?: string;
  typewriterSpeed?: number;
}

export interface OnTickFormProps {
  sessionId: string;
  organizationId: string;
  userId: string;
  onSuccess?: () => void;
}

export interface TypewriterState {
  displayedText: string;
  isTyping: boolean;
}

export interface ScrollState {
  isUserScrolledUp: boolean;
}