import { IconCompass, IconTruck } from '@tabler/icons-react';
import React, { useState } from 'react';
import { ServiceRequest, UserAccount, AppNotification } from '../types';
import { Truck, MapPin, Calendar, CheckCircle2, Navigation, Play } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Sidebar from './Sidebar';
import AnnouncementsBoard from './AnnouncementsBoard';
import { askConfirmation } from '../lib/appDialog';

interface TruckDashboardProps {
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

export default function TruckDashboard({
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
}: TruckDashboardProps) {
  const { t, lang } = useApp();
  const [activeTab, setActiveTab] = useState<'announcements' | 'available' | 'active'>('announcements');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Filter transport requests
  const transportRequests = serviceRequests.filter(s => s.type === 'transport');

  // Available are transport requests with "pending" status
  const availableDeliveries = transportRequests.filter(s => s.status === 'pending');

  // Active are transport requests assigned to THIS operator email (separates accounts per user!)
  const activeDeliveries = transportRequests.filter(
    s => s.status === 'matched' && s.operatorEmail === user.email
  );

  const completedTodayCount = transportRequests.filter(
    s => s.status === 'completed' && s.operatorEmail === user.email
  ).length;

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

        <main className="dashboard-main flex-1 min-w-0 w-full max-w-[1440px] mx-auto h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 font-sans scroll-smooth">
        
        {/* Title Header for active feature */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display uppercase tracking-wide">
              {activeTab === 'available' && (lang === 'en' ? 'Available Logistics Jobs' : 'Hiling na Transportasyon')}
              {activeTab === 'active' && (lang === 'en' ? 'My Active Trips' : 'Aking Active na Biyahe')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeTab === 'available' && (lang === 'en' ? 'Browse and accept hauling requests from local farmers.' : 'Mag-browse at tumanggap ng hiling na biyahe mula sa mga magsasaka.')}
              {activeTab === 'active' && (lang === 'en' ? 'Manage ongoing deliveries and update trip status.' : 'Pamahalaan ang mga kasalukuyang biyahe at i-update ang status.')}
            </p>
          </div>
        </div>

        {/* Tab panels */}
        {activeTab === 'announcements' ? (
          <AnnouncementsBoard
            user={user}
            notifications={notifications}
            onMarkNotificationRead={onMarkNotificationRead}
            onClearAllNotifications={onClearAllNotifications}
            onNavigateToFeature={(tabId) => setActiveTab(tabId === 'requests' ? 'available' : tabId as any)}
          />
        ) : activeTab === 'available' ? (
          availableDeliveries.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 text-center py-16 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconTruck size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('empty_cargo')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {t('empty_cargo_desc')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {availableDeliveries.map((s) => (
                <div
                  key={s.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300"
                >
                  <div className="p-6 flex-grow">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded block">
                          PENDING CARGO
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 font-display">{s.cropType}</h3>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                        {lang === 'en' ? 'NEEDS TRANSPORT' : 'KAILANGAN NG TRANSPORT'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-3">{t('label_farmer')}: {s.farmerName}</p>

                    <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                      {s.truckType && (
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 p-2 rounded-lg border border-blue-100 dark:border-blue-900/40">
                          <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>{s.truckType}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>
                          {t('cargo_weight')}{' '}
                          <strong className="text-slate-900 dark:text-white">{s.quantity} {s.unit}</strong>
                          {s.quantityAccuracy && (
                            <span className="ml-1 text-[10px] font-bold text-slate-400">
                              ({lang === 'en' ? 'actual' : 'aktuwal'})
                            </span>
                          )}
                          {s.containerQuantity && s.containerType && (
                            <span className="block text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                              {s.containerQuantity.toLocaleString()} {s.containerType === 'sacks' ? 'sacks/kaban' : 'plastic bags'} × {s.estimatedKgPerContainer?.toLocaleString()} kg
                            </span>
                          )}
                        </span>
                      </div>
                      {s.pickupLocation && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{lang === 'en' ? 'Pick-up Place' : 'Sakayan'}: <strong className="text-slate-900 dark:text-white">{s.pickupLocation}</strong></span>
                        </div>
                      )}
                      {s.dropLocation && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <span>{lang === 'en' ? 'Drop Place' : 'Bagsakan'}: <strong className="text-slate-900 dark:text-white">{s.dropLocation}</strong></span>
                        </div>
                      )}
                      {!s.pickupLocation && !s.dropLocation && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{t('pickup_at')} <strong className="text-slate-900 dark:text-white truncate">{s.location}</strong></span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{t('requested_on')} {s.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    <button
                      id={`reject-delivery-${s.id}`}
                      onClick={() => askConfirmation(lang === 'en' ? 'Reject this delivery?' : 'Tanggihan ang request na ito?', () => onRejectService(s.id), { tone: 'danger', confirmLabel: lang === 'en' ? 'Reject Delivery' : 'Tanggihan' })}
                      className="flex-1 py-2.5 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
                    >
                      {lang === 'en' ? 'Reject' : 'Tanggihan'}
                    </button>
                    <button
                      id={`accept-delivery-${s.id}`}
                      onClick={() => askConfirmation(lang === 'en' ? 'Accept this delivery and take responsibility for it?' : 'Tanggapin at akuin ang request na ito?', () => onAcceptService(s.id), { tone: 'success', confirmLabel: lang === 'en' ? 'Accept Delivery' : 'Tanggapin' })}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4" /> {t('btn_accept_delivery')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          activeDeliveries.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 text-center py-16 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconCompass size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('empty_trips')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {t('empty_trips_desc')}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeDeliveries.map((s) => (
                <div
                  key={s.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/10 dark:bg-blue-950/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300"
                >
                  <div className="flex items-start gap-4 flex-grow">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xl flex-shrink-0"><span className="inline-flex items-center gap-1.5 align-middle"><IconTruck size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
                    <div className="space-y-1.5 flex-grow">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-lg font-display">{s.cropType}</h4>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 uppercase tracking-wider animate-pulse">
                          {t('transit_badge')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('label_farmer')}: <strong className="text-slate-700 dark:text-slate-200">{s.farmerName}</strong> • {lang === 'en' ? 'Weight' : 'Timbang'}: <strong className="text-slate-700 dark:text-slate-200">{s.quantity} {s.unit}</strong>
                      </p>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs text-slate-600 dark:text-slate-300 pt-2">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span>{lang === 'en' ? 'From' : 'Mula sa'}: <strong className="text-slate-800 dark:text-white">{s.location}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Navigation className="w-4 h-4 text-slate-400" />
                          <span>{lang === 'en' ? 'To' : 'Patungong'}: <strong className="text-slate-800 dark:text-white">Manila Wholesale Market</strong></span>
                        </div>
                      </div>

                      {/* Distance display */}
                      <div className="pt-2">
                        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                          <span>Distance: ~45 km</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch md:items-end justify-center min-w-0 md:min-w-[160px] w-full md:w-auto">
                    <button
                      id={`complete-delivery-${s.id}`}
                      onClick={() => askConfirmation(lang === 'en' ? 'Mark this delivery as completed? This will close the job.' : 'Markahan itong completed? Isasara nito ang trabaho.', () => onCompleteService(s.id), { tone: 'success', confirmLabel: lang === 'en' ? 'Mark Completed' : 'Markahan na Tapos' })}
                      className="py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                    >
                      <CheckCircle2 className="w-4 h-4" /> {t('btn_deliver_now')}
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
