import { useEffect, useMemo, useState } from 'react';
import { SpamDetectorService } from '@/services/spam-detector';
import { htmlToText } from '@/utils/html-to-text';

const SPAM_SUGGESTION_PARAM = 'spam-suggestion';

// Read once on load so the flag survives in-app navigation between mails
const isSpamSuggestionRequested = new URLSearchParams(window.location.search).has(SPAM_SUGGESTION_PARAM);

interface UseSpamSuggestionParams {
  subject: string;
  htmlBody: string;
  collapsed: boolean;
  isDecrypting?: boolean;
  decryptError?: boolean;
}

export interface SpamSuggestion {
  isSpam: boolean;
  confidencePercent: number;
}

export const useSpamSuggestion = ({
  subject,
  htmlBody,
  collapsed,
  isDecrypting,
  decryptError,
}: UseSpamSuggestionParams): SpamSuggestion | null => {
  const [result, setResult] = useState<{ text: string; suggestion: SpamSuggestion } | null>(null);
  const canSuggest = isSpamSuggestionRequested && !collapsed && !isDecrypting && !decryptError;
  const text = useMemo(() => `${subject} ${htmlToText(htmlBody)}`, [subject, htmlBody]);

  useEffect(() => {
    if (!canSuggest) return;

    let isCurrent = true;
    SpamDetectorService.instance
      .predict(text)
      .then(({ isSpam, spamProbability }) => {
        if (!isCurrent) return;
        const confidence = isSpam ? spamProbability : 1 - spamProbability;
        setResult({ text, suggestion: { isSpam, confidencePercent: Math.round(confidence * 100) } });
      })
      .catch(() => {
        // The suggestion is optional: if the model cannot run, the mail is shown without it
      });

    return () => {
      isCurrent = false;
    };
  }, [canSuggest, text]);

  return canSuggest && result?.text === text ? result.suggestion : null;
};
