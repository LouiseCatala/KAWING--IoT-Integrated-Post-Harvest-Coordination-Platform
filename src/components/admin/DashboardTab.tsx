import { useApp } from '../../context/AppContext';
import React from 'react';
import { 
  Users, 
  Sprout, 
  Truck, 
  Briefcase, 
  CheckSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { UserAccount, Harvest, ServiceRequest, Offer } from '../../types';

interface DashboardTabProps {
  lang: 'en' | 'tl';
  usersList: UserAccount[];
  harvestsList: Harvest[];
  servicesList: ServiceRequest[];
  pendingUsers: UserAccount[];
  offersList: Offer[];
}

export default function DashboardTab({
  lang,
  usersList,
  harvestsList,
  servicesList,
  pendingUsers,
  offersList
}: DashboardTabProps) {
  const { theme } = useApp();
  const tooltipStyle = { backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', color: theme === 'dark' ? '#f8fafc' : '#0f172a', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` };

  // 1. Calculations for the 8 Summary Cards
  const accountUsers = usersList.filter(u => u.role !== 'admin');
  const totalUsers = accountUsers.length;
  const totalFarmers = usersList.filter(u => u.role === 'farmer').length;
  const legacyBusinessRoles = ['buyer', 'logistics', 'truck', 'storage', 'dryer', 'miller'];
  const agriculturalBusinessUsers = usersList.filter(u => u.role === 'agricultural_business' || legacyBusinessRoles.includes(u.role));
  const totalAgriculturalBusinesses = agriculturalBusinessUsers.length;
  const totalEnabledBusinessServices = agriculturalBusinessUsers.reduce((total, user) => {
    if (user.role !== 'agricultural_business') return total + 1;
    return total + Object.values(user.businessCapabilities || {}).filter(capability => capability?.enabled).length;
  }, 0);
  const pendingVerificationsCount = pendingUsers.length;
  const ongoingTransactionsCount = offersList.filter(o => o.status === 'pending').length; // Real buyer verify requests
  const completedTransactionsCount = offersList.filter(o => o.status === 'accepted').length + servicesList.filter(s => s.status === 'completed').length;
  const highSpoilageAlertsCount = harvestsList.filter(h => h.spoilageRisk === 'high').length;

  // 2. Charts are calculated only from persisted platform records.
  const now = new Date();
  const monthlyTxnData = Array.from({ length: 7 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (6 - index), 1);
    const matchingOffers = offersList.filter(offer => {
      const created = new Date(offer.createdAt);
      return !Number.isNaN(created.getTime()) && created.getFullYear() === monthDate.getFullYear() && created.getMonth() === monthDate.getMonth();
    });
    return {
      month: monthDate.toLocaleDateString(lang === 'en' ? 'en-PH' : 'fil-PH', { month: 'short' }),
      Transactions: matchingOffers.length,
      Volume: matchingOffers.reduce((total, offer) => total + Number(offer.totalAmount || 0), 0),
    };
  });

  // B. Most Requested Services (Bar Chart)
  const servicesData = [
    { name: lang === 'en' ? 'Transportation' : 'Bumibyahe', Requests: servicesList.filter(s => s.type === 'transport').length },
    { name: lang === 'en' ? 'Storage' : 'Imbakan', Requests: servicesList.filter(s => s.type === 'storage').length },
    { name: lang === 'en' ? 'Drying' : 'Patuyuan', Requests: servicesList.filter(s => s.type === 'drying').length },
    { name: lang === 'en' ? 'Milling' : 'Gilingan', Requests: servicesList.filter(s => s.type === 'milling').length },
    { name: lang === 'en' ? 'Buyer Matching' : 'Pag-match', Requests: offersList.length }
  ];

  // C. Most Harvested Crops (Pie Chart) -> Palay Classification Ratio
  const cropsData = [
    { name: lang === 'en' ? 'Wet (17%+ MC)' : 'Basa (17%+ MC)', value: harvestsList.filter(h => Number.parseFloat(h.moistureLevel) >= 17).length },
    { name: lang === 'en' ? 'Moderate (15-16.9% MC)' : 'Katamtaman (15-16.9% MC)', value: harvestsList.filter(h => { const mc = Number.parseFloat(h.moistureLevel); return mc >= 15 && mc < 17; }).length },
    { name: lang === 'en' ? 'Dry (12-14.9% MC)' : 'Tuyo (12-14.9% MC)', value: harvestsList.filter(h => { const mc = Number.parseFloat(h.moistureLevel); return mc >= 12 && mc < 15; }).length },
    { name: lang === 'en' ? 'Breakage Risk (Below 12% MC)' : 'Panganib ng Pagkabiyak (Mababa sa 12% MC)', value: harvestsList.filter(h => Number.parseFloat(h.moistureLevel) < 12).length }
  ];
  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

  // D. User Registration Trend (Line Chart)
  const userTrendData = [{ month: lang === 'en' ? 'Current' : 'Kasalukuyan', Farmers: totalFarmers, AgriculturalBusinesses: totalAgriculturalBusinesses }];

  // Construct real dynamic recent activities from actual active system interactions
  const realActivities: Array<{ user: string; activity: string; date: string; status: string }> = [];

  // 1. Add recent buyer offers/interests
  offersList.forEach(o => {
    if (o.status === 'pending') {
      realActivities.push({
        user: o.buyerName,
        activity: lang === 'en' 
          ? `Submitted verification details to connect for ${o.quantity} ${o.unit} of ${o.cropType}`
          : `Nagpadala ng impormasyon para sa verification sa ani na ${o.quantity} ${o.unit} na ${o.cropType}`,
        date: o.createdAt || '2026-07-13 06:15',
        status: 'In Progress'
      });
    } else if (o.status === 'accepted') {
      realActivities.push({
        user: o.farmerName,
        activity: lang === 'en'
          ? `Verified and approved connection with buyer ${o.buyerName}`
          : `Na-verify at inaprubahan ang koneksyon sa buyer na si ${o.buyerName}`,
        date: o.createdAt || '2026-07-13 06:20',
        status: 'Completed'
      });
    } else {
      realActivities.push({
        user: o.farmerName,
        activity: lang === 'en'
          ? `Declined connection request from ${o.buyerName}`
          : `Tinanggihan ang kahilingan ng buyer na si ${o.buyerName}`,
        date: o.createdAt || '2026-07-13 06:30',
        status: 'Rejected'
      });
    }
  });

  // 2. Add recent harvests posted
  harvestsList.forEach(h => {
    realActivities.push({
      user: h.farmerName,
      activity: lang === 'en'
        ? `Posted a new harvest: ${h.quantity} ${h.unit} of ${h.cropType}`
        : `Nag-post ng bagong ani: ${h.quantity} ${h.unit} na ${h.cropType}`,
      date: h.harvestDate + ' 08:00',
      status: 'Success'
    });
  });

  // 3. Add service requests
  servicesList.forEach(s => {
    const sType = s.type === 'transport' ? 'Transport' : s.type === 'storage' ? 'Cold Storage' : s.type === 'drying' ? 'Drying' : s.type === 'milling' ? 'Milling' : 'Buyer Matching';
    const sTypeFil = s.type === 'transport' ? 'Transportasyon' : s.type === 'storage' ? 'Cold Storage' : s.type === 'drying' ? 'Patuyuan' : s.type === 'milling' ? 'Gilingan' : 'Buyer Matching';
    realActivities.push({
      user: s.farmerName,
      activity: lang === 'en'
        ? `Requested ${sType} service for ${s.quantity} ${s.unit} of ${s.cropType}`
        : `Humiling ng serbisyong ${sTypeFil} para sa ${s.quantity} ${s.unit} na ${s.cropType}`,
      date: s.createdAt + ' 09:00',
      status: s.status === 'pending' ? 'Pending' : s.status === 'matched' ? 'In Progress' : 'Completed'
    });
  });

  const activitiesToDisplay = realActivities
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
          {lang === 'en' ? 'Kawing Executive Dashboard' : 'Executive Dashboard ng Kawing'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {lang === 'en' ? 'Track network activity, supply matches, and spoilage risk.' : 'Subaybayan ang supply matches, logistika, at panganib ng pagkasira ng ani.'}
        </p>
      </div>

      {/* 1. 8 SUMMARY CARDS */}
      <div className="grid grid-cols-1 min-[390px]:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Users */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm hover:shadow transition-all flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {lang === 'en' ? 'Total Users' : 'Kabuuhang Users'}
            </span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
              {totalUsers}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 block">Active on KAWING</span>
          </div>
        </div>

        {/* Card 2: Total Farmers */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm hover:shadow transition-all flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {lang === 'en' ? 'Total Farmers' : 'Mga Magsasaka'}
            </span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Sprout className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-display">
              {totalFarmers}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 block">Registered growers</span>
          </div>
        </div>

        {/* Card 3: Agricultural Business Users */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm hover:shadow transition-all flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {lang === 'en' ? 'Agricultural Business Users' : 'Agricultural Business Users'}
            </span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
              {totalAgriculturalBusinesses}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 block">Registered agricultural businesses</span>
          </div>
        </div>

        {/* Card 4: Enabled Business Services */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm hover:shadow transition-all flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {lang === 'en' ? 'Enabled Business Services' : 'Mga Aktibong Serbisyo'}
            </span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
              {totalEnabledBusinessServices}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 block">Buying, loans, and logistics capabilities</span>
          </div>
        </div>

        {/* Card 5: Pending Verifications */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm hover:shadow transition-all flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {lang === 'en' ? 'Pending Verifications' : 'Pila ng Beripikasyon'}
            </span>
            <div className="p-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className={`text-2xl font-extrabold font-display ${pendingVerificationsCount > 0 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
              {pendingVerificationsCount}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 block">Requires manual review</span>
          </div>
        </div>

        {/* Card 6: Ongoing Transactions */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm hover:shadow transition-all flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {lang === 'en' ? 'Ongoing Deals' : 'Kasalukuyang Deal'}
            </span>
            <div className="p-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
              {ongoingTransactionsCount}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 block">Active matching requests</span>
          </div>
        </div>

        {/* Card 7: Completed Transactions */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm hover:shadow transition-all flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {lang === 'en' ? 'Completed Deals' : 'Matagumpay na Deal'}
            </span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-display">
              {completedTransactionsCount}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 block">Safely closed contracts</span>
          </div>
        </div>

        {/* Card 8: High Spoilage Risk Alerts */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm hover:shadow transition-all flex flex-col justify-between min-h-[110px] bg-gradient-to-br from-red-500/5 to-transparent">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">
              {lang === 'en' ? 'Spoilage Warnings' : 'Babala sa Pagkasira'}
            </span>
            <div className="p-1.5 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-lg animate-pulse">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-red-600 dark:text-red-400 font-display">
              {highSpoilageAlertsCount}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 block">Urgent intervention needed</span>
          </div>
        </div>
      </div>

      {/* 2. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Monthly Transactions Volume (Line Chart) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              {lang === 'en' ? 'Monthly Platform Connections Volume' : 'Buwanang Dami ng Koneksyon sa Platform'}
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Qty Volume</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTxnData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="month" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
                <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tooltipStyle.color }} itemStyle={{ color: tooltipStyle.color }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Line 
                  type="monotone" 
                  dataKey="Transactions" 
                  name={lang === 'en' ? 'Total Transactions' : 'Bilang ng Transaksyon'}
                  stroke="#10b981" 
                  strokeWidth={3} 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Most Requested Services (Bar Chart) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              {lang === 'en' ? 'Most Requested Post-Harvest Services' : 'Pinaka-Hinihiling na Serbisyo sa Sakahan'}
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Fulfillment</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={servicesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
                <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tooltipStyle.color }} itemStyle={{ color: tooltipStyle.color }} />
                <Bar dataKey="Requests" name={lang === 'en' ? 'Booking Requests' : 'Mga Hiling'} fill="#3b82f6" radius={[8, 8, 0, 0]}>
                  {servicesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart C: Most Harvested Crops (Pie Chart) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              {lang === 'en' ? 'Palay Classification Ratio' : 'Ratio ng mga Uri ng Palay'}
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Palay Ratio</span>
          </div>
          <div className="h-64 w-full flex flex-col md:flex-row items-center justify-around gap-4">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cropsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {cropsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tooltipStyle.color }} itemStyle={{ color: tooltipStyle.color }} formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2.5 shrink-0 pr-4">
              {cropsData.map((crop, index) => (
                <div key={crop.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{crop.name}</span>
                  <span className="text-xs font-bold text-slate-400">({crop.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart D: User Registration Trend (Area Chart) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" />
              {lang === 'en' ? 'User Growth & Registration Trend' : 'Paglago at Pagrehistro ng mga User'}
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">MoM Trend</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFarmers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBuyers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="month" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
                <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tooltipStyle.color }} itemStyle={{ color: tooltipStyle.color }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="Farmers" name={lang === 'en' ? 'Farmers' : 'Magsasaka'} stroke="#10b981" fillOpacity={1} fill="url(#colorFarmers)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="AgriculturalBusinesses" name="Agricultural Business Users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBuyers)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. RECENT ACTIVITIES TABLE */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <Activity className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-display">
            {lang === 'en' ? 'Recent Network Activity Logs' : 'Kamakailang Log ng Aktibidad sa Platform'}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-slate-150 dark:border-slate-800 text-emerald-800 dark:text-emerald-200 font-bold">
                <th className="p-3 pl-4 text-left">{lang === 'en' ? 'User Account' : 'Account ng User'}</th>
                <th className="p-3 text-left">{lang === 'en' ? 'Activity Log' : 'Aktibidad'}</th>
                <th className="p-3 text-left">{lang === 'en' ? 'Timestamp' : 'Oras at Araw'}</th>
                <th className="p-3 pr-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {activitiesToDisplay.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-sm font-semibold text-slate-400">
                    {lang === 'en' ? 'No platform activity has been recorded yet.' : 'Wala pang naitalang aktibidad sa platform.'}
                  </td>
                </tr>
              )}
              {activitiesToDisplay.map((act, index) => (
                <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                  <td className="p-3 pl-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {act.user}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{act.activity}</td>
                  <td className="p-3 text-slate-400 font-mono text-[11px]">{act.date}</td>
                  <td className="p-3 pr-4 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase ${
                      act.status === 'Success' || act.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20'
                        : act.status === 'In Progress' || act.status === 'Matched'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
                    }`}>
                      {act.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
