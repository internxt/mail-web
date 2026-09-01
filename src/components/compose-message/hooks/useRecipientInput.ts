import { useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { parseRecipients } from '../helpers/parse-recipients';
import type { Recipient } from '../types';

interface UseRecipientInputParams {
  recipients: Recipient[];
  onAddRecipient: (email: string) => void;
  onRemoveRecipient: (id: string) => void;
  readOnly?: boolean;
}

const LIST_SEPARATORS = /[,;\s]/;

export const useRecipientInput = ({ recipients, onAddRecipient, onRemoveRecipient }: UseRecipientInputParams) => {
  const [inputValue, setInputValue] = useState('');

  const addRecipients = (value: string) => {
    const { emails, invalid } = parseRecipients(value);
    const alreadyAdded = new Set(recipients.map((recipient) => recipient.email.toLowerCase()));

    emails.filter((email) => !alreadyAdded.has(email.toLowerCase())).forEach((email) => onAddRecipient(email));
    setInputValue(invalid.join(', '));
  };

  const onInputChange = (value: string) => {
    setInputValue(value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',' || event.key === ';') {
      event.preventDefault();
      addRecipients(inputValue);
    } else if (event.key === 'Backspace' && inputValue === '' && recipients.length > 0) {
      onRemoveRecipient(recipients.at(-1)!.id);
    }
  };

  const onBlur = () => {
    addRecipients(inputValue);
  };

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData('text');
    // A single address without separators is left to the browser so it can still be edited before adding it.
    if (!LIST_SEPARATORS.test(pastedText.trim())) return;

    event.preventDefault();
    addRecipients(`${inputValue}${pastedText}`);
  };

  return { inputValue, onInputChange, onKeyDown, onBlur, onPaste };
};
