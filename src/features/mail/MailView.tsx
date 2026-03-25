import { useTranslationContext } from '@/i18n';
import type { FolderType } from '@/types/mail';
import { getMockedMail } from '@/test-utils/fixtures';
import PreviewMail from './components/mail-preview';
import type { User } from './components/mail-preview/header';
import TrayList from './components/tray';
import Settings from './components/settings';

interface MailViewProps {
  folder: FolderType;
}

const MailView = ({ folder }: MailViewProps) => {
  const { translate } = useTranslationContext();
  const mockedMail = getMockedMail();
  const from = mockedMail.from[0];
  const to = mockedMail.to;
  const cc = mockedMail.cc;
  const bcc = mockedMail.bcc;

  const folderName = translate(`mail.${folder}`);

  return (
    <div className="flex flex-row w-full h-full">
      {/* Tray */}
      <TrayList folderName={folderName} />
      {/* Mail Preview */}
      <div className="flex flex-col w-full gap-5">
        <div className="flex w-full justify-end">
          <Settings />
        </div>
        <PreviewMail bcc={bcc} cc={cc as User[]} from={from} to={to} mail={mockedMail} />
      </div>
    </div>
  );
};

export default MailView;
