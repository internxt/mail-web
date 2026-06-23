import { useCallback } from 'react';
import { ActionDialog, useActionDialog } from '@/context/dialog-manager';
import { useLazyGetThreadQuery } from '@/store/api/mail';
import { ErrorService } from '@/services/error';
import { useTranslationContext } from '@/i18n';

export const useOpenDraftInCompose = () => {
  const { openDialog } = useActionDialog();
  const { translate } = useTranslationContext();
  const [fetchThread] = useLazyGetThreadQuery();

  return useCallback(
    async (draftId: string) => {
      try {
        const thread = await fetchThread({ emailId: draftId }).unwrap();
        const draft = thread.find((m) => m.id === draftId);
        if (!draft) {
          ErrorService.instance.notifyUser(translate('errors.mail.draftOpenFailed'));
          return;
        }
        openDialog(ActionDialog.ComposeMessage, {
          data: { mode: 'draft', draft },
          closeAllDialogsFirst: true,
        });
      } catch {
        ErrorService.instance.notifyUser(translate('errors.mail.draftOpenFailed'));
      }
    },
    [fetchThread, openDialog, translate],
  );
};

export default useOpenDraftInCompose;
