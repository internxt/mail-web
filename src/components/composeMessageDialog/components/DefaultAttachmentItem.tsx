import { PaperclipIcon, XIcon } from '@phosphor-icons/react'
import type { Attachment } from '../types'

export const DefaultAttachmentItem = ({
  attachment,
  onRemove,
}: {
  attachment: Attachment
  onRemove: () => void
}) => (
  <div className="flex items-center justify-between rounded-lg border border-gray-10 bg-gray-5 px-3 py-2">
    <div className="flex items-center gap-2 min-w-0">
      <PaperclipIcon size={16} className="shrink-0 text-gray-50" />
      <span className="truncate text-sm text-gray-100">{attachment.name}</span>
      <span className="shrink-0 text-xs text-gray-50">({attachment.size})</span>
    </div>
    <button
      type="button"
      onClick={onRemove}
      className="ml-2 shrink-0 rounded p-1 hover:bg-gray-10"
      aria-label={`Remove ${attachment.name}`}
    >
      <XIcon size={14} className="text-gray-50" />
    </button>
  </div>
)
