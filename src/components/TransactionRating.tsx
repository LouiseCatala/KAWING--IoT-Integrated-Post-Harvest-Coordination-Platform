import { useEffect, useState } from 'react';
import { IconStar } from '@tabler/icons-react';
import { useApp } from '../context/AppContext';

export default function TransactionRating({ offerId }: { offerId: string }) {
  const { lang } = useApp();
  const [selected, setSelected] = useState(0);
  const [saved, setSaved] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    setSelected(0);
    setSaved(null);
    fetch(`/api/ratings?offerId=${encodeURIComponent(offerId)}`, { credentials: 'include' })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load rating.');
        if (active) { setSaved(data.score); setSelected(data.score || 0); setError(''); }
      }).catch(reason => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [offerId]);
  const submit = async () => {
    if (!selected || busy || saved !== null) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/ratings', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ offerId, score: selected }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save rating.');
      setSaved(data.score);
      window.dispatchEvent(new Event('kawing:rating-saved'));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save rating.'); }
    finally { setBusy(false); }
  };
  return <div className="min-w-0 sm:ml-auto">
    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{lang === 'en' ? 'Rate this transaction' : 'I-rate ang transaksyon'}</p>
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <div role="group" aria-label={lang === 'en' ? 'Transaction rating' : 'Rating ng transaksyon'} className="flex">
        {[1, 2, 3, 4, 5].map(value => <button key={value} type="button" aria-label={`${value} / 5`} aria-pressed={selected === value} disabled={loading || busy || saved !== null} onClick={() => setSelected(value)} className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-default">
          <IconStar size={26} stroke={2} className={value <= selected ? 'fill-yellow-400 text-yellow-500' : 'text-slate-400 dark:text-slate-500'} />
        </button>)}
      </div>
      {selected > 0 && saved === null && <button type="button" disabled={busy || loading} onClick={submit} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50">{busy ? (lang === 'en' ? 'Saving...' : 'Sine-save...') : (lang === 'en' ? 'Submit' : 'Isumite')}</button>}
      {saved !== null && <span role="status" className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{lang === 'en' ? 'Submitted' : 'Naisumite'} · {saved}/5</span>}
    </div>
    {loading && <p className="text-xs text-slate-500">{lang === 'en' ? 'Loading rating...' : 'Kinukuha ang rating...'}</p>}
    {error && <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
  </div>;
}
