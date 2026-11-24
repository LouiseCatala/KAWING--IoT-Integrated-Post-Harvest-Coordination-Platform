import React, { useState } from 'react';
import { AlertCircle, Search, Filter, ShieldAlert } from 'lucide-react';
import { Harvest } from '../../types';

interface SpoilageTabProps {
  lang: 'en' | 'tl';
  harvestsList: Harvest[];
}

export default function SpoilageTab({ lang, harvestsList }: SpoilageTabProps) {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');

  const alerts = harvestsList
    .filter(harvest => ['high', 'medium', 'low'].includes(harvest.spoilageRisk))
    .map(harvest => ({
      id: harvest.id,
      farmerName: harvest.farmerName,
      cropType: harvest.cropType,
      riskLevel: (harvest.spoilageRisk[0].toUpperCase() + harvest.spoilageRisk.slice(1)) as 'High' | 'Medium' | 'Low',
      moistureLevel: harvest.moistureLevel,
      date: harvest.harvestDate,
    }));

  // Filters
  const filteredAlerts = alerts.filter(a => {
    const matchesRisk = riskFilter === 'all' || a.riskLevel === riskFilter;
    const matchesSearch = 
      a.farmerName.toLowerCase().includes(search.toLowerCase()) ||
      a.cropType.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
            <span>{lang === 'en' ? 'Kawing Spoilage Mitigation & Alert Command' : 'Sistema ng Babala sa Pagkasira ng Ani'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'en' ? 'Monitor spoilage risk from humidity, temperature, and transport delays.' : 'Subaybayan ang panganib sa ani mula sa moisture, init, at tagal ng biyahe.'}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'en' ? 'Search farmer, crop, reason...' : 'Maghanap...'}
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
          <span>{lang === 'en' ? 'Filter Risk Level:' : 'Salain ayon sa Panganib:'}</span>
        </div>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value as any)}
          className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
        >
          <option value="all">{lang === 'en' ? 'All Risks' : 'Lahat ng Panganib'}</option>
          <option value="High">{lang === 'en' ? 'High Spoilage Risk' : 'Mataas na Panganib ng Pagkasira'}</option>
          <option value="Medium">{lang === 'en' ? 'Medium Spoilage Risk' : 'Katamtamang Panganib ng Pagkasira'}</option>
          <option value="Low">{lang === 'en' ? 'Low Spoilage Risk' : 'Mababang Panganib ng Pagkasira'}</option>
        </select>
      </div>

      {/* Harvest risk records */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredAlerts.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400">
            {lang === 'en' ? 'No spoilage alert reports match your filters.' : 'Walang ulat ng panganib ng pagkasira na tumutugma sa iyong mga filter.'}
          </div>
        ) : (
          filteredAlerts.map((a) => (
            <div 
              key={a.id}
              className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:shadow transition-all relative overflow-hidden"
            >
              <div>
                {/* Header info */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      a.riskLevel === 'High'
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/20'
                        : a.riskLevel === 'Medium'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20'
                    }`}>
                      <span aria-hidden="true" className={`inline-block h-2 w-2 shrink-0 rounded-full ${a.riskLevel === 'High' ? 'bg-red-500' : a.riskLevel === 'Medium' ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                      <span>{lang === 'en' ? `${a.riskLevel} Spoilage Risk` : `${a.riskLevel === 'High' ? 'Mataas' : a.riskLevel === 'Medium' ? 'Katamtaman' : 'Mababa'} ang Panganib ng Pagkasira`}</span>
                    </span>

                    <h3 className="text-md font-extrabold text-slate-900 dark:text-white font-display mt-2.5">
                      {a.cropType} — {a.farmerName}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg">
                    {a.date}
                  </span>
                </div>

                {/* Risk Reasons & Recommendations */}
                <div className="mt-4 space-y-3.5 border-t border-b border-slate-100 dark:border-slate-800 py-4 text-xs">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">{lang === 'en' ? 'Reason for Risk:' : 'Dahilan ng Panganib:'}</span>
                      <p className="text-slate-700 dark:text-slate-300 font-semibold mt-1 flex items-start gap-1.5 leading-relaxed">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{a.moistureLevel != null ? `${lang === 'en' ? 'Recorded moisture content' : 'Naitalang moisture content'}: ${a.moistureLevel}` : (lang === 'en' ? `This harvest was posted with a ${a.riskLevel.toLowerCase()} risk level.` : `Na-post ang ani na may ${a.riskLevel.toLowerCase()} na antas ng panganib.`)}</span>
                    </p>
                  </div>

                  <div className="bg-emerald-50/40 dark:bg-emerald-950/5 p-3 rounded-xl border border-emerald-100/40">
                    <span className="block text-[9px] uppercase font-bold text-emerald-600 tracking-wider">{lang === 'en' ? 'Harvest record' : 'Talaan ng ani'}</span>
                    <p className="text-slate-800 dark:text-emerald-400 font-bold mt-1 leading-relaxed">{lang === 'en' ? 'Risk level from the farmer’s harvest post.' : 'Antas ng panganib mula sa post ng ani ng magsasaka.'}</p>
                  </div>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
