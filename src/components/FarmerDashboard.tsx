import { IconAlertTriangle, IconArrowRight, IconArrowUpRight, IconCalendar, IconCash, IconCheck, IconCircleCheck, IconCircleX, IconCoin, IconConfetti, IconDroplet, IconFolderOpen, IconHammer, IconHeartHandshake, IconMapPin, IconMedal, IconPackage, IconSettings, IconTools, IconTrophy, IconTruck, IconWheat, IconWind, IconWorld, IconX } from '@tabler/icons-react';
import { useLiveRevision } from '../lib/useLiveRevision';
import React, { useEffect, useState } from 'react';
import { Harvest, ServiceRequest, UserAccount, AppNotification, Offer, OfferedService } from '../types';
import { Plus, Calendar, MapPin, AlertTriangle, TrendingUp, RefreshCw, Check, X, Phone, ShieldCheck, Trash2, Truck, HardDrive, Wind, ChevronDown, ChevronUp, Star, CircleDot, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { getMoistureClassification } from '../lib/moisture';
import { hasApprovedBusinessCapability } from '../lib/businessCapabilities';
import Sidebar from './Sidebar';
import AnimatedButton from './AnimatedButton';
import AnnouncementsBoard from './AnnouncementsBoard';
import ProductionLoanFarmer from './ProductionLoanFarmer';
import { ProductionLoanRequest } from '../types';
import farmerBackground from '../assets/images/Farmer_Background.jpg';

const TRUCK_OPTIONS = [
  { name: 'Pick-up / Utility Vehicle', maxCapacityKg: 1000 },
  { name: '4-Wheelers (Elf / Utility Light Truck)', maxCapacityKg: 3000 },
  { name: 'Farm Tractor with Trailer', maxCapacityKg: 5000 },
  { name: '6-Wheelers (Medium Duty Hauler)', maxCapacityKg: 8000 },
  { name: 'Forward Truck (Wing Van / Covered)', maxCapacityKg: 10000 },
  { name: '10-Wheelers (Heavy Duty Cargo)', maxCapacityKg: 15000 },
] as const;

const DEFAULT_TRUCK_TYPE = TRUCK_OPTIONS[3].name;
interface FarmerDashboardProps {
  user: UserAccount;
  harvests: Harvest[];
  offers: Offer[];
  serviceRequests: ServiceRequest[];
  offeredServices?: OfferedService[];
  productionLoans?: ProductionLoanRequest[];
  registeredUsers: UserAccount[];
  marketReferencePrice: number;
  onAddHarvest: (
    harvest: Omit<Harvest, 'id' | 'farmerEmail' | 'farmerName' | 'farmerRating' | 'status'>,
    neededServices?: ('transport' | 'storage' | 'drying' | 'milling' | 'buyer')[]
  ) => void;
  onAddServiceRequest: (harvestId: string, type: 'transport' | 'storage' | 'drying' | 'milling' | 'buyer') => void;
  onSubmitLoanRequest?: (request: Omit<ProductionLoanRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  onCancelLoanRequest?: (requestId: string) => void;
  onAcceptOffer: (id: string) => void;
  onRejectOffer: (id: string) => void;
  onDeleteHarvests: (ids: string[]) => void;
  onUpdateHarvest: (id: string, updates: Partial<Harvest>) => void;
  onUpdateUser?: (originalName: string, updated: UserAccount) => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onClearAllNotifications: (email: string) => void;
  onLogout: () => void;
}

export default function FarmerDashboard({
  user,
  harvests,
  offers = [],
  serviceRequests,
  offeredServices = [],
  productionLoans = [],
  registeredUsers,
  marketReferencePrice,
  onAddHarvest,
  onAddServiceRequest,
  onSubmitLoanRequest,
  onCancelLoanRequest,
  onAcceptOffer,
  onRejectOffer,
  onDeleteHarvests,
  onUpdateHarvest,
  onUpdateUser,
  notifications,
  onMarkNotificationRead,
  onClearAllNotifications,
  onLogout,
}: FarmerDashboardProps) {
  const { t, lang } = useApp();
  const [activeTab, setActiveTab] = useState<'harvests' | 'services' | 'interests' | 'buyers' | 'directory' | 'palay' | 'announcements' | 'loans'>('services');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Modal states
  const [showRequestServiceModal, setShowRequestServiceModal] = useState(false);
  const [showRequestServiceReview, setShowRequestServiceReview] = useState(false);
  const [showPostHarvestModal, setShowPostHarvestModal] = useState(false);
  const [selectedHarvestPost, setSelectedHarvestPost] = useState<Harvest | null>(null);
  const [harvestEditDraft, setHarvestEditDraft] = useState<Harvest | null>(null);
  const [isEditingHarvestPost, setIsEditingHarvestPost] = useState(false);
  const [confirmHarvestDelete, setConfirmHarvestDelete] = useState(false);
  const [selectedOperatorModal, setSelectedOperatorModal] = useState<UserAccount | null>(null);
  const [selectedServiceProvider, setSelectedServiceProvider] = useState<UserAccount | null>(null);
  const [selectedBuyerModal, setSelectedBuyerModal] = useState<UserAccount | null>(null);
  const [partnerFilter, setPartnerFilter] = useState<'all' | 'buyer' | 'transport' | 'storage' | 'drying' | 'milling'>('all');
  const [partnerSearch, setPartnerSearch] = useState('');
  
  // Selected offer confirmation modal
  const [offerToAccept, setOfferToAccept] = useState<Offer | null>(null);

  // Logistics Directory state
  const [selectedServiceDir, setSelectedServiceDir] = useState<'all' | 'truck' | 'storage' | 'dryer' | 'miller'>('all');
  const [showDirDetails, setShowDirDetails] = useState(true);

  // Request Service Form states (Logistics & Post-Harvest Services)
  const [reqRiceVariety, setReqRiceVariety] = useState<string>('');
  const [reqHarvestDate, setReqHarvestDate] = useState<string>('');
  const [reqQuantityAccuracy] = useState<'actual' | 'estimated'>('actual');
  const [reqContainerType, setReqContainerType] = useState<'plastic_bags' | 'sacks'>('sacks');
  const [reqContainerQuantity, setReqContainerQuantity] = useState<number | ''>('');
  const [reqEstimatedKgPerContainer, setReqEstimatedKgPerContainer] = useState<number | ''>('');
  const [reqLocation, setReqLocation] = useState('');
  const [reqUrgency, setReqUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [reqServices, setReqServices] = useState<('transport' | 'storage' | 'drying' | 'milling')[]>([]);
  const [reqTruckType, setReqTruckType] = useState<string>(DEFAULT_TRUCK_TYPE);
  const [reqPickupPlace, setReqPickupPlace] = useState<string>('');
  const [reqDropPlace, setReqDropPlace] = useState<string>('');
  const [reqPrefDate, setReqPrefDate] = useState<string>('');
  const [reqPrefTime, setReqPrefTime] = useState<string>('08:00');
  const [reqAddNotes, setReqAddNotes] = useState<string>('');

  const handleOpenRequestServiceModal = () => {
    setSelectedServiceProvider(null);
    setReqRiceVariety('');
    setReqHarvestDate('');
    setReqContainerType('sacks');
    setReqContainerQuantity('');
    setReqEstimatedKgPerContainer('');
    setReqLocation('');
    setReqUrgency('medium');
    setReqServices([]);
    setReqTruckType(DEFAULT_TRUCK_TYPE);
    setReqPickupPlace('');
    setReqDropPlace('');
    setReqPrefDate('');
    setReqPrefTime('08:00');
    setReqAddNotes('');
    setShowRequestServiceModal(true);
  };

  // Post Harvest Form states (for direct sale to buyers)
  const [postRiceVariety, setPostRiceVariety] = useState<string>('');
  const [postHarvestDate, setPostHarvestDate] = useState<string>('');
  const [postQuantityAccuracy] = useState<'actual' | 'estimated'>('actual');
  const [postContainerType, setPostContainerType] = useState<'plastic_bags' | 'sacks'>('sacks');
  const [postContainerQuantity, setPostContainerQuantity] = useState<number | ''>('');
  const [postKgPerContainer, setPostKgPerContainer] = useState<number | ''>('');
  const [postUnit, setPostUnit] = useState('kg');
  const [postLocation, setPostLocation] = useState('');
  const [postUrgency, setPostUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [postMoisture, setPostMoisture] = useState('');
  const postMoistureCardClass = {
    high: 'border-red-600 bg-red-600 text-white shadow-red-600/30',
    'needs-drying': 'border-orange-500 bg-orange-500 text-slate-950 shadow-orange-500/30',
    ready: 'border-green-700 bg-green-700 text-white shadow-green-600/30',
    overdry: 'border-purple-600 bg-purple-600 text-white shadow-purple-600/30',
    suitable: 'border-amber-400 bg-amber-400 text-slate-950 shadow-amber-500/20',
  }[getMoistureClassification(postMoisture).category];
  const [palaySenseStatus, setPalaySenseStatus] = useState<'waiting' | 'connected' | 'error'>('waiting');
  const [palaySenseReadingAt, setPalaySenseReadingAt] = useState('');
  const [palaySenseSessionStart, setPalaySenseSessionStart] = useState('');
  const [postTargetPrice, setPostTargetPrice] = useState<number | ''>('');
  const [postSellingMethod, setPostSellingMethod] = useState<'fixed_price' | 'bidding'>('fixed_price');
  const [postRemarks, setPostRemarks] = useState('');
  const [targetHarvestBuyer, setTargetHarvestBuyer] = useState<UserAccount | null>(null);
  const [showPostHarvestReview, setShowPostHarvestReview] = useState(false);

  const handleOpenPostHarvestModal = (targetBuyer: UserAccount | null = null) => {
    setShowPostHarvestReview(false);
    setTargetHarvestBuyer(targetBuyer);
    setPostRiceVariety('');
    setPostHarvestDate('');
    setPostContainerType('sacks');
    setPostContainerQuantity('');
    setPostKgPerContainer('');
    setPostUnit('kg');
    setPostLocation('');
    setPostUrgency('medium');
    setPostMoisture('');
    setPalaySenseStatus('waiting');
    setPalaySenseReadingAt('');
    setPalaySenseSessionStart(new Date().toISOString());
    setPostTargetPrice('');
    setPostSellingMethod('fixed_price');
    setPostRemarks('');
    setShowPostHarvestModal(true);
  };

  const moistureRevision = useLiveRevision('moisture');
  useEffect(() => {
    if (!showPostHarvestModal || !palaySenseSessionStart) return;
    let cancelled = false;

    const readPalaySense = async () => {
      try {
        const params = new URLSearchParams({
          limit: '1',
          since: palaySenseSessionStart,
          includeUnassigned: 'true',
        });
        if (user.email) params.set('farmerEmail', user.email);
        const response = await fetch(`/api/moisture-readings?${params.toString()}`);
        if (!response.ok) throw new Error('PalaySense service unavailable');
        const payload = await response.json();
        const reading = payload.data?.[0];
        if (!cancelled && reading) {
          setPostMoisture(Number(reading.moisture_percentage).toFixed(1));
          setPalaySenseReadingAt(reading.recorded_at);
          setPalaySenseStatus('connected');
        } else if (!cancelled) {
          setPalaySenseStatus('waiting');
        }
      } catch {
        if (!cancelled) setPalaySenseStatus('error');
      }
    };

    readPalaySense();

    return () => {
      cancelled = true;

    };
  }, [showPostHarvestModal, palaySenseSessionStart, user.email, moistureRevision]);

  useEffect(() => {
    const quantityKg = Number(reqContainerQuantity) * Number(reqEstimatedKgPerContainer);
    if (!reqServices.includes('transport') || quantityKg <= 0) return;

    const recommendedTruck = TRUCK_OPTIONS.find((truck) => truck.maxCapacityKg >= quantityKg)
      ?? TRUCK_OPTIONS[TRUCK_OPTIONS.length - 1];
    setReqTruckType(recommendedTruck.name);
  }, [reqContainerQuantity, reqEstimatedKgPerContainer, reqServices]);

  // Category filter state for service requests
  const [serviceCategory, setServiceCategory] = useState<'all' | 'transport' | 'storage' | 'drying' | 'milling'>('all');

  // Filter local harvests and service requests owned by this farmer
  const myHarvests = harvests.filter(h => h.farmerEmail === user.email);
  const myServices = serviceRequests.filter(s => s.farmerEmail === user.email);
  const myIncomingOffers = offers.filter(o => o.farmerEmail === user.email);
  const verifiedBuyers = registeredUsers.filter(buyer => hasApprovedBusinessCapability(buyer, 'buyer'));
  const partnerEntries: Array<{
    id: string;
    kind: 'buyer' | 'service';
    category: 'buyer' | 'transport' | 'storage' | 'drying' | 'milling';
    serviceRole?: 'truck' | 'storage' | 'dryer' | 'miller';
    user: UserAccount;
    label: string;
    icon: React.ReactNode;
  }> = [
    ...verifiedBuyers.map((buyer) => ({
      id: `buyer-${buyer.email || buyer.name}`,
      kind: 'buyer' as const,
      category: 'buyer' as const,
      user: buyer,
      label: lang === 'en' ? 'Verified Buyer' : 'Verified Buyer',
      icon: <span className="inline-flex items-center gap-1.5 align-middle"><IconHeartHandshake size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>,
    })),
    ...registeredUsers.flatMap((provider) => {
      if (provider.isApproved === false) return [];
      const serviceDefinitions = [
        { category: 'transport' as const, role: 'truck' as const, label: lang === 'en' ? 'Trucking & Hauling' : 'Trucking at Hauling', icon: <span className="inline-flex items-center gap-1.5 align-middle"><IconTruck size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span> },
        { category: 'storage' as const, role: 'storage' as const, label: lang === 'en' ? 'Storage Facility' : 'Imbakan', icon: <span className="inline-flex items-center gap-1.5 align-middle"><IconPackage size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span> },
        { category: 'drying' as const, role: 'dryer' as const, label: lang === 'en' ? 'Drying Facility' : 'Patuyuan', icon: <span className="inline-flex items-center gap-1.5 align-middle"><IconWind size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span> },
        { category: 'milling' as const, role: 'miller' as const, label: lang === 'en' ? 'Rice Milling' : 'Gilingan', icon: <span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span> },
      ];
      return serviceDefinitions
        .filter(({ category }) => hasApprovedBusinessCapability(provider, category))
        .map(({ category, role, label, icon }) => ({
          id: `${category}-${provider.email || provider.name}`,
          kind: 'service' as const,
          category,
          serviceRole: role,
          user: provider,
          label,
          icon,
        }));
    }),
  ];
  // Only expose services backed by an enabled, approved logistics provider or
  // by an active service listing published by a buyer.
  const availableServiceTypes = new Set<'transport' | 'storage' | 'drying' | 'milling'>([
    ...partnerEntries
      .filter((entry) => entry.kind === 'service')
      .map((entry) => entry.category as 'transport' | 'storage' | 'drying' | 'milling'),
    ...(offeredServices || [])
      .filter((service) => service.isAvailable !== false && registeredUsers.some(provider => provider.email === service.providerEmail && hasApprovedBusinessCapability(provider, service.serviceType)))
      .map((service) => service.serviceType),
  ]);
  const visiblePartnerEntries = partnerEntries.filter((entry) => {
    const matchesFilter = partnerFilter === 'all' || entry.category === partnerFilter;
    const searchText = `${entry.user.businessName || ''} ${entry.user.name} ${entry.user.address || ''} ${entry.label}`.toLowerCase();
    return matchesFilter && searchText.includes(partnerSearch.trim().toLowerCase());
  });

  const filteredMyServices = myServices.filter(s => {
    if (serviceCategory === 'all') return true;
    return s.type === serviceCategory;
  });

  const totalHarvestQty = myHarvests.reduce((sum, h) => sum + h.quantity, 0);
  const activeServicesCount = myServices.filter(s => s.status === 'pending' || s.status === 'matched').length;
  const highRiskHarvests = myHarvests.filter(h => h.spoilageRisk === 'high' && h.status !== 'completed').length;
  const selectedTruckOption = TRUCK_OPTIONS.find((truck) => truck.name === reqTruckType) ?? TRUCK_OPTIONS[3];
  const requestLoadKg = Number(reqContainerQuantity) * Number(reqEstimatedKgPerContainer);
  const recommendedTruckOption = requestLoadKg > 0
    ? (TRUCK_OPTIONS.find((truck) => truck.maxCapacityKg >= requestLoadKg) ?? TRUCK_OPTIONS[TRUCK_OPTIONS.length - 1])
    : null;
  const postWeightKg = Number(postContainerQuantity) * Number(postKgPerContainer);
  const postTotalPrice = postWeightKg * Number(postTargetPrice);

  // Submit Request Service (Logistics/Processing)
  const handleRequestServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (reqServices.length === 0) {
      alert(lang === 'en' 
        ? 'Please select at least one service needed (Transportation, Drying, Storage, or Milling).' 
        : 'Mangyaring pumili ng kahit isang serbisyo (Transport, Patuyuan, Imbakan, o Gilingan).');
      return;
    }

    if (!reqRiceVariety.trim()) {
      alert(lang === 'en' ? 'Please select or enter the Rice Variety.' : 'Mangyaring pumili o ilagay ang Uri ng Palay.');
      return;
    }

    if (requestLoadKg <= 0) {
      alert(lang === 'en' ? 'Please enter a valid estimated quantity.' : 'Mangyaring maglagay ng tamang dami ng ani.');
      return;
    }

    if (reqServices.includes('transport')) {
      if (!reqPickupPlace.trim()) {
        alert(lang === 'en' ? 'Please enter the Pick-up Place for transportation.' : 'Mangyaring ilagay ang Lugar ng Sakay (Pick-up Place).');
        return;
      }
      if (!reqDropPlace.trim()) {
        alert(lang === 'en' ? 'Please enter the Drop Place for transportation.' : 'Mangyaring ilagay ang Lugar ng Bagsakan (Drop Place).');
        return;
      }
    }

    const finalLocation = reqServices.includes('transport')
      ? `${reqPickupPlace.trim()}  to  ${reqDropPlace.trim()}`
      : (reqLocation.trim() || reqPickupPlace.trim() || user.address || 'Barangay San Jose');

    if (!finalLocation) return;
    setShowRequestServiceReview(true);
  };

  const confirmRequestService = () => {
    const finalLocation = reqServices.includes('transport')
      ? `${reqPickupPlace.trim()}  to  ${reqDropPlace.trim()}`
      : (reqLocation.trim() || reqPickupPlace.trim() || user.address || 'Barangay San Jose');

    onAddHarvest({
      cropType: `Palay (${reqRiceVariety})`,
      quantity: requestLoadKg,
      unit: 'kg',
      quantityAccuracy: reqQuantityAccuracy,
      estimatedWeightKg: requestLoadKg,
      containerType: reqContainerType,
      containerQuantity: Number(reqContainerQuantity),
      estimatedKgPerContainer: Number(reqEstimatedKgPerContainer),
      harvestDate: reqHarvestDate || new Date().toISOString().split('T')[0],
      location: finalLocation,
      urgency: reqUrgency,
      spoilageRisk: reqUrgency === 'high' ? 'high' : reqUrgency === 'medium' ? 'medium' : 'low',
      riceVariety: reqRiceVariety,
      preferredScheduleDate: reqPrefDate || new Date().toISOString().split('T')[0],
      preferredScheduleTime: reqPrefTime,
      additionalNotes: reqAddNotes,
      truckType: reqServices.includes('transport')
        ? `${selectedTruckOption.name} — Maximum capacity: ${selectedTruckOption.maxCapacityKg.toLocaleString()} kg`
        : undefined,
      pickupLocation: reqServices.includes('transport') ? reqPickupPlace : undefined,
      dropLocation: reqServices.includes('transport') ? reqDropPlace : undefined,
      requestedProviderEmail: selectedServiceProvider?.email,
      requestedProviderName: selectedServiceProvider?.name,
    }, reqServices);

    setShowRequestServiceModal(false);
    setShowRequestServiceReview(false);
  };

  // Submit Post Harvest (Selling to Buyers)
  const handlePostHarvestSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!postRiceVariety.trim()) {
      alert(lang === 'en' ? 'Please select or enter the Rice Variety.' : 'Mangyaring pumili ng Uri ng Palay.');
      return;
    }

    if (postWeightKg <= 0) {
      alert(lang === 'en' ? 'Please enter a valid quantity.' : 'Mangyaring maglagay ng tamang dami ng ani.');
      return;
    }

    if (!postTargetPrice || Number(postTargetPrice) <= 0) {
      alert(lang === 'en' ? 'Please enter a valid asking price.' : 'Mangyaring maglagay ng tamang hinging presyo.');
      return;
    }

    if (!postHarvestDate) {
      alert(lang === 'en' ? 'Please select the harvest date.' : 'Mangyaring ilagay ang petsa ng ani.');
      return;
    }

    if (!postMoisture.trim()) {
      alert(lang === 'en'
        ? 'Turn on your PalaySense device and wait for its live moisture reading before posting.'
        : 'I-on ang PalaySense device at hintayin ang live moisture reading bago mag-post.');
      return;
    }

    setShowPostHarvestReview(true);
  };

  const confirmPostHarvest = () => {
    onAddHarvest({
      cropType: `Palay (${postRiceVariety})`,
      quantity: postWeightKg,
      unit: postUnit,
      quantityAccuracy: postQuantityAccuracy,
      estimatedWeightKg: postWeightKg,
      containerType: postContainerType,
      containerQuantity: Number(postContainerQuantity),
      estimatedKgPerContainer: Number(postKgPerContainer),
      harvestDate: postHarvestDate,
      location: postLocation.trim() || user.address || 'Barangay San Jose',
      urgency: postUrgency,
      spoilageRisk: postUrgency === 'high' ? 'high' : postUrgency === 'medium' ? 'medium' : 'low',
      riceVariety: postRiceVariety,
      moistureLevel: `${postMoisture}%`,
      targetPrice: Number(postTargetPrice),
      sellingMethod: targetHarvestBuyer ? 'fixed_price' : postSellingMethod,
      totalPrice: postTotalPrice,
      priceUnit: 'per kg',
      marketRefPrice: marketReferencePrice,
      notes: postRemarks,
      farmerPhone: user.contactNumber || '0917-888-9999',
      targetBuyerEmail: targetHarvestBuyer?.email,
      targetBuyerName: targetHarvestBuyer?.name,
    }, ['buyer']); // Marked as buyer sale so it posts to Buyer Dashboard!

    setShowPostHarvestModal(false);
    setShowPostHarvestReview(false);
  };

  const openHarvestManager = (harvest: Harvest) => {
    setSelectedHarvestPost(harvest);
    setHarvestEditDraft({ ...harvest });
    setIsEditingHarvestPost(false);
    setConfirmHarvestDelete(false);
  };

  const closeHarvestManager = () => {
    setSelectedHarvestPost(null);
    setHarvestEditDraft(null);
    setIsEditingHarvestPost(false);
    setConfirmHarvestDelete(false);
  };

  const saveHarvestChanges = () => {
    if (!selectedHarvestPost || !harvestEditDraft) return;
    const weight = Number(harvestEditDraft.estimatedWeightKg || harvestEditDraft.quantity);
    const price = Number(harvestEditDraft.targetPrice || 0);
    if (!harvestEditDraft.riceVariety?.trim() || !harvestEditDraft.harvestDate || weight <= 0 || price <= 0) {
      alert('Please complete the rice variety, harvest date, total weight, and price.');
      return;
    }
    const updates: Partial<Harvest> = {
      ...harvestEditDraft,
      cropType: `Palay (${harvestEditDraft.riceVariety.trim()})`,
      quantity: weight,
      estimatedWeightKg: weight,
      targetPrice: price,
      totalPrice: weight * price,
      spoilageRisk: harvestEditDraft.urgency,
      sellingMethod: harvestEditDraft.targetBuyerEmail ? 'fixed_price' : harvestEditDraft.sellingMethod,
    };
    onUpdateHarvest(selectedHarvestPost.id, updates);
    const updated = { ...selectedHarvestPost, ...updates } as Harvest;
    setSelectedHarvestPost(updated);
    setHarvestEditDraft(updated);
    setIsEditingHarvestPost(false);
  };

  const getUrgencyClass = (u: 'low' | 'medium' | 'high') => {
    switch (u) {
      case 'high': return 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-200 dark:border-red-900/50';
      case 'medium': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
      case 'low': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50';
      case 'in_progress': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50';
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50';
      default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getSpoilageIndicator = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high': return { text: t('risk_high'), color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500' };
      case 'medium': return { text: t('risk_medium'), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500' };
      case 'low': return { text: t('risk_low'), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500' };
    }
  };

  return (
    <div
      className="h-dvh max-h-dvh overflow-hidden bg-cover bg-center bg-scroll md:bg-fixed flex flex-col font-sans transition-colors duration-300"
      style={{ backgroundImage: `url(${farmerBackground})` }}
    >
      
      {/* Main Container with Left Sidebar */}
      <div className="flex-1 min-h-0 flex w-full overflow-hidden">
        <Sidebar
          user={user}
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId as any)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onUpdateUser={onUpdateUser}
          onLogout={onLogout}
          notifications={notifications}
          onMarkNotificationRead={onMarkNotificationRead}
        />

        <main className="dashboard-main flex-1 min-w-0 w-full max-w-[1440px] mx-auto h-full overflow-y-auto border-x border-white/30 bg-white/60 px-4 py-8 shadow-2xl backdrop-blur-[3px] scroll-smooth dark:border-slate-700/40 dark:bg-slate-950/65 sm:px-6 lg:px-8">
        
        {/* Top Header Action Buttons Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display uppercase tracking-wide">
              {activeTab === 'services' && (lang === 'en' ? 'KAWING Partner Hub' : 'KAWING Partner Hub')}
              {activeTab === 'harvests' && (lang === 'en' ? 'My Harvest Posts' : 'Aking Mga Na-Post na Ani')}
              {activeTab === 'buyers' && (lang === 'en' ? 'Find a Buyer' : 'Maghanap ng Buyer')}
              {activeTab === 'interests' && (lang === 'en' ? "Buyer's Offers & Rankings" : 'Mga Offers at Presyo ng Buyer')}
              {activeTab === 'announcements' && (lang === 'en' ? 'Updates & System Announcements' : 'Mga Anunsyo at Update')}
              {activeTab === 'loans' && (lang === 'en' ? 'Production Loan Financing' : 'Pautang sa Pagtatanim ng Palay')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeTab === 'services' && (lang === 'en' ? 'Find trusted buyers and book verified farm services in one place.' : 'Maghanap ng mapagkakatiwalaang buyer at mag-book ng verified na serbisyo sa iisang lugar.')}
              {activeTab === 'harvests' && (lang === 'en' ? 'Manage your palay listings and sale status.' : 'Pamahalaan ang iyong mga na-post na palay para sa mga buyer.')}
              {activeTab === 'buyers' && (lang === 'en' ? 'Browse verified buyers who may purchase your harvested grain.' : 'Tingnan ang mga verified buyer na maaaring bumili ng iyong inaning palay.')}
              {activeTab === 'interests' && (lang === 'en' ? 'Review buyer offers and select the best price.' : 'Suriin ang mga alok na presyo mula sa mga buyer.')}
              {activeTab === 'announcements' && (lang === 'en' ? 'DA reference benchmarks and system notifications.' : 'Mga opisyal na presyo ng DA at abiso sa sistema.')}
              {activeTab === 'loans' && (lang === 'en' ? 'Request and track rice production loans from verified Buyers & Traders.' : 'Mag-apply at subaybayan ang pautang sa pagtatanim mula sa mga verified Buyer.')}
            </p>
          </div>

          <div className="flex flex-col min-[390px]:flex-row items-stretch min-[390px]:items-center gap-2.5 self-stretch sm:self-auto">
            <AnimatedButton
              onClick={handleOpenRequestServiceModal}
              variant="outline"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl !border-amber-400 !bg-amber-400 !text-slate-950 hover:!border-amber-300 hover:!bg-amber-300 shadow-md shadow-amber-500/20"
            >
              <Truck className="w-4 h-4" />
              {lang === 'en' ? 'Request Service' : 'Humiling ng Serbisyo'}
            </AnimatedButton>

            <AnimatedButton
              onClick={() => handleOpenPostHarvestModal()}
              variant="primary"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              {lang === 'en' ? 'Post Harvest' : 'Mag-Post ng Ani'}
            </AnimatedButton>
          </div>
        </div>

        {/* Content Panels */}
        <div className="space-y-6">
          {activeTab === 'loans' && (
            <ProductionLoanFarmer
              user={user}
              registeredUsers={registeredUsers}
              loanRequests={productionLoans}
              onSubmitLoanRequest={(req) => onSubmitLoanRequest && onSubmitLoanRequest(req)}
              onCancelLoanRequest={(id) => onCancelLoanRequest && onCancelLoanRequest(id)}
            />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementsBoard 
              marketReferencePrice={marketReferencePrice}
              user={user}
              notifications={notifications}
              onMarkNotificationRead={onMarkNotificationRead}
              onClearAllNotifications={onClearAllNotifications}
              onNavigateToFeature={(tabId) => setActiveTab(tabId as any)}
            />
          )}

          {activeTab === 'services' && (
            <section className="space-y-5">
              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white dark:bg-slate-900 p-4 shadow-lg">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap gap-3">
                    {([
                      ['all', lang === 'en' ? 'All Partners' : 'Lahat'],
                      ['buyer', lang === 'en' ? 'Buyers' : 'Mga Buyer'],
                      ['transport', ' Trucking'],
                      ['storage', ' Storage'],
                      ['drying', ' Drying'],
                      ['milling', ' Milling'],
                    ] as const).map(([filter, label]) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setPartnerFilter(filter)}
                        className={`rounded-xl px-5 py-3 text-base font-extrabold transition-colors ${partnerFilter === filter ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                      >
                        <span className="inline-flex items-center gap-2">
                          {filter !== 'all' && filter !== 'buyer' && React.createElement(({ transport: IconTruck, storage: IconPackage, drying: IconWind, milling: IconWheat })[filter], { size: 20, stroke: 2, className: 'inline-block shrink-0', 'aria-hidden': true })}
                          <span>{label.trim()}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <label className="relative block w-full xl:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={partnerSearch}
                      onChange={(event) => setPartnerSearch(event.target.value)}
                      placeholder={lang === 'en' ? 'Search buyers or services...' : 'Maghanap ng buyer o serbisyo...'}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
                  {lang === 'en' ? 'Available Partners' : 'Mga Available na Partner'}
                </h2>
                <span className="text-xs font-bold text-slate-500">{visiblePartnerEntries.length} available</span>
              </div>

              {visiblePartnerEntries.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-16 text-center text-sm text-slate-400">
                  {lang === 'en' ? 'No matching buyers or service providers are available yet.' : 'Wala pang available na buyer o service provider sa napiling filter.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {visiblePartnerEntries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => entry.kind === 'buyer'
                        ? setSelectedBuyerModal(entry.user)
                        : setSelectedOperatorModal({ ...entry.user, role: entry.serviceRole! })}
                      className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 px-5 py-4 text-left shadow-sm transition-all hover:border-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-xl group-hover:bg-emerald-950">{entry.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <strong className="truncate text-sm text-slate-900 dark:text-white">{entry.user.businessName || entry.user.name}</strong>
                          <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400">{entry.label}</span>
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{entry.user.address || 'Location available in details'}</span>
                          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400"><Star className="h-3.5 w-3.5 fill-current" />{entry.user.rating?.toFixed(1) || 'New'}</span>
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-extrabold text-emerald-400">{lang === 'en' ? 'View details' : 'Tingnan'}<span className="inline-flex items-center gap-1.5 align-middle ml-1.5"><IconArrowRight size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

        {/* Kawing Logistics & Processing Directory */}
        {activeTab === 'directory' && (
        <div className="mb-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
          {/* Header Bar */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/55">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className="absolute flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
              </div>
              <div className="pl-6">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white font-display uppercase tracking-wider flex items-center gap-2">
                  <span>{lang === 'en' ? 'Available Logistics & Processing Services' : 'Mga Magagamit na Serbisyo at Logistics'}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  {lang === 'en' ? 'Directory count of verified trucking, storage, drying, and milling providers.' : 'Bilang ng mga beripikadong trucking, storage, drying, at milling provider.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDirDetails(!showDirDetails)}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl cursor-pointer shadow-sm self-end sm:self-auto"
            >
              <span>{showDirDetails ? (lang === 'en' ? 'Hide Details' : 'Itago') : (lang === 'en' ? 'Show Details' : 'Ipakita')}</span>
              {showDirDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Quick Stats Grid */}
          {(() => {
            const approvedUsers = registeredUsers || [];
            const providersFor = (service: 'transport' | 'storage' | 'drying' | 'milling', legacyRole: 'truck' | 'storage' | 'dryer' | 'miller') =>
              approvedUsers
                .filter(u => hasApprovedBusinessCapability(u, service))
                // Preserve the service being browsed so the existing request form opens
                // with the correct transport/storage/drying/milling selection.
                .map(u => ({ ...u, role: legacyRole }));
            const liveTrucks = providersFor('transport', 'truck');
            const liveStorage = providersFor('storage', 'storage');
            const liveDryers = providersFor('drying', 'dryer');
            const liveMillers = providersFor('milling', 'miller');

            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-100 dark:border-slate-800 divide-x divide-slate-100 dark:divide-slate-800">
                  <button
                    disabled={liveTrucks.length === 0}
                    onClick={() => {
                      setSelectedServiceDir(selectedServiceDir === 'truck' ? 'all' : 'truck');
                      setShowDirDetails(true);
                    }}
                    className={`p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-slate-50/50 dark:enabled:hover:bg-slate-800/20 cursor-pointer ${selectedServiceDir === 'truck' ? 'bg-blue-50/40 dark:bg-blue-950/10 border-b-2 border-blue-500' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 dark:text-slate-500 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-blue-600 dark:text-blue-400">
                        <Truck className="w-5 h-5" />
                      </span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${liveTrucks.length > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'}`}>
                        {liveTrucks.length > 0 ? 'VERIFIED' : 'NONE'}
                      </span>
                    </div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white block font-display">{liveTrucks.length}</span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Trucks & Haulers' : 'Mga Truck'}</span>
                  </button>

                  <button
                    disabled={liveStorage.length === 0}
                    onClick={() => {
                      setSelectedServiceDir(selectedServiceDir === 'storage' ? 'all' : 'storage');
                      setShowDirDetails(true);
                    }}
                    className={`p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-slate-50/50 dark:enabled:hover:bg-slate-800/20 cursor-pointer ${selectedServiceDir === 'storage' ? 'bg-purple-50/40 dark:bg-purple-950/10 border-b-2 border-purple-500' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 dark:text-slate-500 p-2 bg-purple-50 dark:bg-purple-950/20 rounded-xl text-purple-600 dark:text-purple-400">
                        <HardDrive className="w-5 h-5" />
                      </span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${liveStorage.length > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'}`}>
                        {liveStorage.length > 0 ? 'VERIFIED' : 'NONE'}
                      </span>
                    </div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white block font-display">{liveStorage.length}</span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Storage Spaces' : 'Mga Imbakan'}</span>
                  </button>

                  <button
                    disabled={liveDryers.length === 0}
                    onClick={() => {
                      setSelectedServiceDir(selectedServiceDir === 'dryer' ? 'all' : 'dryer');
                      setShowDirDetails(true);
                    }}
                    className={`p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-slate-50/50 dark:enabled:hover:bg-slate-800/20 cursor-pointer ${selectedServiceDir === 'dryer' ? 'bg-amber-50/40 dark:bg-amber-950/10 border-b-2 border-amber-500' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 dark:text-slate-500 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-xl text-amber-600 dark:text-amber-400">
                        <Wind className="w-5 h-5" />
                      </span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${liveDryers.length > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'}`}>
                        {liveDryers.length > 0 ? 'VERIFIED' : 'NONE'}
                      </span>
                    </div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white block font-display">{liveDryers.length}</span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Drying Facilities' : 'Mga Patuyuan'}</span>
                  </button>

                  <button
                    disabled={liveMillers.length === 0}
                    onClick={() => {
                      setSelectedServiceDir(selectedServiceDir === 'miller' ? 'all' : 'miller');
                      setShowDirDetails(true);
                    }}
                    className={`p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-slate-50/50 dark:enabled:hover:bg-slate-800/20 cursor-pointer ${selectedServiceDir === 'miller' ? 'bg-teal-50/40 dark:bg-teal-950/10 border-b-2 border-teal-500' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 dark:text-slate-500 p-2 bg-teal-50 dark:bg-teal-950/20 rounded-xl text-teal-600 dark:text-teal-400">
                        <RefreshCw className="w-5 h-5 animate-spin-slow" />
                      </span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${liveMillers.length > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'}`}>
                        {liveMillers.length > 0 ? 'VERIFIED' : 'NONE'}
                      </span>
                    </div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white block font-display">{liveMillers.length}</span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Rice Millers' : 'Mga Gilingan'}</span>
                  </button>
                </div>

                {/* Directory Details Panel */}
                {showDirDetails && (
                  <div className="p-6 bg-slate-50/30 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <CircleDot className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        {selectedServiceDir === 'all' && (lang === 'en' ? 'Showing All Verified Providers' : 'Ipinapakita ang Lahat ng Beripikadong Provider')}
                        {selectedServiceDir === 'truck' && (lang === 'en' ? 'Showing Available Trucks & Logistics' : 'Ipinapakita ang mga Truck at Logistics')}
                        {selectedServiceDir === 'storage' && (lang === 'en' ? 'Showing Available Storage Spaces' : 'Ipinapakita ang mga Bodega at Imbakan')}
                        {selectedServiceDir === 'dryer' && (lang === 'en' ? 'Showing Available Drying Facilities' : 'Ipinapakita ang mga Patuyuan')}
                        {selectedServiceDir === 'miller' && (lang === 'en' ? 'Showing Available Rice Millers' : 'Ipinapakita ang mga Gilingan')}
                      </h3>
                      {selectedServiceDir !== 'all' && (
                        <button
                          onClick={() => setSelectedServiceDir('all')}
                          className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                        >
                          {lang === 'en' ? 'Clear Filter' : 'Tanggalin Filter'}
                        </button>
                      )}
                    </div>

                    {(() => {
                      const displayedOperators = (() => {
                        switch(selectedServiceDir) {
                          case 'truck': return liveTrucks;
                          case 'storage': return liveStorage;
                          case 'dryer': return liveDryers;
                          case 'miller': return liveMillers;
                          default: return [...liveTrucks, ...liveStorage, ...liveDryers, ...liveMillers];
                        }
                      })();

                      if (displayedOperators.length === 0) {
                        return (
                          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              {lang === 'en' ? 'No verified providers found' : 'Walang nakitang beripikadong provider'}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                              {lang === 'en' ? 'Approved providers for this service will appear in this directory.' : 'Lalabas dito ang mga aprubadong provider para sa serbisyong ito.'}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {displayedOperators.map((operator, i) => (
                            <div
                              key={operator.email || i}
                              onClick={() => setSelectedOperatorModal(operator)}
                              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm hover:border-blue-400 dark:hover:border-blue-500/80 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group active:scale-[0.99] relative"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                                    operator.role === 'truck' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' :
                                    operator.role === 'storage' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400' :
                                    operator.role === 'dryer' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' :
                                    'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400'
                                  }`}>
                                    {operator.role === 'truck' ? (lang === 'en' ? 'Hauler / Truck' : 'Maaarkilang Truck') :
                                     operator.role === 'storage' ? (lang === 'en' ? 'Storage Facility' : 'Imbakan') :
                                     operator.role === 'dryer' ? (lang === 'en' ? 'Mechanical Dryer' : 'Patuyuan') :
                                     (lang === 'en' ? 'Rice Miller' : 'Gilingan ng Bigas')}
                                  </span>
                                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">
                                    <Star className="w-3 h-3 fill-current" />
                                    <span>{(operator.rating || 4.8).toFixed(1)}</span>
                                  </div>
                                </div>

                                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 font-display mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-between">
                                  <span>{operator.name}</span>
                                  <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"><span className="inline-flex items-center gap-1.5 align-middle"><IconArrowUpRight size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></span>
                                </h4>
                                
                                {operator.address && (
                                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                    <span className="truncate">{operator.address}</span>
                                  </div>
                                )}

                                {operator.contactNumber && (
                                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                                    <Phone className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                                    <span>{operator.contactNumber}</span>
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  {lang === 'en' ? 'Available' : 'Maaaring Kuhanin'}
                                </span>
                                
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOperatorModal(operator);
                                  }}
                                  className="text-[10px] font-extrabold uppercase bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
                                >
                                  {lang === 'en' ? 'View Details' : 'Tignan Detalye'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            );
          })()}
        </div>
        )}

        {/* Posted Buyer & Operator Services Section */}
        {activeTab === 'directory' && (
          <div className="mb-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-display uppercase tracking-wider">
                    {lang === 'en' ? 'Posted Truck & Logistics Services by Buyers & Partners' : 'Mga Inalok na Byahe at Truck ng Buyer at Byahero'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === 'en' ? 'Direct trucks and pickup services posted by buyers for local farmers.' : 'Direktang mga truck at pickup service na inalok ng mga buyer para sa mga magsasaka.'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full shrink-0">
                {(offeredServices || []).filter(s => s.isAvailable !== false).length} {lang === 'en' ? 'Available Services Offered' : 'Mga Serbisyong Available'}
              </span>
            </div>

            {(() => {
              const activeOffers = (offeredServices || []).filter(s => s.isAvailable !== false);
              if (activeOffers.length === 0) {
                return (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-4">
                    {lang === 'en' ? 'No posted buyer truck services available at this moment.' : 'Walang nakapost na serbisyo mula sa mga buyer sa ngayon.'}
                  </p>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {activeOffers.map((service) => (
                    <div
                      key={service.id}
                      className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 uppercase tracking-wider">
                            {service.providerRole === 'buyer' ? (lang === 'en' ? 'Buyer Pickup Truck' : 'Sundo ng Buyer') : (lang === 'en' ? 'Hauler Service' : 'Serbisyo sa Hakot')}
                          </span>
                          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {lang === 'en' ? 'Available' : 'Maaaring Kuhanin'}
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white font-display mb-0.5">
                          {service.title}
                        </h4>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-3">
                          {service.companyName || service.providerName}
                        </p>

                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          {service.truckType && (
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-medium">{lang === 'en' ? 'Truck' : 'Sasakyan'}:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{service.truckType}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">{lang === 'en' ? 'Capacity' : 'Kapasidad'}:</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{service.capacity}</span>
                          </div>
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-slate-400 font-medium shrink-0">{lang === 'en' ? 'Area' : 'Lugar'}:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{service.locationCoverage}</span>
                          </div>
                          {service.rateInfo && (
                            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-start gap-1">
                              <span className="text-slate-400 font-medium shrink-0">{lang === 'en' ? 'Rates' : 'Bayad'}:</span>
                              <span className="font-bold text-cyan-600 dark:text-cyan-400 text-right">{service.rateInfo}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{service.providerPhone || '0917-555-0100'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenRequestServiceModal()}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>{lang === 'en' ? 'Book Truck' : 'I-book ang Truck'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}


          {activeTab === 'buyers' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-cyan-200 dark:border-cyan-900 bg-cyan-50/80 dark:bg-cyan-950/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white">
                    {lang === 'en' ? 'Connect Your Harvest With a Buyer' : 'Ikonekta ang Iyong Ani sa Buyer'}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {lang === 'en'
                      ? 'Browse verified buyers below, then post your harvested grain so they can send you a price offer.'
                      : 'Pumili ng verified buyer at i-post ang ani para makatanggap ng alok.'}
                  </p>
                </div>
                <AnimatedButton
                  onClick={() => handleOpenPostHarvestModal()}
                  className="shrink-0 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {lang === 'en' ? 'Post Harvest for Buyers' : 'I-post ang Ani para sa Buyers'}
                </AnimatedButton>
              </div>

              {verifiedBuyers.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 text-center py-14 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-4xl mb-3"><span className="inline-flex items-center gap-1.5 align-middle"><IconHeartHandshake size={32} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">
                    {lang === 'en' ? 'No verified buyers available yet' : 'Wala pang available na verified buyer'}
                  </h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {verifiedBuyers.map(buyer => (
                    <button type="button" onClick={() => setSelectedBuyerModal(buyer)} key={buyer.email || buyer.name} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm text-left hover:border-emerald-400 hover:-translate-y-0.5 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-black text-lg shrink-0">
                          {buyer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-slate-900 dark:text-white truncate">{buyer.businessName || buyer.name}</h3>
                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          </div>
                          {buyer.businessName && <p className="text-xs text-slate-500 dark:text-slate-400">{buyer.name}</p>}
                          <div className="mt-1 flex items-center gap-1 text-xs text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-current" /> {buyer.rating?.toFixed(1) || 'New'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                        <p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-cyan-500 shrink-0" />{buyer.address || (lang === 'en' ? 'Service location not specified' : 'Walang nakasaad na lokasyon')}</p>
                      </div>

                      <span className="mt-4 block w-full px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold text-center">
                        {lang === 'en' ? 'View Buyer Details' : 'Tingnan ang Buyer'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'harvests' ? (
            <div>
              {myHarvests.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 text-center py-16 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{lang === 'en' ? 'No Posted Harvests' : 'Walang Nakapost na Ani'}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {lang === 'en' ? 'Click "Post Harvest" to list your palay with photos and moisture level for buyers!' : 'Pindutin ang "Mag-Post ng Ani" upang mag-post ng palay kasama ang larawan at moisture level para sa mga buyer!'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myHarvests.map((h) => {
                    const riskInfo = getSpoilageIndicator(h.spoilageRisk);
                    return (
                        <button
                          type="button"
                          key={h.id}
                          onClick={() => openHarvestManager(h)}
                          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col hover:border-emerald-400 dark:hover:border-emerald-500 hover:-translate-y-0.5 transition-all duration-300 relative text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label={`Manage ${h.cropType}`}
                        >
                        {/* Optional photo thumbnail if uploaded */}
                        {h.photoUrl && (
                          <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <img 
                              src={h.photoUrl} 
                              alt={h.cropType} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {h.moistureLevel && (
                              <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md text-emerald-400 text-xs font-black px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1 shadow"><span className="inline-flex items-center gap-1.5 align-middle"><IconDroplet size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Moisture:"}</span>{h.moistureLevel}
                              </div>
                            )}
                            <div className="absolute top-3 right-3">
                              <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold border uppercase shadow ${getStatusBadge(h.status)}`}>
                                {h.status === 'posted' ? t('status_posted') : h.status === 'in_progress' ? t('status_in_progress') : t('status_completed')}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="p-6 flex-grow">
                          {!h.photoUrl && (
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                                  {t('label_product')}
                                </span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2 font-display">
                                  {h.cropType}
                                </h3>
                              </div>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getStatusBadge(h.status)}`}>
                                {h.status === 'posted' ? t('status_posted') : h.status === 'in_progress' ? t('status_in_progress') : t('status_completed')}
                              </span>
                            </div>
                          )}

                          {h.photoUrl && (
                            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white font-display mb-3">
                              {h.cropType}
                            </h3>
                          )}

                          <div className="space-y-2.5 mb-6 text-sm text-slate-600 dark:text-slate-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-slate-400" />
                                <span className="font-bold text-slate-800 dark:text-slate-100">{h.quantity} {h.unit}</span>
                              </div>
                              {h.targetPrice && (
                                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded">
                                   {h.sellingMethod === 'bidding' ? <span className="inline-flex items-center gap-1.5 align-middle"><IconHammer size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Starting Bid"}</span> : <span className="inline-flex items-center gap-1.5 align-middle"><IconCash size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Asking Price"}</span>}: ₱{h.targetPrice}/{h.priceUnit || 'kg'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span>{t('harvest_date')} {h.harvestDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span className="truncate">{h.location}</span>
                            </div>
                          </div>

                          {/* Spoilage Risk Gauge */}
                          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                            <div className="flex justify-between items-center mb-1 text-xs">
                              <span className="text-slate-500 dark:text-slate-400 font-semibold">{t('urgency_label')}:</span>
                              <span className={`px-2 py-0.5 rounded font-bold border text-[10px] uppercase ${getUrgencyClass(h.urgency)}`}>
                                {h.urgency === 'high' ? 'High' : h.urgency === 'medium' ? 'Medium' : 'Low'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${riskInfo.bg}`} />
                              <span className={`text-xs font-bold ${riskInfo.color}`}>{riskInfo.text}</span>
                            </div>
                          </div>
                        </div>
                          <span className="px-6 pb-5 text-xs font-bold text-emerald-600 dark:text-emerald-400"><span className="inline-flex items-center gap-1.5 align-middle">{"View details and manage"}<IconArrowRight size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === 'directory' ? (
            <div className="space-y-6">
              {/* Category sub-tabs without buyer */}
              <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl w-fit border border-slate-200/50 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setServiceCategory('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    serviceCategory === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                  }`}
                ><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconWorld size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'All Requests' : 'Lahat ng Hiling'} ({myServices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setServiceCategory('transport')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    serviceCategory === 'transport'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                  }`}
                ><span className="inline-flex items-center gap-1.5 align-middle"><IconTruck size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Transport' : 'Transportasyon'} ({myServices.filter(s => s.type === 'transport').length})
                </button>
                <button
                  type="button"
                  onClick={() => setServiceCategory('storage')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    serviceCategory === 'storage'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                  }`}
                ><span className="inline-flex items-center gap-1.5 align-middle"><IconPackage size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Cold Storage' : 'Cold Storage'} ({myServices.filter(s => s.type === 'storage').length})
                </button>
                <button
                  type="button"
                  onClick={() => setServiceCategory('drying')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    serviceCategory === 'drying'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                  }`}
                ><span className="inline-flex items-center gap-1.5 align-middle"><IconWind size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Drying' : 'Patuyuan'} ({myServices.filter(s => s.type === 'drying').length})
                </button>
                <button
                  type="button"
                  onClick={() => setServiceCategory('milling')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    serviceCategory === 'milling'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                  }`}
                ><span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Milling' : 'Gilingan'} ({myServices.filter(s => s.type === 'milling').length})
                </button>
              </div>

              {/* List */}
              {filteredMyServices.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 text-center py-16 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    {serviceCategory === 'transport' ? <span className="inline-flex items-center gap-1.5 align-middle"><IconTruck size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span> : serviceCategory === 'storage' ? <span className="inline-flex items-center gap-1.5 align-middle"><IconPackage size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span> : serviceCategory === 'drying' ? <span className="inline-flex items-center gap-1.5 align-middle"><IconWind size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span> : serviceCategory === 'milling' ? <span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span> : <span className="inline-flex items-center gap-1.5 align-middle"><IconFolderOpen size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {serviceCategory === 'all' 
                      ? t('empty_services') 
                      : lang === 'en' ? 'No Request Found' : 'Walang nahanap na hiling'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {lang === 'en' ? 'Use the "Request Service" button to order transport, drying, or cold storage.' : 'Gamitin ang "Humiling ng Serbisyo" button para mag-order ng truck, patuyuan, o cold storage.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMyServices.map((s) => (
                    <div
                      key={s.id}
                      className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                          s.type === 'transport' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400' :
                          s.type === 'storage' ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400' :
                          s.type === 'drying' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400' :
                          'bg-emerald-50 dark:bg-emerald-100/10 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {s.type === 'transport' ? <span className="inline-flex items-center gap-1.5 align-middle"><IconTruck size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span> : s.type === 'storage' ? <span className="inline-flex items-center gap-1.5 align-middle"><IconPackage size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span> : s.type === 'drying' ? <span className="inline-flex items-center gap-1.5 align-middle"><IconWind size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span> : <span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 dark:text-white capitalize font-display">
                              {s.type === 'transport' 
                                ? (lang === 'en' ? <span className="inline-flex items-center gap-1.5 align-middle"><IconTruck size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Transport Request"}</span> : <span className="inline-flex items-center gap-1.5 align-middle"><IconTruck size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Hiling sa Transportasyon"}</span>) 
                                : s.type === 'storage' 
                                  ? (lang === 'en' ? <span className="inline-flex items-center gap-1.5 align-middle"><IconPackage size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Cold Storage Request"}</span> : <span className="inline-flex items-center gap-1.5 align-middle"><IconPackage size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Hiling sa Cold Storage"}</span>) 
                                  : s.type === 'drying'
                                    ? (lang === 'en' ? <span className="inline-flex items-center gap-1.5 align-middle"><IconWind size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Drying Queue Request"}</span> : <span className="inline-flex items-center gap-1.5 align-middle"><IconWind size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Hiling sa Patuyuan"}</span>)
                                    : (lang === 'en' ? <span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Milling Service Request"}</span> : <span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Hiling sa Gilingan"}</span>)}
                            </h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              s.status === 'pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' :
                              s.status === 'matched' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' :
                              s.status === 'rejected' ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' :
                              'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            }`}>
                              {s.status === 'pending' ? (lang === 'en' ? 'Awaiting Operator' : 'Naghihintay') :
                               s.status === 'matched' ? (lang === 'en' ? 'Matched' : 'Naitugma na (Matched)') :
                               s.status === 'rejected' ? (lang === 'en' ? 'Declined' : 'Tinanggihan') :
                               (lang === 'en' ? 'Completed' : 'Nakumpleto')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {lang === 'en' ? 'For crop:' : 'Para sa ani na:'} <strong className="text-slate-700 dark:text-slate-200">{s.cropType} ({s.quantity} {s.unit})</strong> • {s.location}
                          </p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs text-slate-500 dark:text-slate-400 block">{lang === 'en' ? 'Request Date' : 'Petsa ng Hiling'}</span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{s.createdAt}</span>
                        {s.operatorName && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                            Operator: {s.operatorName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'interests' ? (
            /* RANKING SYSTEM FOR BUYER OFFERS */
            <div className="space-y-6">
              {myIncomingOffers.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 text-center py-16 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconCoin size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'en' ? 'No Buyer Offers Yet' : 'Wala Pang Offer Mula sa mga Buyer'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {lang === 'en' 
                      ? "Buyer offers appear here, ranked from highest price." 
                      : "Lalabas dito ang buyer offers, mula sa pinakamataas na presyo."}
                  </p>
                </div>
              ) : (
                /* SORT OFFERS BY HIGHEST PRICE (RANKINGS) */
                (() => {
                  const sortedOffers = [...myIncomingOffers].sort((a, b) => (b.offerPrice || 0) - (a.offerPrice || 0));

                  return (
                    <div className="space-y-6">
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconTrophy size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></span>
                          <div>
                            <h4 className="text-sm font-black text-emerald-950 dark:text-emerald-200 uppercase tracking-wider font-display">
                              {lang === 'en' ? 'Buyer Offer Rankings (Sorted by Highest Price)' : 'Rankings ng mga Presyo ng Buyer (Pinakamataas Unang Nakalista)'}
                            </h4>
                            <p className="text-xs text-emerald-800 dark:text-emerald-300">
                              {lang === 'en' 
                                ? 'Piliin ang pinakamataas na offer. Kapag nakapili ka na, masusubaybayan ang transaksyon dito sa KAWING!' 
                                : 'Pumili sa mga offer sa ibaba. Pagkatapos pumili, masusubaybayan ang transaksyon dito sa KAWING.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sortedOffers.map((o, index) => {
                          const isTopRank = index === 0;
                          const rankBadge = index === 0 ? ' #1 HIGHEST OFFER' : index === 1 ? ' #2 RANK' : index === 2 ? ' #3 RANK' : `#${index + 1} RANK`;
                          const rankColor = index === 0 
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20 font-black' 
                            : index === 1 
                            ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100 font-extrabold' 
                            : 'bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold';

                          return (
                            <motion.div
                              key={o.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all duration-300 relative border ${
                                isTopRank 
                                  ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/30 dark:ring-amber-500/20' 
                                  : 'border-slate-100 dark:border-slate-800'
                              }`}
                            >
                              <div>
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-[11px] px-3 py-1 rounded-full uppercase tracking-wider ${rankColor}`}>
                                        <span className="inline-flex items-center gap-1.5">{index < 3 && <IconMedal size={16} stroke={2} aria-hidden="true" className={`inline-block shrink-0 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-400' : 'text-amber-700'}`} />}{rankBadge.trim()}</span>
                                      </span>
                                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-full"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconWheat size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{o.cropType}
                                      </span>
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 dark:text-white mt-2 font-display">
                                      {o.quantity} {o.unit}
                                    </h4>
                                  </div>
                                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                                    o.status === 'pending' 
                                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50' 
                                      : o.status === 'accepted'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
                                      : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50'
                                  }`}>
                                    {o.status === 'pending' 
                                      ? (lang === 'en' ? 'Awaiting Farmer Selection' : 'Naghihintay ng Pagpili')
                                      : o.status === 'accepted'
                                      ? (lang === 'en' ? 'ACCEPTED DEAL' : <span className="inline-flex items-center gap-1.5 align-middle">{"NAPILING OFFER"}<IconCircleCheck size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>)
                                      : (lang === 'en' ? 'Declined' : 'Hindi Napili')}
                                  </span>
                                </div>

                                {/* PRICE OFFER HIGHLIGHT */}
                                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-3 mb-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                      {lang === 'en' ? 'Offered Price:' : 'Inalok na Presyo:'}
                                    </span>
                                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display">
                                      ₱{(o.offerPrice || 0).toFixed(2)} <span className="text-xs text-slate-500 font-normal">{o.priceUnit || 'per kg'}</span>
                                    </span>
                                  </div>
                                  
                                  {o.totalAmount && (
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                                      <span className="text-slate-500 font-semibold">{lang === 'en' ? 'Estimated Total:' : 'Kabuuan Halaga:'}</span>
                                      <span className="font-extrabold text-slate-900 dark:text-white">₱{o.totalAmount.toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Buyer Info */}
                                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-4">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">{lang === 'en' ? 'Buyer Name:' : 'Pangalan ng Buyer:'}</span>
                                    <strong className="text-slate-900 dark:text-white">{o.buyerName}</strong>
                                  </div>
                                  {o.buyerAddress && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">{lang === 'en' ? 'Trading Hub/Location:' : 'Lokasyon:'}</span>
                                      <span className="font-medium text-slate-700 dark:text-slate-300">{o.buyerAddress}</span>
                                    </div>
                                  )}
                                  {o.notes && (
                                    <div className="p-2.5 bg-amber-500/5 rounded-lg border border-amber-500/10 text-[11px] italic text-amber-800 dark:text-amber-300">
                                      "{o.notes}"
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* REVEAL BUYER CONTACT ON SELECTION */}
                              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                                {o.status === 'pending' ? (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => { if (window.confirm(lang === 'en' ? `Decline the offer from ${o.buyerName}?` : `Tanggihan ang offer mula kay ${o.buyerName}?`)) onRejectOffer(o.id); }}
                                      className="py-2.5 px-3 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/10 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                                    >
                                      <X className="w-4 h-4" />
                                      {lang === 'en' ? 'Decline' : 'Tanggihan'}
                                    </button>
                                    <button
                                      onClick={() => setOfferToAccept(o)}
                                      className={`flex-1 py-2.5 px-3 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md ${
                                        isTopRank
                                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/10'
                                      }`}
                                    >
                                      <Check className="w-4 h-4" />
                                      {lang === 'en' ? 'Piliin ang Offer na Ito' : 'Piliin ang Offer na Ito'}
                                    </button>
                                  </div>
                                ) : o.status === 'accepted' ? (
                                  <div className="space-y-3 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                    <div className="p-2 bg-emerald-600 text-white rounded-lg text-center font-bold text-xs"><span className="inline-flex items-center gap-1.5 align-middle"><IconConfetti size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Congratulations! This offer is accepted. Continue tracking the transaction in KAWING."}</span></div>
                                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                      <span>{o.buyerCompanyName || o.buyerName}</span>
                                      <span className="text-[10px] text-emerald-600 uppercase font-bold">Verified Buyer</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-1"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconCircleX size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Other offer was selected for this harvest.' : 'Ibang offer ang napili para sa ani na ito.'}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          ) : null}
        </div>
      </main>
      </div>

      {/* HARVEST DETAILS AND MANAGEMENT */}
      {selectedHarvestPost && harvestEditDraft && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-sm"

        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="kawing-readable-modal flex max-h-[calc(100dvh-1rem)] md:max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-900 to-emerald-700 px-5 py-4 sm:px-7">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-200">My Harvest Post</p>
                <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">{selectedHarvestPost.cropType}</h2>
                <p className="mt-1 text-xs text-emerald-100">View the complete listing or update its information.</p>
              </div>
              <button type="button" onClick={closeHarvestManager} className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close harvest details">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-7">
              {isEditingHarvestPost ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rice Variety *
                    <input value={harvestEditDraft.riceVariety || ''} onChange={e => setHarvestEditDraft({ ...harvestEditDraft, riceVariety: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500" />
                  </label>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Harvest Date *
                    <input type="date" value={harvestEditDraft.harvestDate} onChange={e => setHarvestEditDraft({ ...harvestEditDraft, harvestDate: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500" />
                  </label>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Weight (kg) *
                    <input type="number" min="1" value={harvestEditDraft.estimatedWeightKg || harvestEditDraft.quantity} onChange={e => setHarvestEditDraft({ ...harvestEditDraft, estimatedWeightKg: Number(e.target.value), quantity: Number(e.target.value) })} className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500" />
                  </label>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Price per kg (₱) *
                    <input type="number" min="1" step="0.01" value={harvestEditDraft.targetPrice || ''} onChange={e => setHarvestEditDraft({ ...harvestEditDraft, targetPrice: Number(e.target.value) })} className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500" />
                  </label>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Selling Method
                    <select value={harvestEditDraft.sellingMethod || 'fixed_price'} onChange={e => setHarvestEditDraft({ ...harvestEditDraft, sellingMethod: e.target.value as Harvest['sellingMethod'] })} className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500">
                      <option value="fixed_price">Fixed Asking Price</option>
                      {!harvestEditDraft.targetBuyerEmail && <option value="bidding">Open for Bidding</option>}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Moisture Content (PalaySense)
                    <div className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2.5 text-sm font-bold text-blue-300">
                      {harvestEditDraft.moistureLevel || 'No PalaySense reading'}
                    </div>
                  </label>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Urgency
                    <select value={harvestEditDraft.urgency} onChange={e => setHarvestEditDraft({ ...harvestEditDraft, urgency: e.target.value as Harvest['urgency'] })} className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500">
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pickup / Farm Location
                    <input value={harvestEditDraft.location || ''} onChange={e => setHarvestEditDraft({ ...harvestEditDraft, location: e.target.value, pickupLocation: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500" />
                  </label>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 sm:col-span-2">Description / Additional Notes
                    <textarea rows={3} value={harvestEditDraft.notes || harvestEditDraft.remarks || ''} onChange={e => setHarvestEditDraft({ ...harvestEditDraft, notes: e.target.value, remarks: e.target.value })} className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500" />
                  </label>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ['Status', selectedHarvestPost.status.replace('_', ' ')],
                      ['Selling Method', selectedHarvestPost.sellingMethod === 'bidding' ? 'Open for Bidding' : 'Fixed Price'],
                      ['Total Weight', `${selectedHarvestPost.quantity.toLocaleString()} ${selectedHarvestPost.unit}`],
                      ['Moisture', selectedHarvestPost.moistureLevel || 'Not provided'],
                    ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"><p className="text-[10px] font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-sm font-extrabold capitalize text-slate-900 dark:text-slate-100">{value}</p></div>)}
                  </div>
                  <div className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-5 sm:grid-cols-2">
                    {[
                      ['Rice variety', selectedHarvestPost.riceVariety || selectedHarvestPost.cropType],
                      ['Harvest date', selectedHarvestPost.harvestDate],
                      ['Packaging', selectedHarvestPost.containerQuantity ? `${selectedHarvestPost.containerQuantity} ${selectedHarvestPost.containerType === 'plastic_bags' ? 'plastic bags' : 'sacks'} × ${selectedHarvestPost.estimatedKgPerContainer || 0} kg` : 'Not specified'],
                      ['Price', selectedHarvestPost.targetPrice ? `₱${selectedHarvestPost.targetPrice.toLocaleString()} per kg` : 'Not specified'],
                      ['Total value', selectedHarvestPost.totalPrice ? `₱${selectedHarvestPost.totalPrice.toLocaleString()}` : selectedHarvestPost.targetPrice ? `₱${(selectedHarvestPost.quantity * selectedHarvestPost.targetPrice).toLocaleString()}` : 'Not specified'],
                      ['Urgency / risk', `${selectedHarvestPost.urgency} / ${selectedHarvestPost.spoilageRisk} spoilage risk`],
                      ['Pickup / farm location', selectedHarvestPost.pickupLocation || selectedHarvestPost.location],
                      ['Destination', selectedHarvestPost.dropLocation || 'To be arranged with buyer'],
                      ['Preferred schedule', [selectedHarvestPost.preferredScheduleDate, selectedHarvestPost.preferredScheduleTime].filter(Boolean).join(' ') || 'Not specified'],
                      ['Market reference', selectedHarvestPost.marketRefPrice ? `₱${selectedHarvestPost.marketRefPrice}/kg` : 'Not specified'],
                    ].map(([label, value]) => <div key={label}><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</p></div>)}
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-5"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Description / Additional Notes</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">{selectedHarvestPost.notes || selectedHarvestPost.remarks || selectedHarvestPost.additionalNotes || 'No additional notes.'}</p></div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 sm:px-7">
              {confirmHarvestDelete ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-bold text-red-300">Delete this harvest post permanently?</p>
                  <div className="flex gap-2"><button type="button" onClick={() => setConfirmHarvestDelete(false)} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold">Cancel</button><button type="button" onClick={() => { onDeleteHarvests([selectedHarvestPost.id]); closeHarvestManager(); }} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500">Yes, Delete</button></div>
                </div>
              ) : isEditingHarvestPost ? (
                <div className="flex justify-end gap-2"><button type="button" onClick={() => { setHarvestEditDraft({ ...selectedHarvestPost }); setIsEditingHarvestPost(false); }} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-bold">Cancel</button><button type="button" onClick={saveHarvestChanges} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-500">Save Changes</button></div>
              ) : (
                <div className="flex items-center justify-between gap-3"><button type="button" onClick={() => setConfirmHarvestDelete(true)} className="flex items-center gap-2 rounded-xl border border-red-500/40 px-4 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /> Delete</button><button type="button" onClick={() => setIsEditingHarvestPost(true)} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-500">Edit Post</button></div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL 1: REQUEST SERVICE MODAL (LOGISTICS & PROCESSING) */}
      {showRequestServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="kawing-readable-modal bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl md:rounded-3xl w-full max-w-xl sm:max-w-[1440px] shadow-2xl overflow-hidden max-h-[calc(100dvh-1rem)] md:max-h-[96vh] flex flex-col my-auto"
          >
            <div className="px-5 py-3.5 flex items-center justify-between bg-blue-600 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-base sm:text-lg font-display">{lang === 'en' ? 'Request Service' : 'Request Service (Para sa Magsasaka)'}</h3>
                  <p className="text-[11px] text-blue-100">{lang === 'en' ? 'Request post-harvest logistics & equipment' : 'Mag-request ng transportasyon, patuyuan, imbakan, o gilingan'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRequestServiceModal(false)}
                className="text-white/80 hover:text-white font-bold text-lg cursor-pointer p-1"
                aria-label="Close service request"
              ><span className="inline-flex items-center gap-1.5 align-middle"><IconX size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></button>
            </div>
            
            <form onSubmit={handleRequestServiceSubmit} className="request-service-form min-h-0 p-4 sm:p-5 space-y-4 text-left overflow-y-auto flex-1 lg:grid lg:grid-cols-2 lg:items-start lg:content-start lg:gap-5 lg:space-y-0">
              {selectedServiceProvider && (
                <div className="lg:col-span-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-500/30 dark:bg-blue-500/10">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                    Direct booking request
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">
                    To: {selectedServiceProvider.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    This request and its notification will be sent only to this provider.
                  </p>
                </div>
              )}
              
              {/* Harvest Information */}
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-700/70 dark:bg-slate-900 space-y-4">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block"><span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Harvest Information"}</span></span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                      Rice Variety <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={reqRiceVariety}
                      onChange={(e) => setReqRiceVariety(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white"
                    >
                      <option value="">-- {lang === 'en' ? 'Select Rice Variety' : 'Pumili ng Uri ng Palay'} --</option>
                      <option value="NSIC Rc222">NSIC Rc222</option>
                      <option value="NSIC Rc160">NSIC Rc160</option>
                      <option value="Dinorado">Dinorado</option>
                      <option value="Jasmine">Jasmine</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                      Harvest Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={reqHarvestDate}
                      onChange={(e) => setReqHarvestDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                </div>

                {reqQuantityAccuracy === 'actual' ? (
                  <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">{lang === 'en' ? 'Packaging Type' : 'Uri ng Pakete'}</label>
                      <select
                        value={reqContainerType}
                        onChange={(e) => setReqContainerType(e.target.value as 'plastic_bags' | 'sacks')}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white"
                      >
                        <option value="plastic_bags">{lang === 'en' ? 'Plastic Bags' : 'Mga Plastic'}</option>
                        <option value="sacks">{lang === 'en' ? 'Sacks / Kaban' : 'Sako / Kaban'}</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                        {reqContainerType === 'sacks' ? (lang === 'en' ? 'Number of Sacks' : 'Bilang ng Sako/Kaban') : (lang === 'en' ? 'Number of Plastic Bags' : 'Bilang ng Plastic')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="e.g. 20"
                        value={reqContainerQuantity}
                        onChange={(e) => setReqContainerQuantity(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                        {reqContainerType === 'sacks' ? (lang === 'en' ? 'Measured kg per Sack/Kaban' : 'Sinukat na kg Bawat Sako/Kaban') : (lang === 'en' ? 'Measured kg per Plastic Bag' : 'Sinukat na kg Bawat Plastic')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        required
                        placeholder="e.g. 50"
                        value={reqEstimatedKgPerContainer}
                        onChange={(e) => setReqEstimatedKgPerContainer(e.target.value === '' ? '' : Math.max(0.1, parseFloat(e.target.value) || 0))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold"
                      />
                      {Number(reqContainerQuantity) > 0 && Number(reqEstimatedKgPerContainer) > 0 && (
                        <p className="pt-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          {lang === 'en' ? 'Total kg:' : 'Kabuuang kg:'} <span className="font-black">{requestLoadKg.toLocaleString()} kg</span>
                          <span className="block font-medium text-slate-500 dark:text-slate-400">
                            {Number(reqContainerQuantity).toLocaleString()} × {Number(reqEstimatedKgPerContainer).toLocaleString()} kg
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                        {lang === 'en' ? 'Packaging Type' : 'Uri ng Pakete'}
                      </label>
                      <select
                        value={reqContainerType}
                        onChange={(e) => setReqContainerType(e.target.value as 'plastic_bags' | 'sacks')}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white"
                      >
                        <option value="plastic_bags">{lang === 'en' ? 'Plastic Bags' : 'Mga Plastic'}</option>
                        <option value="sacks">{lang === 'en' ? 'Sacks / Kaban' : 'Sako / Kaban'}</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                        {reqContainerType === 'sacks'
                          ? (lang === 'en' ? 'Number of Sacks' : 'Bilang ng Sako/Kaban')
                          : (lang === 'en' ? 'Number of Plastic Bags' : 'Bilang ng Plastic')}{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="e.g. 20"
                        value={reqContainerQuantity}
                        onChange={(e) => setReqContainerQuantity(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                        {reqContainerType === 'sacks'
                          ? (lang === 'en' ? 'Measured kg per Sack/Kaban' : 'Sinukat na kg Bawat Sako/Kaban')
                          : (lang === 'en' ? 'Measured kg per Plastic Bag' : 'Sinukat na kg Bawat Plastic')}{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        required
                        placeholder="e.g. 50"
                        value={reqEstimatedKgPerContainer}
                        onChange={(e) => setReqEstimatedKgPerContainer(e.target.value === '' ? '' : Math.max(0.1, parseFloat(e.target.value) || 0))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold"
                      />
                      {Number(reqContainerQuantity) > 0 && Number(reqEstimatedKgPerContainer) > 0 && (
                        <p className="pt-1 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          {lang === 'en' ? 'Total kg:' : 'Kabuuang kg:'} <span className="font-black">{requestLoadKg.toLocaleString()} kg</span>
                          <span className="block font-medium text-slate-500 dark:text-slate-400">
                            {Number(reqContainerQuantity).toLocaleString()} × {Number(reqEstimatedKgPerContainer).toLocaleString()} kg
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SERVICES NEEDED */}
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-700/70 dark:bg-slate-900 space-y-4">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block flex items-center justify-between">
                  <span><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconTools size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Service Needed"}</span><span className="text-red-500">*</span></span>
                  <span className="text-[10px] font-normal text-slate-400">({lang === 'en' ? 'Check at least 1' : 'Mag-check ng kahit 1'})</span>
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { id: 'transport', label: ' Transportation' },
                    { id: 'drying', label: ' Mechanical Drying' },
                    { id: 'storage', label: ' Storage' },
                    { id: 'milling', label: ' Milling' },
                  ].map((service) => {
                    const isSelected = reqServices.includes(service.id as any);
                    const isAvailable = availableServiceTypes.has(service.id as 'transport' | 'storage' | 'drying' | 'milling');
                    return (
                      <button
                        type="button"
                        key={service.id}
                        onClick={() => {
                          if (isSelected) {
                            setReqServices(reqServices.filter(s => s !== service.id));
                          } else {
                            setReqServices([...reqServices, service.id as any]);
                          }
                        }}
                        className={`flex min-w-0 items-center gap-3 p-3 rounded-xl border text-left text-sm font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 text-blue-800 dark:text-blue-300 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:border-blue-300'
                        }`}
                      >
                        <div className={`w-4 h-4 shrink-0 rounded flex items-center justify-center border text-[10px] ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white font-bold' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isSelected && <span className="inline-flex items-center gap-1.5 align-middle"><IconCheck size={14} stroke={2} aria-hidden="true" className="inline-block shrink-0 text-emerald-500" /></span>}
                        </div>
                        {React.createElement(({ transport: IconTruck, storage: IconPackage, drying: IconWind, milling: IconWheat })[service.id], { size: 20, stroke: 2, className: 'inline-block shrink-0', 'aria-hidden': true })}
                        <span className="min-w-0 flex-1 whitespace-normal text-sm leading-snug">
                          <span className="block">{service.label.trim()}</span>
                          {!isAvailable && <small className="mt-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Open request' : 'Bukas na request'}</small>}
                        </span>
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* CONDITIONAL TRANSPORTATION SPECIFICATIONS WHEN TRANSPORTATION IS CLICKED */}
              {reqServices.includes('transport') && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="lg:col-span-2 p-3.5 bg-blue-50/90 dark:bg-blue-950/40 border-2 border-blue-300 dark:border-blue-800/80 rounded-2xl space-y-3 shadow-xs"
                >
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-extrabold text-xs uppercase tracking-wider">
                    <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{lang === 'en' ? 'Transportation & Vehicle Specifications' : 'Detalye ng Sasakyan at Byahe'}</span>
                  </div>

                  {/* Dropdown for Type of Truck */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconTruck size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Type of Truck Needed' : 'Klase ng Truck / Sasakyan'}:
                    </label>
                    <select
                      value={reqTruckType}
                      onChange={(e) => setReqTruckType(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                    >
                      {TRUCK_OPTIONS.map((truck) => (
                        <option key={truck.name} value={truck.name}>
                          {truck.name} — Max {truck.maxCapacityKg.toLocaleString()} kg
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                      {lang === 'en' ? 'Maximum load capacity:' : 'Pinakamataas na kapasidad:'}{' '}
                      {selectedTruckOption.maxCapacityKg.toLocaleString()} kg
                    </p>
                    {recommendedTruckOption && (
                      <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        {lang === 'en' ? 'Recommended for your estimated load:' : 'Rekomendado para sa tinatayang karga:'}{' '}
                        {recommendedTruckOption.name} ({recommendedTruckOption.maxCapacityKg.toLocaleString()} kg max)
                      </p>
                    )}
                    {requestLoadKg > selectedTruckOption.maxCapacityKg && (
                      <p className="text-[10px] font-bold text-red-600 dark:text-red-400">
                        {lang === 'en'
                          ? `The requested load exceeds this truck's capacity by ${(requestLoadKg - selectedTruckOption.maxCapacityKg).toLocaleString()} kg. Choose a larger truck or split the load.`
                          : `Lampas ng ${(requestLoadKg - selectedTruckOption.maxCapacityKg).toLocaleString()} kg ang karga. Pumili ng mas malaking truck o hatiin ang karga.`}
                      </p>
                    )}
                  </div>

                  {/* Pick-up Place & Drop Place text inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{lang === 'en' ? 'Pick-up Place' : 'Lugar ng Sakay (Pick-up Location)'} <span className="text-red-500">*</span>:</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={reqPickupPlace}
                        onChange={(e) => {
                          setReqPickupPlace(e.target.value);
                          setReqLocation(e.target.value);
                        }}
                        placeholder={lang === 'en' ? 'e.g. Farm Lot 4, Brgy. San Jose' : 'hal. Bukid 4, Brgy. San Jose'}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>{lang === 'en' ? 'Drop Place' : 'Lugar ng Bagsakan (Drop Location)'} <span className="text-red-500">*</span>:</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={reqDropPlace}
                        onChange={(e) => setReqDropPlace(e.target.value)}
                        placeholder={lang === 'en' ? 'e.g. Golden Grain Rice Mill, Magalang' : 'hal. Gilingan o Imbakan sa Bayan'}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Schedule */}
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-700/70 dark:bg-slate-900 space-y-4">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block"><span className="inline-flex items-center gap-1.5 align-middle"><IconCalendar size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Preferred Schedule"}</span></span>
                <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                      Preferred Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={reqPrefDate}
                      onChange={(e) => setReqPrefDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Preferred Time</label>
                    <select
                      value={reqPrefTime}
                      onChange={(e) => setReqPrefTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white"
                    >
                      <option value="08:00">08:00 AM (Morning)</option>
                      <option value="10:00">10:00 AM (Mid-Morning)</option>
                      <option value="13:00">01:00 PM (Afternoon)</option>
                      <option value="15:00">03:00 PM (Late Afternoon)</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Additional Notes */}
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-700/70 dark:bg-slate-900 space-y-4">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block">Additional Notes (Optional)</label>
                <textarea rows={3}
                  value={reqAddNotes}
                  onChange={(e) => setReqAddNotes(e.target.value)}
                  placeholder={lang === 'en' ? 'e.g., "Need 10-wheeler truck", "Urgent"' : 'hal., "Kailangan ng 10-wheeler truck"'}
                  className="w-full resize-y px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl text-xs"
                />
              </div>

              {/* Validation Warning Notice */}
              {(reqServices.length === 0 || !reqRiceVariety.trim() || requestLoadKg <= 0 || !reqHarvestDate || !reqPrefDate || (reqServices.includes('transport') && (!reqPickupPlace.trim() || !reqDropPlace.trim()))) && (
                <div className="lg:col-span-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] font-bold text-amber-800 dark:text-amber-300 text-center"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconAlertTriangle size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{reqServices.length === 0
                    ? (lang === 'en' ? 'Select at least one service needed above before submitting.' : 'Pumili ng kahit isang serbisyo sa taas bago mag-submit.')
                    : (lang === 'en' ? 'Please fill in all required fields marked with (*).' : 'Mangyaring punan ang lahat ng kailangang patlang na may (*).')}
                </div>
              )}

              <div className="lg:col-span-2 sticky bottom-0 z-10 flex gap-3 border-t border-slate-100 bg-white py-3 dark:border-slate-800 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setShowRequestServiceModal(false)}
                  className="flex-1 py-2.5 px-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={reqServices.length === 0 || !reqRiceVariety.trim() || requestLoadKg <= 0 || !reqHarvestDate || !reqPrefDate || (reqServices.includes('transport') && (!reqPickupPlace.trim() || !reqDropPlace.trim()))}
                  className={`flex-1 py-2.5 px-4 text-xs font-extrabold rounded-xl transition-all shadow-md ${
                    reqServices.length > 0 && reqRiceVariety.trim() && requestLoadKg > 0 && reqHarvestDate && reqPrefDate && (!reqServices.includes('transport') || (reqPickupPlace.trim() && reqDropPlace.trim()))
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: POST HARVEST MODAL (FOR SELLING TO BUYERS WITH MOISTURE LEVEL & PHOTO UPLOAD) */}
      {showPostHarvestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="kawing-readable-modal relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl md:rounded-3xl w-full max-w-xl sm:max-w-6xl shadow-2xl overflow-hidden max-h-[calc(100dvh-1rem)] md:max-h-[96vh] flex flex-col my-auto"
          >
            <div className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 bg-emerald-600 text-white shrink-0">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></span>
                <div className="min-w-0">
                  <h3 className="font-bold text-base sm:text-lg font-display">{lang === 'en' ? 'Post Harvest' : 'Post Harvest (Para sa Buyer Marketplace)'}</h3>
                  <p className="text-[11px] text-emerald-100">
                    {targetHarvestBuyer
                      ? (lang === 'en' ? `Direct offer to ${targetHarvestBuyer.businessName || targetHarvestBuyer.name}` : `Direktang alok kay ${targetHarvestBuyer.businessName || targetHarvestBuyer.name}`)
                      : (lang === 'en' ? 'Buyers will see this harvest and can send price offers.' : 'Makikita ito ng mga buyer at maaari silang magpadala ng alok na presyo.')}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <div className="rounded-xl border border-amber-300/50 bg-amber-950/25 px-3 py-1.5 text-right shadow-sm">
                  <p className="text-[8px] font-extrabold uppercase tracking-wider text-amber-100/80 sm:text-[9px]">
                    {lang === 'en' ? 'Government Suggested Price' : 'Gabay na Presyo ng Gobyerno'}
                  </p>
                  <p className="text-xs font-black text-amber-300 sm:text-sm">₱{marketReferencePrice.toFixed(2)} / kg</p>
                </div>
                <button
                  onClick={() => setShowPostHarvestModal(false)}
                  className="text-white/80 hover:text-white font-bold text-lg cursor-pointer p-1"
                  aria-label={lang === 'en' ? 'Close post harvest form' : 'Isara ang post harvest form'}
                ><span className="inline-flex items-center gap-1.5 align-middle"><IconX size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></button>
              </div>
            </div>

            <form onSubmit={handlePostHarvestSubmit} className="post-harvest-form p-4 sm:p-5 space-y-3.5 text-left overflow-y-auto flex-1">
              
              {/* Harvest Information */}
              <div className="post-harvest-information min-w-0 space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700/70">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider"><span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Harvest Information"}</span></span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                      Rice Variety <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={postRiceVariety}
                      onChange={(e) => setPostRiceVariety(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                    >
                      <option value="">-- {lang === 'en' ? 'Select Variety' : 'Pumili ng Uri'} --</option>
                      <option value="NSIC Rc222">NSIC Rc222</option>
                      <option value="NSIC Rc160">NSIC Rc160</option>
                      <option value="Dinorado">Dinorado</option>
                      <option value="Jasmine">Jasmine</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                      Harvest Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={postHarvestDate}
                      onChange={(e) => setPostHarvestDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                      {!targetHarvestBuyer && postSellingMethod === 'bidding' ? 'Starting Bid (₱/kg)' : 'Asking Price (₱/kg)'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      min="1"
                      required
                      placeholder={lang === 'en' ? 'e.g. 23.50' : 'hal. 23.50'}
                      value={postTargetPrice}
                      onChange={(e) => setPostTargetPrice(e.target.value === '' ? '' : Math.max(1, parseFloat(e.target.value) || 0))}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold text-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">{lang === 'en' ? 'Packaging Type' : 'Uri ng Pakete'}</label>
                    <select
                      value={postContainerType}
                      onChange={(e) => setPostContainerType(e.target.value as 'plastic_bags' | 'sacks')}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                    >
                      <option value="plastic_bags">{lang === 'en' ? 'Plastic Bags' : 'Mga Plastic'}</option>
                      <option value="sacks">{lang === 'en' ? 'Sacks / Kaban' : 'Sako / Kaban'}</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                      {postContainerType === 'sacks' ? (lang === 'en' ? 'Number of Sacks' : 'Bilang ng Sako/Kaban') : (lang === 'en' ? 'Number of Plastic Bags' : 'Bilang ng Plastic')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 20"
                      value={postContainerQuantity}
                      onChange={(e) => setPostContainerQuantity(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                      {postContainerType === 'sacks' ? 'Kg per Sack/Kaban' : 'Kg per Plastic Bag'}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      required
                      placeholder="e.g. 50"
                      value={postKgPerContainer}
                      onChange={(e) => setPostKgPerContainer(e.target.value === '' ? '' : Math.max(0.1, parseFloat(e.target.value) || 0))}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Description stays directly below the harvest fields. */}
                <div className="post-harvest-description space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block flex items-center justify-between">
                    <span>Description</span>
                    <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={postRemarks}
                    onChange={(e) => setPostRemarks(e.target.value)}
                    placeholder="Description"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="post-harvest-selling space-y-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white/30 dark:bg-slate-900/30 p-4">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  {lang === 'en' ? 'How do you want to sell?' : 'Paano mo gustong ibenta?'} <span className="text-red-500">*</span>
                </label>
                <div className={`grid grid-cols-1 gap-3 ${targetHarvestBuyer ? '' : 'sm:grid-cols-2'}`}>
                  <button
                    type="button"
                    onClick={() => setPostSellingMethod('fixed_price')}
                    className={`min-h-20 w-full rounded-xl border p-3 text-left transition-all ${postSellingMethod === 'fixed_price' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                    <span className="block text-xs font-extrabold text-slate-900 dark:text-white"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconCash size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Fixed Asking Price' : 'Takdang Presyo'}</span>
                    <span className="mt-1 block text-[10px] text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Receive offers based on your price.' : 'Tumanggap ng alok batay sa iyong presyo.'}</span>
                  </button>
                  {!targetHarvestBuyer && <button
                    type="button"
                    onClick={() => setPostSellingMethod('bidding')}
                    className={`min-h-20 w-full rounded-xl border p-3 text-left transition-all ${postSellingMethod === 'bidding' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                    <span className="block text-xs font-extrabold text-slate-900 dark:text-white"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconHammer size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Open for Bidding' : 'Bukas para sa Bidding'}</span>
                    <span className="mt-1 block text-[10px] text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Buyers compete with their best price.' : 'Maglalaban ang mga buyer sa presyo.'}</span>
                  </button>}
                </div>
              </div>

              {postWeightKg > 0 && Number(postTargetPrice) > 0 && (
                <div className="post-harvest-total grid grid-cols-[auto_1fr] items-center gap-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/35">
                  <div className="border-r border-emerald-300 pr-4 dark:border-emerald-800">
                    <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Total kg' : 'Kabuuang kg'}</p>
                    <strong className="block text-base font-black text-emerald-700 dark:text-emerald-300">{postWeightKg.toLocaleString()} kg</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                      {lang === 'en' ? 'Total Harvest Price' : 'Kabuuang Presyo ng Ani'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {postWeightKg.toLocaleString()} kg × ₱{Number(postTargetPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/kg
                    </p>
                    </div>
                    <strong className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                      ₱{postTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              )}

              {/* Moisture content is supplied exclusively by a fresh PalaySense reading. */}
              <div className={`post-harvest-moisture rounded-2xl border p-4 shadow-md transition-colors duration-300 ${postMoistureCardClass}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-sm font-display font-black uppercase tracking-wide"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconDroplet size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Moisture Content (%)"}</span><span className="text-inherit">*</span>
                  </label>
                  <span className={`${palaySenseStatus !== 'connected' && palaySenseStatus !== 'error' ? 'invisible' : ''} shrink-0 rounded-lg border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider ${palaySenseStatus === 'connected' ? 'border-emerald-400 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'border-red-400 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'}`}>
                    {palaySenseStatus === 'connected' ? <span className="inline-flex items-center gap-1.5 align-middle"><span aria-hidden="true" className="inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500" />{"PalaySense Connected"}</span> : palaySenseStatus === 'error' ? <span className="inline-flex items-center gap-1.5 align-middle"><span aria-hidden="true" className="inline-block h-2 w-2 shrink-0 rounded-full bg-red-500" />{"Connection Error"}</span> : ''}
                  </span>
                </div>

                {postMoisture === '' && <div className="mt-3">
                  <ol className="space-y-2 rounded-xl bg-black/10 p-3 text-sm leading-relaxed">
                    <li className="flex items-center gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/15 text-xs font-black">1</span> {lang === 'en' ? 'Insert PalaySense into grain.' : 'Ipasok ang PalaySense sa palay.'}</li>
                    <li className="flex items-center gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/15 text-xs font-black">2</span> {lang === 'en' ? 'Turn it on.' : 'I-on ito.'}</li>
                    <li className="flex items-center gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/15 text-xs font-black">3</span> {lang === 'en' ? 'Wait for the readings.' : 'Hintayin ang mga reading.'}</li>
                  </ol>
                </div>}

                {/* Reading details appear only after PalaySense supplies data. */}
                {postMoisture !== '' && (() => {
                  const classification = getMoistureClassification(postMoisture);
                  return (
                    <div className="mt-3 space-y-2">
                      <div className="rounded-xl bg-black/15 p-3">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-3xl font-black tracking-tight tabular-nums">{postMoisture}<span className="ml-1 text-xl font-bold">%</span></span>
                          <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
                            {lang === 'en' ? classification.labelEn : classification.labelTl}
                          </span>
                        </div>
                        {palaySenseReadingAt && (
                          <span className="mt-1 block text-xs font-medium opacity-90">
                            {lang === 'en' ? 'Updated ' : 'Na-update '}{new Date(palaySenseReadingAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium leading-snug">
                        <span className="font-black">{lang === 'en' ? 'Tip: ' : 'Payo: '}</span>
                        {classification.category === 'high'
                          ? (lang === 'en'
                              ? 'Dry immediately before storage or milling.'
                              : 'Patuyuin agad bago imbakin o gilingin.')
                          : classification.category === 'suitable'
                            ? (lang === 'en'
                                ? 'Continue drying before storage.'
                                : 'Patuyuin pa bago imbakin.')
                            : classification.category === 'needs-drying'
                              ? (lang === 'en'
                                  ? 'Dry to 12–14% moisture.'
                                  : 'Patuyuin hanggang 12–14% moisture.')
                              : classification.category === 'ready'
                              ? (lang === 'en'
                                  ? 'Ready for sale, milling, or proper storage.'
                                  : 'Maaari nang ibenta, gilingin, o imbakin nang maayos.')
                              : (lang === 'en'
                                  ? 'Stop drying to prevent grain breakage.'
                                  : 'Huwag nang patuyuin upang hindi mabiyak ang butil.')}
                      </p>
                      <p className="text-xs font-medium leading-relaxed opacity-90">
                        {lang === 'en'
                          ? 'Price should account for water weight and drying costs.'
                          : 'Iayon ang presyo sa bigat ng tubig at gastos sa pagpapatuyo.'}
                      </p>
                    </div>
                  );
                })()}
                <div className="mt-3">
                  <ul aria-label={lang === 'en' ? 'Moisture classification colors' : 'Mga kulay ng klasipikasyon ng moisture'} className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-current/20 pt-2 text-xs font-semibold">
                    <li className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full bg-red-700 ring-1 ring-white/80" />{lang === 'en' ? 'Wet' : 'Basa'}</li>
                    <li className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full bg-orange-500 ring-1 ring-white/80" />{lang === 'en' ? 'Moderate' : 'Katamtaman'}</li>
                    <li className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full bg-green-700 ring-1 ring-white/80" />{lang === 'en' ? 'Dry' : 'Tuyo'}</li>
                    <li className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full bg-purple-700 ring-1 ring-white/80" />{lang === 'en' ? 'Risk of Grain Breakage' : 'Panganib ng Pagkabiyak ng Butil'}</li>
                  </ul>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="post-harvest-actions sticky bottom-0 z-10 flex gap-3 border-t border-slate-100 bg-white py-3 dark:border-slate-800 dark:bg-slate-900 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPostHarvestModal(false)}
                  className="flex-1 py-2 px-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!postRiceVariety.trim() || postWeightKg <= 0 || !postTargetPrice || Number(postTargetPrice) <= 0 || !postHarvestDate || !postMoisture.trim()}
                  className={`flex-1 py-2 px-4 text-xs font-extrabold rounded-xl transition-all shadow-md ${
                    postRiceVariety.trim() && postWeightKg > 0 && postTargetPrice && Number(postTargetPrice) > 0 && postHarvestDate && postMoisture.trim()
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  Post Harvest
                </button>
              </div>
            </form>
            {showPostHarvestReview && (
              <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/65 p-3 backdrop-blur-sm sm:p-5">
                <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl dark:border-emerald-800 dark:bg-slate-900">
                  <div className="mb-3 text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xl dark:bg-emerald-950"><span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">{targetHarvestBuyer ? 'Confirm Harvest Offer' : 'Confirm Harvest Post'}</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Review the information before publishing.</p>
                  </div>
                  <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-950/60">
                    {targetHarvestBuyer && <div className="flex justify-between gap-4"><span className="text-slate-500">Buyer</span><strong className="text-right text-slate-900 dark:text-white">{targetHarvestBuyer.businessName || targetHarvestBuyer.name}</strong></div>}
                    <div className="flex justify-between gap-4"><span className="text-slate-500">Rice variety</span><strong className="text-right text-slate-900 dark:text-white">{postRiceVariety}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-slate-500">Harvest date</span><strong className="text-right text-slate-900 dark:text-white">{postHarvestDate}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-slate-500">Quantity</span><strong className="text-right text-slate-900 dark:text-white">{postWeightKg.toLocaleString()} kg</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-slate-500">Packaging</span><strong className="text-right text-slate-900 dark:text-white">{Number(postContainerQuantity).toLocaleString()} {postContainerType === 'sacks' ? 'sacks' : 'plastic bags'}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-slate-500">Moisture</span><strong className="text-right text-blue-600">{postMoisture}%</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-slate-500">Selling method</span><strong className="text-right text-slate-900 dark:text-white">{targetHarvestBuyer || postSellingMethod === 'fixed_price' ? 'Fixed asking price' : 'Open for bidding'}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-slate-500">Price</span><strong className="text-right text-emerald-600">₱{Number(postTargetPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}/kg</strong></div>
                    <div className="flex justify-between gap-4 border-t border-slate-200 pt-1.5 dark:border-slate-700"><span className="font-bold text-slate-700 dark:text-slate-300">Total</span><strong className="text-right text-base text-emerald-600">₱{postTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-slate-500">Location</span><strong className="max-w-[65%] text-right text-slate-900 dark:text-white">{postLocation.trim() || user.address || 'Barangay San Jose'}</strong></div>
                    {postRemarks.trim() && <div className="border-t border-slate-200 pt-2 dark:border-slate-700"><span className="block text-slate-500">Notes</span><p className="mt-1 whitespace-pre-wrap font-medium text-slate-900 dark:text-white">{postRemarks}</p></div>}
                  </div>
                  <div className="mt-4 flex gap-2.5">
                    <button type="button" onClick={() => setShowPostHarvestReview(false)} className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
                    <button type="button" onClick={confirmPostHarvest} className="flex-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-emerald-500">{targetHarvestBuyer ? 'Confirm Offer' : 'Confirm Post'}</button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* CONFIRM OFFER SELECTION MODAL */}
      {offerToAccept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 md:p-4 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-center space-y-4"
          >
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconHeartHandshake size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
              {lang === 'en' ? 'Confirm Offer Selection' : 'Kumpirmahin ang Pagpili ng Offer'}
            </h3>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl text-xs space-y-2 text-left border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Buyer Name:</span>
                <strong className="text-slate-900 dark:text-white">{offerToAccept.buyerName}</strong>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold text-sm">
                <span>Price Offer:</span>
                <span>₱{offerToAccept.offerPrice.toFixed(2)} / kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Quantity:</span>
                <strong className="text-slate-900 dark:text-white">{(offerToAccept.quantityWanted || offerToAccept.quantity).toLocaleString()} kg</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Collection date:</span>
                <strong className="text-slate-900 dark:text-white">{offerToAccept.preferredCollectionDate ? new Date(`${offerToAccept.preferredCollectionDate}T00:00:00`).toLocaleDateString() : 'Not specified'}</strong>
              </div>
              {offerToAccept.totalAmount && (
                <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold">
                  <span>Total Amount:</span>
                  <span>₱{offerToAccept.totalAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'en' 
                ? 'Kapag kinumpirma mo, lilitaw ang contact details ni buyer at magpapadala ng notipikasyon sa kanila.' 
                : 'Kapag kinumpirma mo, maa-update ang transaksyon at aabisuhan ang buyer sa KAWING.'}
            </p>
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-left text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              Accepting this offer will decline {Math.max(0, offers.filter(o => o.harvestId === offerToAccept.harvestId && o.status === 'pending' && o.id !== offerToAccept.id).length)} competing pending offer(s) for this harvest.
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setOfferToAccept(null)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
              >
                Kanselahin
              </button>
              <button
                onClick={() => {
                  onAcceptOffer(offerToAccept.id);
                  setOfferToAccept(null);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Oo, Tanggapin ang Offer
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {showRequestServiceReview && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-3 md:p-4 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} role="dialog" aria-modal="true" className="w-full max-w-lg rounded-3xl border border-cyan-800 bg-white dark:bg-slate-900 p-6 text-slate-900 dark:text-white shadow-2xl">
            <h2 className="text-xl font-black">Review Service Request</h2>
            <p className="mt-1 text-xs text-slate-400">Confirm all details before this request is sent.</p>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><dt className="text-xs text-slate-400">Services</dt><dd className="font-bold capitalize">{reqServices.join(', ')}</dd></div>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><dt className="text-xs text-slate-400">Provider</dt><dd className="font-bold">{selectedServiceProvider?.businessName || selectedServiceProvider?.name || 'Any approved available provider'}</dd></div>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><dt className="text-xs text-slate-400">Harvest</dt><dd className="font-bold">Palay ({reqRiceVariety})</dd></div>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><dt className="text-xs text-slate-400">Quantity</dt><dd className="font-bold">{requestLoadKg.toLocaleString()} kg</dd></div>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3 sm:col-span-2"><dt className="text-xs text-slate-400">Location / Route</dt><dd className="font-bold">{reqServices.includes('transport') ? `${reqPickupPlace}  to  ${reqDropPlace}` : (reqLocation || user.address)}</dd></div>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><dt className="text-xs text-slate-400">Schedule</dt><dd className="font-bold">{reqPrefDate || 'Earliest available'} {reqPrefTime}</dd></div>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><dt className="text-xs text-slate-400">Rate and contact</dt><dd className="font-bold">{selectedServiceProvider ? `${selectedServiceProvider.contactNumber || 'Contact shared after acceptance'} • Rate confirmed by provider` : 'Shown after provider accepts'}</dd></div>
            </dl>
            <div className="mt-6 flex gap-3"><button type="button" onClick={() => setShowRequestServiceReview(false)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-3 text-sm font-bold">Back and Edit</button><button type="button" onClick={confirmRequestService} className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-black">Submit Request</button></div>
          </motion.div>
        </div>
      )}

      {/* MODAL: BUYER DETAILS — the offer form opens only after reviewing this summary. */}
      {selectedBuyerModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-slate-950/75 backdrop-blur-sm p-3 md:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl"
          >
            <div className="flex items-start justify-between bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Verified Harvest Buyer</p>
                <h2 className="mt-1 text-xl font-extrabold">{selectedBuyerModal.businessName || selectedBuyerModal.name}</h2>
                {selectedBuyerModal.businessName && <p className="text-xs text-white/80">{selectedBuyerModal.name}</p>}
              </div>
              <button type="button" onClick={() => setSelectedBuyerModal(null)} className="rounded-xl bg-white/15 p-2 hover:bg-white/25" aria-label="Close buyer details">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6 text-sm text-slate-800 dark:text-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-4">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Rating</p>
                  <p className="mt-1 flex items-center gap-1 font-extrabold text-amber-400"><Star className="h-4 w-4 fill-current" />{selectedBuyerModal.rating?.toFixed(1) || 'New'}</p>
                </div>
                <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-4">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Status</p>
                  <p className="mt-1 flex items-center gap-1 font-extrabold text-emerald-400"><ShieldCheck className="h-4 w-4" /> Verified</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />{selectedBuyerModal.address || 'Service location not specified'}</p>
                <p className="mt-3 flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-emerald-400" />{selectedBuyerModal.contactNumber || (lang === 'en' ? 'Shared after a successful match' : 'Ibibigay pagkatapos ng successful match')}</p>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                {lang === 'en' ? 'Review the buyer above, then submit your harvest details and asking price directly to this buyer.' : 'Suriin muna ang buyer, pagkatapos ay ipadala ang detalye at asking price ng iyong ani.'}
              </p>
            </div>

            <div className="flex gap-3 border-t border-slate-200 dark:border-slate-800 p-5">
              <button type="button" onClick={() => setSelectedBuyerModal(null)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                {lang === 'en' ? 'Back' : 'Bumalik'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const buyer = selectedBuyerModal;
                  setSelectedBuyerModal(null);
                  handleOpenPostHarvestModal(buyer);
                }}
                className="flex-[1.5] rounded-xl bg-emerald-600 px-4 py-3 text-xs font-extrabold text-white hover:bg-emerald-500"
              >
                {lang === 'en' ? 'Offer My Harvest' : 'I-alok ang Aking Ani'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: LOGISTICS PROVIDER DETAILS POPUP */}
      {selectedOperatorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-h-[calc(100dvh-1.5rem)] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl md:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto flex flex-col"
          >
            {/* Header with role color gradient */}
            <div className={`px-6 py-5 flex items-start justify-between text-white ${
              selectedOperatorModal.role === 'truck' ? 'bg-gradient-to-r from-blue-600 to-indigo-700' :
              selectedOperatorModal.role === 'storage' ? 'bg-gradient-to-r from-purple-600 to-violet-700' :
              selectedOperatorModal.role === 'dryer' ? 'bg-gradient-to-r from-amber-600 to-orange-700' :
              'bg-gradient-to-r from-teal-600 to-emerald-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  {selectedOperatorModal.role === 'truck' ? <span className="inline-flex items-center gap-1.5 align-middle"><IconTruck size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span> :
                   selectedOperatorModal.role === 'storage' ? <span className="inline-flex items-center gap-1.5 align-middle"><IconPackage size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span> :
                   selectedOperatorModal.role === 'dryer' ? <span className="inline-flex items-center gap-1.5 align-middle"><IconWind size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span> : <span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-md text-white">
                      {selectedOperatorModal.role === 'truck' ? (lang === 'en' ? 'Hauler / Trucker' : 'Byahero / Trucking') :
                       selectedOperatorModal.role === 'storage' ? (lang === 'en' ? 'Cold Storage' : 'Imbakan ng Palay') :
                       selectedOperatorModal.role === 'dryer' ? (lang === 'en' ? 'Mechanical Dryer' : 'Patuyuan ng Palay') :
                       (lang === 'en' ? 'Rice Miller' : 'Gilingan ng Bigas')}
                    </span>
                  </div>
                  <h3 className="font-black text-xl text-white font-display mt-1">
                    {selectedOperatorModal.name}
                  </h3>
                  {selectedOperatorModal.businessName && (
                    <p className="text-xs text-white/80 font-medium">{selectedOperatorModal.businessName}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedOperatorModal(null)}
                className="text-white/80 hover:text-white font-black text-xl cursor-pointer p-1 rounded-full hover:bg-white/10 transition-all"
                aria-label="Close operator details"
              ><span className="inline-flex items-center gap-1.5 align-middle"><IconX size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></button>
            </div>

            {/* Body Details */}
            <div className="p-4 md:p-6 space-y-4 text-left overflow-y-auto max-h-[70vh]">
              {/* Rating & Verified Badge */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-amber-500 font-extrabold text-sm">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{(selectedOperatorModal.rating || 4.8).toFixed(1)}</span>
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 dark:text-slate-600 text-xs">|</span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {lang === 'en' ? 'Verified Logistics Partner' : 'Veripikadong Partner sa Logistika'}
                  </span>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>

              {/* Location & Coverage */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconMapPin size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Location & Operating Hub' : 'Lokasyon at Sentro ng Byahe'}
                </span>
                <div className="flex items-start gap-2 p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{selectedOperatorModal.address || (lang === 'en' ? 'Arayat, Pampanga / Central Luzon Coverage' : 'Arayat, Pampanga / Byahe sa Buong Central Luzon')}</span>
                </div>
              </div>

              {/* Capacity & Equipment Specs */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconSettings size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Equipment & Facility Details' : 'Detalye ng Sasakyan at Pasilidad'}
                </span>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700 text-xs space-y-1.5 leading-relaxed text-slate-600 dark:text-slate-300">
                  {selectedOperatorModal.role === 'truck' && (
                    <>
                      <p className="font-bold text-slate-800 dark:text-slate-100"><span className="inline-flex items-center gap-1.5 align-middle"><IconTruck size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"6-Wheeler & 10-Wheeler Palay Hauler Trucks"}</span></p>
                      <p>• Capacity: Up to 250 - 500 sacks (12.5 - 25 Tons) per haul</p>
                      <p>• Equipped with heavy-duty waterproof tarpaulins for all-weather hauling</p>
                      <p>• Fast farm-to-dryer and farm-to-mill direct transport</p>
                    </>
                  )}
                  {selectedOperatorModal.role === 'storage' && (
                    <>
                      <p className="font-bold text-slate-800 dark:text-slate-100"><span className="inline-flex items-center gap-1.5 align-middle"><IconPackage size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Climate-Controlled Palay & Rice Storage"}</span></p>
                      <p>• Capacity: Up to 5,000 sacks (250 Tons)</p>
                      <p>• Low humidity, pest-controlled warehouse environment</p>
                      <p>• Palletized floor setup ensuring grain quality preservation</p>
                    </>
                  )}
                  {selectedOperatorModal.role === 'dryer' && (
                    <>
                      <p className="font-bold text-slate-800 dark:text-slate-100"><span className="inline-flex items-center gap-1.5 align-middle"><IconWind size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"High-Capacity Mechanical Recirculating Dryer"}</span></p>
                      <p>• Capacity: 10 - 20 Tons per drying batch</p>
                      <p>• Rapid moisture reduction from 24% down to target 14%</p>
                      <p>• Minimal grain breakage rate ensuring high milling recovery</p>
                    </>
                  )}
                  {selectedOperatorModal.role === 'miller' && (
                    <>
                      <p className="font-bold text-slate-800 dark:text-slate-100"><span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Commercial High-Recovery Rice Mill"}</span></p>
                      <p>• Milling Recovery Rate: 65% - 68% well-milled rice</p>
                      <p>• Custom processing for Rc222, Rc160, Dinorado & Jasmine varieties</p>
                      <p>• De-husking, polishing, and automated bagging services</p>
                    </>
                  )}
                </div>
              </div>

              {/* Booking action */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const role = selectedOperatorModal.role;
                    setSelectedServiceProvider(selectedOperatorModal);
                    setSelectedOperatorModal(null);
                    if (role === 'truck') setReqServices(['transport']);
                    else if (role === 'storage') setReqServices(['storage']);
                    else if (role === 'dryer') setReqServices(['drying']);
                    else if (role === 'miller') setReqServices(['milling']);
                    setShowRequestServiceModal(true);
                  }}
                  className="py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Request Service' : 'Humiling ng Serbisyo'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
