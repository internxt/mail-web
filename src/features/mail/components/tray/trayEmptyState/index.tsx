import { useTranslationContext } from '@/i18n';

interface TrayEmptyStateProps {
  folderName: string;
}

export const TrayEmptyState = ({ folderName }: TrayEmptyStateProps) => {
  const { translate } = useTranslationContext();

  return (
    <div className="flex flex-col h-full justify-center items-center w-full overflow-hidden">
      <div className="py-3 px-5">
        <p className="text-gray-50">
          {translate('mail.tray.isEmpty', {
            folderName,
          })}
        </p>
      </div>
    </div>
  );
};
