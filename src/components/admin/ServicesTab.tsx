import React, { useState } from 'react';
import { Truck, Warehouse, Wind, ShieldAlert, RefreshCw, Search, List } from 'lucide-react';
import { ServiceRequest } from '../../types';

interface ServicesTabProps {
  lang: 'en' | 'tl';
  servicesList: ServiceRequest[];
}

export default function ServicesTab({
  lang,
  servicesList,
}: ServicesTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'transport' | 'storage' | 'dryer' | 'miller'>('all');
  const [search, setSearch] = useState('');

  // Filter lists based on subtab
  const filteredServices = servicesList.filter(s => {
    if (activeSubTab === 'all') return (
      s.farmerName.toLowerCase().includes(search.toLowerCase()) ||
      s.cropType.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase())
    );
    if (activeSubTab === 'transport' && s.type !== 'transport') return false;
    if (activeSubTab === 'storage' && s.type !== 'storage') return false;
    if (activeSubTab === 'dryer' && s.type !== 'drying') return false;
    if (activeSubTab === 'miller' && s.type !== 'milling') return false;
    
    // Search filter
    const matchesSearch = 
      s.farmerName.toLowerCase().includes(search.toLowerCase()) ||
      s.cropType.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
            {lang === 'en' ? 'Kawing Logistical Coordination Center' : 'Koordinasyon ng mga Serbisyo sa Sakahan'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'en' ? 'Manage transport, storage, drying, and milling requests.' : 'Mag-ugnay ng cold truck, maglaan ng cold storage, kumpirmahin ang drying, at hiling sa gilingan.'}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'en' ? 'Search details...' : 'Maghanap...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white w-64"
          />
        </div>
      </div>

      {/* 3 Physical Services Tabs */}
      <div className="flex gap-1.5 flex-wrap bg-slate-100 dark:bg-slate-850 p-1 rounded-2xl w-fit">
        <button
          onClick={() => { setActiveSubTab('all'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'all'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <List className="w-4 h-4" />
          <span>{lang === 'en' ? 'All' : 'Lahat'}</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('transport'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'transport'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>{lang === 'en' ? 'Transportation' : 'Transportasyon'}</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('storage'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'storage'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>{lang === 'en' ? 'Storage' : 'Cold Storage'}</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('dryer'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'dryer'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Wind className="w-4 h-4" />
          <span>{lang === 'en' ? 'Mechanical Dryer' : 'Patuyuan'}</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('miller'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'miller'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>{lang === 'en' ? 'Milling' : 'Gilingan'}</span>
        </button>
      </div>

      {/* RENDERING LISTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredServices.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400">
            {lang === 'en' ? 'No active coordination requests found under this category.' : 'Walang aktibong kahilingan sa koordinasyon sa kategoryang ito.'}
          </div>
        ) : (
          filteredServices.map((req) => (
            <div 
              key={req.id}
              className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold text-slate-500">
                      {req.id}
                    </span>
                    <h3 className="text-md font-extrabold text-slate-900 dark:text-white mt-2 font-display">
                      {req.cropType} ({req.quantity} {req.unit})
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    req.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : req.status === 'matched'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-700 animate-pulse'
                  }`}>
                    {req.status === 'matched' ? 'Coordination Assigned' : req.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-b border-slate-100 dark:border-slate-800 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-bold">{lang === 'en' ? 'Farmer Name:' : 'Pangalan ng Magsasaka:'}</span>
                    <span className="font-semibold text-slate-800 dark:text-white">{req.farmerName}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-bold">{lang === 'en' ? 'Hub / Location:' : 'Sentro / Lokasyon:'}</span>
                    <span className="font-semibold text-slate-800 dark:text-white truncate max-w-[200px]">{req.location}</span>
                  </p>
                  {req.details?.distance && (
                    <p className="flex justify-between">
                      <span className="text-slate-400 font-bold">{lang === 'en' ? 'Routing Distance:' : 'Layo ng Ruta:'}</span>
                      <span className="font-semibold text-slate-800 dark:text-white">{req.details.distance}</span>
                    </p>
                  )}
                  {req.details?.daysRemaining && (
                    <p className="flex justify-between">
                      <span className="text-slate-400 font-bold">{lang === 'en' ? 'Safe Days Remaining:' : 'Natitirang Ligtas na Araw:'}</span>
                      <span className="font-bold text-amber-600">{req.details.daysRemaining} {lang === 'en' ? 'days' : 'araw'}</span>
                    </p>
                  )}
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-bold">{lang === 'en' ? 'Assigned Operator:' : 'Nakatalagang Operator:'}</span>
                    <span className="font-bold text-emerald-600">
                      {req.operatorName || (lang === 'en' ? 'Unassigned' : 'Wala pa')}
                    </span>
                  </p>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
