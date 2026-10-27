import { IconSettings, IconWheat } from '@tabler/icons-react';
import React, { useState } from 'react';
import { ServiceRequest, UserAccount, AppNotification } from '../types';
import { RefreshCw, Droplets, Percent, Calendar, MapPin, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Sidebar from './Sidebar';
import PalayHub from './PalayHub';
import AnnouncementsBoard from './AnnouncementsBoard';

interface MillerDashboardProps {
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

export default function MillerDashboard({
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
}: MillerDashboardProps) {
  const { t, lang } = useApp();
  const [activeTab, setActiveTab] = useState<'announcements' | 'available' | 'active' | 'palay'>('announcements');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const millingRequests = serviceRequests.filter(s => s.type === 'milling');

  // Available requests
  const availableQueue = millingRequests.filter(s => s.status === 'pending');

  // Active milling batches for THIS operator
  const activeBatches = millingRequests.filter(
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
        
        {/* Statistics panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 md:mb-8 font-sans">
          <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all duration-300">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
              <RefreshCw className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                {lang === 'en' ? 'Active Milling Grains' : 'Kasalukuyang Ginagiling'}
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{activeBatches.length} Batches</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all duration-300">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                {lang === 'en' ? 'Completed Today' : 'Tapos Na Ngayong Araw'}
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">4 Batches</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all duration-300">
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                {lang === 'en' ? 'Pending Queue' : 'Mga Nakapilang Gilingin'}
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{availableQueue.length} Batches</span>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="bg-slate-200/60 dark:bg-slate-800/80 p-1 rounded-xl flex self-start mb-6 w-fit">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'available' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {lang === 'en' ? 'Milling Queue' : 'Pila sa Gilingan'} ({availableQueue.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'active' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {lang === 'en' ? 'Active Milling' : 'Kasalukuyang Ginagiling'} ({activeBatches.length})
          </button>
          <button
            onClick={() => setActiveTab('palay')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'palay' ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          ><span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Sentrong Palay' : 'Sentrong Palay'}
          </button>
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
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'en' ? 'No Pending Milling Requests' : 'Walang Nakapila sa Gilingan'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {lang === 'en' ? 'Currently no requests for grain milling or polishing in your area.' : 'Walang hiling sa paggiling o pagpapakinis sa iyong lugar.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableQueue.map((s) => (
                <div
                  key={s.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300"
                >
                  <div className="p-6 flex-grow">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                          PENDING MILLING
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 font-display">{s.cropType}</h3>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                        {lang === 'en' ? 'NEEDS MILLING' : 'KAILANGAN GILINGIN'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-3">Farmer: {s.farmerName}</p>

                    <div className="space-y-3 text-sm mb-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-slate-400" />
                        <span>{lang === 'en' ? 'Grain Weight' : 'Timbang ng Butil'}: <strong className="text-slate-900 dark:text-white">{s.quantity} {s.unit}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>Location: <strong className="text-slate-900 dark:text-white truncate">{s.location}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>Milling Duration: <strong className="text-slate-900 dark:text-white">Same Day</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    <button
                      id={`reject-milling-${s.id}`}
                      onClick={() => { if (window.confirm(lang === 'en' ? 'Reject this milling request?' : 'Tanggihan ang request na ito?')) onRejectService(s.id); }}
                      className="flex-1 py-2.5 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
                    >
                      {lang === 'en' ? 'Reject' : 'Tanggihan'}
                    </button>
                    <button
                      id={`accept-milling-${s.id}`}
                      onClick={() => { if (window.confirm(lang === 'en' ? 'Accept this milling request and take responsibility for it?' : 'Tanggapin at akuin ang request na ito?')) onAcceptService(s.id); }}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} /> {lang === 'en' ? 'Start Milling' : 'Simulan ang Paggiling'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'active' ? (
          activeBatches.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 text-center py-16 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'en' ? 'No Active Milling Batches' : 'Walang Kasalukuyang Ginagiling'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {lang === 'en' ? 'Choose a batch from the queue tab to start the milling process.' : 'Pumili ng karga sa pila upang simulan ang paggiling.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeBatches.map((s) => (
                <div
                  key={s.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/10 dark:bg-emerald-950/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300"
                >
                  <div className="flex items-start gap-4 flex-grow">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xl flex-shrink-0 font-display"><span className="inline-flex items-center gap-1.5 align-middle"><IconSettings size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
                    <div className="space-y-2 flex-grow">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-lg font-display">{s.cropType}</h4>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 uppercase tracking-wider animate-pulse">
                          {lang === 'en' ? 'Currently Milling' : 'Kasalukuyang Ginagiling'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Farmer: <strong className="text-slate-700 dark:text-slate-200">{s.farmerName}</strong> • {lang === 'en' ? 'Quantity' : 'Dami'}: <strong className="text-slate-700 dark:text-slate-200">{s.quantity} {s.unit}</strong>
                      </p>

                      {/* Equipment parameters */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md pt-2">
                        <div className="bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <div>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">MILL SPEED</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-white">1200 RPM</span>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                          <div>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">MOISTURE</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-white">13.5%</span>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl flex items-center gap-2 col-span-2 sm:col-span-1">
                          <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <div>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">RECOVERY RATE</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-white">68%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch md:items-end justify-center">
                    <button
                      id={`complete-milling-${s.id}`}
                      onClick={() => { if (window.confirm(lang === 'en' ? 'Mark this milling request as completed? This will close the job.' : 'Markahan itong completed? Isasara nito ang trabaho.')) onCompleteService(s.id); }}
                      className="py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                    >
                      <CheckCircle className="w-4 h-4" /> {lang === 'en' ? 'Complete Milling' : 'Tapusin ang Paggiling'}
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
