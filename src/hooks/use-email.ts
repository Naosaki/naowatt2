import { useState } from 'react';

type EmailType = 'share-notification' | 'welcome';

interface UseEmailOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useEmail(options: UseEmailOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Envoie un email via l'API
   */
  const sendEmail = async (type: EmailType, data: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Une erreur est survenue lors de l\'envoi de l\'email');
      }

      if (options.onSuccess) {
        options.onSuccess(result.data);
      }

      return result.data;
    } catch (err: any) {
      const errorObj = new Error(err.message || 'Une erreur est survenue');
      setError(errorObj);
      
      if (options.onError) {
        options.onError(errorObj);
      }
      
      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Envoie un email de notification de partage
   */
  const sendShareNotification = async ({
    to,
    recipientName,
    senderName,
    resourceName,
    resourceLink,
  }: {
    to: string | string[];
    recipientName?: string;
    senderName: string;
    resourceName: string;
    resourceLink: string;
  }) => {
    return sendEmail('share-notification', {
      to,
      recipientName,
      senderName,
      resourceName,
      resourceLink,
    });
  };

  /**
   * Envoie un email de bienvenue
   */
  const sendWelcomeEmail = async ({
    to,
    userName,
    dashboardLink,
  }: {
    to: string | string[];
    userName: string;
    dashboardLink: string;
  }) => {
    return sendEmail('welcome', {
      to,
      userName,
      dashboardLink,
    });
  };

  return {
    isLoading,
    error,
    sendShareNotification,
    sendWelcomeEmail,
  };
}
