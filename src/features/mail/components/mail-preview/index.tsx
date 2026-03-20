import PreviewHeader, { type User } from './header';
import Preview from './preview';

interface PreviewMailProps {
  from: User;
  to: User[];
  cc: User[];
  bcc: User[];
  mail: {
    subject: string;
    receivedAt: string;
    htmlBody: string;
  };
}

const PreviewMail = ({ from, to, cc, bcc, mail }: PreviewMailProps) => {
  return (
    <div className="flex flex-col w-full h-full">
      <PreviewHeader sender={from} date={mail.receivedAt} to={to} cc={cc} bcc={bcc} attachmentsLength={0} />
      <Preview subject={mail.subject} body={mail.htmlBody} />
    </div>
  );
};

export default PreviewMail;
