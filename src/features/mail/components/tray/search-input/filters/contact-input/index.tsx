import { useState } from 'react';
import isValidEmail from '@internxt/lib/dist/src/auth/isValidEmail';
import { XIcon } from '@phosphor-icons/react';

interface ContactInputProps {
  emails: string[];
  onAdd: (email: string) => void;
  onRemove: (email: string) => void;
  placeholder: string;
  offsetLeft: number;
}

const ContactInput = ({ emails, onAdd, onRemove, placeholder, offsetLeft }: ContactInputProps) => {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed || emails.includes(trimmed) || !isValidEmail(trimmed)) {
      return;
    }

    onAdd(trimmed);
    setDraft('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && draft === '' && emails.length > 0) {
      onRemove(emails.at(-1) ?? '');
    }
  };

  return (
    <div
      className="absolute top-full z-30 mt-1 w-full max-w-65 rounded-xl border border-gray-10 bg-surface shadow-subtle-hard"
      style={{ left: offsetLeft }}
    >
      <div className="flex w-full flex-wrap items-center gap-1.5 px-3 py-2.5">
        {emails.map((email) => (
          <span
            key={email}
            className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
          >
            {email}
            <button
              type="button"
              aria-label={email}
              onClick={() => onRemove(email)}
              className="opacity-60 hover:opacity-100"
            >
              <XIcon size={10} />
            </button>
          </span>
        ))}
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          placeholder={emails.length === 0 ? placeholder : ''}
          className="w-full bg-transparent text-sm text-gray-100 placeholder-gray-40 outline-none"
        />
      </div>
    </div>
  );
};

export default ContactInput;
