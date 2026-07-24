import { Activity } from 'react';
import { ActionDialog } from './types';
import { useActionDialog } from './useActionDialog';
import { ComposeMessageDialog } from '@/components/compose-message';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';

export const DialogsRoot = () => {
  const { isDialogOpen } = useActionDialog();
  const isComposeMessageDialogOpen = isDialogOpen(ActionDialog.ComposeMessage);
  const isConfirmDeleteDialogOpen = isDialogOpen(ActionDialog.ConfirmDeletePermanently);

  return (
    <>
      <Activity mode={isComposeMessageDialogOpen ? 'visible' : 'hidden'}>
        <ComposeMessageDialog />
      </Activity>
      <Activity mode={isConfirmDeleteDialogOpen ? 'visible' : 'hidden'}>
        <ConfirmDeleteDialog />
      </Activity>
    </>
  );
};
