import { useApp } from '../../context/AppContext';
import React from 'react';
import { Link2, Sprout, Truck, Users, AlertTriangle } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
}

export default function ReportsTab({ lang }: ReportsTabProps) {
  const { theme } = useApp();
  const tooltipStyle = { backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', color: theme === 'dark' ? '#f8fafc' : '#0f172a', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` };

  // Chart and statistical mocks
  const cropPriceDistribution = [
    { name: 'Palay (Wet)', avgPrice: 16.5, prevPrice: 15.2 },
    { name: 'Palay (Dry)', avgPrice: 21.0, prevPrice: 19.4 },
    { name: 'Palay (RC 160)', avgPrice: 23.5, prevPrice: 22.0 },
    { name: 'Palay (RC 218)', avgPrice: 24.0, prevPrice: 23.0 },
    { name: 'Palay (Regular)', avgPrice: 20.0, prevPrice: 18.5 }
  ];

  const serviceCompletionMins = [
    { name: 'Transport Dispatch', durationMins: 45 },
    { name: 'Cold Allocation', durationMins: 20 },
    { name: 'Mechanical Drying', durationMins: 120 },
    { name: 'Milling Service', durationMins: 90 },
    { name: 'Buyer Matching Lock', durationMins: 35 }
  ];

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
            <span className="text-[9px] uppercase font-bold tracking-wider">Crop Statistics</span>
            <Sprout className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-md font-extrabold text-slate-900 dark:text-white font-display">64.5 Tons</h3>
          <p className="text-[10px] text-slate-500 mt-1">Total listed volume this month. Average price index: ₱61.7/kg.</p>
        </div>

        {/* Category 2: Service Utilization */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[9px] uppercase font-bold tracking-wider">Service Utilization</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-md font-extrabold text-slate-900 dark:text-white font-display">94.8% Rate</h3>
          <p className="text-[10px] text-slate-500 mt-1">Fulfillment index. Average transport routing dispatch: 45 minutes.</p>
        </div>

        {/* Category 3: Transactional Analytics */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[9px] uppercase font-bold tracking-wider">Direct Connections</span>
            <Link2 className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-md font-extrabold text-slate-900 dark:text-white font-display">482 Matches</h3>
          <p className="text-[10px] text-slate-500 mt-1">Total farmer-buyer contact matches. Matching success rate: 84%.</p>
        </div>

        {/* Category 4: User Growth */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[9px] uppercase font-bold tracking-wider">User Statistics</span>
            <Users className="w-4 h-4 text-violet-600" />
          </div>
          <h3 className="text-md font-extrabold text-slate-900 dark:text-white font-display">+32% Growth</h3>
          <p className="text-[10px] text-slate-500 mt-1">Daily Active Users: 86. Registration approval success rate: 91.2%.</p>
        </div>

        {/* Category 5: Spoilage Prevented */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[9px] uppercase font-bold tracking-wider">Spoilage Risk prevented</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <h3 className="text-md font-extrabold text-emerald-600 font-display">42.5 Tons Saved</h3>
          <p className="text-[10px] text-slate-500 mt-1">Prevents post-harvest spoilage. Equivalent savings: ₱184k to farmers.</p>
        </div>
      </div>

      {/* Reports Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Average Market Price and Previous Month (Bar Chart) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            {lang === 'en' ? 'Average Farmgate Price Index comparison (₱/kg)' : 'Paghahambing ng Presyo sa Farmgate (₱/kg)'}
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cropPriceDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
                <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tooltipStyle.color }} itemStyle={{ color: tooltipStyle.color }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="avgPrice" name="This Month" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="prevPrice" name="Last Month" fill="#94a3b8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Average Service Fulfillment Duration (Area Chart) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            {lang === 'en' ? 'Average Post-Harvest Service Fulfillment Speed' : 'Bilis ng Pagtupad sa mga Serbisyo (Minuto)'}
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serviceCompletionMins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
                <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tooltipStyle.color }} itemStyle={{ color: tooltipStyle.color }} />
                <Area type="monotone" dataKey="durationMins" name="Minutes" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDuration)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
