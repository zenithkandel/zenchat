import { useState, useCallback } from 'react';
import { useTransport } from '../transport/TransportContext';

export function useSendMessage() {
  const { sendMessage } = useTransport();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (peerId: string, text: string) => {
      setIsSending(true);
      setError(null);
      try {
        await sendMessage(peerId, text);
        return true;
      } catch (err: any) {
        const msg = err?.message || 'Failed to send message.';
        setError(msg);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [sendMessage]
  );

  return {
    send,
    isSending,
    error,
    clearError: () => setError(null),
  };
}
