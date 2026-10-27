import { IconBell, IconBolt, IconSun, IconTruckDelivery, IconWheat } from '@tabler/icons-react';
import { useLiveRevision } from '../lib/useLiveRevision';
import React, { useEffect, useState } from 'react';
import { UserAccount, AppNotification } from '../types';
import { 
  Bell, Megaphone, TrendingUp, Truck, ShieldCheck, 
  Search, CheckCircle2, Clock, Sparkles, Filter, 
  Building2, ChevronRight, XCircle, FileText, Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import WeatherWidget from './WeatherWidget';

export interface AnnouncementsBoardProps {
  user: UserAccount;
  showWeather?: boolean;
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onClearAllNotifications?: (userEmail: string) => void;
  onNavigateToFeature?: (featureId: string) => void;
}

export interface PlatformAnnouncement {
  id: string;
  category: 'market' | 'logistics' | 'system' | 'advisory';
  titleEn: string;
  titleTl: string;
  contentEn: string;
  contentTl: string;
  badgeEn: string;
  badgeTl: string;
  date: string;
  isUrgent?: boolean;
  actionFeatureId?: string;
  actionLabelEn?: string;
  actionLabelTl?: string;
}

const SAMPLE_ANNOUNCEMENTS: PlatformAnnouncement[] = [
  {
    id: 'ann-1',
    category: 'market',
    titleEn: 'DA Reference Price Benchmark Updated: ₱22.80/kg',
    titleTl: 'Opisyal na Gabay sa Presyo ng Palay mula sa DA: ₱22.80/kg',
    contentEn: 'The Department of Agriculture (DA) has released the benchmark reference price for fresh and dry palay (14% moisture content). Farmers and buyers are encouraged to use this price reference for fair trade transactions across Luzon.',
    contentTl: 'Inilabas ng Kagawaran ng Pagsasaka (DA) ang opisyal na gabay sa presyo ng tuyong palay (14% moisture). Inirerekomenda sa mga magsasaka at mamimili na gamitin ito bilang batayan sa patas na bentahan.',
    badgeEn: ' Market Benchmark',
    badgeTl: ' Presyo sa Merkado',
    date: 'Today, 8:00 AM',
    isUrgent: true,
    actionFeatureId: 'palay',
    actionLabelEn: 'View Market Insights',
    actionLabelTl: 'Suriin ang Presyo',
  },
  {
    id: 'ann-2',
    category: 'logistics',
    titleEn: '12 New Verified Hauling Operators Joined Kawing Fleet',
    titleTl: '12 Bagong Byahero at Truck Operators ang Handa Na',
    contentEn: 'We have added 12 new verified truck operators in Bulacan, Nueva Ecija, Tarlac, and Pampanga. You can now request immediate or scheduled crop hauling with transparent per-bag distance rates.',
    contentTl: 'Nagdagdag ng 12 bagong beripikadong truck operators sa Bulacan, Nueva Ecija, Tarlac, at Pampanga. Pwede nang humiling ng biyahe para sa paghakot ng ani gamit ang makatarungang rate.',
    badgeEn: ' Logistics Fleet',
    badgeTl: ' Transportasyon',
    date: 'Yesterday',
    actionFeatureId: 'services',
    actionLabelEn: 'Book Hauling Truck',
    actionLabelTl: 'Humingi ng Byahero',
  },
  {
    id: 'ann-3',
    category: 'system',
    titleEn: 'Enhanced Direct Buyer Bidding & In-App Alerts Enabled',
    titleTl: 'Pinalakas na Bidding System at In-App na Abiso',
    contentEn: 'Kawing Hub now shows real-time in-app updates when buyers submit higher price offers or accept harvest listings.',
    contentTl: 'Mabilis nang nagpapadala ang Kawing Hub ng mga abiso sa tuwing may bagong alok na presyo ang mga buyer sa inyong na-post na ani. Siguraduhing tama ang inyong numero.',
    badgeEn: ' System Update',
    badgeTl: ' Update sa Sistema',
    date: 'July 24, 2026',
    actionFeatureId: 'interests',
    actionLabelEn: 'Check Offers',
    actionLabelTl: 'Tingnan ang Alok',
  },
  {
    id: 'ann-4',
    category: 'advisory',
    titleEn: 'Solar Drying Facilities Operating at Full Capacity',
    titleTl: 'Pasilidad sa Pagpapatuyo sa Tarlac at Nueva Ecija',
    contentEn: 'Mechanical and solar drying centers are prioritizing harvest batches from accredited cooperatives. Reserve your drying slot in advance to avoid post-harvest moisture degradation.',
    contentTl: 'Inuuna ng mga drying centers ang mga ani ng accredited cooperatives. Mag-book ng maaga upang maiwasan ang pagka-sira ng kalidad ng palay.',
    badgeEn: ' Processing Alert',
    badgeTl: ' Abiso sa Patuyuan',
    date: 'July 22, 2026',
    actionFeatureId: 'services',
    actionLabelEn: 'Request Dryer Slot',
    actionLabelTl: 'Mag-book ng Dryer',
  }
];

export default function AnnouncementsBoard({
  marketReferencePrice = 22.8,
  user,
  showWeather = true,
  notifications = [],
  onMarkNotificationRead,
  onClearAllNotifications,
  onNavigateToFeature,
}: AnnouncementsBoardProps & { marketReferencePrice?: number }) {
  const { lang } = useApp();
  const liveRevision = useLiveRevision('announcements');
  const [filterCategory, setFilterCategory] = useState<'all' | 'market' | 'logistics' | 'system' | 'alerts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<PlatformAnnouncement | null>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [storedAnnouncements, setStoredAnnouncements] = useState<PlatformAnnouncement[]>([]);

  useEffect(() => { let cancelled = false;
    fetch('/api/announcements').then(async response => {
      if (!response.ok) return;
      const result = await response.json(); if (cancelled) return;
      const items = Array.isArray(result.announcements) ? result.announcements : [];
      setStoredAnnouncements(items.filter((item: { status?: string }) => item.status === 'Published').map((item: { id: number; title: string; content: string; category: string; date: string }) => ({
        id: `admin-${item.id}`,
        category: item.category === 'System Maintenance' ? 'system' : 'advisory',
        titleEn: item.title,
        titleTl: item.title,
        contentEn: item.content,
        contentTl: item.content,
        badgeEn: item.category,
        badgeTl: item.category,
        date: item.date,
      })));
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [liveRevision]);

  const userNotifications = notifications.filter(n => n.userEmail === user.email);
  const unreadNotifications = userNotifications.filter(n => !n.isRead);

  const announcements = [...storedAnnouncements, ...SAMPLE_ANNOUNCEMENTS].map((announcement) => announcement.id === 'ANN-001'
    ? {
        ...announcement,
        titleEn: `DA Reference Price Benchmark Updated: ₱${marketReferencePrice.toFixed(2)}/kg`,
        titleTl: `Opisyal na Gabay sa Presyo ng Palay mula sa DA: ₱${marketReferencePrice.toFixed(2)}/kg`,
      }
    : announcement);
  const filteredAnnouncements = announcements.filter(ann => {
    if (filterCategory !== 'all' && filterCategory !== 'alerts' && ann.category !== filterCategory) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = ann.titleEn.toLowerCase().includes(q) || ann.titleTl.toLowerCase().includes(q);
      const matchContent = ann.contentEn.toLowerCase().includes(q) || ann.contentTl.toLowerCase().includes(q);
      return matchTitle || matchContent;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {showWeather && <WeatherWidget lang={lang} />}
      
      {/* Control Bar: Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        
        {/* Category Filters */}
        <div className="flex items-center gap-3 md:gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none snap-x">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              filterCategory === 'all'
                ? 'bg-gradient-to-r from-emerald-800 to-slate-950 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-slate-200 hover:bg-slate-200'
            }`}
          >
            {lang === 'en' ? 'All Announcements' : 'Lahat ng Anunsyo'} ({announcements.length})
          </button>
          <button
            onClick={() => setFilterCategory('market')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              filterCategory === 'market'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-slate-200 hover:bg-slate-200'
            }`}
          ><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconWheat size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Market Prices' : 'Presyo sa Merkado'}
          </button>
          <button
            onClick={() => setFilterCategory('logistics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              filterCategory === 'logistics'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-slate-200 hover:bg-slate-200'
            }`}
          ><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconTruckDelivery size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Logistics' : 'Transportasyon'}
          </button>
          <button
            onClick={() => setFilterCategory('system')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              filterCategory === 'system'
                ? 'bg-gradient-to-r from-purple-600 to-slate-900 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-slate-200 hover:bg-slate-200'
            }`}
          ><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconBolt size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'System Notices' : 'Sistema'}
          </button>
          <button
            onClick={() => setFilterCategory('alerts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filterCategory === 'alerts'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-slate-200 hover:bg-slate-200'
            }`}
          ><span className="inline-flex items-center gap-1.5 align-middle"><IconBell size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Personal Alerts' : 'Aking Abiso'}
            {unreadNotifications.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-black animate-pulse">
                {unreadNotifications.length}
              </span>
            )}
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-950 dark:text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'en' ? 'Search announcements...' : 'Maghanap ng anunsyo...'}
            className="w-full pl-9 pr-3 py-2 text-xs font-black bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950"
          />
        </div>
      </div>

      {/* Content Layout: Main Announcements List + Side Alerts Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Official Announcements List */}
        <div className={`${filterCategory === 'alerts' ? 'hidden' : 'lg:col-span-2'} space-y-4`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider font-display flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-700" />
              {lang === 'en' ? 'Official Platform Announcements' : 'Opisyal na Anunsyo sa Platform'}
            </h2>
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono">
              {filteredAnnouncements.length} {lang === 'en' ? 'announcements' : 'anunsyo'}
            </span>
          </div>

          {filterCategory !== 'alerts' && filteredAnnouncements.map((ann) => (
            <motion.button
              type="button"
              key={ann.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedAnnouncement(ann)}
              aria-label={`${lang === 'en' ? 'Read announcement' : 'Basahin ang anunsyo'}: ${lang === 'en' ? ann.titleEn : ann.titleTl}`}
              className={`w-full p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-2xs hover:shadow-lg text-left cursor-pointer group ${
                ann.isUrgent 
                  ? 'border-emerald-500/80 dark:border-emerald-600/80 bg-gradient-to-r from-emerald-500/10 via-slate-900/5 to-emerald-500/10 dark:from-emerald-950/40 dark:to-slate-900/40' 
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white leading-snug">
                  {lang === 'en' ? ann.titleEn : ann.titleTl}
                </h3>
                <span className="shrink-0 flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-400">
                  <span className="hidden sm:inline">{lang === 'en' ? 'Read details' : 'Basahin'}</span>
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </motion.button>
          ))}

          {filteredAnnouncements.length === 0 && filterCategory !== 'alerts' && (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-black text-slate-950 dark:text-white">
                {lang === 'en' ? 'No matching announcements found.' : 'Walang nahanap na anunsyo.'}
              </p>
            </div>
          )}
        </div>

        {/* Right 1 Column: Personal Activity & Notifications Alerts Board */}
        <div className={`${filterCategory === 'alerts' ? 'lg:col-span-3' : ''} space-y-4`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider font-display flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              {lang === 'en' ? 'My Activity Alerts' : 'Aking Personal na Abiso'}
            </h2>
            {userNotifications.length > 0 && onClearAllNotifications && (
              <button
                onClick={() => setShowClearConfirmation(true)}
                className="text-xs font-black text-slate-700 dark:text-slate-300 hover:text-red-600 uppercase transition-all cursor-pointer"
              >
                {lang === 'en' ? 'Clear All' : 'Burahin Lahat'}
              </button>
            )}
          </div>

          <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 ${filterCategory === 'alerts' ? 'p-5 sm:p-7' : 'p-4'}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className={`${filterCategory === 'alerts' ? 'text-base sm:text-lg' : 'text-xs'} font-black text-slate-950 dark:text-white`}>
                {lang === 'en' ? 'Recent Notifications' : 'Mga Huling Notipikasyon'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300">
                {unreadNotifications.length} {lang === 'en' ? 'unread' : 'bago'}
              </span>
            </div>

            {userNotifications.length === 0 ? (
              <div className="py-8 text-center text-slate-600 dark:text-slate-400 font-medium italic text-xs">
                {lang === 'en' ? 'No recent activity alerts for your account.' : 'Walang bagong abiso para sa iyong account.'}
              </div>
            ) : (
              <div className={`${filterCategory === 'alerts' ? 'max-h-[60vh] space-y-3 pr-2' : 'max-h-[420px] space-y-2 pr-1'} overflow-y-auto scrollbar-thin`}>
                {userNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setFilterCategory('alerts');
                      onMarkNotificationRead?.(notif.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        event.currentTarget.click();
                      }
                    }}
                    className={`${filterCategory === 'alerts' ? 'p-5 sm:p-6' : 'p-3'} rounded-xl border transition-all cursor-pointer ${
                      notif.isRead
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 opacity-80'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-2xs font-bold'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`${filterCategory === 'alerts' ? 'text-sm sm:text-base' : 'text-xs'} font-black text-slate-950 dark:text-white truncate`}>
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-300 font-mono font-bold shrink-0">
                        {notif.createdAt}
                      </span>
                    </div>
                    <p className={`${filterCategory === 'alerts' ? 'text-sm sm:text-base mt-2' : 'text-xs'} text-slate-900 dark:text-slate-200 font-medium leading-relaxed`}>
                      {notif.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Help / Info Card */}
          <div className="p-4 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-slate-950 dark:text-white space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0" />
              <h4 className="text-xs font-black uppercase tracking-wide">
                {lang === 'en' ? 'Official DA Verification' : 'Beripikadong Transaksyon'}
              </h4>
            </div>
            <p className="text-xs font-medium text-slate-900 dark:text-slate-200 leading-relaxed">
              {lang === 'en'
                ? 'All registered farmers, buyers, truck drivers, and facilities are verified through the DA-RSBSA system for safety.'
                : 'Lahat ng rehistradong magsasaka, buyer, at biyhero ay beripikado sa ilalim ng DA-RSBSA para sa inyong seguridad.'}
            </p>
          </div>

        </div>

      </div>

      {showClearConfirmation && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-3 md:p-4 backdrop-blur-sm"

          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="clear-alerts-title"
            aria-describedby="clear-alerts-description"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl md:rounded-3xl border border-slate-700 bg-white shadow-2xl dark:bg-slate-900"
          >
            <div className="p-6 text-center sm:p-7">
              <button type="button" aria-label="Close popup" onClick={() => setShowClearConfirmation(false)} className="float-right relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-slate-500/20">&times;</button>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
                <Trash2 className="h-7 w-7" />
              </div>
              <h3 id="clear-alerts-title" className="text-xl font-black text-slate-950 dark:text-white">
                {lang === 'en' ? 'Clear all activity alerts?' : 'Burahin ang lahat ng activity alerts?'}
              </h3>
              <p id="clear-alerts-description" className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                {lang === 'en'
                  ? 'All of your personal notifications will be permanently removed. This action cannot be undone.'
                  : 'Permanenteng mabubura ang lahat ng iyong personal na abiso. Hindi na ito maibabalik.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-slate-200 bg-slate-50 p-4 min-[390px]:grid-cols-2 md:grid-cols-2 dark:border-slate-800 dark:bg-slate-950/40">
              <button
                type="button"
                onClick={() => setShowClearConfirmation(false)}
                aria-label={lang === 'en' ? 'Close clear alerts confirmation' : 'Isara ang kumpirmasyon'}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {lang === 'en' ? 'Cancel' : 'Kanselahin'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllNotifications?.(user.email);
                  setShowClearConfirmation(false);
                }}
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-red-500"
              >
                {lang === 'en' ? 'Clear All' : 'Burahin Lahat'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/75 backdrop-blur-sm p-3 md:p-4"

          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-detail-title"
            onClick={(event) => event.stopPropagation()}
            className="my-auto w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] md:max-h-[85vh] overflow-y-auto rounded-2xl md:rounded-3xl border border-slate-700 bg-white dark:bg-slate-900 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 p-5 sm:p-6">
              <div className="space-y-3">
                <span className="inline-flex text-xs font-black px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-slate-100 border border-slate-300 dark:border-slate-700 uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1.5">{React.createElement(({ market: IconWheat, logistics: IconTruckDelivery, system: IconBolt, advisory: IconSun })[selectedAnnouncement.category], { size: 16, stroke: 2, className: 'inline-block shrink-0', 'aria-hidden': true })}{lang === 'en' ? selectedAnnouncement.badgeEn.trim() : selectedAnnouncement.badgeTl.trim()}</span>
                </span>
                <h3 id="announcement-detail-title" className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white leading-snug">
                  {lang === 'en' ? selectedAnnouncement.titleEn : selectedAnnouncement.titleTl}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                aria-label={lang === 'en' ? 'Close announcement' : 'Isara ang anunsyo'}
                className="shrink-0 rounded-full p-1 text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                <XCircle className="w-7 h-7" />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <span className="text-xs font-black text-slate-600 dark:text-slate-300 font-mono flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {selectedAnnouncement.date}
              </span>
              <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 leading-7">
                {lang === 'en' ? selectedAnnouncement.contentEn : selectedAnnouncement.contentTl}
              </p>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-5">
                <button
                  type="button"
                  onClick={() => setSelectedAnnouncement(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-black text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {lang === 'en' ? 'Close' : 'Isara'}
                </button>
                {selectedAnnouncement.actionFeatureId && onNavigateToFeature && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToFeature(selectedAnnouncement.actionFeatureId!);
                      setSelectedAnnouncement(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-950 via-slate-800 to-emerald-900 text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>{lang === 'en' ? selectedAnnouncement.actionLabelEn : selectedAnnouncement.actionLabelTl}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
