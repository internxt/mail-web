import { useNavigation } from '@/hooks/useNavigation';
import { useTranslationContext } from '@/i18n';
import { PATHS } from '@/routes/paths';

interface MailViewProps {
  folder: string;
}

const MailView = ({ folder }: MailViewProps) => {
  const { goTo } = useNavigation();
  const { translate } = useTranslationContext();

  const goToInbox = () => {
    goTo(PATHS.inbox);
  };

  const goToTrash = () => {
    goTo(PATHS.trash);
  };

  const goToDemo = () => {
    goTo(PATHS.demo)
  }


  return (
    <div>
      <p>{translate('sidenav.inbox')}</p>
      <p>Current folder: {folder}</p>
      <div className="flex flex-row gap-2">
        <button onClick={goToInbox}>Go To Inbox</button>
        <button onClick={goToTrash}>Go To Trash</button>
        <button onClick={goToDemo}>Go To Spam-demo</button>
      </div>
    </div>
  );
};

export default MailView;
