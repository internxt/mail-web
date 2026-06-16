import { useCallback, useState } from 'react';
import type { Recipient } from '../types';

interface InitialDraft {
  subject?: string;
  to?: Recipient[];
  cc?: Recipient[];
  bcc?: Recipient[];
}

const useComposeMessage = (initialDraft?: InitialDraft) => {
  const [subjectValue, setSubjectValue] = useState<string>(initialDraft?.subject ?? '');
  const [toRecipients, setToRecipients] = useState<Recipient[]>(initialDraft?.to ?? []);
  const [ccRecipients, setCcRecipients] = useState<Recipient[]>(initialDraft?.cc ?? []);
  const [bccRecipients, setBccRecipients] = useState<Recipient[]>(initialDraft?.bcc ?? []);
  const [showCc, setShowCc] = useState((initialDraft?.cc?.length ?? 0) > 0);
  const [showBcc, setShowBcc] = useState((initialDraft?.bcc?.length ?? 0) > 0);

  const onShowCcRecipient = () => {
    setShowCc(true);
  };

  const onShowBccRecipient = () => {
    setShowBcc(true);
  };

  const onSubjectChange = useCallback((value: string) => {
    setSubjectValue(value);
  }, []);

  const onAddToRecipient = useCallback((email: string) => {
    setToRecipients((prev) => [...prev, { id: crypto.randomUUID(), email }]);
  }, []);

  const onRemoveToRecipient = useCallback((id: string) => {
    setToRecipients((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const onAddCcRecipient = useCallback((email: string) => {
    setCcRecipients((prev) => [...prev, { id: crypto.randomUUID(), email }]);
  }, []);

  const onRemoveCcRecipient = useCallback((id: string) => {
    setCcRecipients((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const onAddBccRecipient = useCallback((email: string) => {
    setBccRecipients((prev) => [...prev, { id: crypto.randomUUID(), email }]);
  }, []);

  const onRemoveBccRecipient = useCallback((id: string) => {
    setBccRecipients((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const clear = () => {
    setSubjectValue('');
    setToRecipients([]);
    setCcRecipients([]);
    setBccRecipients([]);
    setShowCc(false);
    setShowBcc(false);
  };

  return {
    subjectValue,
    toRecipients,
    ccRecipients,
    bccRecipients,
    showCc,
    showBcc,
    onShowCcRecipient,
    onShowBccRecipient,
    onSubjectChange,
    onAddToRecipient,
    onRemoveToRecipient,
    onAddCcRecipient,
    onRemoveCcRecipient,
    onAddBccRecipient,
    onRemoveBccRecipient,
    clear,
  };
};

export default useComposeMessage;
