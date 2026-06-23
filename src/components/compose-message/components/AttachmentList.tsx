import { useTranslationContext } from '@/i18n';
import { type AttachmentTask } from '../hooks/useAttachments';
import AttachmentChip from '@/components/attachment-chip';
import { bytesToString } from '@/utils/bytes-to-string';

interface AttachmentListProps {
  attachments: AttachmentTask[];
  totalSize: number;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

export const AttachmentList = ({ attachments, totalSize, onRemove, onRetry }: AttachmentListProps) => {
  const { translate } = useTranslationContext();
  const attachmentsLength = attachments.length;
  if (attachmentsLength === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="px-5 border border-gray-10" />
      <div className="flex flex-row gap-2 items-center">
        <p className="text-sm">{bytesToString({ size: totalSize, removeSpace: false })}</p>
        <p className="text-sm text-gray-50">
          {attachmentsLength}{' '}
          {attachmentsLength > 1 ? translate('composeMessage.attachments') : translate('composeMessage.attachment')}
        </p>
      </div>
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
    </div>
  );
};
