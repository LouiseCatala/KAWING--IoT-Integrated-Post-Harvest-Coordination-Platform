import { useApp } from '../../context/AppContext';
import React from 'react';
import { Link2, Sprout, Truck, Users, AlertTriangle } from 'lucide-react';
import type { Harvest, Offer, ServiceRequest, UserAccount } from '../../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface ReportsTabProps {
  lang: 'en' | 'tl';
  harvestsList: Harvest[];
  servicesList: ServiceRequest[];
  offersList: Offer[];
  usersList: UserAccount[];
}

export default function ReportsTab({ lang, harvestsList, servicesList, offersList, usersList }: ReportsTabProps) {
  const { theme } = useApp();
  const tooltipStyle = { backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', color: theme === 'dark' ? '#f8fafc' : '#0f172a', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` };

  const pricedHarvests = harvestsList.filter(harvest => Number.isFinite(Number(harvest.targetPrice)) && Number(harvest.targetPrice) > 0);
  const cropPriceDistribution = [...pricedHarvests.reduce((groups, harvest) => {
    const group = groups.get(harvest.cropType) ?? { name: harvest.cropType, total: 0, count: 0 };
    group.total += Number(harvest.targetPrice);
    group.count += 1;
    groups.set(harvest.cropType, group);
    return groups;
  }, new Map<string, { name: string; total: number; count: number }>()).values()].map(group => ({ name: group.name, avgPrice: Number((group.total / group.count).toFixed(2)) }));
  const serviceRequestsByType = ['transport', 'storage', 'drying', 'milling', 'buyer'].map(type => ({
    name: type,
    requests: servicesList.filter(service => service.type === type).length,
  })).filter(group => group.requests > 0);
  const activeUsers = usersList.filter(user => user.role !== 'admin').length;
  const acceptedConnections = offersList.filter(offer => offer.status === 'accepted').length;
  const highRiskHarvests = harvestsList.filter(harvest => harvest.spoilageRisk === 'high').length;
  const completedServices = servicesList.filter(service => service.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
          {lang === 'en' ? 'Kawing Comprehensive Reports & Analytics' : 'Mga Ulat at Pagsusuri sa Sakahan'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {lang === 'en' ? 'Review platform performance, crop supply, service use, and spoilage prevention.' : 'Suriin ang presyo, serbisyo, paglago ng users, at pag-iwas sa pagkasira ng ani.'}
        </p>
      </div>

      {/* 5 Specialized Report Categorizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">

        {/* Category 1: Crop Statistics */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[9px] uppercase font-bold tracking-wider">{lang === 'en' ? 'Crop Statistics' : 'Datos ng mga Ani'}</span>
            <Sprout className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-md font-extrabold text-slate-900 dark:text-white font-display">{harvestsList.length}</h3>
          <p className="text-[10px] text-slate-500 mt-1">{lang === 'en' ? 'Harvest listings in the database' : 'Mga post ng ani sa database'}</p>
        </div>

        {/* Category 2: Service Utilization */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[9px] uppercase font-bold tracking-wider">{lang === 'en' ? 'Service Utilization' : 'Paggamit ng Serbisyo'}</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-md font-extrabold text-slate-900 dark:text-white font-display">{servicesList.length}</h3>
          <p className="text-[10px] text-slate-500 mt-1">{lang === 'en' ? `${completedServices} completed service requests` : `${completedServices} kahilingan sa serbisyo ang nakumpleto`}</p>
        </div>

        {/* Category 3: Transactional Analytics */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[9px] uppercase font-bold tracking-wider">{lang === 'en' ? 'Direct Connections' : 'Mga Direktang Koneksyon'}</span>
            <Link2 className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-md font-extrabold text-slate-900 dark:text-white font-display">{acceptedConnections}</h3>
          <p className="text-[10px] text-slate-500 mt-1">{lang === 'en' ? 'Accepted buyer offers' : 'Mga tinanggap na alok ng buyer'}</p>
        </div>

        {/* Category 4: User Growth */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[9px] uppercase font-bold tracking-wider">{lang === 'en' ? 'User Statistics' : 'Datos ng mga Gumagamit'}</span>
            <Users className="w-4 h-4 text-violet-600" />
          </div>
          <h3 className="text-md font-extrabold text-slate-900 dark:text-white font-display">{activeUsers}</h3>
          <p className="text-[10px] text-slate-500 mt-1">{lang === 'en' ? 'Registered farmer and business accounts' : 'Mga rehistradong farmer at business account'}</p>
        </div>

        {/* Category 5: Spoilage Prevented */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[9px] uppercase font-bold tracking-wider">{lang === 'en' ? 'Spoilage Risk Prevented' : 'Naiwasang Pagkasira ng Ani'}</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <h3 className="text-md font-extrabold text-emerald-600 font-display">{highRiskHarvests}</h3>
          <p className="text-[10px] text-slate-500 mt-1">{lang === 'en' ? 'Harvest posts marked high spoilage risk' : 'Mga post ng ani na may mataas na panganib ng pagkasira'}</p>
        </div>
      </div>

      {/* Reports Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: Average Market Price and Previous Month (Bar Chart) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            {lang === 'en' ? 'Average Asking Price by Crop' : 'Karaniwang Presyo ng Ani'}
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cropPriceDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
                <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tooltipStyle.color }} itemStyle={{ color: tooltipStyle.color }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="avgPrice" name={lang === 'en' ? 'Average asking price' : 'Karaniwang presyo'} fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Average Service Fulfillment Duration (Area Chart) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            {lang === 'en' ? 'Service Requests by Type' : 'Mga Kahilingan sa Serbisyo'}
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceRequestsByType} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
                <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tooltipStyle.color }} itemStyle={{ color: tooltipStyle.color }} />
                <Bar dataKey="requests" name="Requests" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
