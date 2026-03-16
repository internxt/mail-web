import { useTranslationContext } from '@/i18n';
import notificationsService, { ToastType, type ToastShowProps } from '@/services/notifications';
import { Loader } from '@internxt/ui';
import { CheckCircleIcon, InfoIcon, WarningIcon, WarningOctagonIcon, XIcon } from '@phosphor-icons/react';
import { NavLink } from 'react-router-dom';
import { Transition } from '../Transition';

const NotificationToast = ({
  text,
  type,
  action,
  visible,
  closable,
  requestId,
  onClose,
}: Omit<ToastShowProps, 'duration'> & { visible: boolean; onClose: () => void }) => {
  const { translate } = useTranslationContext();
  const handleCopyRequestId = () => {
    if (requestId) {
      navigator.clipboard.writeText(requestId);
      notificationsService.show({ text: translate('toastNotification.textCopied'), type: ToastType.Success });
    }
  };

  let Icon: typeof CheckCircleIcon | undefined;
  let IconColor: string | undefined;

  switch (type) {
    case ToastType.Success:
      Icon = CheckCircleIcon;
      IconColor = 'text-green';
      break;
    case ToastType.Error:
      Icon = WarningOctagonIcon;
      IconColor = 'text-red';
      break;
    case ToastType.Info:
      Icon = InfoIcon;
      IconColor = 'text-primary';
      break;
    case ToastType.Warning:
      Icon = WarningIcon;
      IconColor = 'text-yellow';
      break;
    case ToastType.Loading:
      IconColor = 'text-primary';
      break;
  }

  return (
    <Transition
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 scale-95"
      enterTo="opacity-100 scale-100"
      leave="transition ease-in duration-200"
      leaveFrom="opacity-100 scale-100"
      leaveTo="opacity-0 scale-95"
      show={visible}
    >
      <div
        className="flex max-w-xl items-center rounded-lg border border-gray-10 bg-surface p-3 dark:bg-gray-5"
        style={{ minWidth: '300px' }}
      >
        {type === ToastType.Loading && <Loader classNameLoader="mr-1.5 h-6 w-6" />}
        {Icon && <Icon weight="fill" className={`${IconColor} mr-1.5`} size={24} />}

        <div className="flex-1">
          <p className="line-clamp-2 whitespace-pre wrap-break-words text-gray-80">{text}</p>
          {requestId && type === ToastType.Error && (
            <button
              onClick={handleCopyRequestId}
              className="mt-1 text-xs text-gray-50 hover:text-gray-60"
              title="Click to copy"
            >
              ID: {requestId}
            </button>
          )}
        </div>
        {action &&
          (action.to ? (
            <NavLink
              className="ml-3 truncate font-medium text-primary no-underline"
              to={action.to}
              onClick={action.onClick}
            >
              {action.text}
            </NavLink>
          ) : (
            <button onClick={action.onClick} className="ml-3 truncate font-medium text-primary">
              {action.text}
            </button>
          ))}

        {closable && (
          <button onClick={onClose} className="ml-3 text-gray-40">
            <XIcon size={20} />
          </button>
        )}
      </div>
    </Transition>
  );
};

export default NotificationToast;
