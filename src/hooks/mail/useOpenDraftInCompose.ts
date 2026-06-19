import { useCallback } from 'react';
import { ActionDialog, useActionDialog } from '@/context/dialog-manager';
import { useLazyGetThreadQuery } from '@/store/api/mail';

export const useOpenDraftInCompose = () => {
  const [fetchThread] = useLazyGetThreadQuery();
  const { openDialog } = useActionDialog();

  return useCallback(
    async (draftId: string) => {
      const thread = await fetchThread({ emailId: draftId }).unwrap();
      const draft = thread.find((m) => m.id === draftId) ?? thread[0];
      if (!draft) return;
      openDialog(ActionDialog.ComposeMessage, {
        data: { mode: 'draft', draft },
        closeAllDialogsFirst: true,
      });
    },
    [fetchThread, openDialog],
  );
};

export default useOpenDraftInCompose;
