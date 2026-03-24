export enum ActionDialog {
  ComposeMessage = 'compose-message',
  Settings = 'settings',
}

export interface ActionDialogState {
  isOpen: boolean;
  key: ActionDialog;
  data?: unknown;
}

export type DialogActionConfig = { closeAllDialogsFirst?: boolean; data?: unknown };

export type ActionDialogContextProps = {
  actionDialogs: Partial<Record<ActionDialog, ActionDialogState>>;
  openDialog: (key: ActionDialog, config?: DialogActionConfig) => void;
  closeDialog: (key: ActionDialog, config?: DialogActionConfig) => void;
};
