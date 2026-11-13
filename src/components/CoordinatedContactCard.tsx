import { Mail, Phone } from 'lucide-react';
import type { UserAccount } from '../types';
import { getContactNumbers } from '../lib/contactDetails';

interface CoordinatedContactCardProps {
  user?: UserAccount;
  email?: string;
  primaryNumber?: string;
  title?: string;
}

export default function CoordinatedContactCard({ user, email, primaryNumber, title = 'Coordination Contact' }: CoordinatedContactCardProps) {
  const numbers = user ? getContactNumbers(user) : (primaryNumber?.trim() ? [primaryNumber.trim()] : []);
  const contactEmail = user?.email || email;
  if (!contactEmail && numbers.length === 0) return null;

  return (
    <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50 p-4 text-sm shadow-sm dark:border-emerald-700 dark:bg-emerald-950/50 sm:p-5">
      <p className="text-sm font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">{title}</p>
      <div className="mt-3 space-y-3">
        {numbers.map((number, index) => <a key={number} href={`tel:${number}`} className="flex min-w-0 items-center gap-3 break-all text-lg font-extrabold leading-snug text-slate-950 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-white dark:hover:text-emerald-300 sm:text-xl"><Phone className="size-5 shrink-0 text-emerald-700 dark:text-emerald-300" /><span className="min-w-0"><span className="sr-only">{index === 0 ? 'Phone: ' : 'Additional phone: '}</span>{number}</span></a>)}
        {contactEmail && <a href={`mailto:${contactEmail}`} className="flex min-w-0 items-center gap-3 break-all border-t border-emerald-200 pt-3 font-bold text-slate-800 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-emerald-800 dark:text-slate-100 dark:hover:text-emerald-300"><Mail className="size-5 shrink-0 text-emerald-700 dark:text-emerald-300" />{contactEmail}</a>}
      </div>
    </div>
  );
}
