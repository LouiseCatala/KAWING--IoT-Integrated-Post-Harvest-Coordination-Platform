import { AlertTriangle, CircleHelp } from 'lucide-react';

interface AdminConfirmationModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  intent?: 'primary' | 'danger';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function AdminConfirmationModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  intent = 'primary',
  onConfirm,
  onCancel,
}: AdminConfirmationModalProps) {
  const Icon = intent === 'danger' ? AlertTriangle : CircleHelp;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <Icon className={`mx-auto h-8 w-8 ${intent === 'danger' ? 'text-red-500' : 'text-emerald-600'}`} aria-hidden="true" />
        <h2 id="admin-confirm-title" className="mt-3 text-lg font-extrabold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
            {cancelLabel}
          </button>
          <button type="button" onClick={() => { onCancel(); void onConfirm(); }} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white ${intent === 'danger' ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
