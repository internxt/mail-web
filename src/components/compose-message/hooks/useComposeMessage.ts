import { useCallback, useState } from 'react';
import type { Recipient } from '../types';

interface InitialValues {
  subject?: string;
  to?: Recipient[];
  cc?: Recipient[];
  bcc?: Recipient[];
}

const useComposeMessage = () => {
  const [subjectValue, setSubjectValue] = useState<string>('');
  const [toRecipients, setToRecipients] = useState<Recipient[]>([]);
  const [ccRecipients, setCcRecipients] = useState<Recipient[]>([]);
  const [bccRecipients, setBccRecipients] = useState<Recipient[]>([]);
  const [showCc, setShowCc] = useState((ccRecipients?.length ?? 0) > 0);
  const [showBcc, setShowBcc] = useState((bccRecipients?.length ?? 0) > 0);

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

  const setInitialValues = useCallback((initialValues: InitialValues) => {
    setSubjectValue(initialValues.subject ?? '');
    setToRecipients(initialValues.to ?? []);
    setCcRecipients(initialValues.cc ?? []);
    setBccRecipients(initialValues.bcc ?? []);
    setShowCc((initialValues.cc?.length ?? 0) > 0);
    setShowBcc((initialValues.bcc?.length ?? 0) > 0);
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
    setInitialValues,
    clear,
  };
};

export default useComposeMessage;
