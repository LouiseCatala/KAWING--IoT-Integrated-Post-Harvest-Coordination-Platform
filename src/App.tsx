import { IconAlertTriangle, IconLoader2, IconLogout } from '@tabler/icons-react';
import React, { useState, useEffect, useRef } from 'react';
import Splash from './components/Splash';
import Auth from './components/Auth';
import FarmerDashboard from './components/FarmerDashboard';
import BuyerDashboard from './components/BuyerDashboard';
import TruckDashboard from './components/TruckDashboard';
import StorageDashboard from './components/StorageDashboard';
import DryerDashboard from './components/DryerDashboard';
import MillerDashboard from './components/MillerDashboard';
import LogisticsDashboard from './components/LogisticsDashboard';
import AdminDashboard from './components/AdminDashboard';
import { UserAccount, Harvest, ServiceRequest, Offer, AppNotification, OfferedService, ProductionLoanRequest, ProductionLoanStatus, AppSettings, LogisticsServiceProfile, LogisticsServiceType } from './types';
import GrainyAssistant from './components/GrainyAssistant';
import { useLiveDatabase } from './lib/useLiveDatabase';
import { equal, type DatabaseSnapshot } from './lib/databaseSync';
import { hasApprovedBusinessCapability } from './lib/businessCapabilities';
import { createSubmissionGuard, newRecordId } from './lib/submissionGuard';
import { alertDialog } from './lib/appDialog';

const DEFAULT_SETTINGS: AppSettings = { daReferencePrice: 22.8 };

// Default Production Loan Requests
const DEFAULT_PRODUCTION_LOANS: ProductionLoanRequest[] = [
  {
    id: 'PL-2026-001',
    farmerEmail: 'magsasaka@kawing.com',
    farmerName: 'Mang Juan Dela Cruz',
    farmerPhone: '0917-888-1234',
    farmerLocation: 'Arayat, Pampanga',
    buyerEmail: 'mamimili@kawing.com',
    buyerName: 'Aling Maria Santos',
    buyerCompanyName: 'Aling Maria Trading Co.',
    requestedAmount: 12000,
    purpose: 'Rice Seeds',
    plantingSeason: 'Wet Season 2026',
    preferredRepaymentPeriod: '4 Months / Upon Harvest',
    repaymentMethod: 'Harvest-Based Repayment (Farmer as Planter - Harvest allocated to Buyer)',
    additionalNotes: 'Need budget for certified Rc222 seeds and 6 bags of urea fertilizer.',
    status: 'Pending',
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  }
];

// Default offered services
const DEFAULT_OFFERED_SERVICES: OfferedService[] = [
  {
    id: 'os1',
    providerEmail: 'mamimili@kawing.com',
    providerName: 'Aling Maria Santos',
    providerPhone: '0917-555-0100',
    providerRole: 'buyer',
    companyName: 'Aling Maria Trading Co.',
    serviceType: 'transport',
    title: 'Buyer Truck - Free Farm Pickup for 2,000+ kg Palay',
    truckType: '6-Wheeler Hauling Truck',
    capacity: '5,000 kg (100 sacks)',
    locationCoverage: 'Cabanatuan City, Arayat, Candaba, & nearby barangays',
    rateInfo: 'FREE Farm Pickup on purchases over 2,000kg (otherwise ₱1.00/kg)',
    notes: 'Equipped with heavy duty tarp cover, digital weigh scale, and moisture meter.',
    isAvailable: true,
    createdAt: new Date().toISOString().split('T')[0],
  }
];

// Default mock users to load into localStorage if empty
const DEFAULT_USERS: UserAccount[] = [
  { name: 'Mang Juan Dela Cruz', email: 'magsasaka@kawing.com', password: 'password123', role: 'farmer', rating: 4.8, isApproved: true },
  {
    name: 'Aling Maria Santos',
    email: 'mamimili@kawing.com',
    password: 'password123',
    role: 'buyer',
    rating: 4.9,
    isApproved: true,
    loanConfig: {
      enabled: true,
      minAmount: 5000,
      maxAmount: 20000,
      availableFund: 150000,
      repaymentPeriod: '4 Months / Upon Harvest',
      repaymentMethod: 'Harvest-Based Repayment (Farmer as Planter - Harvest allocated to Buyer)',
      termsAndConditions: 'Exclusively for registered rice farmers. Priority palay output delivery upon harvest season.',
      additionalRequirements: 'Valid Government ID and RSBSA Registration Number',
      notes: 'Direct farm verification visit before releasing funds.',
    }
  },
  {
    name: 'Bayanihan Logistics',
    email: 'logistics@kawing.com',
    password: 'password123',
    role: 'logistics',
    rating: 4.8,
    isApproved: true,
    logisticsServices: {
      transport: { enabled: true, approvalStatus: 'approved', isAvailable: true },
      storage: { enabled: true, approvalStatus: 'approved', isAvailable: true },
      drying: { enabled: true, approvalStatus: 'approved', isAvailable: true },
      milling: { enabled: true, approvalStatus: 'approved', isAvailable: true },
    },
  },
  {
    name: 'Tatay Pedring Ramos',
    password: 'password123',
    role: 'farmer',
    rating: 4.8,
    isApproved: false,
    contactNumber: '0917-123-4567',
    address: 'Sitio Central, Brgy. San Juan, Cabanatuan City, Nueva Ecija',
    documents: {
      govId: 'government_id.jpg',
      govIdData: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=500&auto=format&fit=crop&q=60'
    }
  }
];

const LEGACY_LOGISTICS_ROLE_MAP: Partial<Record<UserAccount['role'], LogisticsServiceType>> = {
  truck: 'transport', storage: 'storage', dryer: 'drying', miller: 'milling',
};

const DEMO_LOGISTICS_NAMES = new Set([
  'Bayanihan Logistics',
  'Sariaya Cold Storage',
  'Central Luzon Dryer',
  'Central Luzon Miller',
]);

const ALL_DEMO_LOGISTICS_SERVICES: UserAccount['logisticsServices'] = {
  transport: { enabled: true, approvalStatus: 'approved', isAvailable: true },
  storage: { enabled: true, approvalStatus: 'approved', isAvailable: true },
  drying: { enabled: true, approvalStatus: 'approved', isAvailable: true },
  milling: { enabled: true, approvalStatus: 'approved', isAvailable: true },
};

