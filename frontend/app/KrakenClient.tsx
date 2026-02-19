'use client';

import { useState } from 'react';
import SessionViewer from '@/components/SessionViewer';
import OnTickForm from '@/components/OnTickForm';

export default function KrakenClient() {
  // Em produção, estes valores viriam da autenticação
  const [sessionId] = useState('demo-session-123');
  const [organizationId] = useState('demo-org-123');
  const [userId] = useState('demo-user-123');

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Hub-IA-Kraken
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Modular Cognitive Operating System - Blackboard Pattern
          </p>
        </header>

        <div className="space-y-8">
          <OnTickForm sessionId={sessionId} organizationId={organizationId} userId={userId} />
          <SessionViewer sessionId={sessionId} organizationId={organizationId} />
        </div>
      </div>
    </main>
  );
}

