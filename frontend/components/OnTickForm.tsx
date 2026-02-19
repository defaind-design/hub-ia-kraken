'use client';

import { useState } from 'react';

interface OnTickFormProps {
  sessionId: string;
  organizationId: string;
  userId: string;
  onSuccess?: () => void;
}

export default function OnTickForm({
  sessionId,
  organizationId,
  userId,
  onSuccess,
}: OnTickFormProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Obter URL da Cloud Function
      const functionUrl = process.env.NEXT_PUBLIC_CLOUD_FUNCTION_URL || 
        `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'your-project'}-us-central1.cloudfunctions.net/onTick`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          prompt: prompt.trim(),
          organizationId,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process request');
      }

      const data = await response.json();
      setSuccess(true);
      setPrompt('');
      
      if (onSuccess) {
        onSuccess();
      }

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Enter your prompt:
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type your message here..."
          className="w-full min-h-[120px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     resize-y"
          disabled={loading}
        />
        
        {error && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-800 dark:text-green-200 text-sm">
            Request sent successfully! Check the session viewer for streaming updates.
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="mt-4 w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 
                     disabled:bg-gray-400 disabled:cursor-not-allowed
                     text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Processing...
            </span>
          ) : (
            'Send Prompt'
          )}
        </button>
      </div>
    </form>
  );
}
