import { XIcon } from '@phosphor-icons/react';
import type { Recipient } from '../mail/composeMessageDialog/types';

interface RecipientChipProps {
  recipient: Recipient
  onRemove: () => void
}

export const RecipientChip = ({ recipient, onRemove }: RecipientChipProps) => (
  <span className="inline-flex items-center gap-1 rounded bg-gray-5 px-2 py-0.5 text-sm text-gray-80">
    {recipient.displayName || recipient.email}
    <button
      type="button"
      onClick={onRemove}
      className="rounded hover:bg-gray-10"
      aria-label={`Remove ${recipient.displayName || recipient.email}`}
    >
      <XIcon size={12} className="text-gray-50" />
    </button>
  </span>
);
