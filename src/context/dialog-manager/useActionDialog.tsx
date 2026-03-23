import { createContext, useCallback, useContext } from 'react';
import type { ActionDialog, ActionDialogContextProps } from './types';

export const DialogManagerContext = createContext<ActionDialogContextProps | undefined>(undefined);

export const useActionDialog = () => {
  const ctx = useContext(DialogManagerContext);
  if (!ctx) {
    throw new Error('The context is not initialized. Please it inside the provider');
  }

  const isDialogOpen = useCallback(
    (key: ActionDialog) => {
      return ctx.actionDialogs[key]?.isOpen || false;
    },
    [ctx.actionDialogs],
  );

  const getDialogData = useCallback(
    (key: ActionDialog) => {
      return ctx.actionDialogs[key]?.data || null;
    },
    [ctx.actionDialogs],
  );

  return {
    isDialogOpen,
    getDialogData,
    openDialog: ctx.openDialog,
    closeDialog: ctx.closeDialog,
  };
};
