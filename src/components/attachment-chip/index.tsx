import iconService from '@/services/icons/icon.service';
import { bytesToString } from '@/utils/bytes-to-string';
import { ArrowClockwiseIcon, DownloadSimpleIcon, SpinnerIcon, WarningIcon, XIcon } from '@phosphor-icons/react';

export type AttachmentChipStatus = 'pending' | 'uploading' | 'done' | 'error';

interface AttachmentChipProps {
  fileName: string;
  size: number;
  type: string;
  status?: AttachmentChipStatus;
  onDownload?: () => void;
  onRetry?: () => void;
  onRemove?: () => void;
}

const AttachmentChip = ({
  fileName,
  onRemove,
  onDownload,
  onRetry,
  size,
  type,
  status = 'done',
}: AttachmentChipProps) => {
  const TypeIcon = iconService.getItemIcon(false, type.split('/')[1]);

  const renderLeftIcon = () => {
    if (status === 'uploading' || status === 'pending') {
      return <SpinnerIcon width={32} height={32} className="animate-spin text-gray-60" />;
    }
    if (status === 'error') {
      return <WarningIcon width={32} height={32} weight="fill" className="text-red" />;
    }
    return <TypeIcon width={32} height={32} />;
  };

  const renderActionButton = () => {
    if (status === 'error' && onRetry) {
      return (
        <button
          aria-label="Retry upload"
          className="flex shrink-0 items-center justify-center self-center rounded-full bg-gray-10 p-1.5"
          onClick={onRetry}
        >
          <ArrowClockwiseIcon size={18} weight="bold" />
        </button>
      );
    }
    if (status === 'done' && onDownload) {
      return (
        <button
          aria-label="Download attachment"
          className="flex shrink-0 items-center justify-center self-center rounded-full bg-gray-10 p-1.5"
          onClick={onDownload}
        >
          <DownloadSimpleIcon size={18} />
        </button>
      );
    }
    return null;
  };

  return (
    <div
      className={`group relative flex flex-row items-center w-screen ${onDownload ? 'justify-between' : 'gap-2.5'} bg-gray-5 rounded-xl max-w-66 p-3`}
    >
      {onRemove && (
        <button
          aria-label="Remove attachment"
          className="absolute -top-1.5 -right-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-gray-20 text-white group-hover:flex"
          onClick={onRemove}
        >
          <XIcon size={12} weight="bold" />
        </button>
      )}
      {renderLeftIcon()}
      <div className="flex flex-col min-w-0 w-36">
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-100">{fileName}</span>
        <span className="text-xs text-gray-80">{bytesToString({ size, removeSpace: false })}</span>
      </div>
      {renderActionButton()}
    </div>
  );
};

export default AttachmentChip;
