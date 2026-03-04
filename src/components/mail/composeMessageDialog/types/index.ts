import type { Icon } from '@phosphor-icons/react';

export interface Attachment {
  id: string
  name: string
  size: number
}

export interface Recipient {
  id: string
  email: string
  displayName?: string
}

export interface EditorBarItem {
  id: string
  icon: Icon
  onClick: () => void
  isActive?: boolean
}
