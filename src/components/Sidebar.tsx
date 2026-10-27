import React, { useState } from 'react';
import { AppNotification, UserAccount } from '../types';
import { 
  Sprout, Truck, HardDrive, Wind, Wheat, ShoppingBag, 
  Users, BarChart3, Clock, CheckCircle2, Settings, FileText, 
  Store, Building2, MapPin, DollarSign, Tag, X, ChevronRight, ShieldCheck, User, Edit3, LogOut, Landmark, Mail, Bell
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import UserProfileModal from './UserProfileModal';
import ThemeToggle from './ThemeToggle';

export interface SidebarTabItem {
  id: string;
  labelEn: string;
  labelTl: string;
  icon: React.ReactNode;
  badgeCount?: number;
  children?: SidebarTabItem[];
}

interface SidebarProps {
  user: UserAccount;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  unreadCount?: number;
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onUpdateUser?: (originalName: string, updated: UserAccount) => void;
  onLogout?: () => void;
}

export default function Sidebar({
  user,
  activeTab,
  onSelectTab,
  isMobileOpen = false,
  onCloseMobile,
  unreadCount = 0,
  notifications = [],
  onMarkNotificationRead,
  onUpdateUser,
  onLogout,
}: SidebarProps) {
  const { lang, setGrainyScreen } = useApp();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEmailConsent, setShowEmailConsent] = useState(false);
  const [buyerLogisticsOpen, setBuyerLogisticsOpen] = useState(Boolean(user.buyerLogisticsEnabled));
  const [showBuyerLogisticsEnable, setShowBuyerLogisticsEnable] = useState(false);

  React.useEffect(() => {
    setShowEmailConsent(Boolean(user.email) && !user.emailNotificationConsentAsked && user.role !== 'admin');
  }, [user.email, user.emailNotificationConsentAsked, user.role]);

  const saveEmailConsent = (enabled: boolean) => {
    onUpdateUser?.(user.name, {
      ...user,
      emailNotificationsEnabled: enabled,
      emailNotificationConsentAsked: true,
      emailNotificationConsentAt: new Date().toISOString(),
    });
    setShowEmailConsent(false);
  };

  // Define role specific navigation tabs
  const getNavItems = (): SidebarTabItem[] => {
    const announcementsItem: SidebarTabItem = {
      id: 'announcements',
      labelEn: 'Announcements Board',
      labelTl: 'Papan ng Anunsyo',
      icon: <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
    };

    switch (user.role) {
      case 'farmer':
        return [
          { id: 'services', labelEn: 'KAWING Partner Hub', labelTl: 'KAWING Partner Hub', icon: <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> },
          announcementsItem,
          { id: 'loans', labelEn: 'Farm Loans', labelTl: 'Pautang para sa Sakahan', icon: <DollarSign className="w-4 h-4 text-amber-500 dark:text-amber-400" /> },
          { id: 'harvests', labelEn: 'My Harvest Posts', labelTl: 'Aking Mga Na-Post na Ani', icon: <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
          { id: 'interests', labelEn: 'Price Offers Received', labelTl: 'Mga Natanggap na Alok', icon: <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" /> },
        ];
      case 'agricultural_business':
      case 'buyer':
        return [
          { id: 'marketplace', labelEn: 'Buy Harvests', labelTl: 'Bumili ng Ani', icon: <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
          { id: 'offers', labelEn: 'My Price Offers', labelTl: 'Aking Mga Alok na Presyo', icon: <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" /> },
          announcementsItem,
          { id: 'loans', labelEn: 'Loan Management', labelTl: 'Pamamahala ng Pautang', icon: <DollarSign className="w-4 h-4 text-amber-500 dark:text-amber-400" /> },
          {
            id: 'buyer_logistics',
            labelEn: 'Logistics',
            labelTl: 'Logistics',
            icon: <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
            children: [
              { id: 'posted_services', labelEn: 'My Posted Services', labelTl: 'Aking Mga Serbisyo', icon: <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
              { id: 'logistics_jobs', labelEn: 'Available Jobs', labelTl: 'Mga Available na Trabaho', icon: <Truck className="w-4 h-4 text-amber-500 dark:text-amber-400" /> },
              { id: 'services', labelEn: 'My Booked Services', labelTl: 'Aking Naka-book na Serbisyo', icon: <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
            ],
          },
        ];
      case 'truck':
        return [
          announcementsItem,
          { id: 'available', labelEn: 'Available Logistics Jobs', labelTl: 'Hiling na Transportasyon', icon: <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
          { id: 'active', labelEn: 'My Active Trips', labelTl: 'Aking Active na Biyahe', icon: <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" /> },
          { id: 'history', labelEn: 'Completed Trips History', labelTl: 'Kasaysayan ng Natapos na Biyahe', icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
          { id: 'settings', labelEn: 'Truck Specs & Rate Settings', labelTl: 'Pamamahala ng Byahe & Rate', icon: <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" /> },
        ];
      case 'logistics':
        return [
          announcementsItem,
          { id: 'service_transport', labelEn: 'Trucking', labelTl: 'Trucking / Pagbibiyahe', icon: <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
          { id: 'service_storage', labelEn: 'Storage', labelTl: 'Imbakan', icon: <HardDrive className="w-4 h-4 text-violet-600 dark:text-violet-400" /> },
          { id: 'service_drying', labelEn: 'Drying', labelTl: 'Patuyuan', icon: <Wind className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> },
          { id: 'service_milling', labelEn: 'Milling', labelTl: 'Gilingan', icon: <Wheat className="w-4 h-4 text-amber-600 dark:text-amber-400" /> },
          { id: 'services_settings', labelEn: 'Manage My Services', labelTl: 'Pamahalaan ang Serbisyo', icon: <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
        ];
      case 'storage':
        return [
          announcementsItem,
          { id: 'available', labelEn: 'Storage Requests', labelTl: 'Mga Hiling na Imbakan', icon: <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
          { id: 'active', labelEn: 'Active Warehouse Stocks', labelTl: 'Aking Active Stocks sa Bodega', icon: <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" /> },
          { id: 'history', labelEn: 'Storage History', labelTl: 'Kasaysayan ng Naitagong Ani', icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
          { id: 'settings', labelEn: 'Facility & Rates', labelTl: 'Pamamahala ng Bodega & Rate', icon: <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" /> },
        ];
      case 'dryer':
        return [
          announcementsItem,
          { id: 'available', labelEn: 'Drying Requests', labelTl: 'Mga Hiling na Patuyuan', icon: <Wind className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
          { id: 'active', labelEn: 'Active Drying Operations', labelTl: 'Aking Active na Pagpapatuyo', icon: <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" /> },
          { id: 'history', labelEn: 'Drying History', labelTl: 'Kasaysayan ng Napatuyong Ani', icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
          { id: 'settings', labelEn: 'Dryer Specs & Rates', labelTl: 'Pamamahala ng Dryer & Rate', icon: <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" /> },
        ];
      case 'miller':
        return [
          announcementsItem,
          { id: 'available', labelEn: 'Milling Requests', labelTl: 'Mga Hiling na Pagpapagiling', icon: <Wheat className="w-4 h-4 text-amber-600 dark:text-amber-400" /> },
          { id: 'active', labelEn: 'Active Milling Batches', labelTl: 'Aking Active na Pagpapagiling', icon: <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
          { id: 'history', labelEn: 'Milling History', labelTl: 'Kasaysayan ng Nagiling na Palay', icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
          { id: 'settings', labelEn: 'Mill Specs & Rates', labelTl: 'Pamamahala ng Rice Mill & Rate', icon: <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" /> },
        ];
      case 'admin':
        return [
          announcementsItem,
          { id: 'users', labelEn: 'User Accounts Management', labelTl: 'Pamamahala ng mga Miyembro', icon: <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
          { id: 'harvests', labelEn: 'Harvest Listings Monitor', labelTl: 'Monitor ng Lahat ng Na-Post na Ani', icon: <Sprout className="w-4 h-4 text-green-600 dark:text-green-400" /> },
          { id: 'services', labelEn: 'Service Requests Overview', labelTl: 'Monitor ng Logistics & Processing', icon: <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
          { id: 'offers', labelEn: 'Price Offers & Transactions', labelTl: 'Lahat ng Transaksyon at Alok', icon: <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" /> },
          { id: 'analytics', labelEn: 'System Analytics & Reports', labelTl: 'Statistika ng Kawing Ecosystem', icon: <BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400" /> },
          { id: 'settings', labelEn: 'DA Price & Settings', labelTl: 'DA Presyo at Settings', icon: <Settings className="w-4 h-4 text-amber-600 dark:text-amber-400" /> },
        ];
      default:
        return [announcementsItem];
    }
  };

  // Agricultural Business Users always see every business module. Individual
  // services can still show their own enable/setup flow when not configured.
  const navItems = getNavItems();
  const currentScreen = navItems.flatMap(item => [item, ...(item.children || [])]).find(item => item.id === activeTab)?.labelEn || activeTab;
  React.useEffect(() => {
    setGrainyScreen(currentScreen);
    return () => setGrainyScreen('');
  }, [currentScreen, setGrainyScreen]);

  const separatorBefore = new Set<string>(
    (user.role === 'buyer' || user.role === 'agricultural_business')
      ? ['announcements', 'loans', 'buyer_logistics']
      : user.role === 'farmer'
        ? ['announcements', 'loans', 'harvests']
        : user.role === 'logistics'
          ? ['service_transport', 'services_settings']
          : ['available', 'settings']
  );

  const notificationTab = (notification: AppNotification): string => {
    const text = `${notification.title} ${notification.message}`.toLowerCase();
    const isAnnouncement = Boolean(notification.emailDetails?.Announcement) || /announcement|anunsyo/.test(text);
    if (isAnnouncement) return 'announcements';

    if (user.role === 'admin') {
      if (/account registration|verification|logistics service approval|applicant|provider/.test(text)) return 'users';
      if (/harvest|ani/.test(text)) return 'harvests';
      if (/service|serbisyo|logistics|transport|storage|drying|milling/.test(text)) return 'services';
      if (/offer|alok|transaction/.test(text)) return 'offers';
      return 'analytics';
    }

    if (user.role === 'farmer') {
      if (/loan|pautang/.test(text)) return 'loans';
      if (/offer|alok|buyer|mamimili/.test(text)) return 'interests';
      if (/service|serbisyo|kahilingan|transport|storage|drying|milling/.test(text)) return 'services';
      return 'harvests';
    }

    if (user.role === 'buyer' || user.role === 'agricultural_business') {
      if (/loan|pautang/.test(text)) return 'loans';
      if (/harvest|ani|palay/.test(text) && !/offer accepted|offer update|tinanggap|tinanggihan/.test(text)) return 'marketplace';
      if (/offer|alok/.test(text)) return 'offers';
      if (/new .*service request|logistics job/.test(text)) return 'logistics_jobs';
      if (/service|serbisyo|kahilingan/.test(text)) return 'services';
      return 'marketplace';
    }

    if (user.role === 'logistics') {
      if (/approval|approved|manage/.test(text)) return 'services_settings';
      if (/storage|imbakan/.test(text)) return 'service_storage';
      if (/drying|dryer|patuy/.test(text)) return 'service_drying';
      if (/milling|mill|giling/.test(text)) return 'service_milling';
      return 'service_transport';
    }

    if (/active|accepted|tinanggap/.test(text)) return 'active';
    if (/complete|completed|nakumpleto|history/.test(text)) return 'history';
    return 'available';
  };

  const unreadForUser = notifications.filter(notification =>
    notification.userEmail.toLowerCase() === (user.email || '').toLowerCase() && !notification.isRead
  );

  const badgeCountFor = (tabId: string) => unreadForUser.filter(notification => notificationTab(notification) === tabId).length;

  const handleNavClick = (id: string) => {
    unreadForUser
      .filter(notification => notificationTab(notification) === id)
      .forEach(notification => onMarkNotificationRead?.(notification.id));
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleBuyerLogisticsClick = () => {
    if (!user.buyerLogisticsEnabled) {
      setShowBuyerLogisticsEnable(true);
      return;
    }
    setBuyerLogisticsOpen(current => !current);
  };

  const enableBuyerLogistics = () => {
    onUpdateUser?.(user.name, { ...user, buyerLogisticsEnabled: true });
    setShowBuyerLogisticsEnable(false);
    setBuyerLogisticsOpen(true);
  };

  const content = (
    <div className="sidebar-content flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 w-full md:w-56 lg:w-64 xl:w-72 shrink-0 transition-[width] duration-300 relative">
      
      {/* Mobile close button overlay */}
      {onCloseMobile && (
        <div className="md:hidden flex justify-end p-2 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={onCloseMobile}
            className="min-h-11 min-w-11 p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all md:min-h-0 md:min-w-0 md:p-1.5"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* User Profile Card Button in Sidebar */}
      <div className="mt-3 px-3 pt-3">
        <button
          onClick={() => setShowProfileModal(true)}
          className="sidebar-profile-button w-full p-2.5 bg-emerald-50/80 dark:bg-emerald-950/30 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl transition-all text-left flex items-center gap-2.5 cursor-pointer group shadow-2xs"
          title={lang === 'en' ? 'Open Profile Settings' : 'Buksan ang Profile'}
        >
          <div className="sidebar-profile-avatar relative w-8 h-8 rounded-lg overflow-hidden bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span>{user.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="sidebar-expanded-only min-w-0 flex-1">
            <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate block">
              {user.name}
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-extrabold uppercase tracking-wider block flex items-center gap-1">
              <User className="w-3 h-3 inline" />
              {lang === 'en' ? 'My Profile' : 'Aking Profile'}
            </span>
          </div>
          <Edit3 className="sidebar-expanded-only w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* Nav Menu Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        <div className="sidebar-section-heading mb-2 flex items-center justify-between px-2">
          <span className="sidebar-expanded-only text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-display">
            {lang === 'en' ? 'Features & Workspace' : 'Mga Tampok at Serbisyo'}
          </span>
          <button
            type="button"
            onClick={() => {
              onSelectTab('announcements');
              onCloseMobile?.();
            }}
            className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
            aria-label={`${unreadForUser.length} unread notifications`}
            title={lang === 'en' ? 'Open notifications' : 'Buksan ang mga notification'}
          >
            <Bell className="h-4 w-4" />
            {unreadForUser.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-red-500 px-1 text-center text-[9px] font-black leading-4 text-white">
                {unreadForUser.length > 99 ? '99+' : unreadForUser.length}
              </span>
            )}
          </button>
        </div>

        {navItems.map((item) => {
          const isGroup = Boolean(item.children?.length);
          const isActive = activeTab === item.id || Boolean(item.children?.some(child => child.id === activeTab));
          const badgeCount = item.children
            ? item.children.reduce((total, child) => total + badgeCountFor(child.id), 0)
            : badgeCountFor(item.id) || item.badgeCount || 0;
          return (
            <React.Fragment key={item.id}>
              {separatorBefore.has(item.id) && (
                <div className="mx-2 my-2 border-t border-slate-200/80 dark:border-slate-700/80" aria-hidden="true" />
              )}
              <button
              onClick={() => isGroup ? handleBuyerLogisticsClick() : handleNavClick(item.id)}
              title={lang === 'en' ? item.labelEn : item.labelTl}
              className={`sidebar-nav-button w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer text-left group relative overflow-hidden ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/50'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 z-10">
                <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${item.id === 'interests' ? 'sidebar-price-offers-icon' : ''} ${
                  isActive ? 'bg-white/20 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/40 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                }`}>
                  {item.icon}
                  {badgeCount > 0 && (
                    <span className="absolute -right-2 -top-1.5 z-20 min-w-4 rounded-full bg-red-500 px-1 text-center text-[9px] font-black leading-4 text-white">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </span>
                <span className={`sidebar-expanded-only truncate ${isActive ? 'font-black text-white' : 'font-bold'}`}>
                  {lang === 'en' ? item.labelEn : item.labelTl}
                </span>
              </div>

              {isGroup ? (
                <div className="sidebar-expanded-only z-10 flex shrink-0 items-center gap-1.5">
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${buyerLogisticsOpen ? 'rotate-90' : ''} ${isActive ? 'text-white' : 'text-slate-400'}`} />
                </div>
              ) : isActive ? (
                <ChevronRight className="sidebar-expanded-only w-4 h-4 shrink-0 text-white z-10" />
              ) : null}
              </button>
              {item.children && user.buyerLogisticsEnabled && buyerLogisticsOpen && (
                <div className="sidebar-expanded-only ml-5 mt-1 space-y-1 border-l border-slate-200 pl-3 dark:border-slate-700">
                  {item.children.map(child => {
                    const childActive = activeTab === child.id;
                    const childBadge = badgeCountFor(child.id);
                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => handleNavClick(child.id)}
                        title={lang === 'en' ? child.labelEn : child.labelTl}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-bold transition-colors ${childActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center">{child.icon}</span>
                        <span className="min-w-0 flex-1 truncate">{lang === 'en' ? child.labelEn : child.labelTl}</span>
                        {childBadge > 0 && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-black text-white">{childBadge > 99 ? '99+' : childBadge}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Sidebar Logout Button */}
      <div className="sidebar-theme-container p-3">
        <ThemeToggle variant="sidebar" />
      </div>
      {onLogout && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            className="sidebar-logout-button w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-extrabold transition-all cursor-pointer shadow-2xs group"
          >
            <LogOut className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform" />
            <span className="sidebar-expanded-only">{lang === 'en' ? 'Log Out' : 'Mag-logout'}</span>
          </button>
        </div>
      )}

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
        <div className="sidebar-expanded-only flex items-center gap-1.5 font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{lang === 'en' ? 'Account records secured' : 'Ligtas ang account records'}</span>
        </div>
        <span className="sidebar-expanded-only text-[10px] font-mono">v2.4</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Always visible on md screens and up) */}
      <aside className="desktop-sidebar-shell hidden h-full w-[88px] shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out hover:w-56 md:block lg:hover:w-64 xl:hover:w-72 z-30">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full w-[min(88vw,22rem)] shadow-2xl">
            {content}
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showBuyerLogisticsEnable && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"

          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="enable-buyer-logistics-title"
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-amber-400/30 bg-white p-5 text-center shadow-2xl dark:bg-slate-900 sm:p-12 md:rounded-3xl md:p-8"
          >
            <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-500 to-teal-500" />
              <button type="button" aria-label="Close popup" onClick={() => setShowBuyerLogisticsEnable(false)} className="float-right relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-slate-500/20">&times;</button>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              <Truck className="h-8 w-8" />
            </div>
            <h2 id="enable-buyer-logistics-title" className="text-2xl font-black text-slate-900 dark:text-white">
              {lang === 'en' ? 'Enable Buyer Logistics' : 'I-enable ang Buyer Logistics'}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
              {lang === 'en'
                ? 'Enable logistics to post services, find jobs, and manage bookings.'
                : 'I-enable ang logistics para mag-post ng serbisyo, maghanap ng trabaho, at pamahalaan ang bookings.'}
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowBuyerLogisticsEnable(false)}
                aria-label={lang === 'en' ? 'Close logistics enable popup' : 'Isara ang logistics popup'}
                className="rounded-2xl bg-slate-100 px-6 py-4 text-base font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {lang === 'en' ? 'Cancel' : 'Kanselahin'}
              </button>
              <button
                type="button"
                onClick={enableBuyerLogistics}
                className="rounded-2xl bg-emerald-600 px-6 py-4 text-base font-extrabold text-white shadow-xl shadow-emerald-600/25 hover:bg-emerald-500"
              >
                {lang === 'en' ? 'Enable Logistics' : 'I-enable ang Logistics'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmailConsent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 text-center text-slate-900 dark:text-white shadow-2xl md:rounded-3xl md:p-7">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400"><Mail className="h-7 w-7" /></div>
            <h2 className="text-xl font-extrabold">{lang === 'en' ? 'Allow email notifications?' : 'Payagan ang email notifications?'}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{lang === 'en' ? 'Receive important KAWING updates. Change this anytime in your Profile.' : 'Tumanggap ng mahahalagang KAWING update. Maaari mo itong baguhin anumang oras sa Profile.'}</p>
            <p className="mt-3 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300 break-all">{user.email}</p>
            <div className="mt-6 grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 md:grid-cols-2">
              <button type="button" onClick={() => saveEmailConsent(false)} className="rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">{lang === 'en' ? 'Not Now' : 'Huwag Muna'}</button>
              <button type="button" onClick={() => saveEmailConsent(true)} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500">{lang === 'en' ? 'Allow Email' : 'Payagan'}</button>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <UserProfileModal
          user={user}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onUpdateUser={onUpdateUser}
        />
      )}
    </>
  );
}
