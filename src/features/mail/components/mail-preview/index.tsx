import { LockKeyIcon, WarningIcon } from '@phosphor-icons/react';
import { useTranslationContext } from '@/i18n';
import PreviewHeader, { type User } from './header';
import Preview from './preview';
import type { EmailResponse, EncryptionBlock } from '@internxt/sdk/dist/mail/types';
import { useSanitizedMailHtml } from './utils/useSanitizedMailHtml';

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
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

const PreviewMail = ({ from, to, cc, bcc, mail, collapsed = false, onToggleCollapsed }: PreviewMailProps) => {
  const { translate } = useTranslationContext();
  const sanitizedBody = useSanitizedMailHtml(mail.htmlBody);

  const isInteractive = !!onToggleCollapsed;

  return (
    <div className="flex flex-col w-full h-full bg-surface">
      <button
        type="button"
        onClick={onToggleCollapsed}
        disabled={!isInteractive}
        className={`w-full text-left ${isInteractive ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <PreviewHeader
          sender={from}
          date={mail.receivedAt}
          to={to}
          cc={cc}
          bcc={bcc}
          attachmentsLength={mail.attachments?.length}
          collapsedSnippet={
            collapsed ? (
              <div className="line-clamp-1 text-sm text-gray-60" dangerouslySetInnerHTML={{ __html: sanitizedBody }} />
            ) : undefined
          }
        />
      </button>
      {mail.isEncrypted && !mail.decryptError && !collapsed && (
        <div className="mx-5 mt-2 inline-flex items-center gap-1 self-start rounded-full bg-green/10 px-2.5 py-1 text-sm font-medium text-green">
          <LockKeyIcon size={14} weight="fill" />
          {translate('modals.composeMessageDialog.encryptedBadge')}
        </div>
      )}
      {mail.decryptError && !collapsed && (
        <div className="mx-5 mt-2 inline-flex items-center gap-1 self-start rounded-full bg-red/10 px-2.5 py-1 text-sm font-medium text-red">
          <WarningIcon size={14} weight="fill" />
          {translate('mail.preview.decryptFailed')}
        </div>
      )}

      {!collapsed && (
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
