import type { EmailResponse, EncryptionBlock } from '@internxt/sdk/dist/mail/types';
import notificationsService, { ToastType } from '@/services/notifications';
import { useTranslationContext } from '@/i18n';
import { useAttachmentsSessionKey } from '@/hooks/mail/useAttachmentsSessionKey';
import { NetworkService } from '@/services/network';
import { useSanitizedMailHtml } from '../utils/useSanitizedMailHtml';
import AttachmentChip from '@/components/attachment-chip';

export type EmailAttachment = NonNullable<EmailResponse['attachments']>[number];

interface PreviewProps {
  mailId: string;
  subject: string;
  body: string;
  attachments?: EmailResponse['attachments'];
  envelope?: EncryptionBlock | null;
}

const Preview = ({ mailId, subject, body, attachments, envelope }: PreviewProps) => {
  const { translate } = useTranslationContext();
  const sanitizedBody = useSanitizedMailHtml(body);
  const attachmentsSessionKey = useAttachmentsSessionKey(mailId, envelope ?? null);

  const onDownload = async (attachment: EmailAttachment) => {
    try {
      const { blob, name } = await NetworkService.instance.download({
        ...attachment,
        mailId: mailId,
        attachmentsSessionKey: attachmentsSessionKey!,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name ?? attachment.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      notificationsService.show({
        text: translate('mail.preview.errors.downloadAttachmentFailed'),
        type: ToastType.Error,
      });
    }
  };

  return (
    <div className="flex flex-col w-full p-5">
      <div className="flex flex-col gap-2.5">
        <h2 className="text-2xl font-semibold text-gray-100">{subject}</h2>
        <div className="prose text-gray-100" dangerouslySetInnerHTML={{ __html: sanitizedBody }} />
      </div>

      {attachments && attachments.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <AttachmentChip
              key={attachment.blobId}
              fileName={attachment.name}
              size={attachment.size}
              type={attachment.type}
              onDownload={() => onDownload(attachment)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Preview;
