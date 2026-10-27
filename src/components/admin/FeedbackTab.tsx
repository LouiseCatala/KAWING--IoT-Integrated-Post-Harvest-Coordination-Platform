import React, { useState } from 'react';
import { Star, Search, Filter, ShieldCheck } from 'lucide-react';

interface FeedbackTabProps {
  lang: 'en' | 'tl';
}

export default function FeedbackTab({ lang }: FeedbackTabProps) {
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');

  const feedbacks = [
    { id: 'FDB-1', writer: 'Aling Maria Santos', target: 'Bayanihan Logistics', role: 'Buyer Matching', rating: 5, comment: lang === 'en' ? 'Superb shipping coordination. The premium Palay cargo was loaded and reached the Manila wholesale hub completely safe.' : 'Salamat sa mabilis at maingat na paghatid ng aming palay. Ligtas na nakarating sa gilingan.', score: 98, date: '2026-07-11' },
    { id: 'FDB-2', writer: 'Mang Juan Dela Cruz', target: 'Central Luzon Dryer Hub', role: 'Farmer Partner', rating: 4, comment: lang === 'en' ? 'Mechanical drying was very efficient, although the queue on Monday morning was slightly long.' : 'Maayos ang pagpapatuyo ng aming palay, pero medyo matagal ang pila nitong nakaraang Lunes.', score: 92, date: '2026-07-10' },
    { id: 'FDB-3', writer: 'Tatay Pedring Ramos', target: 'Sariaya Cold Storage', role: 'Farmer Partner', rating: 5, comment: lang === 'en' ? 'Excellent warehouse storage support. Saved my Palay bags from moisture damage while I booked drying services.' : 'Laking tulong ng bodega sa palay ko, naiwasan ang pagkabasa at pagkasira habang naghahanap ng dryer.', score: 96, date: '2026-07-09' },
    { id: 'FDB-4', writer: 'Sariaya Cold Storage Operator', target: 'Mang Juan Dela Cruz', role: 'Storage Operator Partner', rating: 3, comment: lang === 'en' ? 'The farmer arrived 2 hours late for the scheduled warehouse delivery slot.' : 'Medyo huli dumating ang farmer sa napagkasunduang oras ng pick-up ng paninda.', score: 85, date: '2026-07-08' }
  ];

  // Filters
  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesRating = ratingFilter === 'all' || f.rating === Number(ratingFilter);
    const matchesSearch = 
      f.writer.toLowerCase().includes(search.toLowerCase()) ||
      f.target.toLowerCase().includes(search.toLowerCase()) ||
      f.comment.toLowerCase().includes(search.toLowerCase());
    return matchesRating && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
            {lang === 'en' ? 'Platform Feedback & Ratings Board' : 'Sentral na Lupon ng Puna at Marka'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'en' ? 'Monitor rating stats, review user comments, and audit corresponding reliability index logs.' : 'Suriin ang ratings, puna, at reliability ng bawat miyembro.'}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'en' ? 'Search feedback, comments...' : 'Maghanap ng puna...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white w-64"
          />
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-bold">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Filter by Rating:</span>
        </div>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
        >
          <option value="all">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredFeedbacks.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400">
            No reviews found matching your filter criteria.
          </div>
        ) : (
          filteredFeedbacks.map((f) => (
            <div 
              key={f.id}
              className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header info */}
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-display">
                      {f.writer}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{f.role}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{f.date}</span>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1 mt-3">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star 
                      key={idx} 
                      className={`w-3.5 h-3.5 ${idx < f.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-800'}`} 
                    />
                  ))}
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 ml-1.5">{f.rating}.0 / 5.0</span>
                </div>

                {/* Target Partner & Comments */}
                <div className="mt-4 bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Review Target: <span className="text-emerald-600 font-extrabold">{f.target}</span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                    "{f.comment}"
                  </p>
                </div>
              </div>

              {/* Reliability Score Impact */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">Reliability Impact:</span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{f.score}% Index Factor</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
