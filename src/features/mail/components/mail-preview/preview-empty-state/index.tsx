import EnvelopeOpen from '@/assets/icons/envelope-open.svg?react';
import UnreadEnvelopes from '@/assets/icons/unread-envelopes.svg?react';
import { useTranslationContext } from '@/i18n';

interface PreviewEmailStateProps {
  unreadEmailsCount?: number;
}

const PreviewEmailEmptyState = ({ unreadEmailsCount }: PreviewEmailStateProps) => {
  const { translate } = useTranslationContext();
  if (unreadEmailsCount === undefined) return null;
  const hasUnread = unreadEmailsCount > 0;

  const title = hasUnread
    ? translate('mail.preview.emptyEmail.unreadEmails.title')
    : translate('mail.preview.emptyEmail.noUnreadEmails.title');

  const description = hasUnread
    ? translate('mail.preview.emptyEmail.unreadEmails.description')
    : translate('mail.preview.emptyEmail.noUnreadEmails.description');

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex flex-col items-center bg-gray-1 rounded-lg p-10">
        {hasUnread ? <UnreadEnvelopes /> : <EnvelopeOpen />}

        <div className="flex flex-col gap-2 items-center">
          {hasUnread && (
            <div className="flex px-3 py-0.5 bg-gray-10 rounded-full w-max">
              <p className="text-lg font-medium text-gray-60">{unreadEmailsCount}</p>
            </div>
          )}
          <div className="flex flex-col text-center">
            <h1 className="font-semibold text-gray-80">{title}</h1>
            <p className="font-medium text-gray-50">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewEmailEmptyState;
