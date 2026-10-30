export type AppDialogTone = 'info' | 'warning' | 'danger' | 'success';

export interface AppDialogRequest {
  message: string;
  title?: string;
  tone?: AppDialogTone;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  resolve: (confirmed: boolean) => void;
}

const DIALOG_EVENT = 'kawing:dialog';

const openDialog = (request: Omit<AppDialogRequest, 'resolve'>) =>
  new Promise<boolean>((resolve) => {
    window.dispatchEvent(new CustomEvent<AppDialogRequest>(DIALOG_EVENT, {
      detail: { ...request, resolve },
    }));
  });

export const confirmDialog = (message: string, options: Omit<AppDialogRequest, 'message' | 'resolve' | 'showCancel'> = {}) =>
  openDialog({ ...options, message, showCancel: true });

export const alertDialog = (message: string, options: Omit<AppDialogRequest, 'message' | 'resolve' | 'showCancel'> = {}) =>
  openDialog({ ...options, message, showCancel: false });

export const askConfirmation = (
  message: string,
  onConfirm: () => void | Promise<void>,
  options: Omit<AppDialogRequest, 'message' | 'resolve' | 'showCancel'> = {},
) => {
  void confirmDialog(message, options).then((confirmed) => {
    if (confirmed) void onConfirm();
  });
};

export { DIALOG_EVENT };
