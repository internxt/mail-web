import { useMemo, useState, useCallback, type ReactNode, type FC } from 'react';
import type { ActionDialog, ActionDialogState, DialogActionConfig } from './types';
import { DialogManagerContext } from './useActionDialog';

export const DialogManagerProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [actionDialogs, setActionDialogs] = useState<Partial<Record<ActionDialog, ActionDialogState>>>({});

  const openDialog = useCallback((dialogKey: ActionDialog, config?: DialogActionConfig) => {
    setActionDialogs((prevDialogs) => {
      const newDialogs = config?.closeAllDialogsFirst ? {} : { ...prevDialogs };
      newDialogs[dialogKey] = { isOpen: true, key: dialogKey, data: config?.data };
      return newDialogs;
    });
  }, []);

  const closeDialog = useCallback((dialogKey: ActionDialog) => {
    setActionDialogs((prevDialogs) => {
      return {
        ...prevDialogs,
        [dialogKey]: { ...prevDialogs[dialogKey], key: dialogKey, isOpen: false, data: null },
      };
    });
  }, []);

  const memoizedValue = useMemo(
    () => ({
      actionDialogs,
      openDialog,
      closeDialog,
    }),
    [actionDialogs, openDialog, closeDialog],
  );

  return <DialogManagerContext.Provider value={memoizedValue}>{children}</DialogManagerContext.Provider>;
};
