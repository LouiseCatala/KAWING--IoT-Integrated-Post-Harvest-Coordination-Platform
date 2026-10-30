import { useEffect, useRef, useState } from 'react';
import { IconAlertTriangle, IconCheck, IconInfoCircle, IconTrash, IconX } from '@tabler/icons-react';
import { DIALOG_EVENT, type AppDialogRequest } from '../lib/appDialog';

const toneStyles = {
  info: { icon: IconInfoCircle, iconBox: 'bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300', button: 'bg-sky-600 hover:bg-sky-500 focus-visible:ring-sky-400' },
  warning: { icon: IconAlertTriangle, iconBox: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300', button: 'bg-amber-500 hover:bg-amber-400 focus-visible:ring-amber-400 text-slate-950' },
  danger: { icon: IconTrash, iconBox: 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300', button: 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-400' },
  success: { icon: IconCheck, iconBox: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300', button: 'bg-emerald-600 hover:bg-emerald-500 focus-visible:ring-emerald-400' },
} as const;

export default function AppDialogHost() {
  const [dialog, setDialog] = useState<AppDialogRequest | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const showDialog = (event: Event) => setDialog((event as CustomEvent<AppDialogRequest>).detail);
    window.addEventListener(DIALOG_EVENT, showDialog);
    return () => window.removeEventListener(DIALOG_EVENT, showDialog);
  }, []);

  useEffect(() => {
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => confirmRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dialog]);

  const close = (confirmed: boolean) => {
    const current = dialog;
    setDialog(null);
    current?.resolve(confirmed);
  };

  if (!dialog) return null;
  const tone = dialog.tone ?? 'warning';
  const style = toneStyles[tone];
  const Icon = style.icon;
  const title = dialog.title ?? (dialog.showCancel ? 'Please confirm' : 'Notice');

  return (
    <div className="fixed inset-0 z-2000 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !dialog.showCancel) close(false); }}>
      <section role={dialog.showCancel ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby="app-dialog-title" aria-describedby="app-dialog-message" className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-white">
        <div className="h-1.5 bg-emerald-500" />
        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.iconBox}`}>
              <Icon size={26} stroke={2} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h2 id="app-dialog-title" className="pt-1 text-xl font-black tracking-tight">{title}</h2>
                <button type="button" onClick={() => close(false)} aria-label="Close dialog" className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white">
                  <IconX size={20} stroke={2} />
                </button>
              </div>
              <p id="app-dialog-message" className="mt-3 whitespace-pre-line text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">{dialog.message}</p>
            </div>
          </div>
          <div className={`mt-7 grid gap-3 ${dialog.showCancel ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {dialog.showCancel && (
              <button type="button" onClick={() => close(false)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                {dialog.cancelLabel ?? 'Cancel'}
              </button>
            )}
            <button ref={confirmRef} type="button" onClick={() => close(true)} className={`rounded-xl px-4 py-3 text-sm font-extrabold text-white shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:ring-offset-slate-900 ${style.button}`}>
              {dialog.confirmLabel ?? (dialog.showCancel ? 'Confirm' : 'OK')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
