import { IconBulb, IconWheat } from '@tabler/icons-react';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, 
  Sparkles
} from 'lucide-react';

interface PalayHubProps {
  onAddDryingRequest?: (quantity: number, location: string) => void;
  farmerLocation?: string;
}

export default function PalayHub({ onAddDryingRequest, farmerLocation = '' }: PalayHubProps) {
  const { t, lang } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'guide' | 'varieties'>('guide');

  // Palay Varieties Guide Data
  const PALAY_VARIETIES = [
    {
      name: 'RC 218 (Mabango)',
      type: 'Premium / Aromatic',
      yield: '4.5 - 6.0 tons/ha',
      duration: '120 days',
      features: lang === 'en' ? 'Excellent eating quality, soft and aromatic. Highly preferred by premium buyers.' : 'Napakasarap kainin, malambot at mabango. Unang pinipili ng mga premium na mamimili.',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=60'
    },
    {
      name: 'RC 160 (Tubigan)',
      type: 'High-Yielding / Standard',
      yield: '5.6 - 8.2 tons/ha',
      duration: '107 days',
      features: lang === 'en' ? 'Excellent resistance to pests, sturdy stems, and high milling recovery rate.' : 'Matibay sa peste at hangin, at napakataas ng milling recovery rate (maraming makukuhang bigas).',
      image: 'https://images.unsplash.com/photo-1536657249091-9f0a2270dd05?w=400&auto=format&fit=crop&q=60'
    },
    {
      name: 'Jasmine Rice (Local)',
      type: 'Specialty / Fancy',
      yield: '4.0 - 5.0 tons/ha',
      duration: '115 days',
      features: lang === 'en' ? 'Fragrant, sticky, soft texture. commands the highest premium dry price in markets.' : 'Mabango, malagkit, at napakalambot. Pinakamataas ang presyo nito kapag tuyo sa merkado.',
      image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&auto=format&fit=crop&q=60'
    }
  ];

  return (
    <div id="palay-hub-root" className="bg-linear-to-br from-amber-50/40 via-white to-emerald-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 rounded-3xl border border-amber-100 dark:border-emerald-900/30 p-6 shadow-xl transition-all duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-amber-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/10 text-xl font-bold text-white"><span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 font-display">
              {lang === 'en' ? 'Sentrong Palay' : 'Sentrong Palay'} <span className="text-xs bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold px-2 py-0.5 rounded-full">Kawing Hub</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {lang === 'en' ? 'Premium post-harvest toolset & guidance for paddy rice production' : 'Kagamitan at gabay sa tamang pag-proseso ng inaning palay'}
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start md:self-center">
          <button
            onClick={() => setActiveSubTab('guide')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'guide' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {lang === 'en' ? 'Post-Harvest Guide' : 'Gabay sa Ani'}
          </button>
          <button
            onClick={() => setActiveSubTab('varieties')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'varieties' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {lang === 'en' ? 'Palay Seed Guide' : 'Binhi ng Palay'}
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'guide' && (
          <motion.div
            key="guide"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            {[
              {
                step: '01',
                title: lang === 'en' ? 'Harvesting (Pag-ani)' : 'Pag-ani (Harvesting)',
                desc: lang === 'en' ? 'Harvest when 80-85% of grains are straw-colored. Avoid delays to prevent shattering and quality degradation.' : 'Mag-ani kapag 80-85% ng butil ay kulay-dayami na. Huwag patagalin upang hindi malagas ang palay.',
                tips: 'MC at Harvest: 20-25% (Dry Season), 25-30% (Wet Season)',
                bg: 'from-amber-50 to-amber-100/50 dark:from-slate-800 dark:to-slate-800'
              },
              {
                step: '02',
                title: lang === 'en' ? 'Threshing (Paghahalo)' : 'Pag-giik (Threshing)',
                desc: lang === 'en' ? 'Thresh within 24 hours of cutting to prevent heat build-up which turns grains yellow and bitter.' : 'I-giik ang palay sa loob ng 24 oras upang hindi ito uminit, na nagiging sanhi ng pagka-dilaw at pagkasira ng butil.',
                tips: 'Avoid piling wet straw for more than a day.',
                bg: 'from-emerald-50 to-emerald-100/50 dark:from-slate-800 dark:to-slate-800'
              },
              {
                step: '03',
                title: lang === 'en' ? 'Drying (Pagpapatuyo)' : 'Pagpapatuyo (Drying)',
                desc: lang === 'en' ? 'Dry down to 14% MC immediately. Use clean solar tarps (sapa) or dispatch to our mechanical dryers.' : 'Patuyuin hanggang 14% MC agad. Gumamit ng malinis na lona o mag-book ng mekanikal na dryer rito sa Kawing.',
                tips: 'Never sun-dry on bare concrete highways!',
                bg: 'from-amber-50 to-amber-100/50 dark:from-slate-800 dark:to-slate-800'
              },
              {
                step: '04',
                title: lang === 'en' ? 'Storage (Pag-imbak)' : 'Pag-imbak (Storage)',
                desc: lang === 'en' ? 'Store dried sacks in clean warehouses. Keep off the floor using wooden pallets and allow ventilation.' : 'I-imbak sa malinis na bodega. Ilagay sa kahoy na pallets upang lumayo sa basa at umagos ang hangin.',
                tips: 'Maintain 13-14% MC to prevent grain pests.',
                bg: 'from-emerald-50 to-emerald-100/50 dark:from-slate-800 dark:to-slate-800'
              }
            ].map((g, idx) => (
              <div key={idx} className={`bg-linear-to-br ${g.bg} p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-4`}>
                <div>
                  <span className="text-2xl font-black text-emerald-600/20 dark:text-emerald-400/20 block font-display">{g.step}</span>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mt-1 font-display">{g.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{g.desc}</p>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconBulb size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Tip:"}</span>{g.tips}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeSubTab === 'varieties' && (
          <motion.div
            key="varieties"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {PALAY_VARIETIES.map((v, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300">
                <div className="h-32 w-full overflow-hidden relative">
                  <img src={v.image} alt={v.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute top-3 left-3 bg-slate-900/85 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                    {v.type}
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base font-display">{v.name}</h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div>
                      <span className="text-[10px] uppercase block font-semibold">{lang === 'en' ? 'Potential Yield' : 'Inaasahang Ani'}</span>
                      <strong className="text-slate-800 dark:text-slate-200">{v.yield}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase block font-semibold">{lang === 'en' ? 'Maturity Days' : 'Tagal Lumaki'}</span>
                      <strong className="text-slate-800 dark:text-slate-200">{v.duration}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5 leading-relaxed">
                    {v.features}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

