import { useState } from 'react';
import { Button } from '@internxt/ui';
import { useTranslationContext } from '@/i18n';
import { ActionDialog, useActionDialog } from '@/context/dialog-manager';

export interface ConfirmDeletePermanentlyData {
  count: number;
  onConfirm: () => Promise<void>;
}

export const ConfirmDeleteDialog = () => {
  const { translate } = useTranslationContext();
  const { closeDialog, getDialogData } = useActionDialog();
  const data = getDialogData(ActionDialog.ConfirmDeletePermanently) as ConfirmDeletePermanentlyData | null;
  const [isDeleting, setIsDeleting] = useState(false);

  const onClose = () => {
    if (isDeleting) return;
    closeDialog(ActionDialog.ConfirmDeletePermanently);
  };

  const onConfirm = async () => {
    if (!data) return;
    setIsDeleting(true);
    try {
      await data.onConfirm();
      closeDialog(ActionDialog.ConfirmDeletePermanently);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!data) return null;

  const count = data.count;
  const isSingleEmail = count === 1;
  const titleKey = isSingleEmail
    ? 'modals.confirmDeletePermanently.titleOne'
    : 'modals.confirmDeletePermanently.titleMany';
  const descriptionKey = isSingleEmail
    ? 'modals.confirmDeletePermanently.descriptionOne'
    : 'modals.confirmDeletePermanently.descriptionMany';

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-gray-100/50 transition-opacity duration-150 dark:bg-black/75"
        onClick={onClose}
        data-testid="confirm-delete-dialog-overlay"
        aria-label={translate('modals.confirmDeletePermanently.close')}
      ></button>

      <div
        className="absolute left-1/2 top-1/2 w-full max-w-100 -translate-x-1/2 -translate-y-1/2 transform rounded-2xl
        bg-surface p-5 transition-all duration-150 dark:bg-gray-1"
      >
        <div className="flex flex-col space-y-2">
          <p className="text-lg font-medium text-gray-100">{translate(titleKey, { count })}</p>
          <p className="text-base text-gray-60">{translate(descriptionKey, { count })}</p>
        </div>

        <div className="mt-5 flex flex-row justify-end items-center space-x-2">
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            {translate('modals.confirmDeletePermanently.cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={isDeleting} disabled={isDeleting}>
            {translate('modals.confirmDeletePermanently.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteDialog;
