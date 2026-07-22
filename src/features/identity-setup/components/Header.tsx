import { Button } from '@internxt/ui';
import { useTranslationContext } from '@/i18n';
import { useAppDispatch } from '@/store/hooks';
import { logoutThunk } from '@/store/slices/user/thunks';
import InternxtLogo from '../../../assets/logos/Internxt/big-logo.svg?react';

export const Header = () => {
  const { translate } = useTranslationContext();
  const dispatch = useAppDispatch();

  const onLogout = () => {
    dispatch(logoutThunk());
  };

  return (
    <div className="flex flex-row w-full items-center justify-between px-10">
      <div className="flex-1" />
      <InternxtLogo className="text-gray-100 w-24 h-3" />
      <div className="flex flex-1 justify-end">
        <Button variant="secondary" onClick={onLogout}>
          {translate('accountPopover.logout')}
        </Button>
      </div>
    </div>
  );
};
