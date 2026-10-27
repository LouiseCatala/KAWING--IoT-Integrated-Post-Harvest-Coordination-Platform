import { useLiveRevision } from '../../lib/useLiveRevision';
import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Pencil, PlusCircle, X, Save, Calendar, CheckCircle } from 'lucide-react';
import WeatherWidget from '../WeatherWidget';

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

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
    triggerNotif('Successfully posted new advisory bulletin.');
  };

  const handleDelete = async (id: number) => {
    if (!(await persistAnnouncements(announcements.filter(a => a.id !== id)))) return;
    triggerNotif('Successfully deleted advisory bulletin.');
  };

  const handleOpenEdit = (ann: any) => {
    setEditingAnn({ ...ann, baseline: announcements });
    setEditTitle(ann.title);
    setEditContent(ann.content);
    setEditCategory(ann.category);
    setEditStatus(ann.status);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;

    const next = announcements.map(a => a.id === editingAnn.id ? {
      ...a,
      title: editTitle,
      content: editContent,
      category: editCategory,
      status: editStatus
    } : a);
    if (!(await persistAnnouncements(next, editingAnn.baseline))) return;

    setEditingAnn(null);
    triggerNotif('Successfully updated advisory bulletin.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
          {lang === 'en' ? 'KAWING Public Advisories & Announcements' : 'Mga Pahayag at Paunawa sa Sakahan (Advisory)'}
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
      {saveError && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-xs font-bold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">{saveError} <button type="button" onClick={() => void persistAnnouncements(announcements)} className="ml-2 underline">Retry</button></div>}

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
              <label className="block font-bold text-slate-500 dark:text-slate-400">Advisory Title</label>
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
              <label className="block font-bold text-slate-500 dark:text-slate-400">Category Tag</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg"
              >
                <option value="System Maintenance">System Maintenance</option>
                <option value="Harvest Advisory">Harvest Advisory (Sakahan)</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-500 dark:text-slate-400">Publishing Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg"
              >
                <option value="Published">Published (I-broadcast agad)</option>
                <option value="Draft">Draft (Itabi muna)</option>
              </select>
            </div>

            {/* Content body */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-500 dark:text-slate-400">Detailed Advisory Message</label>
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
            {lang === 'en' ? 'Active Advisories Board' : 'Sentral na Advisory Board (Mga Naka-post)'}
          </h3>

          <div className="space-y-4">
            {announcements.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No public advisories currently listed.</p>
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
                      onClick={() => handleDelete(ann.id)}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center overflow-y-auto p-3 md:p-4 z-55">
          <div className="my-auto max-h-[calc(100dvh-1.5rem)] bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl max-w-md w-full overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-md font-display flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'en' ? 'Modify Advisory Bulletin' : 'Baguhin ang Paunawa'}</span>
                </h3>
              </div>
              <button
                onClick={() => setEditingAnn(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-300">Advisory Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-300">Category Tag</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg"
                >
                  <option value="System Maintenance">System Maintenance</option>
                  <option value="Harvest Advisory">Harvest Advisory (Sakahan)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-300">Publishing Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg"
                >
                  <option value="Published">Published (I-broadcast agad)</option>
                  <option value="Draft">Draft (Itabi muna)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-300">Message Details</label>
                <textarea
                  required
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg leading-relaxed"
                />
              </div>

              <div className="flex gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-4 mt-5">
                <button
                  type="button"
                  onClick={() => setEditingAnn(null)}
                  className="flex-grow py-2.5 text-center text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-grow py-2.5 text-center text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Advisory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
