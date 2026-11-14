import { useLiveRevision } from '../../lib/useLiveRevision';
import { useEffect, useRef, useState } from 'react';
import { Save } from 'lucide-react';
import { FAQ_DATA, FaqItem } from '../../data/faqs';
import AdminConfirmationModal from './AdminConfirmationModal';

export default function GrainyFaqTab({ lang }: { lang: 'en' | 'tl' }) {
  const [faqItems, setFaqItems] = useState<FaqItem[]>(FAQ_DATA);
  const liveRevision = useLiveRevision('faqs');
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmSave, setConfirmSave] = useState(false);
  const baseline = useRef<FaqItem[] | null>(null);
  const saving = useRef(false);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const latestItems = useRef(faqItems);
  latestItems.current = faqItems;

  useEffect(() => { let cancelled = false; if (dirty && baseline.current !== null) return; fetch('/api/faqs').then(async response => { if (response.ok) { const result = await response.json(); if (cancelled || saving.current || (dirtyRef.current && baseline.current !== null)) return; if (Array.isArray(result.faqs)) { baseline.current = result.faqs; if (!dirtyRef.current && result.faqs.length) setFaqItems(result.faqs); } } }).catch(() => undefined); return () => { cancelled = true; }; }, [liveRevision]);
  const saveFaqs = async () => {
    if (saving.current) return;
    if (!baseline.current) { setMessage('Wait for the saved FAQs to load before editing.'); return; }
    saving.current = true;
    setIsSaving(true); setMessage('');
    try {
      const response = await fetch('/api/faqs', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ faqs: faqItems, before: baseline.current }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'FAQ changes could not be saved.');
      baseline.current = result.faqs;
      if (latestItems.current === faqItems) { setDirty(false); setFaqItems(result.faqs); }
      setMessage('Grainy FAQ questions updated successfully.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'FAQ changes could not be saved.'); } finally { saving.current = false; setIsSaving(false); }
  };
  return <section className="space-y-5"><div><h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{lang === 'en' ? 'Grainy FAQ Management' : 'Pamamahala ng mga FAQ ni Grainy'}</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{lang === 'en' ? 'Manage the saved questions and answers shown in Grainy for every user.' : 'Pamahalaan ang mga tanong at sagot na ipinapakita ni Grainy sa lahat ng gumagamit.'}</p></div><div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">{faqItems.map((faq, index) => <div key={faq.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700 md:grid-cols-2"><label className="space-y-1 text-sm font-bold text-slate-700 dark:text-slate-200">{lang === 'en' ? 'Question' : 'Tanong'}<input value={lang === 'en' ? faq.questionEn : faq.questionTl} onChange={(e) => { setDirty(true); setFaqItems(items => items.map((item, i) => i === index ? { ...item, [lang === 'en' ? 'questionEn' : 'questionTl']: e.target.value } : item)); }} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-950 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label><label className="space-y-1 text-sm font-bold text-slate-700 dark:text-slate-200">{lang === 'en' ? 'Answer' : 'Sagot'}<textarea value={lang === 'en' ? faq.answerEn : faq.answerTl} onChange={(e) => { setDirty(true); setFaqItems(items => items.map((item, i) => i === index ? { ...item, [lang === 'en' ? 'answerEn' : 'answerTl']: e.target.value } : item)); }} className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 font-normal text-slate-950 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label></div>)}{message && <p role="status" className="rounded-xl bg-emerald-950/30 p-3 text-sm font-bold text-emerald-300">{message}</p>}<button type="button" disabled={isSaving} onClick={() => setConfirmSave(true)} className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-60"><Save className="mr-2 h-4 w-4" />{isSaving ? (lang === 'en' ? 'Saving…' : 'Sine-save…') : (lang === 'en' ? 'Save Grainy FAQs' : 'I-save ang mga FAQ ni Grainy')}</button></div>{confirmSave && <AdminConfirmationModal title={lang === 'en' ? 'Save Grainy FAQ changes?' : 'I-save ang mga pagbabago sa FAQ ni Grainy?'} message={lang === 'en' ? 'Update the saved FAQ questions and answers for all users?' : 'I-update ang mga tanong at sagot na ipinapakita ni Grainy sa lahat ng gumagamit?'} confirmLabel={lang === 'en' ? 'Save FAQs' : 'I-save ang mga FAQ'} cancelLabel={lang === 'en' ? 'Cancel' : 'Kanselahin'} onConfirm={saveFaqs} onCancel={() => setConfirmSave(false)} />}</section>;
}
