'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SessionViewerProps {
  sessionId?: string;
  organizationId?: string;
  typewriterSpeed?: number;
}

interface SessionData {
  organizationId: string;
  userId: string;
  lastDelta: string;
  lastDeltaTimestamp: Timestamp;
  status: 'active' | 'completed' | 'error';
  blackboard?: {
    [key: string]: any;
  };
}

// Hook para efeito typewriter
const useTypewriter = (text: string, speed: number = 20) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setIsTyping(true);

    let currentIndex = 0;
    
    const typeNextChar = () => {
      if (currentIndex < text.length) {
        setDisplayedText(prev => prev + text.charAt(currentIndex));
        currentIndex++;
        timeoutRef.current = setTimeout(typeNextChar, speed);
      } else {
        setIsTyping(false);
      }
    };

    // Start typing after a small delay for better UX
    const startDelay = setTimeout(() => {
      typeNextChar();
    }, 100);

    return () => {
      clearTimeout(startDelay);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed]);

  return { displayedText, isTyping };
};

// Hook para scroll automático inteligente
const useAutoScroll = (dependencies: any[]) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);

  const checkUserScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    isUserScrolledUp.current = !isAtBottom;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', checkUserScroll);
    return () => container.removeEventListener('scroll', checkUserScroll);
  }, [checkUserScroll]);

  useEffect(() => {
    if (!containerRef.current || isUserScrolledUp.current) return;

    // Smooth scroll to bottom
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, dependencies);

  return containerRef;
};

export default function SessionViewer({
  sessionId = 'test-session-001',
  organizationId = 'org-pablo-astrologia',
  typewriterSpeed = 20,
}: SessionViewerProps) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [accumulatedText, setAccumulatedText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDeltaKey, setLastDeltaKey] = useState(0); // Força re-render do typewriter

  const { displayedText: typedDelta, isTyping } = useTypewriter(
    sessionData?.lastDelta || '',
    typewriterSpeed
  );

  // Ref para scroll automático
  const accumulatedContainerRef = useAutoScroll([accumulatedText]);
  const deltaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) return;

    const sessionRef = doc(db, 'sessions', sessionId);
    
    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as SessionData;
          
          // Validação de organização (multi-tenancy)
          if (data.organizationId !== organizationId) {
            setError(`Session does not belong to organization: ${organizationId}`);
            return;
          }

          setSessionData(data);
          setError(null);

          // Acumular texto imediatamente para evitar race condition
          if (data.lastDelta) {
            setAccumulatedText(prev => {
              // Verifica se o final do texto acumulado já contém o delta para evitar duplicidade
              if (prev.endsWith(data.lastDelta)) return prev;
              return prev + data.lastDelta;
            });
            setLastDeltaKey(prev => prev + 1); // Reinicia o typewriter
          }

          setLoading(false);
        } else {
          setError(`Session "${sessionId}" not found in Firestore`);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error listening to session:', err);
        setError(`Firestore error: ${err.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId, organizationId]);

  // Efeito para scroll automático no lastDelta enquanto digita
  useEffect(() => {
    if (deltaContainerRef.current && isTyping) {
      deltaContainerRef.current.scrollTop = deltaContainerRef.current.scrollHeight;
    }
  }, [typedDelta, isTyping]);

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-300';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'error': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-gray-600 dark:text-gray-400">
          Listening to session: <span className="font-mono font-bold">{sessionId}</span>
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 font-bold">!</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-800">Session Error</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <div className="mt-3 text-sm text-gray-600">
              <p>Session ID: <span className="font-mono">{sessionId}</span></p>
              <p>Organization ID: <span className="font-mono">{organizationId}</span></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      {/* Header with session info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Kraken Session Monitor
            </h2>
            <div className="mt-2 space-y-1">
              <p className="text-gray-600 dark:text-gray-400">
                Session: <span className="font-mono font-semibold">{sessionId}</span>
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Organization: <span className="font-mono font-semibold">{organizationId}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(sessionData?.status || '')}`}>
              {sessionData?.status?.toUpperCase() || 'UNKNOWN'}
            </span>
            {isTyping && (
              <div className="flex items-center gap-2 animate-pulse">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-green-600 font-medium">TYPING...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Streaming Delta (Typewriter Effect) */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            LIVE STREAMING (LAST DELTA)
          </h3>
          {sessionData?.lastDeltaTimestamp && (
            <span className="text-sm text-gray-400">
              {sessionData.lastDeltaTimestamp.toDate().toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div
          ref={deltaContainerRef}
          className="min-h-[150px] max-h-[300px] overflow-y-auto bg-black/30 rounded-lg border border-gray-700 p-5 font-mono"
        >
          <div key={lastDeltaKey} className="text-gray-100 whitespace-pre-wrap leading-relaxed">
            {typedDelta}
            {isTyping && (
              <span className="inline-block h-5 w-[2px] bg-blue-400 ml-1 animate-pulse align-middle"></span>
            )}
          </div>
          
          {!sessionData?.lastDelta && !isTyping && (
            <div className="text-gray-500 italic">
              Waiting for streaming response from Kraken...
            </div>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="text-gray-400">
            {isTyping ? (
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Kraken is thinking...
              </span>
            ) : sessionData?.lastDelta ? (
              <span className="text-green-400">✓ Stream complete</span>
            ) : null}
          </div>
          <div className="text-gray-500">
            Typewriter speed: {typewriterSpeed}ms/char
          </div>
        </div>
      </div>

      {/* Accumulated Response with Auto-scroll */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            ACCUMULATED RESPONSE HISTORY
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Auto-scroll: {accumulatedText.length > 0 ? 'ACTIVE' : 'INACTIVE'}
          </div>
        </div>
        
        <div
          ref={accumulatedContainerRef}
          className="min-h-[300px] max-h-[600px] overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-5"
        >
          {accumulatedText ? (
            <pre className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
              {accumulatedText}
            </pre>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 italic">
              No accumulated response yet. The streaming content will appear here.
            </div>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <div>
            Characters: <span className="font-mono font-semibold">{accumulatedText.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
            Real-time Firestore listener active
          </div>
        </div>
      </div>

      {/* Blackboard Context (Collapsible) */}
      {sessionData?.blackboard && Object.keys(sessionData.blackboard).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            BLACKBOARD CONTEXT
          </h3>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-[400px] overflow-y-auto">
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {JSON.stringify(sessionData.blackboard, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}