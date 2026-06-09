import { LockKeyIcon, WarningIcon } from '@phosphor-icons/react';
import { useTranslationContext } from '@/i18n';
import PreviewHeader, { type User } from './header';
import Preview from './preview';
import type { EmailResponse, EncryptionBlock } from '@internxt/sdk/dist/mail/types';

interface PreviewMailProps {
  from: User;
  to: User[];
  cc: User[];
  bcc: User[];
  mail: {
    id: string;
    subject: string;
    receivedAt: string;
    htmlBody: string;
    attachments?: EmailResponse['attachments'];
    isEncrypted?: boolean;
    isDecrypting?: boolean;
    decryptError?: boolean;
    envelope?: EncryptionBlock | null;
  };
}

const PreviewMail = ({ from, to, cc, bcc, mail }: PreviewMailProps) => {
  const { translate } = useTranslationContext();

  return (
    <div className="flex flex-col w-full h-full">
      <PreviewHeader
        sender={from}
        date={mail.receivedAt}
        to={to}
        cc={cc}
        bcc={bcc}
        attachmentsLength={mail.attachments?.length}
      />
      {mail.isEncrypted && !mail.decryptError && (
        <div className="mx-5 mt-2 inline-flex items-center gap-1 self-start rounded-full bg-green/10 px-2.5 py-1 text-sm font-medium text-green">
          <LockKeyIcon size={14} weight="fill" />
          {translate('modals.composeMessageDialog.encryptedBadge')}
        </div>
      )}
      {mail.decryptError && (
        <div className="mx-5 mt-2 inline-flex items-center gap-1 self-start rounded-full bg-red/10 px-2.5 py-1 text-sm font-medium text-red">
          <WarningIcon size={14} weight="fill" />
          {translate('mail.preview.decryptFailed')}
        </div>
      )}
      {mail.isDecrypting ? (
        <div className="p-5 text-gray-50">{translate('mail.preview.decrypting')}</div>
      ) : (
        <Preview
          mailId={mail.id}
          subject={mail.subject}
          body={mail.htmlBody}
          attachments={mail.attachments}
          envelope={mail.envelope ?? null}
        />
      )}
    </div>
  );
};

export default PreviewMail;
