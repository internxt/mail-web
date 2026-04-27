import {
  ArrowBendDoubleUpLeftIcon,
  ArrowBendUpLeftIcon,
  ArrowBendUpRightIcon,
  EnvelopeOpenIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import MoveTo from '@/assets/icons/move-to.svg?react';
import { Dropdown } from '@internxt/ui';
import type { FolderType } from '@/types/mail';
import { useActionsBar } from '../../../../../hooks/mail/useActionsBar';

interface ActionsBarProps {
  isRead: boolean;
  optionsDisabled: boolean;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onMove: (folder: FolderType) => Promise<null> | void;
  onTrash: () => Promise<null> | void;
}

const Separator = () => <div className="h-5 w-px bg-gray-10" />;

const ActionsBar = ({
  isRead,
  optionsDisabled,
  onMarkAsRead,
  onMarkAsUnread,
  onTrash,
  onMove,
  onReply,
  onReplyAll,
  onForward,
}: ActionsBarProps) => {
  const { translate, moveToItems, toggleReadTitle, onToggleRead } = useActionsBar({
    isRead,
    optionsDisabled,
    onMarkAsRead,
    onMarkAsUnread,
    onMove,
    onTrash,
  });

  const iconButtonClass =
    'flex items-center justify-center rounded-lg p-2 text-gray-60 transition-colors hover:bg-gray-5 hover:text-gray-80 disabled:pointer-events-none disabled:opacity-40';

  return (
    <div className="flex items-center z-30 gap-5 pl-4">
      <button
        disabled={optionsDisabled}
        type="button"
        title={toggleReadTitle}
        className={iconButtonClass}
        onClick={onToggleRead}
      >
        <EnvelopeOpenIcon size={24} />
      </button>

      <div className="flex flex-row gap-1 items-center">
        <button
          disabled={optionsDisabled}
          type="button"
          title={translate('actions.trashEmail')}
          className={iconButtonClass}
          onClick={onTrash}
        >
          <TrashIcon size={24} />
        </button>
        <Separator />
        <Dropdown
          classButton={`${iconButtonClass}${optionsDisabled ? ' pointer-events-none opacity-40' : ''}`}
          dropdownActionsContext={moveToItems}
          openDirection="left"
          classMenuItems="max-w-[224px] w-screen"
        >
          <MoveTo />
        </Dropdown>
      </div>

      <div className="flex flex-row items-center gap-1">
        <button
          disabled={optionsDisabled}
          type="button"
          title={translate('actions.reply')}
          className={iconButtonClass}
          onClick={onReply}
        >
          <ArrowBendUpLeftIcon size={24} />
        </button>
        <Separator />
        <button
          disabled={optionsDisabled}
          type="button"
          title={translate('actions.replyAll')}
          className={iconButtonClass}
          onClick={onReplyAll}
        >
          <ArrowBendDoubleUpLeftIcon size={24} />
        </button>
        <Separator />
        <button
          disabled={optionsDisabled}
          type="button"
          title={translate('actions.forward')}
          className={iconButtonClass}
          onClick={onForward}
        >
          <ArrowBendUpRightIcon size={24} />
        </button>
      </div>
    </div>
  );
};

export default ActionsBar;