const stableUserId = (user: UserAccount) => {
  const source = (user.email || user.name).trim().toLowerCase();
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) hash = Math.imul(hash ^ source.charCodeAt(index), 16777619);
  return `USR-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

const migrateLegacyProvider = (user: UserAccount): UserAccount => {
  const userId = user.userId || stableUserId(user);
  if (user.role === 'farmer' || user.role === 'admin') return { ...user, userId };

  const businessCapabilities = { ...(user.businessCapabilities || {}) };
  if (user.role === 'agricultural_business' && !businessCapabilities.buyer) {
    businessCapabilities.buyer = { enabled: true, approvalStatus: user.isApproved === false ? 'pending' : 'approved', isAvailable: user.isApproved !== false };
  }
  if (user.role === 'buyer' && !businessCapabilities.buyer) {
    businessCapabilities.buyer = { enabled: true, approvalStatus: user.isApproved === false ? 'pending' : 'approved', isAvailable: true };
  }
  if (user.loanConfig?.enabled && !businessCapabilities.loan_provider) {
    businessCapabilities.loan_provider = { enabled: true, approvalStatus: user.isApproved === false ? 'pending' : 'approved', isAvailable: true };
  }
  Object.entries(user.logisticsServices || {}).forEach(([capability, profile]) => {
    if (profile?.enabled && !businessCapabilities[capability as LogisticsServiceType]) {
      businessCapabilities[capability as LogisticsServiceType] = { ...profile };
    }
  });
  const legacyService = LEGACY_LOGISTICS_ROLE_MAP[user.role];
  if (legacyService && !businessCapabilities[legacyService]) {
    businessCapabilities[legacyService] = { enabled: true, approvalStatus: user.isApproved === false ? 'pending' : 'approved', isAvailable: user.isAvailable !== false };
  }
  if (DEMO_LOGISTICS_NAMES.has(user.name) && Object.keys(businessCapabilities).length === 0) {
    Object.assign(businessCapabilities, ALL_DEMO_LOGISTICS_SERVICES);
  }
  return {
    ...user,
    userId,
    role: 'agricultural_business',
    businessName: user.businessName || user.legalCompanyName || user.name,
    businessCapabilities,
  };
};

const migrateLegacyProviders = (users: UserAccount[]): UserAccount[] => {
  let demoLogisticsAdded = false;
  return users.reduce<UserAccount[]>((result, user) => {
    if (DEMO_LOGISTICS_NAMES.has(user.name)) {
      if (demoLogisticsAdded) return result;
      demoLogisticsAdded = true;
    }
    result.push(migrateLegacyProvider(user));
    return result;
  }, []);
};

// Seed initial harvests in global pool
const DEFAULT_HARVESTS: Harvest[] = [
  {
    id: 'h1',
    cropType: 'Palay (Wet - Basa)',
    quantity: 1500,
    unit: 'kg',
    harvestDate: '2026-07-10',
    location: 'Farm A, Arayat, Pampanga',
    urgency: 'high',
    status: 'posted',
    spoilageRisk: 'high',
    farmerEmail: 'magsasaka@kawing.com',
    farmerName: 'Mang Juan Dela Cruz',
    farmerRating: 4.8,
  },
  {
    id: 'h2',
    cropType: 'Palay (Dry - Tuyo)',
    quantity: 3500,
    unit: 'kg',
    harvestDate: '2026-07-09',
    location: 'Farm B, Candaba, Pampanga',
    urgency: 'medium',
    status: 'posted',
    spoilageRisk: 'medium',
    farmerEmail: 'magsasaka@kawing.com',
    farmerName: 'Mang Juan Dela Cruz',
    farmerRating: 4.8,
  },
  {
    id: 'h3',
    cropType: 'Palay (Premium - RC 160)',
    quantity: 2000,
    unit: 'kg',
    harvestDate: '2026-07-08',
    location: 'Central Plain Farm, Cabanatuan',
    urgency: 'low',
    status: 'posted',
    spoilageRisk: 'low',
    farmerEmail: 'another_farmer@kawing.com',
    farmerName: 'Mang Pedring Ramos',
    farmerRating: 4.6,
  },
];

// Seed initial service requests
const DEFAULT_SERVICES: ServiceRequest[] = [
  {
    id: 's1',
    type: 'transport',
    harvestId: 'h1',
    cropType: 'Palay (Wet - Basa)',
    quantity: 1500,
    unit: 'kg',
    status: 'pending',
    createdAt: '2026-07-11',
    farmerEmail: 'magsasaka@kawing.com',
    farmerName: 'Mang Juan Dela Cruz',
    location: 'Farm A, Arayat, Pampanga',
  },
  {
    id: 's2',
    type: 'storage',
    harvestId: 'h2',
    cropType: 'Palay (Dry - Tuyo)',
    quantity: 3500,
    unit: 'kg',
    status: 'pending',
    createdAt: '2026-07-11',
    farmerEmail: 'magsasaka@kawing.com',
    farmerName: 'Mang Juan Dela Cruz',
    location: 'Farm B, Candaba, Pampanga',
  },
];

export default function App() {
  const claimSubmission = useRef(createSubmissionGuard()).current;
  const [phase, setPhase] = useState<'splash' | 'auth' | 'dashboard'>('splash');
  const [activeUser, setActiveUser] = useState<UserAccount | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offeredServices, setOfferedServices] = useState<OfferedService[]>([]);
  const [productionLoans, setProductionLoans] = useState<ProductionLoanRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [syncRetry, setSyncRetry] = useState(0);
  const skipNextFullSnapshotSync = useRef(false);

  // Popups are dismissed explicitly by their controls, never by backdrop clicks or Escape.

  // 1. Load database from server DB on startup with local storage fallback
  useEffect(() => {
    async function initData() {
      const fetchStartup = (input: RequestInfo | URL, init?: RequestInit) => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 5000);
        return fetch(input, { ...init, signal: controller.signal })
          .finally(() => window.clearTimeout(timeout));
      };
      // Start both requests together so an unavailable API can delay startup by
      // at most five seconds instead of leaving the app on its loader forever.
      const databaseRequest = fetchStartup('/api/db');
      const sessionRequest = fetchStartup('/api/auth/me', { credentials: 'include' });
      try {
        const res = await databaseRequest;
        if (res.ok) {
          const data = await res.json();
          setRegisteredUsers(migrateLegacyProviders(data.users ?? []));
          setHarvests(data.harvests ?? []);
          setServiceRequests(data.services ?? []);
          setOffers(data.offers || []);
          setOfferedServices(data.offeredServices ?? []);
          setProductionLoans(data.productionLoans ?? []);
          setNotifications(data.notifications || []);
          setSettings({ ...DEFAULT_SETTINGS, ...(data.settings || {}) });
        } else {
          // Fallback to localStorage
          setRegisteredUsers(migrateLegacyProviders(JSON.parse(localStorage.getItem('kawing_users') || '[]')));
          setHarvests(JSON.parse(localStorage.getItem('kawing_harvests') || '[]'));
          setServiceRequests(JSON.parse(localStorage.getItem('kawing_services') || '[]'));
          setOffers(JSON.parse(localStorage.getItem('kawing_offers') || '[]'));
          setOfferedServices(JSON.parse(localStorage.getItem('kawing_offered_services') || '[]'));
          setProductionLoans(JSON.parse(localStorage.getItem('kawing_production_loans') || '[]'));
          setNotifications(JSON.parse(localStorage.getItem('kawing_notifications') || '[]'));
          setSettings(JSON.parse(localStorage.getItem('kawing_settings') || JSON.stringify(DEFAULT_SETTINGS)));
        }
      } catch (e) {
        console.error('Failed to fetch from server db, using local storage fallback', e);
        setRegisteredUsers(migrateLegacyProviders(JSON.parse(localStorage.getItem('kawing_users') || '[]')));
        setHarvests(JSON.parse(localStorage.getItem('kawing_harvests') || '[]'));
        setServiceRequests(JSON.parse(localStorage.getItem('kawing_services') || '[]'));
        setOffers(JSON.parse(localStorage.getItem('kawing_offers') || '[]'));
        setOfferedServices(JSON.parse(localStorage.getItem('kawing_offered_services') || '[]'));
        setProductionLoans(JSON.parse(localStorage.getItem('kawing_production_loans') || '[]'));
        setNotifications(JSON.parse(localStorage.getItem('kawing_notifications') || '[]'));
        setSettings(JSON.parse(localStorage.getItem('kawing_settings') || JSON.stringify(DEFAULT_SETTINGS)));
      } finally {
        // The PHP session is the sole authentication authority. Browser storage
        // is only a cache and must never grant access to a dashboard.
        try {
          const authResponse = await sessionRequest;
          if (authResponse.ok) {
            const authData = await authResponse.json();
            const restoredUser = migrateLegacyProvider(authData.user as UserAccount);
            setActiveUser(restoredUser);
            localStorage.setItem('kawing_active_session', JSON.stringify(restoredUser));
            setPhase('dashboard');
          } else if (authResponse.status === 401 || authResponse.status === 403) {
            setActiveUser(null);
            localStorage.removeItem('kawing_active_session');
            setPhase('splash');
          } else {
            throw new Error(`Session restoration failed with HTTP ${authResponse.status}`);
          }
        } catch (error) {
          console.error('Secure session restoration unavailable; authentication was not restored.', error);
          setActiveUser(null);
          localStorage.removeItem('kawing_active_session');
          setPhase('splash');
        }
        setIsLoaded(true);
      }
    }
    initData();
  }, []);

  // Local cache only. Server synchronization is handled by the single live controller.
  useEffect(() => {
    if (!isLoaded) return;
    const cached = { users: registeredUsers, harvests, services: serviceRequests, offers, offered_services: offeredServices, production_loans: productionLoans, notifications, settings };
    for (const [key, value] of Object.entries(cached)) {
      try { localStorage.setItem(`kawing_${key}`, JSON.stringify(value)); } catch { /* Storage quota must not interrupt live sync. */ }
    }
  }, [registeredUsers, harvests, serviceRequests, offers, offeredServices, productionLoans, notifications, settings, isLoaded]);

  const databaseState: DatabaseSnapshot = { users: registeredUsers, harvests, services: serviceRequests, offers, offeredServices, productionLoans, notifications, settings };
  useLiveDatabase({
    user: activeUser,
    loaded: isLoaded,
    state: databaseState,
    normalize: data => ({ ...data, users: migrateLegacyProviders(data.users), settings: { ...DEFAULT_SETTINGS, ...data.settings } }),
    apply: data => {
      setRegisteredUsers(current => equal(current, data.users) ? current : data.users);
      setHarvests(current => equal(current, data.harvests) ? current : data.harvests);
      setServiceRequests(current => equal(current, data.services) ? current : data.services);
      setOffers(current => equal(current, data.offers) ? current : data.offers);
      setOfferedServices(current => equal(current, data.offeredServices) ? current : data.offeredServices);
      setProductionLoans(current => equal(current, data.productionLoans) ? current : data.productionLoans);
      setNotifications(current => equal(current, data.notifications) ? current : data.notifications);
      setSettings(current => equal(current, data.settings) ? current : data.settings);
      setActiveUser(current => {
        const updated = data.users.find(user => user.email?.toLowerCase() === current?.email?.toLowerCase());
        return current && updated && !equal(current, updated) ? updated : current;
      });
    },
    onUnauthorized: () => {
      setActiveUser(null);
      localStorage.removeItem('kawing_active_session');
      setPhase('auth');
    },
    onError: setSyncError,
    retry: syncRetry,
    targetedSave: skipNextFullSnapshotSync,
  });

  const handleUpdateDAReferencePrice = (price: number) => {
    setSettings((current) => ({ ...current, daReferencePrice: price }));
  };

  const handleSaveEmailNotifications = async (enabled: boolean): Promise<void> => {
    if (!activeUser?.email) throw new Error('Sign in again before changing email notifications.');
    const response = await fetch('/api/auth/email-notifications', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, before: { emailNotificationsEnabled: activeUser.emailNotificationsEnabled ?? null } }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.user) throw new Error(result.error || 'Email notification preference could not be saved.');
    const savedUser = migrateLegacyProvider(result.user as UserAccount);
    skipNextFullSnapshotSync.current = true;
    setRegisteredUsers(current => current.map(user => user.email?.toLowerCase() === savedUser.email?.toLowerCase() ? { ...user, ...savedUser } : user));
    setActiveUser(savedUser);
    localStorage.setItem('kawing_active_session', JSON.stringify(savedUser));
  };

  const persistUserProfile = async (updated: UserAccount, before: UserAccount): Promise<void> => {
    if (!activeUser?.email || activeUser.email.toLowerCase() !== updated.email?.toLowerCase()) return;
    const response = await fetch('/api/auth/profile', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        before,
        name: updated.name,
        contactNumber: updated.contactNumber || '',
        address: updated.address || '',
        businessName: updated.businessName || '',
        legalCompanyName: updated.legalCompanyName || '',
        rsbsaNumber: updated.rsbsaNumber || '',
        avatarUrl: updated.avatarUrl || '',
        bio: updated.bio || '',
        emailNotificationsEnabled: updated.emailNotificationsEnabled === true,
        emailNotificationConsentAsked: true,
        emailNotificationConsentAt: updated.emailNotificationConsentAt || new Date().toISOString(),
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.user) throw new Error(result.error || 'Profile changes could not be saved.');
    const savedUser = migrateLegacyProvider(result.user as UserAccount);
    // The profile endpoint already committed this change. Both the optimistic
    // update and this authoritative response must bypass the legacy snapshot.
    skipNextFullSnapshotSync.current = true;
    setRegisteredUsers(current => current.map(account => account.email?.toLowerCase() === savedUser.email?.toLowerCase() ? { ...account, ...savedUser } : account));
    setActiveUser(current => current?.email?.toLowerCase() === savedUser.email?.toLowerCase() ? { ...current, ...savedUser } : current);
    localStorage.setItem('kawing_active_session', JSON.stringify({ ...updated, ...savedUser }));
  };

  const handlePublishAnnouncement = (title: string, content: string, notifyByEmail: boolean) => {
    registeredUsers
      .filter(user => user.email)
      .forEach(user => addNotification(
        user.email!,
        title,
        content,
        'info',
        notifyByEmail && user.emailNotificationsEnabled === true,
        { 'Announcement': title, 'Status': 'Published by KAWING Administration' }
      ));
  };

  const handleRegisterUser = async (newUser: UserAccount): Promise<UserAccount> => {
    const response = await fetch('/api/registrations', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.user) throw new Error(result.error || 'Registration could not be saved. Please try again.');
    const savedUser = result.user as UserAccount;
    const updated = [...registeredUsers, savedUser];
    setRegisteredUsers(updated);
    const admin = registeredUsers.find(user => user.role === 'admin');
    if (admin?.email) {
      const accountCategory = savedUser.role === 'farmer' ? 'Farmer' : 'Agricultural Business User';
      addNotification(
        admin.email,
        'New Account Registration',
        `${savedUser.name} submitted a new ${accountCategory} account for verification.`,
        'alert',
        true,
        { 'Applicant': savedUser.name, 'Account Category': accountCategory, 'Status': 'Pending Verification' }
      );
    }
    return savedUser;
  };

  const handleAuthSuccess = (user: UserAccount) => {
    setSyncError('');
    setActiveUser(user);
    localStorage.setItem('kawing_active_session', JSON.stringify(user));
    setPhase('dashboard');
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    setSyncError('');
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Server logout was unavailable; local compatibility session was cleared.', error);
    }
    setActiveUser(null);
    localStorage.removeItem('kawing_active_session');
    setPhase('splash');
  };

  const handleApproveUser = (name: string) => {
    const applicant = registeredUsers.find(user => user.name === name);
    if (!applicant) return;
    if (!applicant.email?.trim() || !applicant.contactNumber?.trim() || !applicant.address?.trim()) {
      void alertDialog('Email, contact number, and full address are required for approval.', { tone: 'info' });
      return;
    }
    // Approve verified status or add user to active pool
    const updatedUsers = registeredUsers.map(u => {
      if (u.name === name) {
        const logisticsServices = u.role === 'logistics'
          ? Object.fromEntries(
              Object.entries(u.logisticsServices || {}).map(([key, profile]) => {
                const serviceProfile = profile as LogisticsServiceProfile;
                return [key, serviceProfile.enabled ? { ...serviceProfile, approvalStatus: 'approved', isAvailable: true } : serviceProfile];
              })
            )
          : u.logisticsServices;
        const businessCapabilities = u.role === 'agricultural_business'
          ? {
              ...u.businessCapabilities,
              buyer: {
                ...(u.businessCapabilities?.buyer || {}),
                enabled: true,
                approvalStatus: 'approved' as const,
                isAvailable: true,
              },
            }
          : u.businessCapabilities;
        return { ...u, isApproved: true, rating: 5.0, logisticsServices, businessCapabilities }; // verified starter rating
      }
      return u;
    });
    setRegisteredUsers(updatedUsers);
    localStorage.setItem('kawing_users', JSON.stringify(updatedUsers));
  };

  const handleRejectUser = (name: string, _reason: string) => {
    const updatedUsers = registeredUsers.filter(u => u.name !== name);
    setRegisteredUsers(updatedUsers);
    localStorage.setItem('kawing_users', JSON.stringify(updatedUsers));
  };

  const handleDeleteUser = (name: string) => {
    const updatedUsers = registeredUsers.filter(u => u.name !== name);
    setRegisteredUsers(updatedUsers);
    localStorage.setItem('kawing_users', JSON.stringify(updatedUsers));
  };

  const handleDeleteUsers = (names: string[]) => {
    const updatedUsers = registeredUsers.filter(u => !names.includes(u.name));
    setRegisteredUsers(updatedUsers);
    localStorage.setItem('kawing_users', JSON.stringify(updatedUsers));
  };

  const handleDeleteHarvest = (harvestId: string) => {
    const updatedHarvests = harvests.filter(h => h.id !== harvestId);
    setHarvests(updatedHarvests);
    localStorage.setItem('kawing_harvests', JSON.stringify(updatedHarvests));
  };

  const handleDeleteHarvests = (ids: string[]) => {
    const updatedHarvests = harvests.filter(h => !ids.includes(h.id));
    setHarvests(updatedHarvests);
    localStorage.setItem('kawing_harvests', JSON.stringify(updatedHarvests));
  };

  const handleUpdateHarvest = (harvestId: string, updates: Partial<Harvest>) => {
    const updatedHarvests = harvests.map(harvest =>
      harvest.id === harvestId
        ? { ...harvest, ...updates, id: harvest.id, farmerEmail: harvest.farmerEmail, farmerName: harvest.farmerName }
        : harvest
    );
    setHarvests(updatedHarvests);
    localStorage.setItem('kawing_harvests', JSON.stringify(updatedHarvests));
  };

  const persistProviderSettings = async (updated: UserAccount, before: UserAccount) => {
    if (!activeUser?.email || activeUser.email.toLowerCase() !== updated.email?.toLowerCase()) return;
    const response = await fetch('/api/auth/provider-settings', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        before,
        loanConfig: updated.loanConfig ?? null,
        logisticsServices: updated.logisticsServices,
        businessCapabilities: updated.businessCapabilities,
        buyerLogisticsEnabled: updated.buyerLogisticsEnabled,
        isAvailable: updated.isAvailable,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.user) throw new Error(result.error || 'Provider settings could not be saved.');
    const savedUser = migrateLegacyProvider(result.user as UserAccount);
    skipNextFullSnapshotSync.current = true;
    setRegisteredUsers(current => current.map(account => account.email?.toLowerCase() === savedUser.email?.toLowerCase() ? { ...account, ...savedUser } : account));
    setActiveUser(savedUser);
    localStorage.setItem('kawing_active_session', JSON.stringify(savedUser));
  };

  const handleUpdateUser = (originalName: string, updated: UserAccount, formBaseline?: UserAccount) => {
    const originalUser = registeredUsers.find(u => u.name === originalName);
    const updatedEmail = updated.email?.trim().toLowerCase();
    if (updatedEmail && registeredUsers.some(u => u !== originalUser && u.email?.trim().toLowerCase() === updatedEmail)) {
      void alertDialog('That email address is already used by another account. Please enter a different email address.', { tone: 'warning' });
      return;
    }
    const isSelf = activeUser?.email?.toLowerCase() === updated.email?.toLowerCase();
    const emailPreferenceChanged = isSelf && (
      originalUser?.emailNotificationsEnabled !== updated.emailNotificationsEnabled ||
      originalUser?.emailNotificationConsentAsked !== updated.emailNotificationConsentAsked
    );
    const profileChanged = isSelf && [
      'name', 'contactNumber', 'address', 'businessName', 'legalCompanyName',
      'rsbsaNumber', 'avatarUrl', 'bio',
    ].some((field) => originalUser?.[field as keyof UserAccount] !== updated[field as keyof UserAccount]);
    const providerSettingsChanged = isSelf && (
      originalUser?.loanConfig !== updated.loanConfig ||
      originalUser?.logisticsServices !== updated.logisticsServices ||
      originalUser?.businessCapabilities !== updated.businessCapabilities ||
      originalUser?.buyerLogisticsEnabled !== updated.buyerLogisticsEnabled ||
      originalUser?.isAvailable !== updated.isAvailable
    );
    if (providerSettingsChanged || emailPreferenceChanged || profileChanged) skipNextFullSnapshotSync.current = true;
    const updatedUsers = registeredUsers.map(u => u.name === originalName ? { ...u, ...updated } : u);
    setRegisteredUsers(updatedUsers);
    localStorage.setItem('kawing_users', JSON.stringify(updatedUsers));

    if (updated.role === 'logistics' || updated.role === 'agricultural_business') {
      const serviceLabels: Record<LogisticsServiceType, string> = {
        transport: 'Trucking & Hauling',
        storage: 'Storage Facility',
        drying: 'Drying Facility',
        milling: 'Rice Milling',
      };
      const newlyPendingServices = (Object.keys(serviceLabels) as LogisticsServiceType[]).filter(serviceType => {
        const previousStatus = updated.role === 'agricultural_business'
          ? originalUser?.businessCapabilities?.[serviceType]?.approvalStatus
          : originalUser?.logisticsServices?.[serviceType]?.approvalStatus;
        const currentService = updated.role === 'agricultural_business'
          ? updated.businessCapabilities?.[serviceType]
          : updated.logisticsServices?.[serviceType];
        return currentService?.enabled && currentService.approvalStatus === 'pending' && previousStatus !== 'pending';
      });
      const admin = registeredUsers.find(user => user.role === 'admin');
      if (admin?.email) {
        newlyPendingServices.forEach(serviceType => addNotification(
          admin.email!,
          'New Logistics Service Approval Request',
          `${updated.legalCompanyName || updated.businessName || updated.name} submitted ${serviceLabels[serviceType]} for approval.`,
          'alert',
          true,
          {
            'Provider': updated.legalCompanyName || updated.businessName || updated.name,
            'Requested Service': serviceLabels[serviceType],
            'Coverage Area': (updated.role === 'agricultural_business'
              ? updated.businessCapabilities?.[serviceType]?.locationCoverage
              : updated.logisticsServices?.[serviceType]?.locationCoverage) || updated.serviceCoverageArea || 'Not specified',
            'Status': 'Pending Admin Approval',
          }
        ));
      }
    }
    
    // Sync active user session if they updated themselves
    if (activeUser && activeUser.name === originalName) {
      const newActive = { ...activeUser, ...updated };
      setActiveUser(newActive);
      localStorage.setItem('kawing_active_session', JSON.stringify(newActive));
    }
    if (providerSettingsChanged) {
      void persistProviderSettings(updated, formBaseline || originalUser || activeUser || updated).catch(error => {
        setSyncError(error instanceof Error ? error.message : 'Provider settings could not be saved.');
      });
    }
    if (profileChanged || emailPreferenceChanged) {
      void persistUserProfile(updated, formBaseline || originalUser || activeUser || updated).catch(error => {
        setSyncError(error instanceof Error ? error.message : 'Profile changes could not be saved.');
      });
    }
  };

  // Notifications helper
  const addNotification = (userEmail: string, title: string, message: string, type: 'info' | 'success' | 'alert' = 'info', sendEmail = false, emailDetails?: Record<string, string>) => {
    const newNotif: AppNotification = {
      id: 'n_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userEmail,
      title,
      message,
      type,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      isRead: false,
      sendEmail,
      emailDetails,
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      localStorage.setItem('kawing_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
      localStorage.setItem('kawing_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearAllNotifications = (userEmail: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.userEmail !== userEmail);
      localStorage.setItem('kawing_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  // Farmer callbacks
  const handleAddHarvest = (
    newHarvestData: Omit<Harvest, 'id' | 'farmerEmail' | 'farmerName' | 'farmerRating' | 'status'>,
    neededServices?: ('transport' | 'storage' | 'drying' | 'milling' | 'buyer')[]
  ) => {
    if (!activeUser) return;
    if (!claimSubmission('harvest', [activeUser.email, newHarvestData, neededServices])) return;
    const harvestId = newRecordId('h');
    const hasBuyerService = neededServices ? neededServices.includes('buyer') : false;
    const nonBuyerServices = neededServices ? neededServices.filter(s => s !== 'buyer') : [];
    const hasOtherServices = nonBuyerServices.length > 0;

    // If they selected the buyer service, or if there are no logistical services, it's immediately posted!
    const status: Harvest['status'] = (hasBuyerService || !hasOtherServices) ? 'posted' : 'in_progress';

    const newHarvest: Harvest = {
      ...newHarvestData,
      id: harvestId,
      farmerEmail: activeUser.email || 'magsasaka@kawing.com',
      farmerName: activeUser.name,
      farmerRating: activeUser.rating || 4.8,
      status,
    };
    const updatedHarvests = [newHarvest, ...harvests];
    setHarvests(updatedHarvests);
    localStorage.setItem('kawing_harvests', JSON.stringify(updatedHarvests));

    const isOpenBidding = newHarvest.sellingMethod === 'bidding' && !newHarvest.targetBuyerEmail;

    // Open bidding is visible to the marketplace, but its alert belongs only
    // to eligible buyers. The farmer already receives the posting confirmation
    // below and must never receive their own bidding email.
    if (hasBuyerService || isOpenBidding) {
      const notificationRecipients = registeredUsers
        .filter(buyer => hasApprovedBusinessCapability(buyer, 'buyer') && buyer.email)
        .filter(buyer => !isOpenBidding || buyer.email?.toLowerCase() !== activeUser.email?.toLowerCase())
        .filter(buyer => !newHarvest.targetBuyerEmail || buyer.email === newHarvest.targetBuyerEmail);

      notificationRecipients
        .forEach(recipient => addNotification(
          recipient.email!,
          newHarvest.targetBuyerEmail
            ? 'New Harvest Offered Directly to You'
            : newHarvest.sellingMethod === 'bidding'
              ? 'New Harvest Open for Bidding'
              : 'New Fixed-Price Harvest',
          newHarvest.targetBuyerEmail
            ? `${activeUser.name} directly offered ${newHarvest.cropType}, ${newHarvest.quantity.toLocaleString()} ${newHarvest.unit}, to you.`
            : `${activeUser.name} posted ${newHarvest.cropType}, ${newHarvest.quantity.toLocaleString()} ${newHarvest.unit}.`,
          'info',
          // The server performs the final, current opt-in check against the
          // users table before it sends. This avoids stale browser state
          // suppressing an email for an account that has just enabled alerts.
          Boolean(newHarvest.targetBuyerEmail) || isOpenBidding,
          {
            'Harvest Listing': newHarvest.cropType,
            'Variety': newHarvest.riceVariety || newHarvest.cropType,
            'Estimated Quantity': newHarvest.containerQuantity ? `${newHarvest.containerQuantity} ${newHarvest.containerType === 'sacks' ? 'Bags/Sacks' : 'Plastic Bags'}` : `${newHarvest.quantity} ${newHarvest.unit}`,
            'Exact Weight': `${newHarvest.quantity.toLocaleString()} kg`,
            'Moisture Content': newHarvest.moistureLevel || 'Not specified',
            [newHarvest.sellingMethod === 'bidding' ? 'Starting Bid' : 'Asking Price']: `₱${Number(newHarvest.targetPrice || 0).toFixed(2)}/kg`,
            'Status': newHarvest.targetBuyerEmail ? 'Direct Harvest Offer' : newHarvest.sellingMethod === 'bidding' ? 'Open for Bidding' : 'Fixed Price Listing',
          }
        ));
    }

    if (neededServices && neededServices.length > 0) {
      // Create multiple service requests (excluding buyer requests which are handled via buyer-interest / offers directly)
      const serviceTypesToCreate = neededServices.filter(s => s !== 'buyer');
      
      const newRequests: ServiceRequest[] = serviceTypesToCreate.map((serviceType, index) => ({
        id: newRecordId('s'),
        type: serviceType,
        harvestId: harvestId,
        cropType: newHarvest.cropType,
        quantity: newHarvest.quantity,
        unit: newHarvest.unit,
        quantityAccuracy: newHarvest.quantityAccuracy,
        estimatedWeightKg: newHarvest.estimatedWeightKg,
        containerType: newHarvest.containerType,
        containerQuantity: newHarvest.containerQuantity,
        estimatedKgPerContainer: newHarvest.estimatedKgPerContainer,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
        farmerEmail: activeUser.email || 'magsasaka@kawing.com',
        farmerName: activeUser.name,
        location: (serviceType === 'transport' && (newHarvest.pickupLocation || newHarvest.dropLocation))
          ? ` Pickup: ${newHarvest.pickupLocation || newHarvest.location}  to  Drop: ${newHarvest.dropLocation || 'Buying Station'}`
          : newHarvest.location,
        truckType: newHarvest.truckType,
        pickupLocation: newHarvest.pickupLocation || newHarvest.location,
        dropLocation: newHarvest.dropLocation,
        preferredDate: newHarvest.preferredScheduleDate,
        preferredTime: newHarvest.preferredScheduleTime,
        additionalNotes: newHarvest.additionalNotes,
        operatorEmail: newHarvest.requestedProviderEmail,
        operatorName: newHarvest.requestedProviderName,
      }));

      if (newRequests.length > 0) {
        const updatedServices = [...newRequests, ...serviceRequests];
        setServiceRequests(updatedServices);
        localStorage.setItem('kawing_services', JSON.stringify(updatedServices));
        newRequests.forEach(request => {
          if (!request.operatorEmail) return;
          const serviceLabel = request.type === 'transport' ? 'Trucking' : request.type === 'storage' ? 'Storage' : request.type === 'drying' ? 'Drying' : 'Milling';
          addNotification(
            request.operatorEmail,
            `New ${serviceLabel} Service Request`,
            `${activeUser.name} sent a booking request directly to your ${serviceLabel.toLowerCase()} service.`,
            'alert',
            true,
            {
              'Requested Service': serviceLabel,
              'Farmer': activeUser.name,
              'Harvest': request.cropType,
              'Quantity': `${request.quantity.toLocaleString()} ${request.unit}`,
              'Location': request.location,
              'Preferred Schedule': `${request.preferredDate || 'Not specified'} ${request.preferredTime || ''}`.trim(),
              'Status': 'New Booking Request',
            }
          );
        });
      }

      neededServices.forEach((serviceType) => {
        const serviceNameFilipino = 
          serviceType === 'transport' ? 'transportasyon' :
          serviceType === 'storage' ? 'cold storage' :
          serviceType === 'drying' ? 'patuyuan' :
          serviceType === 'milling' ? 'gilingan' : 'direktang mamimili (buyer)';

        const msg = serviceType === 'buyer'
          ? `Ang iyong ani na ${newHarvest.cropType} ay matagumpay na na-post sa Browse Fresh Harvest ng mga Buyer!`
          : `Matagumpay na na-post ang hiling para sa ${serviceNameFilipino} para sa iyong ani na ${newHarvest.cropType}.`;

        addNotification(
          activeUser.email || 'magsasaka@kawing.com',
          'KAWING Update',
          msg,
          'success'
        );
      });
    } else {
      addNotification(
        activeUser.email || 'magsasaka@kawing.com',
        'Bagong Ani na-Post',
        `Matagumpay na na-post ang iyong ani na ${newHarvest.cropType} sa market board.`,
        'success'
      );
    }
  };

  const handleAddServiceRequest = (
    harvestId: string, 
    type: 'transport' | 'storage' | 'drying' | 'milling' | 'buyer',
    customDetails?: Partial<ServiceRequest>
  ) => {
    const harvest = harvests.find(h => h.id === harvestId);
    if (!harvest && !customDetails?.cropType) return;
    if (!activeUser) return;
    if (!claimSubmission('service-request', [activeUser.email, harvestId, type, customDetails])) return;

    // Check if duplicate request exists
    const duplicate = serviceRequests.some(s => s.harvestId === harvestId && s.type === type && s.status !== 'rejected');
    if (duplicate) return;

    const newRequest: ServiceRequest = {
      id: newRecordId('s'),
      type,
      harvestId: harvestId || 'req_' + Date.now(),
      cropType: customDetails?.cropType || harvest?.cropType || 'Palay (RC 160)',
      riceVariety: customDetails?.riceVariety || harvest?.riceVariety || 'NSIC Rc160',
      quantity: customDetails?.quantity || harvest?.quantity || 1000,
      unit: customDetails?.unit || harvest?.unit || 'kg',
      servicesNeeded: customDetails?.servicesNeeded || [type as any],
      preferredDate: customDetails?.preferredDate || new Date().toISOString().split('T')[0],
      preferredTime: customDetails?.preferredTime || '08:00',
      additionalNotes: customDetails?.additionalNotes || '',
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      farmerEmail: activeUser.email || 'magsasaka@kawing.com',
      farmerName: activeUser.name,
      farmerPhone: activeUser.contactNumber || '0917-888-9999',
      location: customDetails?.location || harvest?.location || activeUser.address || 'Barangay San Jose',
      barangay: customDetails?.barangay || harvest?.barangay || 'San Jose',
    };

    const updated = [newRequest, ...serviceRequests];
    setServiceRequests(updated);
    localStorage.setItem('kawing_services', JSON.stringify(updated));

    // Also update the harvest status to "in_progress" to indicate logistics active
    const updatedHarvests = harvests.map(h => {
      if (h.id === harvestId) {
        return { ...h, status: 'in_progress' as const };
      }
      return h;
    });
    setHarvests(updatedHarvests);
    localStorage.setItem('kawing_harvests', JSON.stringify(updatedHarvests));

    const serviceNameFilipino = 
      type === 'transport' ? 'transportasyon' :
      type === 'storage' ? 'cold storage' :
      type === 'drying' ? 'patuyuan' :
      type === 'milling' ? 'gilingan' : 'pagbili (buyer)';

    addNotification(
      activeUser.email || 'magsasaka@kawing.com',
      'Kahilingan sa Serbisyo',
      `Matagumpay na naidagdag ang hiling para sa ${serviceNameFilipino} para sa iyong ani na ${harvest.cropType}.`,
      'success'
    );
  };

  // Buyer callbacks
  const handleAddOffer = (
    harvestId: string,
    phone: string,
    name: string,
    govIdData: string,
    offerPrice?: number,
    priceUnit?: string,
    notes?: string,
    extraOfferData?: {
      buyerCompanyName?: string;
      quantityWanted?: number;
      preferredCollectionDate?: string;
      paymentMethod?: 'Cash' | 'Bank Transfer' | 'Other';
      additionalMessage?: string;
      agreedTerms?: boolean;
    }
  ) => {
    const harvest = harvests.find(h => h.id === harvestId);
    if (!harvest || !activeUser) return;
    if (!claimSubmission('offer', [activeUser.email, harvestId, phone, name, offerPrice, extraOfferData])) return;

    // Find farmer details if available in registeredUsers
    const farmerAccount = registeredUsers.find(u => u.email === harvest.farmerEmail || u.name === harvest.farmerName);

    const priceVal = offerPrice || harvest.targetPrice || 22;
    const unitVal = priceUnit || harvest.priceUnit || 'kg';
    const wantedQty = extraOfferData?.quantityWanted || harvest.quantity;
    const totalVal = wantedQty * priceVal;

    const newOffer: Offer = {
      id: newRecordId('o'),
      harvestId,
      cropType: harvest.cropType,
      riceVariety: harvest.riceVariety || harvest.cropType,
      quantity: harvest.quantity,
      unit: harvest.unit,
      quantityWanted: wantedQty,
      offerPrice: priceVal,
      priceUnit: unitVal,
      totalAmount: totalVal,
      marketRefPrice: settings.daReferencePrice,
      preferredCollectionDate: extraOfferData?.preferredCollectionDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      paymentMethod: extraOfferData?.paymentMethod || 'Cash',
      additionalMessage: extraOfferData?.additionalMessage || notes || '',
      agreedTerms: extraOfferData?.agreedTerms ?? true,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      buyerEmail: activeUser.email || 'mamimili@kawing.com',
      buyerName: name || activeUser.name,
      buyerCompanyName: extraOfferData?.buyerCompanyName || 'ABC Rice Trading',
      buyerPhone: phone || activeUser.contactNumber || '0917-555-0100',
      buyerAddress: activeUser.address || 'Central Trading Post',
      govIdData,
      farmerEmail: harvest.farmerEmail,
      farmerName: harvest.farmerName,
      farmerPhone: farmerAccount?.contactNumber || harvest.farmerPhone || '0917-888-9999',
      farmerLocation: harvest.location,
      notes: notes || extraOfferData?.additionalMessage || '',
    };

    const updatedOffers = [newOffer, ...offers];
    setOffers(updatedOffers);
    localStorage.setItem('kawing_offers', JSON.stringify(updatedOffers));

    // Notify farmer about new offer
    addNotification(
      harvest.farmerEmail,
      ' Bagong Offer ng Presyo sa Ani Mo!',
      `Nag-offer si ${name || activeUser.name} (${extraOfferData?.buyerCompanyName || 'Buyer'}) ng ₱${priceVal.toFixed(2)}/kg (${wantedQty.toLocaleString()} kg, Kabuuan: ₱${totalVal.toLocaleString()}) para sa iyong ${harvest.cropType}. Tingnan ang iyong rankings!`,
      'info',
      true,
      {
        'Buyer': name || activeUser.name,
        'Company': extraOfferData?.buyerCompanyName || 'Buyer',
        'Harvest': harvest.cropType,
        'Offered Price': `₱${priceVal.toFixed(2)}/kg`,
        'Requested Quantity': `${wantedQty.toLocaleString()} kg`,
        'Total Offer': `₱${totalVal.toLocaleString()}`,
        'Status': 'New Price Offer',
      }
    );
  };

  const handleCancelOffer = (offerId: string, reason: string) => {
    const offer = offers.find(item => item.id === offerId);
    if (!offer || offer.status !== 'pending' || offer.buyerEmail !== activeUser?.email) return;

    const updatedOffers = offers.map(item => item.id === offerId ? { ...item, status: 'cancelled' as const, cancellationReason: reason, cancelledAt: new Date().toISOString() } : item);
    setOffers(updatedOffers);
    localStorage.setItem('kawing_offers', JSON.stringify(updatedOffers));
    addNotification(
      offer.farmerEmail,
      'Price Offer Cancelled',
      `${offer.buyerName} cancelled the price offer for ${offer.cropType}. Reason: ${reason}`,
      'info',
      true,
      { Buyer: offer.buyerName, Harvest: offer.cropType, Status: 'Cancelled by Buyer', Reason: reason }
    );
  };

  const handleUpdateOffer = (offerId: string, updates: Partial<Offer>) => {
    const current = offers.find(item => item.id === offerId);
    if (!current || current.status !== 'pending' || current.buyerEmail !== activeUser?.email) return;
    const updatedOffers = offers.map(item => item.id === offerId ? { ...item, ...updates, status: 'pending' as const } : item);
    setOffers(updatedOffers);
    localStorage.setItem('kawing_offers', JSON.stringify(updatedOffers));
  };

  // Production Loan Callbacks
  const handleSubmitLoanRequest = (request: Omit<ProductionLoanRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    if (!claimSubmission('loan', request)) return;
    const newRequest: ProductionLoanRequest = {
      ...request,
      id: newRecordId('PL'),
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newRequest, ...productionLoans];
    setProductionLoans(updated);

    // Notify Buyer
    addNotification(
      request.buyerEmail,
      ' Bagong Hiling sa Pautang sa Pagtatanim',
      `Nagpadala si Magsasaka ${request.farmerName} ng Production Loan Request na nagkakahalagang ₱${request.requestedAmount.toLocaleString()} para sa ${request.purpose}.`,
      'info',
      true
    );

    // Notify Farmer
    addNotification(
      request.farmerEmail,
      ' Naipadala ang Hiling sa Pautang',
      `Matagumpay na naipadala ang iyong Production Loan Request kay ${request.buyerCompanyName || request.buyerName}. Manatiling nakatutok para sa feedback.`,
      'success'
    );
  };

  const handleCancelLoanRequest = (requestId: string) => {
    const req = productionLoans.find(r => r.id === requestId);
    if (!req) return;

    const updated = productionLoans.map(r => r.id === requestId ? { ...r, status: 'Cancelled' as const, updatedAt: new Date().toISOString().split('T')[0] } : r);
    setProductionLoans(updated);

    addNotification(
      req.buyerEmail,
      'Kanseladong Hiling sa Pautang',
      `Kinaransela ni Magsasaka ${req.farmerName} ang Production Loan Request ID: ${requestId}.`,
      'info',
      true
    );
  };

  const handleApproveLoanRequest = (requestId: string, approvedAmount: number, buyerNotes?: string) => {
    const req = productionLoans.find(r => r.id === requestId);
    if (!req) return;

    const updated = productionLoans.map(r => r.id === requestId ? {
      ...r,
      status: 'Approved' as const,
      approvedAmount,
      buyerNotes: buyerNotes || r.buyerNotes,
      updatedAt: new Date().toISOString().split('T')[0]
    } : r);

    setProductionLoans(updated);

    // The server deducts the lender's funds atomically with approval.

    // Notify Farmer
    addNotification(
      req.farmerEmail,
      ' Inaprubahan ang Iyong Production Loan Request!',
      `Inaprubahan ni ${req.buyerCompanyName || req.buyerName} ang iyong Production Loan sa halagang ₱${approvedAmount.toLocaleString()}. Tignan ang detalye sa iyong dashboard.`,
      'success',
      true
    );
  };

  const handleDeclineLoanRequest = (requestId: string, buyerNotes?: string) => {
    const req = productionLoans.find(r => r.id === requestId);
    if (!req) return;

    const updated = productionLoans.map(r => r.id === requestId ? {
      ...r,
      status: 'Declined' as const,
      buyerNotes: buyerNotes || r.buyerNotes,
      updatedAt: new Date().toISOString().split('T')[0]
    } : r);

    setProductionLoans(updated);

    addNotification(
      req.farmerEmail,
      'Hindi Inaprubahan ang Hiling sa Pautang',
      `Paumanhin, hindi naaprubahan ni ${req.buyerCompanyName || req.buyerName} ang iyong Production Loan Request. ${buyerNotes ? `Rason: ${buyerNotes}` : ''}`,
      'alert',
      true
    );
  };

  const handleUpdateLoanStatus = (requestId: string, status: ProductionLoanStatus) => {
    const req = productionLoans.find(r => r.id === requestId);
    if (!req) return;

    const updated = productionLoans.map(r => r.id === requestId ? { ...r, status, updatedAt: new Date().toISOString().split('T')[0] } : r);
    setProductionLoans(updated);
    addNotification(
      req.farmerEmail,
      'Production Loan Status Updated',
      `${req.buyerCompanyName || req.buyerName} updated your production loan status to ${status}.`,
      status === 'Completed' ? 'success' : 'info',
      true
    );
  };

  const handleAddOfferedService = (newService: Omit<OfferedService, 'id' | 'providerEmail' | 'providerName' | 'providerRole' | 'createdAt'>) => {
    if (!activeUser) return;
    if (!claimSubmission('offered-service', [activeUser.email, newService])) return;
    const os: OfferedService = {
      ...newService,
      id: newRecordId('os'),
      providerEmail: activeUser.email || 'user@kawing.com',
      providerName: activeUser.name,
      providerPhone: newService.providerPhone || activeUser.contactNumber || '0917-555-0100',
      providerRole: activeUser.role,
      companyName: newService.companyName || activeUser.businessName || `${activeUser.name} Trading Services`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [os, ...offeredServices];
    setOfferedServices(updated);
    localStorage.setItem('kawing_offered_services', JSON.stringify(updated));

    addNotification(
      activeUser.email || '',
      'Serbisyo Na-Post!',
      `Matagumpay na na-post ang iyong serbisyo na "${os.title}". Makikita na ito ng mga magsasaka!`,
      'success'
    );
  };

  const handleToggleOfferedServiceStatus = (id: string) => {
    const updated = offeredServices.map(s => {
      if (s.id === id) {
        return { ...s, isAvailable: !s.isAvailable };
      }
      return s;
    });
    setOfferedServices(updated);
    localStorage.setItem('kawing_offered_services', JSON.stringify(updated));
  };

  const handleDeleteOfferedService = (id: string) => {
    const updated = offeredServices.filter(s => s.id !== id);
    setOfferedServices(updated);
    localStorage.setItem('kawing_offered_services', JSON.stringify(updated));
  };

  const handleAcceptOffer = (offerId: string) => {
    const selectedOffer = offers.find(o => o.id === offerId);
    if (!selectedOffer) return;

    // 1. Update the winning offer to 'accepted' and mark competing pending offers for the same harvest as 'declined'
    const updatedOffers = offers.map(o => {
      if (o.id === offerId) {
        addNotification(
          o.buyerEmail,
          ' TINANGGAP ANG IYONG OFFER!',
          `Inaprubahan ni ${o.farmerName} ang iyong offer na ₱${o.offerPrice} ${o.priceUnit || 'per kg'} para sa ${o.cropType}. Subaybayan ang transaksyon sa KAWING.`,
          'success',
          true
        );
        return { ...o, status: 'accepted' as const };
      }
      if (o.harvestId === selectedOffer.harvestId && o.status === 'pending') {
        addNotification(
          o.buyerEmail,
          'Update sa Offer',
          `Pumili na ng ibang offer ang magsasaka para sa ani na ${o.cropType}. Maraming salamat sa iyong interest!`,
          'info',
          true
        );
        return { ...o, status: 'declined' as const };
      }
      return o;
    });
    setOffers(updatedOffers);
    localStorage.setItem('kawing_offers', JSON.stringify(updatedOffers));

    // 2. Mark the harvest as completed/sold
    const updatedHarvests = harvests.map(h => {
      if (h.id === selectedOffer.harvestId) {
        return { ...h, status: 'completed' as const };
      }
      return h;
    });
    setHarvests(updatedHarvests);
    localStorage.setItem('kawing_harvests', JSON.stringify(updatedHarvests));

    // 3. Notify farmer
    addNotification(
      selectedOffer.farmerEmail,
      ' Matagumpay na Nakapili ng Buyer!',
      `Napili mo ang offer ni ${selectedOffer.buyerName} (₱${selectedOffer.offerPrice} ${selectedOffer.priceUnit || 'per kg'}). Subaybayan ang transaksyon sa KAWING.`,
      'success'
    );
  };

  const handleRejectOffer = (offerId: string) => {
    const updated = offers.map(o => {
      if (o.id === offerId) {
        addNotification(
          o.buyerEmail,
          'Tinanggihan ang Impormasyon',
          `Hindi na-verify ni ${o.farmerName} ang iyong impormasyon para sa ani na ${o.cropType}.`,
          'alert',
          true
        );
        return { ...o, status: 'declined' as const };
      }
      return o;
    });
    setOffers(updated);
    localStorage.setItem('kawing_offers', JSON.stringify(updated));
  };

  // Operator callbacks (Accept service)
  const handleAcceptService = (requestId: string) => {
    if (!activeUser) return;
    let farmerEmail = '';
    let cropType = '';
    let serviceType = '';

    const updatedServices = serviceRequests.map(s => {
      if (s.id === requestId) {
        farmerEmail = s.farmerEmail;
        cropType = s.cropType;
        serviceType = s.type;
        return {
          ...s,
          status: 'matched' as const,
          operatorEmail: activeUser.email,
          operatorName: activeUser.name,
        };
      }
      return s;
    });
    setServiceRequests(updatedServices);
    localStorage.setItem('kawing_services', JSON.stringify(updatedServices));

    if (farmerEmail) {
      const serviceNameFilipino = 
        serviceType === 'transport' ? 'Transportasyon' :
        serviceType === 'storage' ? 'Cold Storage' :
        serviceType === 'drying' ? 'Patuyuan' :
        serviceType === 'milling' ? 'Gilingan' : 'Pagbili (Buyer)';
      
      addNotification(
        farmerEmail,
        'Tinatanggap ang Kahilingan!',
        `Tinanggap ni ${activeUser.name} ang iyong kahilingan para sa ${serviceNameFilipino} para sa ${cropType}.`,
        'success',
        true
      );
    }
  };

  // Operator callbacks (Reject service)
  const handleRejectService = (requestId: string) => {
    if (!activeUser) return;
    let farmerEmail = '';
    let cropType = '';
    let serviceType = '';

    const updatedServices = serviceRequests.map(s => {
      if (s.id === requestId) {
        farmerEmail = s.farmerEmail;
        cropType = s.cropType;
        serviceType = s.type;
        return {
          ...s,
          status: 'rejected' as const,
          operatorEmail: activeUser.email,
          operatorName: activeUser.name,
        };
      }
      return s;
    });
    setServiceRequests(updatedServices);
    localStorage.setItem('kawing_services', JSON.stringify(updatedServices));

    if (farmerEmail) {
      const serviceNameFilipino = 
        serviceType === 'transport' ? 'Transportasyon' :
        serviceType === 'storage' ? 'Cold Storage' :
        serviceType === 'drying' ? 'Patuyuan' :
        serviceType === 'milling' ? 'Gilingan' : 'Pagbili (Buyer)';
      
      addNotification(
        farmerEmail,
        'Tinanggihan ang Kahilingan',
        `Tinanggihan ni ${activeUser.name} ang iyong kahilingan para sa ${serviceNameFilipino} para sa ${cropType}.`,
        'alert',
        true
      );
    }
  };

  // Operator callbacks (Complete service)
  const handleCompleteService = (requestId: string) => {
    const service = serviceRequests.find(s => s.id === requestId);
    if (!service) return;

    const updatedServices = serviceRequests.map(s => {
      if (s.id === requestId) {
        return { ...s, status: 'completed' as const };
      }
      return s;
    });
    setServiceRequests(updatedServices);
    localStorage.setItem('kawing_services', JSON.stringify(updatedServices));

    // Also update the associated harvest to "completed" in global list!
    const updatedHarvests = harvests.map(h => {
      if (h.id === service.harvestId) {
        return { ...h, status: 'completed' as const };
      }
      return h;
    });
    setHarvests(updatedHarvests);
    localStorage.setItem('kawing_harvests', JSON.stringify(updatedHarvests));

    // Send completed notification to Farmer
    const serviceNameFilipino = 
      service.type === 'transport' ? 'Transportasyon' :
      service.type === 'storage' ? 'Cold Storage' :
      service.type === 'drying' ? 'Patuyuan' :
      service.type === 'milling' ? 'Gilingan' : 'Pagbili';

    addNotification(
      service.farmerEmail,
      'Nakumpleto ang Serbisyo!',
      `Nakumpleto na ni ${service.operatorName || 'Operator'} ang serbisyong ${serviceNameFilipino} para sa iyong ${service.cropType}!`,
      'success',
      true
    );
  };

  // Dispatch correct view
  const renderDashboard = () => {
    if (!activeUser) return null;

    switch (activeUser.role) {
      case 'farmer':
        return (
          <FarmerDashboard
            user={activeUser}
            harvests={harvests}
            offers={offers}
            serviceRequests={serviceRequests}
            offeredServices={offeredServices}
            productionLoans={productionLoans}
            registeredUsers={registeredUsers}
            marketReferencePrice={settings.daReferencePrice}
            onAddHarvest={handleAddHarvest}
            onAddServiceRequest={handleAddServiceRequest}
            onSubmitLoanRequest={handleSubmitLoanRequest}
            onCancelLoanRequest={handleCancelLoanRequest}
            onAcceptOffer={handleAcceptOffer}
            onRejectOffer={handleRejectOffer}
            onDeleteHarvests={handleDeleteHarvests}
            onUpdateHarvest={handleUpdateHarvest}
            onUpdateUser={handleUpdateUser}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onClearAllNotifications={handleClearAllNotifications}
            onLogout={handleLogout}
          />
        );
      case 'agricultural_business':
      case 'buyer':
        return (
          <BuyerDashboard
            user={activeUser}
            harvests={harvests}
            offers={offers}
            serviceRequests={serviceRequests}
            offeredServices={offeredServices}
            productionLoans={productionLoans}
            marketReferencePrice={settings.daReferencePrice}
            onAddOfferedService={handleAddOfferedService}
            onToggleOfferedServiceStatus={handleToggleOfferedServiceStatus}
            onDeleteOfferedService={handleDeleteOfferedService}
            onAcceptService={handleAcceptService}
            onRejectService={handleRejectService}
            onCompleteService={handleCompleteService}
            onApproveLoanRequest={handleApproveLoanRequest}
            onDeclineLoanRequest={handleDeclineLoanRequest}
            onUpdateLoanStatus={handleUpdateLoanStatus}
            onAddOffer={handleAddOffer}
            onUpdateOffer={handleUpdateOffer}
            onCancelOffer={handleCancelOffer}
            onUpdateUser={handleUpdateUser}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onClearAllNotifications={handleClearAllNotifications}
            onLogout={handleLogout}
          />
        );
      case 'truck':
        return (
          <TruckDashboard
            user={activeUser}
            serviceRequests={serviceRequests}
            onAcceptService={handleAcceptService}
            onRejectService={handleRejectService}
            onCompleteService={handleCompleteService}
            onUpdateUser={handleUpdateUser}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onClearAllNotifications={handleClearAllNotifications}
            onLogout={handleLogout}
          />
        );
      case 'logistics':
        return (
          <LogisticsDashboard
            user={activeUser}
            serviceRequests={serviceRequests}
            offeredServices={offeredServices}
            onAcceptService={handleAcceptService}
            onRejectService={handleRejectService}
            onCompleteService={handleCompleteService}
            onAddOfferedService={handleAddOfferedService}
            onToggleOfferedServiceStatus={handleToggleOfferedServiceStatus}
            onDeleteOfferedService={handleDeleteOfferedService}
            onUpdateUser={handleUpdateUser}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onClearAllNotifications={handleClearAllNotifications}
            onLogout={handleLogout}
          />
        );
      case 'storage':
        return (
          <StorageDashboard
            user={activeUser}
            serviceRequests={serviceRequests}
            onAcceptService={handleAcceptService}
            onRejectService={handleRejectService}
            onCompleteService={handleCompleteService}
            onUpdateUser={handleUpdateUser}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onClearAllNotifications={handleClearAllNotifications}
            onLogout={handleLogout}
          />
        );
      case 'dryer':
        return (
          <DryerDashboard
            user={activeUser}
            serviceRequests={serviceRequests}
            onAcceptService={handleAcceptService}
            onRejectService={handleRejectService}
            onCompleteService={handleCompleteService}
            onUpdateUser={handleUpdateUser}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onClearAllNotifications={handleClearAllNotifications}
            onLogout={handleLogout}
          />
        );
      case 'miller':
        return (
          <MillerDashboard
            user={activeUser}
            serviceRequests={serviceRequests}
            onAcceptService={handleAcceptService}
            onRejectService={handleRejectService}
            onCompleteService={handleCompleteService}
            onUpdateUser={handleUpdateUser}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onClearAllNotifications={handleClearAllNotifications}
            onLogout={handleLogout}
          />
        );
      case 'admin':
        return (
          <AdminDashboard
            user={activeUser}
            harvests={harvests}
            serviceRequests={serviceRequests}
            registeredUsers={registeredUsers}
            offers={offers}
            marketReferencePrice={settings.daReferencePrice}
            onUpdateDAReferencePrice={handleUpdateDAReferencePrice}
            onSaveEmailNotifications={handleSaveEmailNotifications}
            onApproveUser={handleApproveUser}
            onRejectUser={handleRejectUser}
            onDeleteUser={handleDeleteUser}
            onDeleteUsers={handleDeleteUsers}
            onDeleteHarvest={handleDeleteHarvest}
            onDeleteHarvests={handleDeleteHarvests}
            onUpdateUser={handleUpdateUser}
            onPublishAnnouncement={handlePublishAnnouncement}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onLogout={handleLogout}
          />
        );
      default:
        return null;
    }
  };

  // Do not flash a public page while server-side session restoration is pending.
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white" aria-label="Loading KAWING">
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-slate-900/70 px-5 py-4 shadow-xl">
          <IconLoader2 size={24} stroke={2} className="animate-spin text-emerald-400" aria-hidden="true" />
          <div>
            <p className="font-display text-sm font-black tracking-wide">KAWING</p>
            <p className="text-xs text-slate-400">Loading platform...</p>
          </div>
        </div>
      </div>
    );
  }

  // Main view router based on phase
  if (phase === 'splash') {
    return (
      <Splash
        onComplete={() => {
          if (activeUser) {
            setPhase('dashboard');
          } else {
            setPhase('auth');
          }
        }}
      />
    );
  }

  if (phase === 'dashboard' && !activeUser) {
    return <Splash onComplete={() => setPhase('auth')} />;
  }

  // A route state can never bypass server-backed authentication.
  if (phase === 'auth') {
    return (
      <Auth
        onBack={() => setPhase('splash')}
        onAuthSuccess={handleAuthSuccess}
        registeredUsers={registeredUsers}
        onRegisterUser={handleRegisterUser}
      />
    );
  }

  return (
    <>
      {renderDashboard()}
      {activeUser && activeUser.role !== 'admin' && <GrainyAssistant key={activeUser.email || activeUser.name} user={activeUser} />}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[1000] flex items-center justify-center overflow-y-auto p-3 md:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-5 md:p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 relative">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 mx-auto text-3xl border border-red-200 dark:border-red-900/40 shadow-xs"><span className="inline-flex items-center gap-1.5 align-middle"><IconLogout size={32} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Confirm Logout
              </h3>
              <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                Kumpirmahin ang Pag-logout
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed pt-1">
                Are you sure you want to log out of your account?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                Sigurado ka bang nais mong lumabas sa iyong account sa Kawing?
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2 min-[390px]:grid-cols-2 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-sm rounded-2xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                Cancel / No
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
      {syncError && activeUser && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-3 backdrop-blur-sm md:p-4">
          <div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl md:rounded-3xl border border-red-800 bg-white dark:bg-slate-900 p-5 md:p-7 text-slate-900 dark:text-white shadow-2xl">
            <div className="text-3xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconAlertTriangle size={32} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
            <h2 className="mt-3 text-xl font-black">Changes were not saved</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{syncError} Your changes are still on this screen but are not saved.</p>
            <div className="mt-6 flex flex-col min-[390px]:flex-row md:flex-row gap-3">
              <button type="button" onClick={() => setSyncError('')} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-3 text-sm font-bold">Dismiss</button>
              <button type="button" onClick={() => { setSyncError(''); setSyncRetry(value => value + 1); }} className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-black">Retry Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
