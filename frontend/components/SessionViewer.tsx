'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SessionViewerProps {
  sessionId: string;
  organizationId: string;
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

export default function SessionViewer({ sessionId, organizationId }: SessionViewerProps) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [accumulatedText, setAccumulatedText] = useState('');
  const [lastTimestamp, setLastTimestamp] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const sessionRef = doc(db, 'sessions', sessionId);
    
    // Escutar mudanças em tempo real no documento da sessão
    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as SessionData;
          
          // Verificar organização
          if (data.organizationId !== organizationId) {
            setError('Session does not belong to this organization');
            return;
          }

          setSessionData(data);
          
          // Acumular texto do lastDelta apenas se for um novo chunk
          if (data.lastDelta && data.lastDeltaTimestamp) {
            const currentTimestamp = data.lastDeltaTimestamp.toDate();
            // Só acumula se o timestamp mudou (novo chunk)
            if (!lastTimestamp || currentTimestamp.getTime() > lastTimestamp.getTime()) {
              setAccumulatedText((prev) => prev + data.lastDelta);
              setLastTimestamp(currentTimestamp);
            }
          }
          
          setLoading(false);
          setError(null);
        } else {
          setError('Session not found');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error listening to session:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId, organizationId, lastTimestamp]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-semibold">Error:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Status:</span>
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            sessionData?.status === 'active'
              ? 'bg-green-100 text-green-800'
              : sessionData?.status === 'completed'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {sessionData?.status || 'unknown'}
        </span>
      </div>

      {/* Último Delta (streaming em tempo real) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Last Delta (Streaming):
        </h3>
        <div className="min-h-[100px] p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {sessionData?.lastDelta || 'Waiting for response...'}
          </p>
        </div>
        {sessionData?.lastDeltaTimestamp && (
          <p className="text-xs text-gray-500 mt-2">
            Updated: {sessionData.lastDeltaTimestamp.toDate().toLocaleString()}
          </p>
        )}
      </div>

      {/* Texto Acumulado */}
      {accumulatedText && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Accumulated Response:
          </h3>
          <div className="min-h-[200px] max-h-[600px] overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {accumulatedText}
            </p>
          </div>
        </div>
      )}

      {/* Blackboard Context */}
      {sessionData?.blackboard && Object.keys(sessionData.blackboard).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Blackboard Context:
          </h3>
          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
            {JSON.stringify(sessionData.blackboard, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
