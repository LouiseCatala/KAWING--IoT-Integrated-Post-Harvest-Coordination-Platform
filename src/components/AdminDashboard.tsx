import React, { useState, useEffect } from 'react';
import { AppNotification, UserAccount, Harvest, ServiceRequest, Offer } from '../types';
import {
  Shield,
  Users,
  CheckSquare,
  Sprout,
  Truck,
  History,
  BarChart3,
  Star,
  Megaphone,
  Settings,
  LogOut,
  X,
  AlertCircle,
  Eye,
  FileText,
  Clock,
  MapPin,
  Phone,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ThemeToggle from './ThemeToggle';

// Import our modular sub-components
import UsersTab from './admin/UsersTab';
import VerificationTab from './admin/VerificationTab';
import HarvestsTab from './admin/HarvestsTab';
import ServicesTab from './admin/ServicesTab';
import TransactionsTab from './admin/TransactionsTab';
import ReportsTab from './admin/ReportsTab';
import FeedbackTab from './admin/FeedbackTab';
import SpoilageTab from './admin/SpoilageTab';
import AnnouncementsTab from './admin/AnnouncementsTab';
import SettingsTab from './admin/SettingsTab';
import GrainyFaqTab from './admin/GrainyFaqTab';

interface AdminDashboardProps {
  user: UserAccount;
  harvests: Harvest[];
  serviceRequests: ServiceRequest[];
  registeredUsers: UserAccount[];
  offers: Offer[];
  marketReferencePrice: number;
  onUpdateDAReferencePrice: (price: number) => void;
  onSaveEmailNotifications: (enabled: boolean) => Promise<void>;
  onApproveUser: (name: string) => void;
  onRejectUser: (name: string, reason: string) => void;
  onDeleteUser: (name: string) => void;
  onDeleteUsers: (names: string[]) => void;
  onDeleteHarvest: (harvestId: string) => void;
  onDeleteHarvests: (harvestIds: string[]) => void;
  onUpdateUser: (originalName: string, updated: UserAccount) => void;
  onPublishAnnouncement?: (title: string, content: string, notifyByEmail: boolean) => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onLogout: () => void;
}

interface SelectedDocType {
  name: string;
  type: string;
  data: string;
}

export default function AdminDashboard({
  user,
  harvests,
  serviceRequests,
  registeredUsers,
  offers,
  marketReferencePrice,
  onUpdateDAReferencePrice,
  onSaveEmailNotifications,
  onApproveUser,
  onRejectUser,
  onDeleteUser,
  onDeleteUsers,
  onDeleteHarvest,
  onDeleteHarvests,
  onUpdateUser,
  onPublishAnnouncement,
  notifications,
  onMarkNotificationRead,
  onLogout,
}: AdminDashboardProps) {
  const { lang, theme } = useApp();
  const unreadAdminNotifications = notifications.filter(notification =>
    notification.userEmail.toLowerCase() === (user.email || '').toLowerCase() && !notification.isRead
  );
  const unreadUserDirectoryNotifications = unreadAdminNotifications.filter(notification =>
    /account registration|verification|logistics service approval|applicant|provider/i.test(`${notification.title} ${notification.message}`)
  );

  const openUsersDirectory = () => {
    unreadUserDirectoryNotifications.forEach(notification => onMarkNotificationRead(notification.id));
    setActiveTab('users');
  };

  // 1. Centralized Active Tab Routing
  const [activeTab, setActiveTab] = useState<
    | 'users'
    | 'verification'
    | 'harvests'
    | 'services'
    | 'transactions'
    | 'reports'
    | 'feedback'
    | 'spoilage'
    | 'announcements'
    | 'settings'
    | 'grainy-faqs'
  >('users');

  // 2. Centralized State to make the administrative panel 100% interactive
  const [usersList, setUsersList] = useState<UserAccount[]>(() => registeredUsers);
  const [suspendedUsers, setSuspendedUsers] = useState<string[]>([]);
  const [rejectedApplications, setRejectedApplications] = useState<UserAccount[]>([]);
  const [resubmissionRequests, setResubmissionRequests] = useState<string[]>([]);
  
  // Modals
  const [selectedDoc, setSelectedDoc] = useState<SelectedDocType | null>(null);
  const [viewingProfile, setViewingProfile] = useState<UserAccount | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  // Sync users list state when parent registeredUsers prop updates
  useEffect(() => {
    setUsersList(registeredUsers);
  }, [registeredUsers]);

  // Pending users requiring manual registration review
  const pendingUsers = usersList.filter(
    u => u.isApproved === false && u.role !== 'admin' && !rejectedApplications.some(r => r.name === u.name)
  );

  // 3. Centralized Action Handlers passed to subcomponents
  const handleApprove = (name: string) => {
    const applicant = usersList.find(user => user.name === name);
    if (!applicant?.email?.trim() || !applicant.contactNumber?.trim() || !applicant.address?.trim()) {
      setApprovalError('Email, contact number, and full address are required for approval.');
      return;
    }
    // Propagate to AppContext and update local list
    onApproveUser(name);
    setUsersList(prev => prev.map(u => u.name === name ? { ...u, isApproved: true } : u));
    setResubmissionRequests(prev => prev.filter(r => r !== name));
  };

  const handleReject = (name: string, reason: string) => {
    onRejectUser(name, reason);
    const userToReject = usersList.find(u => u.name === name);
    if (userToReject) {
      setRejectedApplications(prev => [...prev, userToReject]);
    }
    setUsersList(prev => prev.filter(u => u.name !== name));
  };

  const handleDeleteUser = (name: string) => {
    onDeleteUser(name);
    setUsersList(prev => prev.filter(u => u.name !== name));
  };

  const handleDeleteUsersLocal = (names: string[]) => {
    onDeleteUsers(names);
    setUsersList(prev => prev.filter(u => !names.includes(u.name)));
  };

  const handleRequestResubmission = (name: string, _reason: string) => {
    setResubmissionRequests(prev => [...prev, name]);
  };

  const handleToggleSuspend = (name: string) => {
    if (suspendedUsers.includes(name)) {
      setSuspendedUsers(prev => prev.filter(u => u !== name));
    } else {
      setSuspendedUsers(prev => [...prev, name]);
    }
  };

  const handleUpdateUser = (originalName: string, updated: UserAccount) => {
    onUpdateUser(originalName, updated);
    setUsersList(prev => prev.map(u => u.name === originalName ? { ...u, ...updated } : u));
  };

  const handleViewDoc = (name: string, type: string, data: string) => {
    setSelectedDoc({ name, type, data });
  };

  return (
    <div className="admin-dashboard-shell h-dvh max-h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950 backdrop-blur-lg flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 [&_p]:leading-relaxed [&_input]:text-sm [&_textarea]:text-sm [&_select]:text-sm [&_button]:text-sm [&_table]:text-sm">
      
      {/* Main Grid: Sidebar + Subcomponent container */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row max-w-[1600px] w-full mx-auto px-2 sm:px-4 lg:px-8 py-2 md:py-6 gap-2 md:gap-4 lg:gap-6 overflow-hidden">
        
        {/* LEFT SIDEBAR - Navigation Rail */}
        <aside className="w-full md:w-64 lg:w-72 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl p-2 md:p-3 sm:p-4 lg:p-5 flex flex-col gap-2 md:gap-4 shrink-0 shadow-sm h-auto md:h-full z-10 overflow-y-hidden md:overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="max-md:hidden mx-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-3 py-3 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950/50 text-emerald-400 rounded-xl shrink-0 ring-1 ring-emerald-500/20">
              <Shield className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight font-display">Kawing Admin</h2>
              <span className="text-[10px] uppercase font-bold text-emerald-400/80 tracking-wider">System registry</span>
            </div>
          </div>

          <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
            {/* 1. Users Directory */}
            <span className="px-3.5 pt-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Accounts</span>
            <button
              onClick={openUsersDirectory}
              title={lang === 'en' ? 'Users Directory' : 'Listahan ng Users'}
              className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Users className="w-4 h-4 shrink-0" />
                <span className="truncate">{lang === 'en' ? 'Users Directory' : 'Listahan ng Users'}</span>
              </div>
              {unreadUserDirectoryNotifications.length > 0 ? (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-extrabold text-white shrink-0">
                  {unreadUserDirectoryNotifications.length > 99 ? '99+' : unreadUserDirectoryNotifications.length}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400 shrink-0">{usersList.length - 1}</span>
              )}
            </button>

            {/* 3. Verification Requests */}
            <button
              onClick={() => setActiveTab('verification')}
              title={lang === 'en' ? 'Account Approval Requests' : 'Mga Account na Kailangang Aprubahan'}
              className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                activeTab === 'verification'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <CheckSquare className="w-4 h-4 shrink-0" />
                <span className="truncate">{lang === 'en' ? 'Account Approvals' : 'Pag-apruba ng Account'}</span>
              </div>
              {pendingUsers.length > 0 && (
                <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-extrabold animate-bounce shrink-0">
                  {pendingUsers.length}
                </span>
              )}
            </button>

            {/* 4. Harvest Records */}
            <span className="mt-3 border-t border-slate-200 dark:border-slate-800 px-3.5 pt-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Operations</span>
            <button
              onClick={() => setActiveTab('harvests')}
              title={lang === 'en' ? 'Harvest Records' : 'Talaan ng Ani'}
              className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                activeTab === 'harvests'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Sprout className="w-4 h-4 shrink-0" />
                <span className="truncate">{lang === 'en' ? 'Harvest Records' : 'Talaan ng Ani'}</span>
              </div>
            </button>

            {/* 5. Service Requests */}
            <button
              onClick={() => setActiveTab('services')}
              title={lang === 'en' ? 'Service Requests' : 'Hiling na Serbisyo'}
              className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Truck className="w-4 h-4 shrink-0" />
                <span className="truncate">{lang === 'en' ? 'Service Requests' : 'Hiling na Serbisyo'}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 shrink-0">{serviceRequests.length}</span>
            </button>

            {/* 6. Transactions */}
            <button
              onClick={() => setActiveTab('transactions')}
              title={lang === 'en' ? 'Connections and Deals' : 'Mga Koneksyon at Kasunduan'}
              className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                activeTab === 'transactions'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <History className="w-4 h-4 shrink-0" />
                <span className="truncate">{lang === 'en' ? 'Connections & Deals' : 'Koneksyon at Kasunduan'}</span>
              </div>
            </button>

            {/* 7. Reports & Analytics */}
            <span className="mt-3 border-t border-slate-200 dark:border-slate-800 px-3.5 pt-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Monitoring</span>
            <button
              onClick={() => setActiveTab('reports')}
              title={lang === 'en' ? 'Reports & Analytics' : 'Suri at Ulat'}
              className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span className="truncate">{lang === 'en' ? 'Reports & Analytics' : 'Suri at Ulat'}</span>
              </div>
            </button>

            {/* 8. Feedback & Ratings */}
            <button
              onClick={() => setActiveTab('feedback')}
              title={lang === 'en' ? 'Feedback & Ratings' : 'Puna at Marka'}
              className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                activeTab === 'feedback'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Star className="w-4 h-4 shrink-0" />
                <span className="truncate">{lang === 'en' ? 'Feedback & Ratings' : 'Puna at Marka'}</span>
              </div>
            </button>

            {/* 9. Spoilage Alerts */}
            <button
              onClick={() => setActiveTab('spoilage')}
              title={lang === 'en' ? 'Spoilage Alerts' : 'Babala sa Pagkasira'}
              className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer relative ${
                activeTab === 'spoilage'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">{lang === 'en' ? 'Spoilage Alerts' : 'Babala sa Pagkasira'}</span>
              </div>
              <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold animate-pulse shrink-0">RISK</span>
            </button>

            {/* 10. Announcements */}
            <span className="mt-3 border-t border-slate-200 dark:border-slate-800 px-3.5 pt-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Communication</span>
            <button
              onClick={() => setActiveTab('announcements')}
              title={lang === 'en' ? 'Announcements' : 'Mga Pahayag (Advisory)'}
              className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer relative ${
                activeTab === 'announcements'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Megaphone className="w-4 h-4 shrink-0" />
                <span className="truncate">{lang === 'en' ? 'Announcements' : 'Mga Pahayag (Advisory)'}</span>
              </div>
              <span className="text-[10px] bg-red-100 dark:bg-red-950/20 text-red-600 px-1.5 py-0.5 rounded font-bold shrink-0">ALERTS</span>
            </button>

            {/* 11. DA reference price and settings */}
            <span className="mt-3 border-t border-slate-200 dark:border-slate-800 px-3.5 pt-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Configuration</span>
            <button
              onClick={() => setActiveTab('settings')}
              title={lang === 'en' ? 'DA Reference Price & Settings' : 'DA Reference Price at Mga Setting'}
              className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Settings className="w-4 h-4 shrink-0" />
                <span className="truncate">{lang === 'en' ? 'DA Price & Settings' : 'DA Presyo at Settings'}</span>
              </div>
              <span className="text-[9px] bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-black shrink-0">DA</span>
            </button>

            <div>
              <button onClick={() => setActiveTab('grainy-faqs')} title="Grainy FAQ Management" className={`flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer ${activeTab === 'grainy-faqs' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'}`}>
                <div className="flex items-center gap-3 min-w-0"><FileText className="w-4 h-4 shrink-0" /><span className="truncate">Grainy FAQ Management</span></div>
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 dark:border-slate-800 pt-3">
              <ThemeToggle variant="sidebar" />
              <button
                onClick={onLogout}
                title={lang === 'en' ? 'Logout Account' : 'I-logout ang Account'}
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>{lang === 'en' ? 'Logout Account' : 'I-logout ang Account'}</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* RIGHT BOARD - Content Router */}
        <main className="dashboard-main flex-1 min-w-0 w-full max-w-[1440px] mx-auto h-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 sm:p-6 shadow-sm overflow-y-auto scroll-smooth">
          {activeTab === 'users' && (
            <UsersTab 
              lang={lang}
              usersList={usersList}
              suspendedUsers={suspendedUsers}
              onToggleSuspend={handleToggleSuspend}
              onViewProfile={setViewingProfile}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onDeleteUsers={handleDeleteUsersLocal}
            />
          )}

          {activeTab === 'verification' && (
            <VerificationTab 
              lang={lang}
              pendingUsers={pendingUsers}
              resubmissionRequests={resubmissionRequests}
              rejectedApplications={rejectedApplications}
              onApprove={handleApprove}
              onReject={handleReject}
              onRequestResubmission={handleRequestResubmission}
              onViewDoc={handleViewDoc}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === 'harvests' && (
            <HarvestsTab 
              lang={lang}
              harvestsList={harvests}
              onDeleteHarvest={onDeleteHarvest}
              onDeleteHarvests={onDeleteHarvests}
            />
          )}

          {activeTab === 'services' && (
            <ServicesTab 
              lang={lang}
              servicesList={serviceRequests}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsTab 
              lang={lang}
              offersList={offers}
              onViewDoc={handleViewDoc}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab 
              lang={lang}
            />
          )}

          {activeTab === 'feedback' && (
            <FeedbackTab 
              lang={lang}
            />
          )}

          {activeTab === 'spoilage' && (
            <SpoilageTab 
              lang={lang}
            />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementsTab lang={lang} onPublishAnnouncement={onPublishAnnouncement} />
          )}

          {activeTab === 'settings' && (
            <SettingsTab 
              user={user}
              lang={lang}
              marketReferencePrice={marketReferencePrice}
              onUpdateDAReferencePrice={onUpdateDAReferencePrice}
              onSaveEmailNotifications={onSaveEmailNotifications}
            />
          )}
          {activeTab === 'grainy-faqs' && <GrainyFaqTab lang={lang} />}

        </main>
      </div>

      {/* MODAL 1: VIEW PROFILE MODAL */}
      {viewingProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center overflow-y-auto p-3 md:p-4 z-50 animate-fade-in">
          <div className="my-auto max-h-[calc(100dvh-1.5rem)] bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl max-w-md w-full overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-800 text-xs">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-md font-display flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <span>{lang === 'en' ? 'User Registry File' : 'Profile ng Miyembro'}</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">KAWING SECURE IDENTITY DOCUMENT</p>
              </div>
              <button
                onClick={() => setViewingProfile(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-50/40 dark:bg-emerald-950/5 rounded-2xl border border-emerald-100/40">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400 font-extrabold text-sm">
                  {viewingProfile.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{viewingProfile.name}</h4>
                  <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400">{viewingProfile.role}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-slate-400 font-bold">Contact Number:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingProfile.contactNumber || 'N/A'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-slate-400 font-bold">Primary Address:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-[200px] truncate">{viewingProfile.address || 'N/A'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-slate-400 font-bold">Verification Status:</span>
                  <span className={`font-bold uppercase text-[10px] ${viewingProfile.isApproved ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {viewingProfile.isApproved ? 'Verified & Active' : 'Pending Verification'}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-bold">Reliability Index Rating:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {(viewingProfile.rating || 5).toFixed(1)} / 5.0 ({( (viewingProfile.rating || 5) * 20 ).toFixed(0)}% Score)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingProfile(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-center transition-all cursor-pointer mt-4"
              >
                Close Registry Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {approvalError && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl border border-amber-700 bg-white dark:bg-slate-900 p-6 shadow-2xl"><AlertCircle className="mb-3 h-7 w-7 text-amber-400" /><h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Registration incomplete</h2><p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{approvalError}</p><button type="button" onClick={() => setApprovalError(null)} className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white hover:bg-emerald-500">Close</button></div></div>}

      {/* MODAL 2: REGISTRATION DOCUMENT PREVIEW MODAL */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center overflow-y-auto p-3 md:p-4 z-50 animate-fade-in">
          <div className="my-auto max-h-[calc(100dvh-1.5rem)] bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl max-w-lg w-full overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm font-display">
                  {selectedDoc.type} — {selectedDoc.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Kawing Digital Trust Document Viewer</p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 bg-slate-100 dark:bg-slate-950 flex justify-center items-center min-h-[300px]">
              {selectedDoc.data.startsWith('data:image') ? (
                <img 
                  src={selectedDoc.data} 
                  alt={selectedDoc.type} 
                  className="max-h-[350px] w-auto rounded-xl object-contain shadow-md border border-slate-200 dark:border-slate-800"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-16 h-16 text-emerald-600 mx-auto opacity-75" />
                  <p className="font-bold text-slate-800 dark:text-white text-xs">Credential Certificate File</p>
                  <p className="text-[10px] text-slate-400 font-mono">MD5 Certificate: {selectedDoc.data.substring(0, 32)}...</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Done Inspecting
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
