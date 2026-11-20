import { useLiveRevision } from '../../lib/useLiveRevision';
import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Pencil, PlusCircle, X, Save, Calendar, CheckCircle } from 'lucide-react';
import WeatherWidget from '../../components/WeatherWidget';
import AdminConfirmationModal from './AdminConfirmationModal';

interface AnnouncementsTabProps {
  lang: 'en' | 'tl';
  onPublishAnnouncement?: (title: string, content: string, notifyByEmail: boolean) => void;
}

export default function AnnouncementsTab({ lang, onPublishAnnouncement }: AnnouncementsTabProps) {
  // Announcements local state
  const liveRevision = useLiveRevision('announcements');
  const [announcements, setAnnouncements] = useState<Array<{ id: number; title: string; category: string; date: string; content: string; status: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const [saveError, setSaveError] = useState('');
  const [confirmation, setConfirmation] = useState<{ title: string; message: string; confirmLabel: string; intent?: 'primary' | 'danger'; action: () => void | Promise<void> } | null>(null);

  useEffect(() => { let cancelled = false;
    fetch('/api/announcements').then(async response => {
      if (!response.ok) throw new Error('Could not load announcements.');
      const result = await response.json(); if (cancelled || savingRef.current) return;
      setAnnouncements(Array.isArray(result.announcements) ? result.announcements : []);
    }).catch(error => setSaveError(error instanceof Error ? error.message : 'Could not load announcements.'));
    return () => { cancelled = true; };
  }, [liveRevision]);

  const persistAnnouncements = async (next: typeof announcements, before = announcements) => {
    if (savingRef.current) return false;
    savingRef.current = true;
    setIsSaving(true);
    setSaveError('');
    try {
      const response = await fetch('/api/announcements', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ announcements: next, before }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Announcement changes were not saved.');
      setAnnouncements(result.announcements);
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Announcement changes were not saved.');
      return false;
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('System Maintenance');
  const [newStatus, setNewStatus] = useState('Published');
  const [notifyAllByEmail, setNotifyAllByEmail] = useState(false);

  // Edit states
  const [editingAnn, setEditingAnn] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const [notif, setNotif] = useState<string | null>(null);

  const triggerNotif = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3000);
  };

  const saveNewAnnouncement = async () => {
    const added = {
      id: Date.now(),
      title: newTitle,
      category: newCategory,
      date: new Date().toISOString().split('T')[0],
      content: newContent,
      status: newStatus
    };

    const next = [added, ...announcements];
    if (!(await persistAnnouncements(next))) return;
    if (newStatus === 'Published') onPublishAnnouncement?.(newTitle, newContent, notifyAllByEmail);
    setNewTitle('');
    setNewContent('');
    setNotifyAllByEmail(false);
    triggerNotif(lang === 'en' ? 'Successfully posted new advisory bulletin.' : 'Matagumpay na nailathala ang bagong paunawa.');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setConfirmation({ title: lang === 'en' ? 'Publish this advisory?' : 'I-post ang paunawang ito?', message: lang === 'en' ? `Save this advisory to the board?${newStatus === 'Published' && notifyAllByEmail ? ' It will also be emailed to users.' : ''}` : `I-save ang paunawang ito sa board?${newStatus === 'Published' && notifyAllByEmail ? ' Ipapadala rin ito sa mga gumagamit sa email.' : ''}`, confirmLabel: newStatus === 'Published' ? (lang === 'en' ? 'Publish Advisory' : 'I-post ang Paunawa') : (lang === 'en' ? 'Save Draft' : 'I-save bilang Draft'), action: saveNewAnnouncement });
  };

  const handleDelete = async (id: number) => {
    if (!(await persistAnnouncements(announcements.filter(a => a.id !== id)))) return;
    triggerNotif(lang === 'en' ? 'Successfully deleted advisory bulletin.' : 'Matagumpay na nabura ang paunawa.');
  };

  const requestDelete = (id: number) => setConfirmation({ title: lang === 'en' ? 'Delete this advisory?' : 'Burahin ang paunawang ito?', message: lang === 'en' ? 'This advisory will be removed from the announcements board.' : 'Aalisin ang paunawang ito sa announcement board.', confirmLabel: lang === 'en' ? 'Delete Advisory' : 'Burahin ang Paunawa', intent: 'danger', action: () => handleDelete(id) });

  const handleOpenEdit = (ann: any) => {
    setEditingAnn({ ...ann, baseline: announcements });
    setEditTitle(ann.title);
    setEditContent(ann.content);
    setEditCategory(ann.category);
    setEditStatus(ann.status);
  };

  const saveEdit = async () => {
    const next = announcements.map(a => a.id === editingAnn.id ? {
      ...a,
      title: editTitle,
      content: editContent,
      category: editCategory,
      status: editStatus
    } : a);
    if (!(await persistAnnouncements(next, editingAnn.baseline))) return;

    setEditingAnn(null);
    triggerNotif(lang === 'en' ? 'Successfully updated advisory bulletin.' : 'Matagumpay na na-update ang paunawa.');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;
    setConfirmation({ title: lang === 'en' ? 'Save advisory changes?' : 'I-save ang mga pagbabago sa paunawa?', message: lang === 'en' ? 'Update this advisory with the details entered?' : 'I-update ang paunawang ito gamit ang mga inilagay mong detalye?', confirmLabel: lang === 'en' ? 'Save Changes' : 'I-save ang mga Pagbabago', action: saveEdit });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
          {lang === 'en' ? 'KAWING Public Advisories & Announcements' : 'Mga Pahayag at Paunawa sa Sakahan'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {lang === 'en' ? 'Publish notices and farm advisories. Weather updates appear automatically.' : 'Mag-post ng mga paunawa at gabay sa pagsasaka. Awtomatiko ang weather updates.'}
        </p>
      </div>

      <WeatherWidget lang={lang} />

      {/* Alert Notif */}
      {notif && (
        <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl text-xs flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="font-bold">{notif}</span>
        </div>
      )}
      {saveError && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-xs font-bold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">{saveError} <button type="button" onClick={() => void persistAnnouncements(announcements)} className="ml-2 underline">{lang === 'en' ? 'Retry' : 'Subukan Muli'}</button></div>}

      {/* Two-Column Layout: Add Form + Current Announcements List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Post New advisory Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm h-fit">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-display mb-4 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'en' ? 'Post New Advisory Bulletin' : 'I-post ang Bagong Paunawa'}</span>
          </h3>

          <form onSubmit={handleAdd} className="space-y-3.5 text-xs">
            {/* Title */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Advisory Title' : 'Pamagat ng Paunawa'}</label>
              <input
                type="text"
                required
                placeholder="e.g., Scheduled platform maintenance"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Category Tag' : 'Kategorya'}</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg"
              >
                <option value="System Maintenance">{lang === 'en' ? 'System Maintenance' : 'Pagpapanatili ng Sistema'}</option>
                <option value="Harvest Advisory">{lang === 'en' ? 'Harvest Advisory' : 'Paunawa sa Anihan'}</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Publishing Status' : 'Kalagayan ng Paglalathala'}</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg"
              >
                <option value="Published">{lang === 'en' ? 'Published' : 'Nailathala'}</option>
                <option value="Draft">{lang === 'en' ? 'Draft' : 'Naka-draft'}</option>
              </select>
            </div>

            {/* Content body */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Detailed Advisory Message' : 'Detalyadong Mensahe ng Paunawa'}</label>
              <textarea
                required
                rows={4}
                placeholder="Write message details..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 cursor-pointer">
              <input type="checkbox" checked={notifyAllByEmail} onChange={(event) => setNotifyAllByEmail(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-600" />
              <span><strong className="block text-slate-800 dark:text-white">{lang === 'en' ? 'Email all opted-in users' : 'I-email ang lahat ng naka-enable'}</strong><span className="mt-1 block text-[10px] leading-4 text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Optional. Leave unchecked to publish in KAWING only.' : 'Optional. Huwag i-check kung sa KAWING lamang ipapakita.'}</span></span>
            </label>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{isSaving ? 'Saving…' : (lang === 'en' ? 'Publish Advisory' : 'I-publish ang Paunawa')}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Listings of Advisories */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-950 dark:text-white font-display mb-4">
            {lang === 'en' ? 'Active Advisories Board' : 'Mga Aktibong Paunawa'}
          </h3>

          <div className="space-y-4">
            {announcements.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">{lang === 'en' ? 'No public advisories currently listed.' : 'Wala pang nakalistang pampublikong paunawa.'}</p>
            ) : (
              announcements.map((ann) => (
                <div 
                  key={ann.id}
                  className="p-5 border border-slate-100 dark:border-slate-800/80 rounded-2xl bg-slate-50/40 dark:bg-slate-950/5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                          ann.category === 'System Maintenance'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {ann.category}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1.5 font-display">
                          {ann.title}
                        </h4>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{ann.date}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${
                          ann.status === 'Published'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {ann.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                      {ann.content}
                    </p>
                  </div>

                  {/* Edit and Delete operations */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(ann)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>{lang === 'en' ? 'Edit' : 'Baguhin'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => requestDelete(ann.id)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 rounded-lg transition-all cursor-pointer border border-red-100 dark:border-red-900/40"
                      title={lang === 'en' ? 'Delete' : 'Burahin'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* EDIT ANNOUNCEMENT MODAL */}
      {editingAnn && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm md:p-6" role="dialog" aria-modal="true" aria-labelledby="edit-announcement-title">
          <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 md:max-h-[min(42rem,calc(100dvh-3rem))]">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-4 py-4 dark:border-slate-700 md:px-6">
              <div>
                <h3 id="edit-announcement-title" className="font-display flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
                  <Pencil className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'en' ? 'Modify Advisory Bulletin' : 'Baguhin ang Paunawa'}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAnn(null)}
                aria-label={lang === 'en' ? 'Close editor' : 'Isara ang editor'}
                className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex min-h-0 flex-1 flex-col text-sm">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-300">{lang === 'en' ? 'Advisory Title' : 'Pamagat ng Paunawa'}</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-300">{lang === 'en' ? 'Category Tag' : 'Kategorya'}</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg"
                >
                  <option value="System Maintenance">{lang === 'en' ? 'System Maintenance' : 'Pagpapanatili ng Sistema'}</option>
                  <option value="Harvest Advisory">{lang === 'en' ? 'Harvest Advisory' : 'Paunawa sa Anihan'}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-300">{lang === 'en' ? 'Publishing Status' : 'Kalagayan ng Paglalathala'}</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg"
                >
                  <option value="Published">{lang === 'en' ? 'Published' : 'Nailathala'}</option>
                  <option value="Draft">{lang === 'en' ? 'Draft' : 'Naka-draft'}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-300">{lang === 'en' ? 'Message Details' : 'Detalye ng Mensahe'}</label>
                <textarea
                  required
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg leading-relaxed"
                />
              </div>

              </div>

              <div className="flex shrink-0 gap-2.5 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 md:px-6 md:py-4">
                <button
                  type="button"
                  onClick={() => setEditingAnn(null)}
                  className="min-h-11 flex-1 rounded-xl border border-slate-300 py-2.5 text-center text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {lang === 'en' ? 'Cancel' : 'Kanselahin'}
                </button>
                <button
                  type="submit"
                  className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-center text-sm font-bold text-white transition-all hover:bg-emerald-500"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Update Advisory' : 'I-update ang Paunawa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirmation && (
        <AdminConfirmationModal
          title={confirmation.title}
          message={confirmation.message}
          confirmLabel={confirmation.confirmLabel}
          cancelLabel={lang === 'en' ? 'Cancel' : 'Kanselahin'}
          intent={confirmation.intent}
          onConfirm={confirmation.action}
          onCancel={() => setConfirmation(null)}
        />
      )}
    </div>
  );
}
