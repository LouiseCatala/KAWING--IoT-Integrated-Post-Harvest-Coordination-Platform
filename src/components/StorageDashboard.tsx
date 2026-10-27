import { IconPackage } from '@tabler/icons-react';
import React, { useState } from 'react';
import { ServiceRequest, UserAccount, AppNotification } from '../types';
import { HardDrive, Percent, Package, MapPin, Calendar, ShieldCheck, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Sidebar from './Sidebar';
import AnnouncementsBoard from './AnnouncementsBoard';

interface StorageDashboardProps {
  user: UserAccount;
  serviceRequests: ServiceRequest[];
  onAcceptService: (requestId: string) => void;
  onRejectService: (requestId: string) => void;
  onCompleteService: (requestId: string) => void;
  onUpdateUser: (originalName: string, updated: UserAccount) => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onClearAllNotifications: (email: string) => void;
  onLogout: () => void;
}

export default function StorageDashboard({
  user,
  serviceRequests,
  onAcceptService,
  onRejectService,
  onCompleteService,
  onUpdateUser,
  notifications,
  onMarkNotificationRead,
  onClearAllNotifications,
  onLogout,
}: StorageDashboardProps) {
  const { t, lang } = useApp();
  const [activeTab, setActiveTab] = useState<'announcements' | 'available' | 'active'>('announcements');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const storageRequests = serviceRequests.filter(s => s.type === 'storage');

  // Available requests
  const availableBookings = storageRequests.filter(s => s.status === 'pending');

  // Active bookings for THIS storage operator email
  const activeBookings = storageRequests.filter(
    s => s.status === 'matched' && s.operatorEmail === user.email
  );

  // Storage utilization math
  const totalCapacity = 5000; // 5 Tons
  const usedCapacity = activeBookings.reduce((sum, b) => sum + b.quantity, 0) + 1800; // dynamic + offset
  const usedPercent = Math.min(100, Math.round((usedCapacity / totalCapacity) * 100));

  return (
    <div className="h-dvh max-h-dvh overflow-hidden bg-slate-50/80 dark:bg-slate-950/92 backdrop-blur-lg flex flex-col font-sans transition-colors duration-300">
      
      {/* Main Container with Left Sidebar */}
      <div className="flex-1 min-h-0 flex w-full overflow-hidden">
        <Sidebar
          user={user}
          activeTab={activeTab === 'available' ? 'requests' : activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId === 'requests' ? 'available' : tabId as any)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onUpdateUser={onUpdateUser}
          onLogout={onLogout}
          notifications={notifications}
          onMarkNotificationRead={onMarkNotificationRead}
        />

        <main className="dashboard-main flex-1 min-w-0 w-full max-w-[1440px] mx-auto h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 scroll-smooth">
        
        {/* Capacity Utilization Visual Card */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6 md:mb-8 transition-all duration-300">
          <div className="flex items-center justify-between mb-4 font-sans">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base font-display">{t('capacity_title')}</h3>
            </div>
            <span className="text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Percent className="w-3.5 h-3.5" /> {usedPercent}% {lang === 'en' ? 'Utilized' : 'Nagagamit'}
            </span>
          </div>
          <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 dark:bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${usedPercent}%` }}
            />
          </div>
          <div className="flex flex-col min-[390px]:flex-row justify-between items-start min-[390px]:items-center gap-2 min-[390px]:gap-3 text-xs text-slate-500 dark:text-slate-400 mt-3 font-mono">
            <span>{t('utilized_label')}: <strong>{usedCapacity.toLocaleString()} kg</strong></span>
            <span>Total Limit: <strong>{totalCapacity.toLocaleString()} kg</strong></span>
            <span className="font-bold text-purple-700 dark:text-purple-400">{t('available_label')}: {(totalCapacity - usedCapacity).toLocaleString()} kg</span>
          </div>
        </div>

        {/* Title Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display uppercase tracking-wide">
              {activeTab === 'available' && (lang === 'en' ? 'Storage Requests' : 'Mga Hiling na Imbakan')}
              {activeTab === 'active' && (lang === 'en' ? 'Active Warehouse Stocks' : 'Aking Active Stocks sa Bodega')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeTab === 'available' && (lang === 'en' ? 'Review incoming storage requests from farmers.' : 'Suriin ang mga hiling na imbakan mula sa magsasaka.')}
              {activeTab === 'active' && (lang === 'en' ? 'Manage active grain inventory stored in your warehouse.' : 'Pamahalaan ang mga kasalukuyang nakatagong palay sa bodega.')}
            </p>
          </div>
        </div>

        {/* Dynamic Panels */}
        {activeTab === 'announcements' ? (
          <AnnouncementsBoard
            user={user}
            notifications={notifications}
            onMarkNotificationRead={onMarkNotificationRead}
            onClearAllNotifications={onClearAllNotifications}
            onNavigateToFeature={(tabId) => setActiveTab(tabId === 'requests' ? 'available' : tabId as any)}
          />
        ) : activeTab === 'available' ? (
          availableBookings.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 text-center py-16 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconPackage size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('empty_bookings')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {t('empty_bookings_desc')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableBookings.map((s) => (
                <div
                  key={s.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300"
                >
                  <div className="p-6 flex-grow">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded">
                          PENDING STORAGE
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 font-display">{s.cropType}</h3>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                        PENDING APPROVAL
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-3">{t('label_farmer')}: {s.farmerName}</p>

                    <div className="space-y-3 text-sm mb-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span>{lang === 'en' ? 'Product Quantity' : 'Timbang ng Produkto'}: <strong className="text-slate-900 dark:text-white">{s.quantity} {s.unit}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{lang === 'en' ? 'Farm Location' : 'Lokasyon ng Sakahan'}: <strong className="text-slate-900 dark:text-white truncate">{s.location}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{t('duration_label')} <strong className="text-slate-900 dark:text-white">{t('duration_days')}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    <button
                      id={`reject-storage-${s.id}`}
                      onClick={() => { if (window.confirm(lang === 'en' ? 'Reject this storage request?' : 'Tanggihan ang request na ito?')) onRejectService(s.id); }}
                      className="flex-1 py-2.5 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
                    >
                      {lang === 'en' ? 'Reject' : 'Tanggihan'}
                    </button>
                    <button
                      id={`accept-storage-${s.id}`}
                      onClick={() => { if (window.confirm(lang === 'en' ? 'Accept this storage request and take responsibility for it?' : 'Tanggapin at akuin ang request na ito?')) onAcceptService(s.id); }}
                      className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-purple-600/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> {t('btn_confirm_booking')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          activeBookings.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 text-center py-16 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconPackage size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('empty_storage')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {t('empty_storage_desc')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeBookings.map((s) => (
                <div
                  key={s.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-purple-100 dark:border-purple-900/50 bg-purple-50/10 dark:bg-purple-950/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 flex items-center justify-center text-xl flex-shrink-0 font-display"><span className="inline-flex items-center gap-1.5 align-middle"><IconPackage size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-lg font-display">{s.cropType}</h4>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 uppercase tracking-wider">
                          {t('storage_active_badge')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('label_farmer')}: <strong className="text-slate-700 dark:text-slate-200">{s.farmerName}</strong> • {lang === 'en' ? 'Quantity' : 'Dami'}: <strong className="text-slate-700 dark:text-slate-200">{s.quantity} {s.unit}</strong>
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs text-slate-600 dark:text-slate-300 pt-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span>{t('temp_label')}: <strong className="text-slate-800 dark:text-white">Room A-3 (Temp: 4°C)</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{t('days_remaining_label')} <strong className="text-purple-700 dark:text-purple-400">{t('days_remaining_val')}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch md:items-end justify-center">
                    <button
                      id={`complete-storage-${s.id}`}
                      onClick={() => { if (window.confirm(lang === 'en' ? 'Mark this storage request as completed? This will close the job.' : 'Markahan itong completed? Isasara nito ang trabaho.')) onCompleteService(s.id); }}
                      className="py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                    >
                      <ShieldCheck className="w-4 h-4" /> {t('btn_pickup_complete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </main>
      </div>
    </div>
  );
}
