import type { Recipient } from '../types';
import UserChip from '@/components/user-chip';
import { useRecipientInput } from '../hooks/useRecipientInput';

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
  const { inputValue, onInputChange, onKeyDown, onBlur, onPaste } = useRecipientInput({
    recipients,
    onAddRecipient,
    onRemoveRecipient,
    readOnly,
  });

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
                name={(recipient.name ?? '').trim() || recipient.email}
                avatar={recipient.avatar}
                onRemove={readOnly ? undefined : () => onRemoveRecipient(recipient.id)}
              />
            </div>
          ))}
          {!readOnly && (
            <input
              type="email"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              onBlur={onBlur}
              disabled={disabled}
              aria-label={label}
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
