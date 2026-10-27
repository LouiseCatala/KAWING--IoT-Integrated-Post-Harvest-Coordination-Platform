import { IconFlame, IconWind } from '@tabler/icons-react';
import React, { useState } from 'react';
import { ServiceRequest, UserAccount, AppNotification } from '../types';
import { Wind, Thermometer, Droplets, Percent, Calendar, MapPin, CheckCircle, Flame } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Sidebar from './Sidebar';
import PalayHub from './PalayHub';
import AnnouncementsBoard from './AnnouncementsBoard';

interface DryerDashboardProps {
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

export default function DryerDashboard({
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
}: DryerDashboardProps) {
  const { t, lang } = useApp();
  const [activeTab, setActiveTab] = useState<'announcements' | 'available' | 'active' | 'palay'>('announcements');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const dryingRequests = serviceRequests.filter(s => s.type === 'drying');

  // Available requests
  const availableQueue = dryingRequests.filter(s => s.status === 'pending');

  // Active drying batches for THIS operator
  const activeBatches = dryingRequests.filter(
    s => s.status === 'matched' && s.operatorEmail === user.email
  );

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
        
        {/* Title Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display uppercase tracking-wide">
              {activeTab === 'available' && (lang === 'en' ? 'Drying Requests Queue' : 'Hiling sa Pagpapatuyo')}
              {activeTab === 'active' && (lang === 'en' ? 'Active Drying Operations' : 'Aking Active na Pagpapatuyo')}
              {activeTab === 'palay' && (lang === 'en' ? 'Sentrong Palay Direct Directory' : 'Sentrong Palay Direct Directory')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeTab === 'available' && (lang === 'en' ? 'Accept drying requests from farmers in your area.' : 'Pumili at tumanggap ng hiling sa pagpapatuyo.')}
              {activeTab === 'active' && (lang === 'en' ? 'Monitor and update moisture reduction progress.' : 'Subaybayan ang antas ng tuyo ng palay sa iyong pasilidad.')}
              {activeTab === 'palay' && (lang === 'en' ? 'View live buying prices and available palay stocks.' : 'Tingnan ang presyo at magagamit na palay.')}
            </p>
          </div>
        </div>

        {/* Dynamic Queue display */}
        {activeTab === 'announcements' ? (
          <AnnouncementsBoard
            user={user}
            notifications={notifications}
            onMarkNotificationRead={onMarkNotificationRead}
            onClearAllNotifications={onClearAllNotifications}
            onNavigateToFeature={(tabId) => setActiveTab(tabId === 'requests' ? 'available' : tabId as any)}
          />
        ) : activeTab === 'available' ? (
          availableQueue.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 text-center py-16 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconWind size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('empty_dry_requests')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {t('empty_dry_requests_desc')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {availableQueue.map((s) => (
                <div
                  key={s.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300"
                >
                  <div className="p-6 flex-grow">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                          PENDING DRYING
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 font-display">{s.cropType}</h3>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                        {lang === 'en' ? 'NEEDS DRYING' : 'KAILANGAN PATUYUIN'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-3">{t('label_farmer')}: {s.farmerName}</p>

                    <div className="space-y-3 text-sm mb-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Wind className="w-4 h-4 text-slate-400" />
                        <span>{lang === 'en' ? 'Grain Weight' : 'Timbang ng Butil'}: <strong className="text-slate-900 dark:text-white">{s.quantity} {s.unit}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{t('pickup_at')} <strong className="text-slate-900 dark:text-white truncate">{s.location}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{t('drying_duration')} <strong className="text-slate-900 dark:text-white">{lang === 'en' ? '1–2 Days' : '1–2 Araw'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    <button
                      id={`reject-drying-${s.id}`}
                      onClick={() => { if (window.confirm(lang === 'en' ? 'Reject this drying request?' : 'Tanggihan ang request na ito?')) onRejectService(s.id); }}
                      className="flex-1 py-2.5 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
                    >
                      {lang === 'en' ? 'Reject' : 'Tanggihan'}
                    </button>
                    <button
                      id={`accept-drying-${s.id}`}
                      onClick={() => { if (window.confirm(lang === 'en' ? 'Accept this drying request and take responsibility for it?' : 'Tanggapin at akuin ang request na ito?')) onAcceptService(s.id); }}
                      className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-600/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Flame className="w-4 h-4 animate-pulse" /> {t('btn_start_drying')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'active' ? (
          activeBatches.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 text-center py-16 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconWind size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('empty_active_drying')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {t('empty_active_drying_desc')}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeBatches.map((s) => (
                <div
                  key={s.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/50 bg-amber-50/10 dark:bg-amber-950/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300"
                >
                  <div className="flex items-start gap-4 flex-grow">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xl flex-shrink-0 font-display"><span className="inline-flex items-center gap-1.5 align-middle"><IconFlame size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
                    <div className="space-y-2 flex-grow">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-lg font-display">{s.cropType}</h4>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 uppercase tracking-wider animate-pulse">
                          {lang === 'en' ? 'Currently Drying' : 'Kasalukuyang Pinapatuyo'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('label_farmer')}: <strong className="text-slate-700 dark:text-slate-200">{s.farmerName}</strong> • {lang === 'en' ? 'Quantity' : 'Dami'}: <strong className="text-slate-700 dark:text-slate-200">{s.quantity} {s.unit}</strong>
                      </p>

                      {/* Equipment parameters */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md pt-2">
                        <div className="bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <div>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">{t('temp_label')}</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-white">45°C</span>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                          <div>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">{t('humidity_metric')}</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-white">14%</span>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl flex items-center gap-2 col-span-2 sm:col-span-1">
                          <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <div>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">{t('drying_rate')}</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-white">Active</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch md:items-end justify-center">
                    <button
                      id={`complete-drying-${s.id}`}
                      onClick={() => { if (window.confirm(lang === 'en' ? 'Mark this drying request as completed? This will close the job.' : 'Markahan itong completed? Isasara nito ang trabaho.')) onCompleteService(s.id); }}
                      className="py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                    >
                      <CheckCircle className="w-4 h-4" /> {t('btn_drying_complete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <PalayHub />
        )}
      </main>
      </div>
    </div>
  );
}
