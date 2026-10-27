import { IconCheck } from '@tabler/icons-react';
import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Search, Filter, ShieldAlert, CheckCircle, Bell } from 'lucide-react';

interface SpoilageTabProps {
  lang: 'en' | 'tl';
}

export default function SpoilageTab({ lang }: SpoilageTabProps) {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [notif, setNotif] = useState<string | null>(null);

  // Spoilage Warnings Mocks
  const [alerts, setAlerts] = useState([
    { id: 'AL-801', farmerName: 'Mang Juan Dela Cruz', cropType: 'Palay (Wet - Basa)', riskLevel: 'High' as const, reason: lang === 'en' ? 'Wet Palay stored without mechanical ventilation exceeding 24 hours' : 'Basang Palay na nakaimbak nang walang bentilasyon nang higit sa 24 oras', action: lang === 'en' ? 'Mobilize Truck immediately to transport to Central Luzon Dryer.' : 'Magpadala agad ng Truck upang dalhin sa Central Luzon Dryer.', resolved: false, date: '2026-07-11' },
    { id: 'AL-802', farmerName: 'Aling Maria Santos', cropType: 'Palay (Dry - Tuyo)', riskLevel: 'High' as const, reason: lang === 'en' ? 'Dry Palay moisture level fluctuating due to warehouse humidity' : 'Pabago-bagong moisture level ng tuyong Palay dahil sa halumigmig ng bodega', action: lang === 'en' ? 'Transfer to climate-controlled storage slot immediately.' : 'Ilipat agad sa climate-controlled na storage slot.', resolved: false, date: '2026-07-11' },
    { id: 'AL-803', farmerName: 'Tatay Pedring Ramos', cropType: 'Palay (Wet - Basa)', riskLevel: 'Medium' as const, reason: lang === 'en' ? 'Moisture level of harvested grain is 22% (Target is <14% for dry storage)' : 'Ang moisture level ng inaning butil ay 22% (Ang target ay <14% para sa dry storage)', action: lang === 'en' ? 'Coordinate booking with Central Luzon Mechanical Dryer Hub within 24 hours.' : 'Makipag-ugnayan sa Central Luzon Mechanical Dryer sa loob ng 24 oras.', resolved: false, date: '2026-07-10' },
    { id: 'AL-804', farmerName: 'Aling Maria Santos', cropType: 'Palay (Premium - RC 160)', riskLevel: 'Medium' as const, reason: lang === 'en' ? 'Delay in mill scheduling causing accumulation of premium raw grains' : 'Pagkaantala sa iskedyul ng gilingan na sanhi ng pagkakaimbak ng de-kalidad na palay', action: lang === 'en' ? 'Coordinate priority booking with Central Luzon Miller Hub.' : 'Makipag-ugnayan sa Central Luzon Miller para magiling na.', resolved: false, date: '2026-07-10' },
    { id: 'AL-805', farmerName: 'Tatay Pedring Ramos', cropType: 'Palay (Regular - Tuyo)', riskLevel: 'Low' as const, reason: lang === 'en' ? 'Standard storage ventilation check required' : 'Standard storage ventilation check required', action: lang === 'en' ? 'Routine inspection of ventilation exhaust fans at Cooperative Storage.' : 'Regular na inspeksyon ng ventilation exhaust fans sa Coop Storage.', resolved: true, date: '2026-07-09' }
  ]);

  const triggerNotif = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3000);
  };

  const handleResolveAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
    triggerNotif(`Successfully resolved alert and logged safety protocol metrics.`);
  };

  const handleAlertService = (id: string, crop: string, location: string) => {
    triggerNotif(`Dispatched an in-app advisory and booking priorities to active KAWING truckers near ${location} for ${crop}.`);
  };

  // Filters
  const filteredAlerts = alerts.filter(a => {
    const matchesRisk = riskFilter === 'all' || a.riskLevel === riskFilter;
    const matchesSearch = 
      a.farmerName.toLowerCase().includes(search.toLowerCase()) ||
      a.cropType.toLowerCase().includes(search.toLowerCase()) ||
      a.reason.toLowerCase().includes(search.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
            <span>{lang === 'en' ? 'Kawing Spoilage Mitigation & Alert Command' : 'Sistema ng Babala sa Pagkasira ng Ani (Spoilage Alerts)'}</span>
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

      {/* Notif */}
      {notif && (
        <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl text-xs flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="font-bold">{notif}</span>
        </div>
      )}

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-bold">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Filter Risk level:</span>
        </div>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value as any)}
          className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
        >
          <option value="all">All Risks</option>
          <option value="High"> High Spoilage Risk</option>
          <option value="Medium"> Medium Spoilage Risk</option>
          <option value="Low"> Low Spoilage Risk</option>
        </select>
      </div>

      {/* Spoilage Warnings Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredAlerts.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400">
            No spoilage alert reports matching your filter criteria.
          </div>
        ) : (
          filteredAlerts.map((a) => (
            <div 
              key={a.id}
              className={`bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:shadow transition-all relative overflow-hidden ${
                a.resolved ? 'opacity-65' : ''
              }`}
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
                      <span>{a.riskLevel} Spoilage Risk</span>
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
                    <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Reason for Risk:</span>
                    <p className="text-slate-700 dark:text-slate-300 font-semibold mt-1 flex items-start gap-1.5 leading-relaxed">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{a.reason}</span>
                    </p>
                  </div>

                  <div className="bg-emerald-50/40 dark:bg-emerald-950/5 p-3 rounded-xl border border-emerald-100/40">
                    <span className="block text-[9px] uppercase font-bold text-emerald-600 tracking-wider">Mitigation Action:</span>
                    <p className="text-slate-800 dark:text-emerald-400 font-bold mt-1 leading-relaxed">
                      {a.action}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Operations Buttons */}
              <div className="mt-5 flex gap-2 pt-1">
                {a.resolved ? (
                  <div className="w-full py-2 bg-emerald-50 dark:bg-emerald-950/10 text-emerald-700 text-center text-xs font-bold rounded-xl border border-emerald-200"><span className="inline-flex items-center gap-1.5 align-middle"><IconCheck size={14} stroke={2} aria-hidden="true" className="inline-block shrink-0 text-emerald-500" />{"Resolved & Logged Safe"}</span></div>
                ) : (
                  <>
                    {/* Alert Nearest */}
                    <button
                      type="button"
                      onClick={() => handleAlertService(a.id, a.cropType, 'Candaba Regional Hub')}
                      className="flex-grow py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Alert Nearby Partners' : 'I-paalam sa Truckers'}</span>
                    </button>

                    {/* Resolve Alert */}
                    <button
                      type="button"
                      onClick={() => handleResolveAlert(a.id)}
                      className="flex-grow py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Resolve Warning' : 'Lutasin'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
