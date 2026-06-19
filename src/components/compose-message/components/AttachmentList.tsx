import { bytesToString } from '@/utils/bytes-to-string';
import { useTranslationContext } from '@/i18n';
import { type AttachmentTask } from '../hooks/useAttachments';
import { MAX_TOTAL_ATTACHMENT_BYTES_PER_MAIL } from '@/constants';
import AttachmentChip from '@/components/attachment-chip';

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
    <div className="flex flex-col gap-2">
      <div className="flex pt-3 flex-row gap-2 overflow-x-auto">
        {attachments.map((a) => (
          <div key={a.id} className="shrink-0">
            <AttachmentChip
              fileName={a.name}
              size={a.size}
              type={a.type}
              status={a.status}
              onRetry={() => onRetry(a.id)}
              onRemove={() => onRemove(a.id)}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-50">
        {translate('modals.composeMessageDialog.attachments.totalSize', {
          used: bytesToString({ size: totalSize }),
          max: bytesToString({ size: MAX_TOTAL_ATTACHMENT_BYTES_PER_MAIL }),
        })}
      </p>
    </div>
  );
};
