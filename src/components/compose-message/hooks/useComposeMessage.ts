import { useCallback, useState } from 'react';
import type { DraftMessage } from '..';
import type { Recipient } from '../types';

const useComposeMessage = (draft?: DraftMessage) => {
  const [subjectValue, setSubjectValue] = useState(draft?.subject ?? '');
  const [toRecipients, setToRecipients] = useState<Recipient[]>(draft?.to ?? []);
  const [ccRecipients, setCcRecipients] = useState<Recipient[]>(draft?.cc ?? []);
  const [bccRecipients, setBccRecipients] = useState<Recipient[]>(draft?.bcc ?? []);
  const [showCc, setShowCc] = useState(ccRecipients?.length > 0);
  const [showBcc, setShowBcc] = useState(bccRecipients?.length > 0);

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
  };
};

export default useComposeMessage;
