import { IconAlertTriangle, IconBuildingBank, IconBuildingFactory, IconBulb, IconCalendar, IconCash, IconCheck, IconCircleCheck, IconCircleX, IconCoin, IconConfetti, IconDroplet, IconFlame, IconHeartHandshake, IconHourglass, IconMail, IconMapPin, IconMessage, IconPackage, IconScale, IconSettings, IconSun, IconTruck, IconWheat, IconX } from '@tabler/icons-react';
import React, { useState, useEffect } from 'react';
import { Harvest, Offer, ServiceRequest, UserAccount, AppNotification, OfferedService } from '../types';
import { Search, MapPin, Calendar, Star, Clock, CheckCircle, Ban, Check, ShieldCheck, Phone, X, Truck, CheckCircle2, Navigation, Compass, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { getMoistureClassification } from '../lib/moisture';
import Sidebar from './Sidebar';
import AnimatedButton from './AnimatedButton';
import AnnouncementsBoard from './AnnouncementsBoard';
import ProductionLoanBuyer from './ProductionLoanBuyer';
import { ProductionLoanRequest, ProductionLoanStatus } from '../types';
import buyerBackground from '../assets/images/buyer_background.jpg';
import { hasApprovedBusinessCapability } from '../lib/businessCapabilities';

interface BuyerDashboardProps {
  user: UserAccount;
  harvests: Harvest[];
  offers: Offer[];
  serviceRequests: ServiceRequest[];
  offeredServices?: OfferedService[];
  productionLoans?: ProductionLoanRequest[];
  marketReferencePrice: number;
  onAddOfferedService?: (service: Omit<OfferedService, 'id' | 'providerEmail' | 'providerName' | 'providerRole' | 'createdAt'>) => void;
  onToggleOfferedServiceStatus?: (id: string) => void;
  onDeleteOfferedService?: (id: string) => void;
  onAddOffer: (harvestId: string, phone: string, name: string, govIdData: string, offerPrice?: number, priceUnit?: string, notes?: string, extraOfferData?: any) => void;
  onUpdateOffer: (offerId: string, updates: Partial<Offer>) => void;
  onCancelOffer: (offerId: string, reason: string) => void;
  onAcceptService: (requestId: string) => void;
  onRejectService: (requestId: string) => void;
  onCompleteService?: (requestId: string) => void;
  onApproveLoanRequest?: (requestId: string, approvedAmount: number, buyerNotes?: string) => void;
  onDeclineLoanRequest?: (requestId: string, buyerNotes?: string) => void;
  onUpdateLoanStatus?: (requestId: string, status: ProductionLoanStatus) => void;
  onUpdateUser?: (originalName: string, updated: UserAccount) => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onClearAllNotifications: (email: string) => void;
  onLogout: () => void;
}

export default function BuyerDashboard({
  user,
  harvests,
  offers,
  serviceRequests = [],
  offeredServices = [],
  productionLoans = [],
  marketReferencePrice,
  onAddOfferedService,
  onToggleOfferedServiceStatus,
  onDeleteOfferedService,
  onAddOffer,
  onUpdateOffer,
  onCancelOffer,
  onAcceptService,
  onRejectService,
  onCompleteService,
  onApproveLoanRequest,
  onDeclineLoanRequest,
  onUpdateLoanStatus,
  onUpdateUser,
  notifications,
  onMarkNotificationRead,
  onClearAllNotifications,
  onLogout,
}: BuyerDashboardProps) {
  const { t, lang } = useApp();
  const canBuy = hasApprovedBusinessCapability(user, 'buyer');
  const approvedServices = (['transport', 'storage', 'drying', 'milling'] as const).filter(capability => hasApprovedBusinessCapability(user, capability));
  const [activeTab, setActiveTab] = useState<'announcements' | 'browse' | 'farmer_offers' | 'offers' | 'logistics_jobs' | 'posted_services' | 'services' | 'requests' | 'palay' | 'loans'>(canBuy ? 'browse' : 'announcements');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedHarvest, setSelectedHarvest] = useState<Harvest | null>(null);
  const selectedMoisture = getMoistureClassification(selectedHarvest?.moistureLevel);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [cancelOfferTarget, setCancelOfferTarget] = useState<Offer | null>(null);
  const [cancelOfferReason, setCancelOfferReason] = useState('');
  
  // Post Service Modal state
  const [showPostServiceModal, setShowPostServiceModal] = useState(false);
  const [serviceType, setServiceType] = useState<'transport' | 'storage' | 'drying' | 'milling' | ''>('');
  const [serviceTitle, setServiceTitle] = useState('');
  const [truckType, setTruckType] = useState('');
  const [capacity, setCapacity] = useState('');
  const [locationCoverage, setLocationCoverage] = useState('');
  const [rateInfo, setRateInfo] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [contactPhone, setContactPhone] = useState(user.contactNumber || '0917-555-0100');

  const handleSelectServiceCategory = (type: 'transport' | 'storage' | 'drying' | 'milling') => {
    setServiceType(type);
    setServiceTitle('');
    setTruckType('');
    setCapacity('');
    setLocationCoverage('');
    setRateInfo('');
    setServiceNotes('');
  };
  
  // Verification & Offer details
  const [offerStatusFilter, setOfferStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'declined' | 'cancelled'>('all');
  
  // Logistics Jobs Filter for Buyers with Trucks
  const [logisticsFilter, setLogisticsFilter] = useState<'available' | 'active' | 'completed'>('available');
  const [buyerPhone, setBuyerPhone] = useState(user.contactNumber || '0917-555-0100');
  const [buyerName, setBuyerName] = useState(user.name || '');
  const [companyName, setCompanyName] = useState(user.businessName || (user.name ? `${user.name} Trading Co.` : 'Agri-Trading Co.'));

  useEffect(() => {
    setBuyerPhone(user.contactNumber || '0917-555-0100');
    setBuyerName(user.name || '');
    setCompanyName(user.businessName || (user.name ? `${user.name} Trading Co.` : 'Agri-Trading Co.'));
  }, [user]);
  const [offerPrice, setOfferPrice] = useState<number>(marketReferencePrice);
  const [quantityWanted, setQuantityWanted] = useState<number>(1000);
  const [preferredCollectionDate, setPreferredCollectionDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Other'>('Cash');
  const [buyerNotes, setBuyerNotes] = useState<string>('');
  const [agreedTerms, setAgreedTerms] = useState<boolean>(true);
  const [govIdData, setGovIdData] = useState<string>('https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?q=80&w=300&auto=format&fit=crop'); 
  const [isDragging, setIsDragging] = useState(false);

  // Filter posted harvests for browsing
  const availableHarvests = harvests.filter(
    h => h.status === 'posted'
      && (!h.targetBuyerEmail || h.targetBuyerEmail === user.email)
      && h.cropType.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const farmerOffers = harvests.filter(h => h.status === 'posted' && h.targetBuyerEmail === user.email);

  // Filter offers made by this specific buyer to separate accounts per user!
  const myOffers = offers.filter(o => o.buyerEmail === user.email);

  const selectedHarvestOffers = selectedHarvest ? offers.filter(o => o.harvestId === selectedHarvest.id) : [];
  const highestOfferPrice = selectedHarvestOffers.length > 0
    ? Math.max(...selectedHarvestOffers.map(o => o.offerPrice))
    : null;

  const pendingOffersCount = myOffers.filter(o => o.status === 'pending').length;
  const acceptedOffersCount = myOffers.filter(o => o.status === 'accepted').length;

  // Filter transport requests for Buyers who own trucks / logistics
  const transportRequests = serviceRequests.filter(s => s.type === 'transport');
  const availableTransportRequests = transportRequests.filter(s => s.status === 'pending');
  const myAcceptedTransportJobs = transportRequests.filter(s => s.status === 'matched' && s.operatorEmail === user.email);
  const myCompletedTransportJobs = transportRequests.filter(s => s.status === 'completed' && s.operatorEmail === user.email);

  const handleOpenOffer = (harvest: Harvest) => {
    setEditingOffer(null);
    setSelectedHarvest(harvest);
    setOfferPrice(marketReferencePrice);
    setQuantityWanted(harvest.quantity || 1000);
    setBuyerPhone(user.contactNumber || '0917-555-0100');
    setBuyerName(user.name || '');
    setCompanyName(user.businessName || (user.name ? `${user.name} Trading Co.` : 'Agri-Trading Co.'));
    setBuyerNotes('');
    setShowOfferModal(true);
  };

  const handleEditOffer = (offer: Offer) => {
    const harvest = harvests.find(item => item.id === offer.harvestId);
    if (!harvest || offer.status !== 'pending') return;
    setEditingOffer(offer);
    setSelectedHarvest(harvest);
    setOfferPrice(offer.offerPrice);
    setQuantityWanted(offer.quantityWanted || offer.quantity);
    setPreferredCollectionDate(offer.preferredCollectionDate || '');
    setBuyerPhone(offer.buyerPhone || user.contactNumber || '');
    setBuyerName(offer.buyerName);
    setCompanyName(offer.buyerCompanyName || user.businessName || user.name);
    setBuyerNotes(offer.additionalMessage || offer.notes || '');
    setGovIdData(offer.govIdData || '');
    setAgreedTerms(true);
    setShowOfferModal(true);
  };

  const handleSendOffer = (e: React.FormEvent) => {
    e.preventDefault();
    const daRef = marketReferencePrice;
    if (!selectedHarvest || !buyerName || !buyerPhone || !govIdData || !offerPrice || offerPrice < daRef || !agreedTerms) return;
    const offerTotal = offerPrice * quantityWanted;
    if (!window.confirm(lang === 'en'
      ? `Send this price offer to ${selectedHarvest.farmerName}?\n\nPrice: ₱${offerPrice.toFixed(2)}/kg\nQuantity: ${quantityWanted.toLocaleString()} kg\nTotal: ₱${offerTotal.toLocaleString()}`
      : `Ipadala ang price offer na ito kay ${selectedHarvest.farmerName}?\n\nPresyo: ₱${offerPrice.toFixed(2)}/kg\nDami: ${quantityWanted.toLocaleString()} kg\nKabuuan: ₱${offerTotal.toLocaleString()}`)) return;

    if (editingOffer) {
      onUpdateOffer(editingOffer.id, {
        offerPrice,
        quantityWanted,
        totalAmount: offerTotal,
        preferredCollectionDate,
        buyerPhone,
        buyerName,
        buyerCompanyName: companyName,
        notes: buyerNotes,
        additionalMessage: buyerNotes,
      });
    } else onAddOffer(
      selectedHarvest.id, 
      buyerPhone, 
      buyerName, 
      govIdData,
      offerPrice,
      selectedHarvest.priceUnit || 'kg',
      buyerNotes,
      {
        buyerCompanyName: companyName,
        quantityWanted: quantityWanted,
        preferredCollectionDate: preferredCollectionDate,
        paymentMethod: paymentMethod,
        additionalMessage: buyerNotes,
        agreedTerms: agreedTerms
      }
    );
    setEditingOffer(null);
    setShowOfferModal(false);
    setSelectedHarvest(null);
  };

  return (
    <div
      className="h-dvh max-h-dvh overflow-hidden bg-cover bg-center bg-scroll md:bg-fixed flex flex-col font-sans transition-colors duration-300"
      style={{ backgroundImage: `url(${buyerBackground})` }}
    >
      
      {/* Main Area with Left Sidebar */}
      <div className="flex-1 min-h-0 flex w-full overflow-hidden">
        <Sidebar
          user={user}
          activeTab={activeTab === 'browse' ? 'marketplace' : activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId === 'marketplace' ? 'browse' : tabId as any)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onUpdateUser={onUpdateUser}
          onLogout={onLogout}
          notifications={notifications}
          onMarkNotificationRead={onMarkNotificationRead}
        />

        <main className="dashboard-main flex-1 min-w-0 w-full max-w-[1440px] mx-auto h-full overflow-y-auto border-x border-white/30 bg-white/60 px-4 py-8 shadow-2xl backdrop-blur-[3px] scroll-smooth dark:border-slate-700/40 dark:bg-slate-950/65 sm:px-6 lg:px-8">
        
        {/* Active Tab Section Header */}
        {activeTab !== 'loans' && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display uppercase tracking-wide">
              {activeTab === 'browse' && (lang === 'en' ? 'Harvest Marketplace' : 'Marketplace ng Ani')}
              {activeTab === 'farmer_offers' && (lang === 'en' ? "Farmers' Harvest Offers" : 'Mga Alok na Ani ng Farmers')}
              {activeTab === 'announcements' && (lang === 'en' ? 'Updates & Platform Announcements' : 'Mga Anunsyo at Update')}
              {activeTab === 'offers' && (lang === 'en' ? 'My Submitted Price Offers' : 'Aking Mga Naipadalang Offer')}
              {activeTab === 'posted_services' && (lang === 'en' ? 'My Posted Truck & Logistics Services' : 'Aking Inalok na Serbisyo at Truck')}
              {activeTab === 'logistics_jobs' && (lang === 'en' ? 'Available Logistics Jobs' : 'Mga Byahe at Transport Jobs')}
              {activeTab === 'services' && (lang === 'en' ? 'Matched Logistics Services' : 'Nakatakdang Byahero & Processing')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeTab === 'browse' && (lang === 'en' ? 'Browse fresh and dry palay listings from local farmers.' : 'Mag-browse ng mga sariwa at tuyong palay mula sa mga magsasaka.')}
              {activeTab === 'farmer_offers' && (lang === 'en' ? 'Review harvests offered directly to you by farmers.' : 'Suriin ang mga ani na direktang inalok sa iyo ng mga farmer.')}
              {activeTab === 'announcements' && (lang === 'en' ? 'DA reference price benchmarks and platform notices.' : 'Mga opisyal na presyo ng DA at abiso sa sistema.')}
              {activeTab === 'offers' && (lang === 'en' ? 'Track farmer responses and manage your purchase bids.' : 'Suriin ang status ng inyong mga alok na presyo.')}
              {activeTab === 'posted_services' && (lang === 'en' ? 'Post available trucks or hauling services directly for local farmers to see.' : 'Mag-post ng bakanteng truck o serbisyo sa paghakot para makita ng mga magsasaka.')}
              {activeTab === 'logistics_jobs' && (lang === 'en' ? 'View farmer transport requests and hauling needs.' : 'Tingnan ang mga hiling na biyahe ng mga magsasaka.')}
              {activeTab === 'services' && (lang === 'en' ? 'Connect with registered truck haulers and millers.' : 'Kumonekta sa mga nakatakdang byahero at gilingan.')}
            </p>
          </div>

          <div className="flex flex-col min-[390px]:flex-row items-stretch min-[390px]:items-center gap-2.5 self-stretch sm:self-auto">
            {approvedServices.length > 0 && <AnimatedButton
              onClick={() => setShowPostServiceModal(true)}
              variant="outline"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl border-cyan-500 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/20"
            >
              <Truck className="w-4 h-4" />
              {lang === 'en' ? '+ Post a Service / Offer Truck' : '+ Mag-post ng Truck / Serbisyo'}
            </AnimatedButton>}

            {activeTab === 'browse' && (
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  id="search-input"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('search_placeholder')}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                />
              </div>
            )}
          </div>
        </div>
        )}

        {/* Content displays */}
        {activeTab === 'loans' && (
          <ProductionLoanBuyer
            user={user}
            loanRequests={productionLoans}
            onUpdateUser={onUpdateUser || (() => {})}
            onApproveLoanRequest={(id, amt, notes) => onApproveLoanRequest && onApproveLoanRequest(id, amt, notes)}
            onDeclineLoanRequest={(id, notes) => onDeclineLoanRequest && onDeclineLoanRequest(id, notes)}
            onUpdateLoanStatus={(id, status) => onUpdateLoanStatus && onUpdateLoanStatus(id, status)}
            onCancel={() => setActiveTab('browse')}
          />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsBoard
            marketReferencePrice={marketReferencePrice}
            user={user}
            notifications={notifications}
            onMarkNotificationRead={onMarkNotificationRead}
            onClearAllNotifications={onClearAllNotifications}
            onNavigateToFeature={(tabId) => setActiveTab(tabId === 'marketplace' ? 'browse' : tabId as any)}
          />
        )}
        {activeTab === 'farmer_offers' && (
          farmerOffers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 text-center py-16 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="text-4xl mb-3"><span className="inline-flex items-center gap-1.5 align-middle"><IconHeartHandshake size={32} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'en' ? 'No direct farmer offers yet' : 'Wala pang direktang alok mula sa farmer'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'en' ? 'Harvests offered directly to you will appear here.' : 'Dito lalabas ang mga ani na direktang iaalok sa iyo.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {farmerOffers.map(harvest => {
                const moistureInfo = getMoistureClassification(harvest.moistureLevel);
                return (
                  <motion.button
                    key={harvest.id}
                    type="button"
                    onClick={() => handleOpenOffer(harvest)}
                    whileHover={{ y: -2 }}
                    className="w-full rounded-2xl border border-violet-200 dark:border-violet-900 bg-white dark:bg-slate-900 p-5 text-left shadow-sm hover:border-violet-400 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 dark:text-white">{harvest.farmerName}</h3>
                          <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-[10px] font-bold uppercase">
                            {lang === 'en' ? 'Offered to you' : 'Inalok sa iyo'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-cyan-700 dark:text-cyan-300">{harvest.cropType}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconMapPin size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{harvest.location}</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs md:text-right">
                        <div><span className="block text-slate-400">{lang === 'en' ? 'Moisture' : 'Antas ng Basa'}</span><strong className={`inline-block rounded-md border px-2 py-0.5 ${moistureInfo.badgeClass}`}>{harvest.moistureLevel || '—'}</strong></div>
                        <div><span className="block text-slate-400">{lang === 'en' ? 'Total' : 'Kabuuan'}</span><strong className="text-slate-800 dark:text-slate-200">{harvest.quantity.toLocaleString()} {harvest.unit}</strong></div>
                        <div><span className="block text-slate-400">{harvest.sellingMethod === 'bidding' ? (lang === 'en' ? 'Starting Bid' : 'Simulang Bid') : (lang === 'en' ? 'Asking Price' : 'Hiling na Presyo')}</span><strong className="text-emerald-600">₱{harvest.targetPrice?.toLocaleString() || '—'}/kg</strong></div>
                        <div><span className="block text-slate-400">{lang === 'en' ? 'Total Price' : 'Kabuuang Presyo'}</span><strong className="text-emerald-600">₱{(harvest.totalPrice ?? (harvest.quantity * Number(harvest.targetPrice || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )
        )}
        {activeTab === 'browse' && (
          availableHarvests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 text-center py-16 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('empty_browse')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {t('empty_browse_desc')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="hidden grid-cols-[minmax(170px,1.4fr)_minmax(140px,1fr)_minmax(120px,0.8fr)_minmax(170px,1.1fr)_minmax(120px,0.8fr)_minmax(100px,0.65fr)] items-center gap-4 px-5 pb-1 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 lg:grid">
                <span>{lang === 'en' ? 'Farmer' : 'Magsasaka'}</span>
                <span>{lang === 'en' ? 'Variety' : 'Uri ng Palay'}</span>
                <span>{lang === 'en' ? 'Moisture' : 'Antas ng Basa'}</span>
                <span>{lang === 'en' ? 'Bags / Sacks' : 'Mga Bag / Sako'}</span>
                <span>{lang === 'en' ? 'Total kg' : 'Kabuuang kg'}</span>
                <span className="sr-only">{lang === 'en' ? 'Details' : 'Detalye'}</span>
              </div>
              {availableHarvests.map((h) => {
                const moistureInfo = getMoistureClassification(h.moistureLevel);
                return (
                <motion.button
                  type="button"
                  key={h.id}
                  onClick={() => handleOpenOffer(h)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                  className="group w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-cyan-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-700/80 dark:bg-slate-900/95 dark:hover:border-cyan-500"
                  aria-label={`${lang === 'en' ? 'View harvest details for' : 'Tingnan ang detalye ng ani ni'} ${h.farmerName}`}
                >
                  <div className="grid grid-cols-2 items-center gap-x-4 gap-y-3 lg:grid-cols-[minmax(170px,1.4fr)_minmax(140px,1fr)_minmax(120px,0.8fr)_minmax(170px,1.1fr)_minmax(120px,0.8fr)_minmax(100px,0.65fr)]">
                    <div className="min-w-0">
                      <span className="block text-[9px] font-bold uppercase text-slate-400 lg:hidden">{lang === 'en' ? 'Farmer' : 'Magsasaka'}</span>
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{h.farmerName}</p>
                    </div>

                    <div className="min-w-0">
                      <span className="block text-[9px] font-bold uppercase text-slate-400 lg:hidden">{lang === 'en' ? 'Variety' : 'Uri ng Palay'}</span>
                      <span className="inline-flex max-w-full rounded-md bg-cyan-100 px-2.5 py-1 text-sm font-extrabold text-cyan-900 dark:bg-cyan-950 dark:text-cyan-200">
                        <span className="truncate">{h.riceVariety || h.cropType}</span>
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span className="block text-[9px] font-bold uppercase text-slate-400 lg:hidden">{lang === 'en' ? 'Moisture' : 'Antas ng Basa'}</span>
                      <span className={`inline-flex max-w-full rounded-md px-2.5 py-1 text-sm font-extrabold ${moistureInfo.badgeClass}`}>
                        <span className="truncate">{h.moistureLevel || '—'}</span>
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span className="block text-[9px] font-bold uppercase text-slate-400 lg:hidden">{lang === 'en' ? 'Bags / Sacks' : 'Mga Bag / Sako'}</span>
                      <span className="block truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {h.containerQuantity
                          ? `${h.containerQuantity.toLocaleString()} ${h.containerType === 'sacks' ? 'sacks/kaban' : 'plastic bags'}`
                          : '—'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span className="block text-[9px] font-bold uppercase text-slate-400 lg:hidden">{lang === 'en' ? 'Total kg' : 'Kabuuang kg'}</span>
                      <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">{(h.estimatedWeightKg ?? h.quantity).toLocaleString()} kg</span>
                    </div>

                    <span className="col-span-2 justify-self-end text-xs font-black uppercase tracking-wide text-amber-400 lg:col-span-1" aria-hidden="true">
                      {h.sellingMethod === 'bidding' ? (lang === 'en' ? 'Open for Bid' : 'Bukas sa Bid') : ''}
                    </span>
                  </div>
                </motion.button>
              );
              })}
            </div>
          )
        )}

        {activeTab === 'offers' && (
          <div className="space-y-4">
            {/* Status filter pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setOfferStatusFilter('all')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  offerStatusFilter === 'all'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-cyan-400'
                }`}
              >
                {lang === 'en' ? 'All Interests' : 'Lahat ng Interes'} ({myOffers.length})
              </button>
              <button
                onClick={() => setOfferStatusFilter('pending')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  offerStatusFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-amber-400'
                }`}
              ><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconHourglass size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Waiting for Farmer' : 'Naghihintay sa Farmer'} ({pendingOffersCount})
              </button>
              <button
                onClick={() => setOfferStatusFilter('accepted')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  offerStatusFilter === 'accepted'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                }`}
              ><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconCircleCheck size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Approved Connections' : 'Aprubadong Koneksyon'} ({acceptedOffersCount})
              </button>
            </div>

            {myOffers.filter(o => offerStatusFilter === 'all' || o.status === offerStatusFilter).length === 0 ? (
              <div className="bg-white dark:bg-slate-900 text-center py-16 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconHeartHandshake size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {lang === 'en' ? 'No Matching Interests Found' : 'Walang Nahanap na Interes'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {lang === 'en'
                    ? "No offers currently match this filter. Go to the \"Browse\" tab to send new price offers."
                    : "Walang alok sa ilalim ng status na ito. Pumunta sa \"Browse\" tab upang magpadala ng bagong price offer."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myOffers
                  .filter(o => offerStatusFilter === 'all' || o.status === offerStatusFilter)
                  .map((o) => (
                  <div
                    key={o.id}
                    className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all duration-300 ${
                      o.status === 'accepted' ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10' : o.status === 'declined' || o.status === 'cancelled' ? 'border-red-100 dark:border-red-900/40 bg-red-50/10 dark:bg-red-950/5' : 'border-slate-100 dark:border-slate-800'
                    }`}
                  >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                      o.status === 'accepted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : o.status === 'declined' || o.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                    }`}>
                      {o.status === 'accepted' ? <Check className="w-6 h-6" /> : o.status === 'declined' || o.status === 'cancelled' ? <Ban className="w-6 h-6" /> : <Clock className="w-6 h-6 animate-pulse" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base font-display">{o.cropType}</h4>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          o.status === 'accepted' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : o.status === 'declined' || o.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}>
                          {o.status === 'accepted' ? (lang === 'en' ? 'Verified & Approved' : 'Aprubado na') : o.status === 'declined' ? (lang === 'en' ? 'Declined' : 'Tinanggihan') : o.status === 'cancelled' ? (lang === 'en' ? 'Cancelled by Buyer' : 'Kinansela ng Buyer') : (lang === 'en' ? 'Awaiting Verification' : 'Nirerepaso')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {t('label_farmer')}: <strong className="text-slate-700 dark:text-slate-200">{o.farmerName}</strong> • {lang === 'en' ? 'Quantity' : 'Dami'}: <strong className="text-slate-700 dark:text-slate-200">{o.quantity} {o.unit}</strong>
                      </p>
                      
                      {/* Submited info description */}
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl text-xs space-y-1 text-slate-500 dark:text-slate-400 max-w-md">
                        <div className="font-semibold text-[10px] uppercase text-slate-400">{lang === 'en' ? 'Submitted Info' : 'Ipinadalang Impormasyon'}</div>
                        <div>Name: <span className="font-medium text-slate-700 dark:text-slate-300">{o.buyerName}</span></div>
                        <div>Phone: <span className="font-medium text-slate-700 dark:text-slate-300">{o.buyerPhone}</span></div>
                        {o.govIdData && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1"><span className="inline-flex items-center gap-1.5 align-middle"><IconCheck size={14} stroke={2} aria-hidden="true" className="inline-block shrink-0 text-emerald-500" />{"ID photo attached"}</span></div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full min-w-0 flex-col justify-center md:w-auto md:min-w-[200px] md:items-end">
                    {o.status === 'accepted' ? (
                      <div className="space-y-2.5 w-full">
                        <div className="p-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs text-center shadow-xs"><span className="inline-flex items-center gap-1.5 align-middle"><IconConfetti size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Congratulations! Your offer has been accepted. Continue tracking the transaction in KAWING."}</span></div>
                      </div>
                    ) : o.status === 'pending' ? (
                      <div className="space-y-2 w-full">
                        <div className="text-xs text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/20 px-3.5 py-2 rounded-xl text-center"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconHourglass size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Farmer is checking your details...' : 'Nirerepaso ang iyong detalye...'}
                        </div>
                        <button type="button" onClick={() => handleEditOffer(o)} className="w-full rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400">
                          {lang === 'en' ? 'Edit Pending Offer' : 'I-edit ang Pending Offer'}
                        </button>
                        <button type="button" onClick={() => { setCancelOfferReason(''); setCancelOfferTarget(o); }} className="w-full rounded-xl border border-red-300 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40">
                          {lang === 'en' ? 'Cancel Price Offer' : 'Kanselahin ang Price Offer'}
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/20 px-3.5 py-2 rounded-xl text-center w-full"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconCircleX size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{o.status === 'cancelled' ? (lang === 'en' ? 'You cancelled this price offer' : 'Kinansela mo ang price offer na ito') : (lang === 'en' ? 'Verification details rejected' : 'Hindi na-verify ang iyong detalye')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        )}



        {activeTab === 'logistics_jobs' && (
          <div className="space-y-6">
            {/* Header Availability Banner for Buyers with Trucks */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                  <Truck className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-display">
                    <span>{lang === 'en' ? 'Buyer Hauling & Transport Services' : 'Serbisyo sa Pagbiyahe at Transport ng Buyer'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 uppercase">
                      Truck Owner
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                    {lang === 'en'
                      ? 'Have a truck? Accept farmer requests to haul palay to mills, storage, or buying stations.'
                      : 'May truck? Tumanggap ng hiling na maghakot ng palay sa gilingan, imbakan, o buying station.'}
                  </p>
                </div>
              </div>

            </div>

            {/* Filter Pills for Jobs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setLogisticsFilter('available')}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  logisticsFilter === 'available'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-400'
                }`}
              ><span className="inline-flex items-center gap-1.5 align-middle"><IconTruck size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Available Farmer Job Requests' : 'Mga Hiling na Biyahe ng Magsasaka'} ({availableTransportRequests.length})
              </button>
              <button
                onClick={() => setLogisticsFilter('active')}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  logisticsFilter === 'active'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-amber-400'
                }`}
              ><span className="inline-flex items-center gap-1.5 align-middle"><IconHourglass size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'My Active Trips' : 'Aking Active na Biyahe'} ({myAcceptedTransportJobs.length})
              </button>
              <button
                onClick={() => setLogisticsFilter('completed')}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  logisticsFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                }`}
              ><span className="inline-flex items-center gap-1.5 align-middle"><IconCircleCheck size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Completed Trips' : 'Natapos na Biyahe'} ({myCompletedTransportJobs.length})
              </button>
            </div>

            {/* Content List Based on Filter */}
            {logisticsFilter === 'available' && (
              availableTransportRequests.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 text-center py-16 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconTruck size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'en' ? 'No Available Transport Requests' : 'Walang Bakanteng Hiling na Biyahe'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    {lang === 'en'
                      ? 'When farmers post new harvest transport/hauling requests, they will appear here for you to accept.'
                      : 'Lalabas dito ang bagong hiling sa paghakot ng ani.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableTransportRequests.map((req) => (
                    <motion.div
                      key={req.id}
                      whileHover={{ y: -3 }}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between hover:border-blue-400 transition-all duration-300"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                              <Truck className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                                {lang === 'en' ? 'Transport Request' : 'Hiling na Biyahe'}
                              </span>
                              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">{req.cropType}</h3>
                            </div>
                          </div>
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 uppercase">
                            Pending Match
                          </span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 mb-5">
                          {req.truckType && (
                            <div className="flex justify-between items-center text-blue-700 dark:text-blue-300 font-extrabold bg-blue-50 dark:bg-blue-950/40 p-1.5 rounded-lg">
                              <span className="text-slate-500 font-medium">{lang === 'en' ? 'Truck Type' : 'Klase ng Truck'}:</span>
                              <span>{req.truckType}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">{t('label_farmer')}:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{req.farmerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">{lang === 'en' ? 'Volume' : 'Dami'}:</span>
                            <span className="font-extrabold text-blue-600 dark:text-blue-400">{req.quantity} {req.unit}</span>
                          </div>
                          {req.pickupLocation && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 font-medium">{lang === 'en' ? 'Pick-up Place' : 'Sakayan'}:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] text-emerald-600 dark:text-emerald-400 font-bold">{req.pickupLocation}</span>
                            </div>
                          )}
                          {req.dropLocation && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 font-medium">{lang === 'en' ? 'Drop Place' : 'Bagsakan'}:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] text-rose-600 dark:text-rose-400 font-bold">{req.dropLocation}</span>
                            </div>
                          )}
                          {!req.pickupLocation && !req.dropLocation && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 font-medium">{lang === 'en' ? 'Location' : 'Lugar'}:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{req.location}</span>
                            </div>
                          )}
                          {req.preferredDate && (
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-medium">{lang === 'en' ? 'Schedule' : 'Petsa'}:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{req.preferredDate} {req.preferredTime || ''}</span>
                            </div>
                          )}
                          {req.additionalNotes && (
                            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 text-[11px] italic text-slate-500">
                              "{req.additionalNotes}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => { if (window.confirm(lang === 'en' ? 'Accept this hauling request and take responsibility for the trip?' : 'Tanggapin at akuin ang hauling request na ito?')) onAcceptService(req.id); }}
                          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{lang === 'en' ? 'Accept & Haul Trip' : 'Tanggapin ang Biyahe'}</span>
                        </button>
                        <button
                          onClick={() => { if (window.confirm(lang === 'en' ? 'Decline this hauling request?' : 'Tanggihan ang hauling request na ito?')) onRejectService(req.id); }}
                          className="py-3 px-4 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/30 text-slate-600 hover:text-red-600 dark:text-slate-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          {lang === 'en' ? 'Decline' : 'Tanggihan'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}

            {logisticsFilter === 'active' && (
              myAcceptedTransportJobs.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 text-center py-16 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconHourglass size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'en' ? 'No Active Hauling Trips' : 'Walang Active na Biyahe'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    {lang === 'en'
                      ? 'You have no accepted active hauling trips at the moment. Accept available requests from the list.'
                      : 'Wala kang active na biyahe ngayon. Mag-accept ng biyahe mula sa listahan ng mga hiling.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myAcceptedTransportJobs.map((req) => (
                    <motion.div
                      key={req.id}
                      whileHover={{ y: -3 }}
                      className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 shadow-sm p-6 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                              <Navigation className="w-6 h-6 animate-spin-slow" />
                            </div>
                            <div>
                              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                                {lang === 'en' ? 'Active Hauling Trip' : 'Kasalukuyang Biyahe'}
                              </span>
                              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">{req.cropType}</h3>
                            </div>
                          </div>
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase"><span className="inline-flex items-center gap-1.5 align-middle"><span aria-hidden="true" className="inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500" />{"In Progress"}</span></span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 mb-5">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">{t('label_farmer')}:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{req.farmerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">{lang === 'en' ? 'Volume' : 'Dami'}:</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{req.quantity} {req.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">{lang === 'en' ? 'Pickup Location' : 'Lugar ng Sakay'}:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{req.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {onCompleteService && (
                          <button
                            onClick={() => { if (window.confirm(lang === 'en' ? 'Mark this delivery as completed? This will close the trip.' : 'Markahan itong completed? Isasara nito ang biyahe.')) onCompleteService(req.id); }}
                            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>{lang === 'en' ? 'Mark Delivery Completed' : 'I-marka na Natapos ang Biyahe'}</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}

            {logisticsFilter === 'completed' && (
              myCompletedTransportJobs.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 text-center py-16 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconCircleCheck size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'en' ? 'No Completed Trips Yet' : 'Wala pa Natatapos na Biyahe'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    {lang === 'en'
                      ? 'Completed hauling trips will be archived here.'
                      : 'Ang mga natapos mong biyahe sa paghahakot ay malalagay rito.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myCompletedTransportJobs.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-base font-display">{req.cropType}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                              Completed
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {t('label_farmer')}: <strong className="text-slate-700 dark:text-slate-200">{req.farmerName}</strong> • {lang === 'en' ? 'Volume' : 'Dami'}: <strong className="text-slate-700 dark:text-slate-200">{req.quantity} {req.unit}</strong> • {req.location}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 inline-block"><span className="inline-flex items-center gap-1.5 align-middle"><IconCircleCheck size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Delivered & Completed"}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'posted_services' && (
          <div className="space-y-6">
            {(() => {
              const myServices = (offeredServices || []).filter(s => s.providerEmail === user.email);
              if (myServices.length === 0) {
                return (
                  <div className="bg-white dark:bg-slate-900 text-center py-16 px-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="w-16 h-16 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconTruck size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {lang === 'en' ? 'No Posted Services Yet' : 'Wala Pa Akong Inalok na Serbisyo'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                      {lang === 'en'
                        ? 'Post your hauling service so local farmers can request a trip.'
                        : 'I-post ang hauling service mo para makahiling ng biyahe ang mga magsasaka.'}
                    </p>
                    <button
                      onClick={() => setShowPostServiceModal(true)}
                      className="mt-5 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-cyan-600/20 cursor-pointer inline-flex items-center gap-2"
                    >
                      <Truck className="w-4 h-4" />
                      <span>{lang === 'en' ? 'Post Your Truck Service Now' : 'I-post ang Serbisyo ng Truck Mo'}</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myServices.map((s) => (
                    <div
                      key={s.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between hover:border-cyan-300 dark:hover:border-cyan-700 transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Truck className="w-3 h-3" />
                            {s.serviceType === 'transport' ? (lang === 'en' ? 'Truck & Hauling' : 'Truck at Hakot') :
                             s.serviceType === 'storage' ? (lang === 'en' ? 'Cold Storage' : 'Bodega') :
                             s.serviceType === 'drying' ? (lang === 'en' ? 'Drying Facility' : 'Patuyuan') :
                             (lang === 'en' ? 'Rice Mill' : 'Gilingan')}
                          </span>
                        </div>

                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white font-display mb-1">
                          {s.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-4">
                          {s.companyName || user.businessName || user.name}
                        </p>

                        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 mb-4">
                          {s.truckType && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 font-medium">{lang === 'en' ? 'Vehicle Type' : 'Uri ng Sasakyan'}:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{s.truckType}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-medium">{lang === 'en' ? 'Capacity' : 'Kapasidad'}:</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{s.capacity}</span>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-slate-400 font-medium shrink-0">{lang === 'en' ? 'Service Area' : 'Lugar ng Biyahe'}:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{s.locationCoverage}</span>
                          </div>
                          {s.rateInfo && (
                            <div className="flex justify-between items-start gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                              <span className="text-slate-400 font-medium shrink-0">{lang === 'en' ? 'Rates / Fee' : 'Bayad / Libre'}:</span>
                              <span className="font-bold text-cyan-600 dark:text-cyan-400 text-right">{s.rateInfo}</span>
                            </div>
                          )}
                          {s.notes && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-2 border-t border-slate-200/40 dark:border-slate-700/40">
                              "{s.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        {onDeleteOfferedService && (
                          <button
                            type="button"
                            onClick={() => { if (window.confirm(lang === 'en' ? `Delete the service post “${s.title}”? Farmers will no longer see it.` : `Burahin ang service post na “${s.title}”? Hindi na ito makikita ng mga farmer.`)) onDeleteOfferedService(s.id); }}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all cursor-pointer"
                            title="Delete service post"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

      </main>
      </div>

      {/* Modal for Posting Buyer Service / Truck */}
      {showPostServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-h-[calc(100dvh-1.5rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto flex flex-col"
          >
            <div className="px-6 py-4 flex items-center justify-between bg-cyan-600 dark:bg-cyan-700 text-white shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 bg-white/10 rounded-xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconTruck size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></span>
                <div>
                  <h3 className="font-extrabold text-base font-display">
                    {lang === 'en' ? 'Post Truck or Logistics Service' : 'Mag-post ng Truck o Serbisyo sa Hakot'}
                  </h3>
                  <p className="text-xs text-cyan-100 font-medium">
                    {lang === 'en' ? 'Make your truck or transport available to local farmers' : 'Ialok ang iyong truck para magamit ng mga magsasaka'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPostServiceModal(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!serviceType) {
                  alert(lang === 'en' ? 'Please select a service category first.' : 'Pumili muna ng kategorya ng serbisyo.');
                  return;
                }
                if (!serviceTitle.trim() || !capacity.trim() || !locationCoverage.trim()) {
                  alert(lang === 'en' ? 'Please fill in required fields.' : 'Mangyaring punan ang kinakailangang impormasyon.');
                  return;
                }
                if (!window.confirm(lang === 'en'
                  ? `Publish this ${serviceType} service?\n\n${serviceTitle.trim()}\nCapacity: ${capacity.trim()}\nCoverage: ${locationCoverage.trim()}`
                  : `I-publish ang ${serviceType} service na ito?\n\n${serviceTitle.trim()}\nKapasidad: ${capacity.trim()}\nSakop: ${locationCoverage.trim()}`)) return;
                if (onAddOfferedService) {
                  onAddOfferedService({
                    serviceType,
                    title: serviceTitle.trim(),
                    truckType: truckType.trim(),
                    capacity: capacity.trim(),
                    locationCoverage: locationCoverage.trim(),
                    rateInfo: rateInfo.trim(),
                    notes: serviceNotes.trim(),
                    providerPhone: contactPhone.trim(),
                    companyName: companyName || user.businessName || user.name,
                    isAvailable: true,
                  });
                }
                setShowPostServiceModal(false);
              }}
              className="p-4 md:p-6 space-y-5 overflow-y-auto max-h-[78vh]"
            >
              {/* Category Selector Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                  {lang === 'en' ? 'Step 1: Choose Service Category First' : 'Hakbang 1: Pumili Muna ng Kategorya ng Serbisyo'} *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectServiceCategory('transport')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      serviceType === 'transport'
                        ? 'bg-cyan-500 text-white border-cyan-500 shadow-md shadow-cyan-500/20 font-bold scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-cyan-400'
                    }`}
                  >
                    <span className="text-xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconTruck size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></span>
                    <span className="text-[11px] leading-tight font-extrabold">
                      {lang === 'en' ? 'Transportation / Truck' : 'Hakot / Trucking'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectServiceCategory('storage')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      serviceType === 'storage'
                        ? 'bg-cyan-500 text-white border-cyan-500 shadow-md shadow-cyan-500/20 font-bold scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-cyan-400'
                    }`}
                  >
                    <span className="text-xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconBuildingFactory size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></span>
                    <span className="text-[11px] leading-tight font-extrabold">
                      {lang === 'en' ? 'Cold Storage / Warehouse' : 'Bodega / Cold Storage'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectServiceCategory('drying')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      serviceType === 'drying'
                        ? 'bg-cyan-500 text-white border-cyan-500 shadow-md shadow-cyan-500/20 font-bold scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-cyan-400'
                    }`}
                  >
                    <span className="text-xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconSun size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></span>
                    <span className="text-[11px] leading-tight font-extrabold">
                      {lang === 'en' ? 'Mechanical Dryer' : 'Mechanical Dryer'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectServiceCategory('milling')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      serviceType === 'milling'
                        ? 'bg-cyan-500 text-white border-cyan-500 shadow-md shadow-cyan-500/20 font-bold scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-cyan-400'
                    }`}
                  >
                    <span className="text-xl"><span className="inline-flex items-center gap-1.5 align-middle"><IconSettings size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></span>
                    <span className="text-[11px] leading-tight font-extrabold">
                      {lang === 'en' ? 'Rice Mill Service' : 'Gilingan ng Palay'}
                    </span>
                  </button>
                </div>
              </div>

              {serviceType && (
                /* Information Text Box Form - Suddenly Appears when Category is Selected */
                <motion.div
                  key={serviceType}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'en' ? 'Service Title' : 'Pamagat ng Serbisyo'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={serviceTitle}
                      onChange={(e) => setServiceTitle(e.target.value)}
                      placeholder={
                        serviceType === 'transport' ? 'e.g. Buyer Hauling Truck - Free Farm Pickup' :
                        serviceType === 'storage' ? 'e.g. Ventilated Palay Warehouse & Cold Storage' :
                        serviceType === 'drying' ? 'e.g. Mechanical Recirculating Palay Dryer' :
                        'e.g. High Recovery Rice Mill Processing'
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'en' ? 'Vehicle / Equipment / Facility Type' : 'Uri ng Sasakyan / Equipment'}
                      </label>
                      <input
                        type="text"
                        value={truckType}
                        onChange={(e) => setTruckType(e.target.value)}
                        placeholder={
                          serviceType === 'transport' ? 'e.g. 6-Wheeler Medium Duty Truck' :
                          serviceType === 'storage' ? 'e.g. Secure Dry Warehouse Facility' :
                          serviceType === 'drying' ? 'e.g. Batch Recirculating Dryer (Biomass/Gas)' :
                          'e.g. Modern Multi-Pass Rice Mill'
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'en' ? 'Load Capacity' : 'Kapasidad ng Sakay'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        placeholder={
                          serviceType === 'transport' ? 'e.g. 5,000 kg (100 sacks)' :
                          serviceType === 'storage' ? 'e.g. 50,000 kg (1,000 sacks)' :
                          serviceType === 'drying' ? 'e.g. 10,000 kg per batch' :
                          'e.g. 15,000 kg / day'
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'en' ? 'Coverage Area / Location' : 'Lugar ng Biyahe / Sakop'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={locationCoverage}
                        onChange={(e) => setLocationCoverage(e.target.value)}
                        placeholder={
                          serviceType === 'transport' ? 'e.g. Cabanatuan City, Arayat, Candaba, & nearby' :
                          serviceType === 'storage' ? 'e.g. San Jose City & Central Luzon Hub' :
                          serviceType === 'drying' ? 'e.g. Tarlac & Nueva Ecija Area' :
                          'e.g. Guimba & Talavera, Nueva Ecija'
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'en' ? 'Contact Number' : 'Numero sa Telepono'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="0917-XXX-XXXX"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'en' ? 'Fee / Rate Policy' : 'Kapasidad / Libreng Sundo Policy'}
                    </label>
                    <input
                      type="text"
                      value={rateInfo}
                      onChange={(e) => setRateInfo(e.target.value)}
                      placeholder={
                        serviceType === 'transport' ? 'e.g. FREE Farm Pickup on 2,000kg+ purchases' :
                        serviceType === 'storage' ? 'e.g. ₱0.50 per sack / week' :
                        serviceType === 'drying' ? 'e.g. ₱45.00 per sack (14% moisture target)' :
                        'e.g. ₱2.00 per kg palay input'
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'en' ? 'Additional Service Details' : 'Karagdagang Detalye'}
                    </label>
                    <textarea
                      rows={2}
                      value={serviceNotes}
                      onChange={(e) => setServiceNotes(e.target.value)}
                      placeholder={
                        serviceType === 'transport' ? 'e.g. Heavy tarpaulin cover, digital scale provided.' :
                        serviceType === 'storage' ? 'e.g. Humidity and pest-controlled with 24/7 security.' :
                        serviceType === 'drying' ? 'e.g. Fast 12-hour drying preserving optimal head-rice quality.' :
                        'e.g. 68% head rice recovery with automatic bran separation.'
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </motion.div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPostServiceModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  {lang === 'en' ? 'Cancel' : 'Kanselahin'}
                </button>
                <button
                  type="submit"
                  disabled={!serviceType}
                  className={`px-6 py-2.5 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 ${
                    serviceType
                      ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20 cursor-pointer'
                      : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Post Service Now' : 'I-post ang Serbisyo'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Verification & Price Offer Submission Modal */}
      {showOfferModal && selectedHarvest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl md:rounded-3xl w-full max-w-7xl shadow-2xl overflow-hidden my-auto max-h-[calc(100dvh-1.5rem)] md:max-h-[96vh] flex flex-col"
          >
            <div className="px-6 py-4 flex items-center justify-between bg-cyan-600 dark:bg-cyan-700 text-white shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 bg-white/10 rounded-xl backdrop-blur-xs"><span className="inline-flex items-center gap-1.5 align-middle"><IconCoin size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></span>
                <div>
                  <h3 className="font-extrabold text-lg font-display">
                    {lang === 'en' ? 'Submit Price Offer for Harvest' : 'Mag-Offer ng Presyo sa Palay'}
                  </h3>
                  <p className="text-xs text-cyan-100 font-medium">
                    {lang === 'en' ? 'Send your price and purchase details directly to the farmer' : 'Ipadala ang iyong presyo at detalye ng pagbili diretso sa magsasaka'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOfferModal(false)}
                className="text-white/80 hover:text-white font-bold text-xl cursor-pointer p-1 rounded-full hover:bg-white/10 transition-all"
                aria-label="Close price offer"
              ><span className="inline-flex items-center gap-1.5 align-middle"><IconX size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></button>
            </div>

            <form onSubmit={handleSendOffer} className="px-5 py-10 sm:px-6 sm:py-12 text-left overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* LEFT COLUMN: Product Overview & Deal Value Summary */}
                <div className="md:col-span-5 space-y-4 flex flex-col">
                  {/* Product Info Card with Photo & Moisture Level */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3 shadow-xs">
                    {selectedHarvest.photoUrl && (
                      <div className="relative h-44 w-full rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-inner">
                        <img 
                          src={selectedHarvest.photoUrl} 
                          alt={selectedHarvest.cropType} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {selectedHarvest.moistureLevel && (
                          <div className="absolute top-2.5 left-2.5 bg-slate-900/90 backdrop-blur-md text-emerald-400 font-extrabold text-xs px-2.5 py-1 rounded-lg border border-emerald-500/40 shadow-sm"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconDroplet size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Moisture:"}</span>{selectedHarvest.moistureLevel}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-extrabold uppercase tracking-wider">{t('label_farmer')}: {selectedHarvest.farmerName}</span>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">{selectedHarvest.cropType}</h4>
                        <span className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${selectedHarvest.sellingMethod === 'bidding' ? 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${selectedHarvest.sellingMethod === 'bidding' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
                          {selectedHarvest.sellingMethod === 'bidding'
                            ? (lang === 'en' ? 'Open for bidding' : 'Bukas para sa bidding')
                            : (lang === 'en' ? 'Fixed price — not for bidding' : 'Fixed price — hindi para sa bidding')}
                        </span>
                      </div>
                      {selectedHarvest.targetPrice && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">{selectedHarvest.sellingMethod === 'bidding' ? (lang === 'en' ? 'Starting Bid:' : 'Simulang Bid:') : (lang === 'en' ? 'Farmer Asking Price:' : 'Hiling na Presyo:')}</span>
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                            ₱{selectedHarvest.targetPrice}/{selectedHarvest.priceUnit || 'kg'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700 font-medium">
                      <div><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconMapPin size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{selectedHarvest.location}</div>
                      <div><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconScale size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{selectedHarvest.quantity} {selectedHarvest.unit}</div>
                      <div className="col-span-2 text-[11px] font-bold text-slate-600 dark:text-slate-300"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconCalendar size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Harvest Date' : 'Petsa ng Pag-ani'}: {selectedHarvest.harvestDate}
                      </div>
                      {selectedHarvest.containerQuantity && selectedHarvest.containerType && (
                        <div className="col-span-2 text-[11px] text-slate-500 dark:text-slate-400"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconPackage size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{selectedHarvest.containerQuantity.toLocaleString()} {selectedHarvest.containerType === 'sacks' ? 'sacks/kaban' : 'plastic bags'} × {selectedHarvest.estimatedKgPerContainer?.toLocaleString()} kg
                          <span className="ml-1 font-bold">(measured)</span>
                        </div>
                      )}
                      <div className="col-span-2 mt-1 bg-amber-400 p-2.5 rounded-xl border border-amber-400 text-slate-950 shadow-md shadow-amber-500/20 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold flex items-center gap-1.5 text-xs">
                            <span className="text-sm"><span className="inline-flex items-center gap-1.5 align-middle"><IconDroplet size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></span>
                            <span>{lang === 'en' ? 'Grain Moisture:' : 'Antas ng Basa ng Palay:'}</span>
                          </span>
                          <span className="font-black text-xl leading-tight text-slate-950 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-600/40 font-mono shadow-2xs">
                            {selectedHarvest.moistureLevel || '—'}
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-950 leading-tight flex items-start gap-1 pt-0.5 border-t border-amber-700/30">
                          <span className="text-sm font-extrabold">
                            {lang === 'en' ? selectedMoisture.labelEn : selectedMoisture.labelTl}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Highest Bid Yellow Card */}
                  {selectedHarvest.sellingMethod === 'bidding' && <div className="order-2 flex h-full flex-col justify-between rounded-2xl border border-amber-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      {lang === 'en' ? 'Highest Bid On Harvest' : 'Pinakamataas na Tawag sa Ani'}
                    </h5>
                    <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {highestOfferPrice ? `₱${highestOfferPrice.toFixed(2)}` : (lang === 'en' ? 'No bids yet' : 'Wala pang bid')}
                      {highestOfferPrice && <span className="text-xs font-bold text-slate-900 dark:text-white font-sans"> / kg</span>}
                    </div>
                    <p className="mt-2 text-[10px] font-semibold text-slate-900 dark:text-white">
                      {selectedHarvestOffers.length} {lang === 'en' ? (selectedHarvestOffers.length === 1 ? 'bid' : 'bids') : 'tawag'}
                      {highestOfferPrice ? ` · ${lang === 'en' ? 'Total' : 'Kabuuan'}: ₱${(highestOfferPrice * (selectedHarvest.quantity || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                    </p>
                  </div>}

                  {/* Summary Callout Box */}
                  <div className={`order-1 flex h-full flex-col justify-between rounded-2xl border border-emerald-700 bg-white dark:bg-slate-900 p-4 ${selectedHarvest.sellingMethod === 'bidding' ? '' : 'sm:col-span-2'}`}>
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      {lang === 'en' ? 'Deal Estimate' : 'Tinatayang Halaga'}
                    </h5>
                    <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white font-mono">
                      ₱{((quantityWanted || 0) * (offerPrice || 0)).toLocaleString()}
                    </div>
                    <p className="mt-2 text-[10px] font-semibold text-slate-900 dark:text-white">
                      {lang === 'en' ? 'Market reference' : 'Presyo sa merkado'}: ₱{marketReferencePrice.toFixed(2)}/kg
                    </p>
                  </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Private price offer fields */}
                <div className="md:col-span-7 space-y-3.5">
                  
                  {/* PRICE OFFER & QUANTITY INPUTS */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2.5">
                    <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider block"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconCash size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Your Price Offer' : 'Mga Detalye ng Iyong Alok'}
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex flex-col gap-1 mb-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                            {lang === 'en' ? 'Price Offer (₱/kg)' : 'Halaga ng Offer (₱/kg)'}
                          </label>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-extrabold text-cyan-800 dark:text-cyan-200 bg-cyan-100 dark:bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-300 dark:border-cyan-800 flex items-center gap-1 shadow-2xs"><span className="inline-flex items-center gap-1.5 align-middle"><IconBuildingBank size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'DA Ref:' : 'DA Ref:'} <strong>₱{marketReferencePrice.toFixed(2)}/kg</strong>
                            </span>
                            {highestOfferPrice ? (
                              <span className="hidden"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconFlame size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Top:' : 'Pinakamataas:'}{' '}
                                <strong className="font-black text-amber-900 dark:text-amber-200">
                                  ₱{highestOfferPrice.toFixed(2)}
                                </strong>
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="relative">
                          <span className={`absolute left-3 top-2 text-base font-black ${offerPrice < marketReferencePrice ? 'text-red-500' : 'text-emerald-600'}`}>₱</span>
                          <input
                            type="number"
                            step="0.10"
                            min="0"
                            required
                            value={offerPrice === 0 ? '' : offerPrice}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setOfferPrice(0);
                              } else {
                                setOfferPrice(parseFloat(val) || 0);
                              }
                            }}
                            placeholder={marketReferencePrice.toFixed(2)}
                            className={`w-full pl-7 pr-12 py-2 rounded-xl text-base font-black focus:outline-none focus:ring-2 transition-colors ${
                              offerPrice < marketReferencePrice
                                ? 'bg-red-50/70 dark:bg-red-950/30 border-2 border-red-500 text-red-700 dark:text-red-300 focus:ring-red-400'
                                : 'bg-white dark:bg-slate-900 border-2 border-emerald-500 text-slate-900 dark:text-white focus:ring-emerald-400'
                            }`}
                          />
                          <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-slate-400 uppercase">
                            / kg
                          </span>
                        </div>
                        {offerPrice < marketReferencePrice && (
                          <p className="text-[10px] font-extrabold text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 leading-tight">
                            <span><span className="inline-flex items-center gap-1.5 align-middle"><IconAlertTriangle size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></span>
                            <span>
                              {lang === 'en'
                                ? `Offer must be at least the DA Reference Price (₱${marketReferencePrice.toFixed(2)}/kg).`
                                : `Ang alok ay dapat hindi bababa sa DA Reference Price (₱${marketReferencePrice.toFixed(2)}/kg).`}
                            </span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          {lang === 'en' ? 'Quantity Wanted (kg)' : 'Dami ng Bibilhin (kg)'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            required
                            value={quantityWanted}
                            onChange={(e) => setQuantityWanted(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          />
                          <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                            kg
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase block">
                        {lang === 'en' ? 'Preferred Collection Date' : 'Petsa ng Pagkuha / Pickup'}
                      </label>
                      <input
                        type="date"
                        required
                        value={preferredCollectionDate}
                        onChange={(e) => setPreferredCollectionDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
                      />
                  </div>

                  {/* Additional Message */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase block"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconMessage size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Additional Message' : 'Karagdagang Mensahe sa Magsasaka'}
                    </label>
                    <input
                      type="text"
                      value={buyerNotes}
                      onChange={(e) => setBuyerNotes(e.target.value)}
                      placeholder={lang === 'en' ? 'e.g., Ready for pickup tomorrow cash on pick-up.' : 'hal. Handa para sa pickup bukas, bayad agad.'}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl text-xs"
                    />
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="agree-terms"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="agree-terms" className="text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer">
                      {lang === 'en' 
                        ? 'I agree to purchase based on the posted information.' 
                        : 'Sumasang-ayon ako na bumili batay sa nakagisnang impormasyon ng ani.'}
                    </label>
                  </div>

                  {/* ID verification */}
                  {govIdData && (
                    <div className="space-y-1">
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={govIdData} 
                            alt="Uploaded ID" 
                            className="object-cover w-16 h-10 rounded"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400"><span className="inline-flex items-center gap-1.5 align-middle"><IconCheck size={14} stroke={2} aria-hidden="true" className="inline-block shrink-0 text-emerald-500" />{"Government ID Attached"}</span></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setGovIdData('')}
                          className="text-xs font-bold text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      id="cancel-offer"
                      onClick={() => setShowOfferModal(false)}
                      className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      {t('btn_cancel')}
                    </button>
                    <button
                      type="submit"
                      id="submit-offer"
                      disabled={!buyerName || !buyerPhone || !offerPrice || offerPrice < marketReferencePrice}
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                    ><span className="inline-flex items-center gap-1.5 align-middle"><IconMail size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{editingOffer ? (lang === 'en' ? 'Save Offer Changes' : 'I-save ang Pagbabago') : (lang === 'en' ? 'Send Price Offer' : 'Ipadala ang Price Offer')}
                    </button>
                  </div>

                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {cancelOfferTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl border border-red-900 bg-white dark:bg-slate-900 p-6 text-slate-900 dark:text-white shadow-2xl">
            <h2 className="text-xl font-black">Cancel Price Offer</h2>
            <div className="mt-4 rounded-xl bg-slate-100 dark:bg-slate-800 p-4 text-sm"><b>{cancelOfferTarget.cropType}</b><p className="mt-1 text-slate-400">₱{cancelOfferTarget.offerPrice.toFixed(2)}/kg • {(cancelOfferTarget.quantityWanted || cancelOfferTarget.quantity).toLocaleString()} kg</p></div>
            <label className="mt-4 block text-xs font-bold text-slate-700 dark:text-slate-300">Reason for cancellation *</label>
            <textarea autoFocus required value={cancelOfferReason} onChange={(e) => setCancelOfferReason(e.target.value)} placeholder="Tell the farmer why you are cancelling…" className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-3 text-sm outline-none focus:border-red-500" />
            <p className="mt-2 text-xs text-amber-300">The farmer will be notified and this pending offer cannot be restored.</p>
            <div className="mt-5 flex gap-3"><button type="button" onClick={() => setCancelOfferTarget(null)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-3 text-sm font-bold">Keep Offer</button><button type="button" disabled={!cancelOfferReason.trim()} onClick={() => { onCancelOffer(cancelOfferTarget.id, cancelOfferReason.trim()); setCancelOfferTarget(null); }} className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-black disabled:opacity-50">Cancel Offer</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
