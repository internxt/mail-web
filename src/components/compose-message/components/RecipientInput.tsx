import { useState, type KeyboardEvent } from 'react';
import type { Recipient } from '../types';
import UserChip from '@/components/user-chip';
import isValidEmail from '@internxt/lib/dist/auth/isValidEmail';

interface RecipientInputProps {
  label: string;
  recipients: Recipient[];
  onAddRecipient: (email: string) => void;
  onRemoveRecipient: (id: string) => void;
  showCcBcc?: boolean;
  onCcClick?: () => void;
  onBccClick?: () => void;
  showCcButton?: boolean;
  showBccButton?: boolean;
  ccButtonText?: string;
  bccButtonText?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export const RecipientInput = ({
  label,
  recipients,
  onAddRecipient,
  onRemoveRecipient,
  showCcBcc = false,
  onCcClick,
  onBccClick,
  showCcButton = true,
  showBccButton = true,
  ccButtonText,
  bccButtonText,
  disabled,
  readOnly = false,
}: RecipientInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const email = inputValue.trim().replace(/,$/, '');
      if (email && isValidEmail(email)) {
        onAddRecipient(email);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && inputValue === '' && recipients.length > 0) {
      onRemoveRecipient(recipients.at(-1)!.id);
    }
  };

  const handleBlur = () => {
    const email = inputValue.trim();
    if (email && isValidEmail(email)) {
      onAddRecipient(email);
      setInputValue('');
    }
  };

  const onRemoveUser = (recipientId: string) => {
    if (readOnly) return;

    onRemoveRecipient(recipientId);
  };

  return (
    <div className="flex flex-row gap-2 items-start">
      <p className="font-medium max-w-16 w-full text-gray-100 py-2">{label}</p>
      <div className="flex-1 min-w-0 flex items-center gap-3 rounded-lg border border-gray-10 bg-surface px-3 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
        <div
          className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 py-0.5 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {recipients.map((recipient) => (
            <div key={recipient.id} className="shrink-0">
              <UserChip
                email={recipient.email}
                name={recipient?.name ?? recipient.email}
                avatar={recipient.avatar}
                onRemove={() => onRemoveUser(recipient.id)}
              />
            </div>
          ))}
          {!readOnly && (
            <input
              type="email"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              disabled={disabled}
              className={`flex-1 min-w-30 bg-transparent text-sm text-gray-100 placeholder:text-gray-40 focus:outline-none py-0.5 ${disabled ? 'cursor-not-allowed' : ''}`}
            />
          )}
        </div>
        {showCcBcc && (showCcButton || showBccButton) && (
          <div className="flex items-center gap-1 ml-auto shrink-0">
            {showCcButton && (
              <button
                type="button"
                onClick={onCcClick}
                disabled={disabled}
                className={`px-1.5 py-0.5 text-sm font-medium text-primary rounded bg-primary/20 hover:bg-primary/30 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {ccButtonText}
              </button>
            )}
            {showBccButton && (
              <button
                type="button"
                onClick={onBccClick}
                disabled={disabled}
                className={`px-1.5 py-0.5 text-sm font-medium text-primary rounded bg-primary/20 hover:bg-primary/30 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {bccButtonText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
