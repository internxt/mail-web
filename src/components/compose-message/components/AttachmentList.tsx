import { ArrowClockwiseIcon, PaperclipIcon, SpinnerIcon, WarningIcon, XIcon } from '@phosphor-icons/react';
import { bytesToString } from '@/utils/bytes-to-string';
import { useTranslationContext } from '@/i18n';
import { MAX_TOTAL_ATTACHMENT_BYTES, type AttachmentTask } from '../hooks/useAttachments';

interface AttachmentListProps {
  attachments: AttachmentTask[];
  totalSize: number;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

export const AttachmentList = ({ attachments, totalSize, onRemove, onRetry }: AttachmentListProps) => {
  const { translate } = useTranslationContext();
  if (attachments.length === 0) return null;
  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {attachments.map((a) => (
          <div key={a.id} className="flex items-center gap-1.5 rounded-md bg-gray-5 px-2 py-1">
            {a.status === 'uploading' && <SpinnerIcon size={14} className="animate-spin" />}
            {a.status === 'done' && <PaperclipIcon size={14} />}
            {a.status === 'error' && <WarningIcon size={14} weight="fill" className="text-red" />}
            <span className="text-sm font-medium text-gray-80">{a.name}</span>
            <span className="text-xs text-gray-50">{bytesToString({ size: a.size })}</span>
            {a.status === 'error' && (
              <ArrowClockwiseIcon className="cursor-pointer" size={14} weight="bold" onClick={() => onRetry(a.id)} />
            )}
            <XIcon className="cursor-pointer" size={14} weight="bold" onClick={() => onRemove(a.id)} />
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-50">
        {translate('modals.composeMessageDialog.attachments.totalSize', {
          used: bytesToString({ size: totalSize }),
          max: bytesToString({ size: MAX_TOTAL_ATTACHMENT_BYTES }),
        })}
      </p>
    </div>
  );
};
