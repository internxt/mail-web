import type { EmailResponse, EncryptionBlock } from '@internxt/sdk/dist/mail/types';
import { DownloadSimpleIcon, PaperclipIcon } from '@phosphor-icons/react';
import DOMPurify from 'dompurify';
import { bytesToString } from '@/utils/bytes-to-string';
import notificationsService, { ToastType } from '@/services/notifications';
import { useTranslationContext } from '@/i18n';
import { useAttachmentsSessionKey } from '@/hooks/mail/useAttachmentsSessionKey';
import { NetworkService } from '@/services/network';

const purify = DOMPurify();

purify.addHook('afterSanitizeAttributes', (node) => {
  const tag = node.tagName?.toLowerCase();

  if (tag === 'img' || tag === 'video' || tag === 'audio' || tag === 'source') {
    const src = node.getAttribute('src') ?? '';
    if (src && !src.startsWith('data:') && !src.startsWith('cid:')) {
      node.removeAttribute('src');
    }
  }

  if (node.hasAttribute('background')) {
    const bg = node.getAttribute('background') ?? '';
    if (bg && !bg.startsWith('data:') && !bg.startsWith('cid:')) {
      node.removeAttribute('background');
    }
  }

  if (tag === 'a') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

type EmailAttachment = NonNullable<EmailResponse['attachments']>[number];

interface PreviewProps {
  mailId: string;
  subject: string;
  body: string;
  attachments?: EmailResponse['attachments'];
  envelope?: EncryptionBlock | null;
}

const Preview = ({ mailId, subject, body, attachments, envelope }: PreviewProps) => {
  const { translate } = useTranslationContext();
  const sanitizedBody = purify.sanitize(body);
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
            <div key={attachment.blobId} className="flex items-center gap-1.5 rounded-md bg-gray-5 px-2 py-1">
              <PaperclipIcon size={14} />
              <span className="text-sm font-medium text-gray-80">{attachment.name}</span>
              <span className="text-xs text-gray-50">{bytesToString({ size: attachment.size })}</span>
              <DownloadSimpleIcon
                size={14}
                weight="bold"
                className="cursor-pointer"
                onClick={() => onDownload(attachment)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Preview;
