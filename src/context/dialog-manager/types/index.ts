export enum ActionDialog {
  ComposeMessage = 'compose-message',
  ConfirmDeletePermanently = 'confirm-delete-permanently',
}

export interface ActionDialogState {
  isOpen: boolean;
  key: ActionDialog;
  data?: unknown;
}

export type DialogActionConfig = { closeAllDialogsFirst?: boolean; data?: unknown };

export type OpenDialog = (key: ActionDialog, config?: DialogActionConfig) => void;

export type ActionDialogContextProps = {
  actionDialogs: Partial<Record<ActionDialog, ActionDialogState>>;
  openDialog: OpenDialog;
  closeDialog: (key: ActionDialog) => void;
};
