import { useTranslationContext } from '@/i18n';
import { AppView } from '@/routes/paths';
import { NavigationService } from '@/services/navigation';
import { useAppDispatch } from '@/store/hooks';
import { logoutThunk } from '@/store/slices/user/thunks';

interface MailViewProps {
  folder: string;
}

const MailView = ({ folder }: MailViewProps) => {
  const { translate } = useTranslationContext();
  const dispatch = useAppDispatch();

  const goToInbox = () => {
    NavigationService.instance.navigate({ id: AppView.Inbox });
  };

  const goToTrash = () => {
    NavigationService.instance.navigate({ id: AppView.Trash });
  };

  const onLogout = async () => {
    await dispatch(logoutThunk());
  };

  return (
    <div>
      <p>
        {NavigationService.instance.getView()?.id === AppView.Inbox
          ? translate('sidebar.inbox')
          : translate('sidebar.trash')}
      </p>
      <p>Current folder: {folder}</p>
      <div className="flex flex-row gap-2">
        <button onClick={goToInbox}>Go To Inbox</button>
        <button onClick={goToTrash}>Go To Trash</button>
        <button onClick={onLogout}>Log out</button>
      </div>
    </div>
  );
};

export default MailView;
