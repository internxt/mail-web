import type { Icon } from '@phosphor-icons/react';

export interface Recipient {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface EditorBarItem {
  id: string;
  icon: Icon;
  onClick: () => void;
  isActive?: boolean;
}

export interface DraftMessage {
  subject?: string;
  to?: Recipient[];
  cc?: Recipient[];
  bcc?: Recipient[];
}
