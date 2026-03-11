import { useTranslationContext } from '@/i18n';
import { AppView } from '@/routes/paths';
import { NavigationService } from '@/services/navigation';

interface MailViewProps {
  folder: string;
}

const MailView = ({ folder }: MailViewProps) => {
  const { translate } = useTranslationContext();

  const goToInbox = () => {
    NavigationService.instance.navigate(AppView.inbox);
  };

  const goToTrash = () => {
    NavigationService.instance.navigate(AppView.trash);
  };

  const goToDemo = () => {
    goTo(PATHS.demo)
  }


  return (
    <div>
      <p>
        {NavigationService.instance.getPathname() === AppView.inbox
          ? translate('sidebar.inbox')
          : translate('sidebar.trash')}
      </p>
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
