import React, { useMemo, useState } from 'react';
import { AppNotification, LogisticsServiceProfile, LogisticsServiceType, OfferedService, ServiceRequest, UserAccount } from '../types';
import { CheckCircle2, Clock, HardDrive, MapPin, Package, Plus, Settings, Truck, Wheat, Wind, XCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import AnnouncementsBoard from './AnnouncementsBoard';
import { useApp } from '../context/AppContext';
import { askConfirmation, confirmDialog } from '../lib/appDialog';

interface Props {
  user: UserAccount;
  serviceRequests: ServiceRequest[];
  offeredServices: OfferedService[];
  onAcceptService: (id: string) => void;
  onRejectService: (id: string) => void;
  onCompleteService: (id: string) => void;
  onAddOfferedService: (service: Omit<OfferedService, 'id' | 'providerEmail' | 'providerName' | 'providerRole' | 'createdAt'>) => void;
  onToggleOfferedServiceStatus: (id: string) => void;
  onDeleteOfferedService: (id: string) => void;
  onUpdateUser: (originalName: string, updated: UserAccount) => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onClearAllNotifications: (email: string) => void;
  onLogout: () => void;
}

const SERVICE_META: Record<LogisticsServiceType, { label: string; tl: string; icon: React.ReactNode; color: string }> = {
  transport: { label: 'Trucking', tl: 'Trucking / Pagbibiyahe', icon: <Truck className="w-5 h-5" />, color: 'blue' },
  storage: { label: 'Storage', tl: 'Imbakan', icon: <HardDrive className="w-5 h-5" />, color: 'violet' },
  drying: { label: 'Drying', tl: 'Patuyuan', icon: <Wind className="w-5 h-5" />, color: 'cyan' },
  milling: { label: 'Milling', tl: 'Gilingan', icon: <Wheat className="w-5 h-5" />, color: 'amber' },
};

const EMPTY_PROFILE: LogisticsServiceProfile = { enabled: false, approvalStatus: 'inactive', isAvailable: false, capacity: '', rateInfo: '', locationCoverage: '', notes: '' };

export default function LogisticsDashboard(props: Props) {
  const { lang } = useApp();
  const { user } = props;
  const [activeTab, setActiveTab] = useState('announcements');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [serviceDrafts, setServiceDrafts] = useState(user.logisticsServices || {});
  const [saveMessage, setSaveMessage] = useState('');
  const [offerFormOpen, setOfferFormOpen] = useState(false);
  const [offer, setOffer] = useState({ title: '', capacity: '', rateInfo: '', locationCoverage: '', notes: '' });
  const [serviceToggleConfirmation, setServiceToggleConfirmation] = useState<LogisticsServiceType | null>(null);

  const selectedService = activeTab.startsWith('service_') ? activeTab.replace('service_', '') as LogisticsServiceType : null;
  const myOffers = props.offeredServices.filter((item) => item.providerEmail === user.email);

  const requests = useMemo(() => selectedService ? props.serviceRequests.filter((request) => request.type === selectedService) : [], [props.serviceRequests, selectedService]);
  const available = requests.filter((request) =>
    request.status === 'pending' &&
    (!request.operatorEmail || request.operatorEmail === user.email)
  );
  const active = requests.filter((request) => request.status === 'matched' && request.operatorEmail === user.email);
  const completed = requests.filter((request) => request.status === 'completed' && request.operatorEmail === user.email);

  const updateDraft = (type: LogisticsServiceType, patch: Partial<LogisticsServiceProfile>) => {
    const current = serviceDrafts[type] || EMPTY_PROFILE;
    setServiceDrafts({ ...serviceDrafts, [type]: { ...current, ...patch } });
  };

  const toggleOwnedService = (type: LogisticsServiceType) => {
    const current = serviceDrafts[type] || EMPTY_PROFILE;
    updateDraft(type, current.enabled
      ? { enabled: false, isAvailable: false, approvalStatus: 'inactive' }
      : { enabled: true, isAvailable: false, approvalStatus: 'pending' });
    setServiceToggleConfirmation(null);
  };

  const saveServices = () => {
    props.onUpdateUser(user.name, { ...user, role: 'logistics', logisticsServices: serviceDrafts });
    setSaveMessage(lang === 'en' ? 'Services saved. Newly added services are pending admin approval.' : 'Nai-save na. Ang bagong serbisyo ay naghihintay ng approval ng admin.');
    setTimeout(() => setSaveMessage(''), 3500);
  };

  const publishOffer = async () => {
    if (!selectedService || !offer.title.trim() || !offer.capacity.trim() || !offer.rateInfo.trim() || !offer.locationCoverage.trim()) return;
    if (!await confirmDialog(lang === 'en'
      ? `Publish this ${SERVICE_META[selectedService].label} service?\n\n${offer.title.trim()}\nCapacity: ${offer.capacity.trim()}\nRate: ${offer.rateInfo.trim()}`
      : `I-publish ang ${SERVICE_META[selectedService].tl} service na ito?\n\n${offer.title.trim()}\nKapasidad: ${offer.capacity.trim()}\nPresyo: ${offer.rateInfo.trim()}`, { title: lang === 'en' ? 'Publish service?' : 'I-publish ang serbisyo?', tone: 'success', confirmLabel: lang === 'en' ? 'Publish Service' : 'I-publish' })) return;
    props.onAddOfferedService({
      serviceType: selectedService,
      title: offer.title.trim(),
      capacity: offer.capacity.trim(),
      rateInfo: offer.rateInfo.trim(),
      locationCoverage: offer.locationCoverage.trim(),
      notes: offer.notes.trim(),
      companyName: user.businessName || user.name,
      providerPhone: user.contactNumber,
      isAvailable: true,
    });
    setOffer({ title: '', capacity: '', rateInfo: '', locationCoverage: '', notes: '' });
    setOfferFormOpen(false);
  };

  const renderRequest = (request: ServiceRequest, mode: 'available' | 'active' | 'completed') => (
    <div key={request.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs font-bold text-emerald-600 uppercase">{request.type}</p><h3 className="font-extrabold text-slate-900 dark:text-white">{request.cropType}</h3></div>
        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">{request.status}</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-300">
        <span className="flex gap-2"><Package className="w-4 h-4" />{request.quantity.toLocaleString()} {request.unit}</span>
        <span className="flex gap-2"><MapPin className="w-4 h-4" />{request.location}</span>
        <span className="flex gap-2"><Clock className="w-4 h-4" />{request.preferredDate || request.createdAt}</span>
        <span>{lang === 'en' ? 'Farmer' : 'Magsasaka'}: <strong>{request.farmerName}</strong></span>
      </div>
      {mode === 'available' && <div className="flex gap-3"><button onClick={() => askConfirmation(lang === 'en' ? 'Reject this service request?' : 'Tanggihan ang service request na ito?', () => props.onRejectService(request.id), { tone: 'danger', confirmLabel: lang === 'en' ? 'Reject Request' : 'Tanggihan' })} className="flex-1 rounded-xl border border-red-500 py-2 text-sm font-bold text-red-500 cursor-pointer">{lang === 'en' ? 'Reject' : 'Tanggihan'}</button><button onClick={() => askConfirmation(lang === 'en' ? 'Accept this request and take responsibility for the job?' : 'Tanggapin at akuin ang request na ito?', () => props.onAcceptService(request.id), { tone: 'success', confirmLabel: lang === 'en' ? 'Accept Request' : 'Tanggapin' })} className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-bold text-white cursor-pointer">{lang === 'en' ? 'Accept Request' : 'Tanggapin'}</button></div>}
      {mode === 'active' && <button onClick={() => askConfirmation(lang === 'en' ? 'Mark this service job as completed? This will close the job.' : 'Markahan itong completed? Isasara nito ang trabaho.', () => props.onCompleteService(request.id), { tone: 'success', confirmLabel: lang === 'en' ? 'Mark Completed' : 'Markahan na Tapos' })} className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white cursor-pointer flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" />{lang === 'en' ? 'Mark Completed' : 'Markahan na Tapos'}</button>}
    </div>
  );

  return <div className="h-dvh max-h-dvh overflow-hidden bg-slate-50/80 dark:bg-slate-950/92 flex flex-col">
    <div className="flex-1 min-h-0 flex overflow-hidden">
      <Sidebar user={user} activeTab={activeTab} onSelectTab={setActiveTab} isMobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} onUpdateUser={props.onUpdateUser} onLogout={props.onLogout} notifications={props.notifications} onMarkNotificationRead={props.onMarkNotificationRead} />
      <main className="dashboard-main flex-1 min-w-0 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'announcements' && <AnnouncementsBoard user={user} notifications={props.notifications} onMarkNotificationRead={props.onMarkNotificationRead} onClearAllNotifications={props.onClearAllNotifications} onNavigateToFeature={setActiveTab} />}
        {activeTab === 'services_settings' && <div className="space-y-6">
          <div><h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{lang === 'en' ? 'Manage My Services' : 'Pamahalaan ang Aking Serbisyo'}</h1><p className="text-sm text-slate-500">{lang === 'en' ? 'Add, deactivate, and update the services your business owns.' : 'Magdagdag, mag-deactivate, at mag-update ng mga serbisyong pag-aari mo.'}</p></div>
          <div className="grid lg:grid-cols-2 gap-6">{(Object.keys(SERVICE_META) as LogisticsServiceType[]).map((type) => {
            const profile = serviceDrafts[type] || EMPTY_PROFILE; const meta = SERVICE_META[type];
            return <section key={type} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
              <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3 text-slate-900 dark:text-white">{meta.icon}<h2 className="font-extrabold">{lang === 'en' ? meta.label : meta.tl}</h2></div><button type="button" role="switch" aria-checked={profile.enabled} aria-label={`${profile.enabled ? 'Disable' : 'Enable'} ${meta.label}`} onClick={() => setServiceToggleConfirmation(type)} className={`relative h-8 w-14 shrink-0 overflow-hidden rounded-full p-1 transition-colors cursor-pointer ${profile.enabled ? 'bg-emerald-600' : 'bg-slate-400'}`}><span className={`block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${profile.enabled ? 'translate-x-6' : 'translate-x-0'}`} /></button></div>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${profile.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : profile.approvalStatus === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{profile.approvalStatus}</span>
              {profile.enabled && <div className="grid gap-3">{(['capacity','rateInfo','locationCoverage'] as const).map((field) => <input key={field} value={profile[field] || ''} onChange={(e) => updateDraft(type, { [field]: e.target.value })} placeholder={field === 'capacity' ? 'Capacity (e.g. 5,000 kg)' : field === 'rateInfo' ? 'Rates (e.g. ₱1.50/kg)' : 'Service coverage / location'} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2.5 text-sm text-slate-900 dark:text-white" />)}<textarea value={profile.notes || ''} onChange={(e) => updateDraft(type, { notes: e.target.value })} placeholder="Equipment and service details" className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2.5 text-sm text-slate-900 dark:text-white" /></div>}
            </section>;
          })}</div>
          {saveMessage && <p className="rounded-xl bg-emerald-100 p-3 text-sm font-bold text-emerald-800">{saveMessage}</p>}
          <button onClick={saveServices} className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white cursor-pointer">{lang === 'en' ? 'Save Service Changes' : 'I-save ang Pagbabago'}</button>
        </div>}
        {selectedService && (() => { const profile = user.logisticsServices?.[selectedService] || serviceDrafts[selectedService] || EMPTY_PROFILE; const meta = SERVICE_META[selectedService]; return <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">{meta.icon}{lang === 'en' ? meta.label : meta.tl}</h1><p className="text-sm text-slate-500">{lang === 'en' ? 'Offer this service and manage farmer requests.' : 'Mag-alok ng serbisyo at pamahalaan ang mga request.'}</p></div>{profile.approvalStatus === 'approved' && <button onClick={() => setOfferFormOpen(!offerFormOpen)} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white cursor-pointer flex items-center gap-2"><Plus className="w-4 h-4" />{lang === 'en' ? 'Offer This Service' : 'Mag-alok ng Serbisyo'}</button>}</div>
          {!profile.enabled || profile.approvalStatus === 'inactive' ? <div className="rounded-2xl border border-dashed border-slate-400 p-10 text-center"><XCircle className="mx-auto w-10 h-10 text-slate-400" /><h2 className="mt-3 font-bold text-slate-900 dark:text-white">{lang === 'en' ? 'Service Not Activated' : 'Hindi Pa Aktibo ang Serbisyo'}</h2><button onClick={() => setActiveTab('services_settings')} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white cursor-pointer">{lang === 'en' ? 'Manage Services' : 'Pamahalaan'}</button></div> : profile.approvalStatus === 'pending' ? <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-8 text-center text-amber-800 dark:text-amber-300"><Clock className="mx-auto w-9 h-9" /><h2 className="mt-3 font-bold">{lang === 'en' ? 'Pending Admin Approval' : 'Naghihintay ng Admin Approval'}</h2><p className="mt-2 text-sm">{lang === 'en' ? 'Your details are saved. Requests and public offers unlock after approval.' : 'Nai-save ang detalye. Magbubukas ang requests at offers pagkatapos ma-approve.'}</p></div> : <>
            {offerFormOpen && <div className="rounded-2xl border border-emerald-300 bg-white dark:bg-slate-900 p-5 grid sm:grid-cols-2 gap-3"><input placeholder="Service title" value={offer.title} onChange={(e) => setOffer({...offer,title:e.target.value})} className="rounded-xl border p-3 bg-transparent dark:text-white" /><input placeholder="Capacity" value={offer.capacity} onChange={(e) => setOffer({...offer,capacity:e.target.value})} className="rounded-xl border p-3 bg-transparent dark:text-white" /><input placeholder="Rate" value={offer.rateInfo} onChange={(e) => setOffer({...offer,rateInfo:e.target.value})} className="rounded-xl border p-3 bg-transparent dark:text-white" /><input placeholder="Coverage / location" value={offer.locationCoverage} onChange={(e) => setOffer({...offer,locationCoverage:e.target.value})} className="rounded-xl border p-3 bg-transparent dark:text-white" /><textarea placeholder="Notes" value={offer.notes} onChange={(e) => setOffer({...offer,notes:e.target.value})} className="sm:col-span-2 rounded-xl border p-3 bg-transparent dark:text-white" /><button onClick={publishOffer} className="sm:col-span-2 rounded-xl bg-emerald-600 py-3 font-bold text-white cursor-pointer">{lang === 'en' ? 'Publish Service Offer' : 'I-publish ang Serbisyo'}</button></div>}
            <div className="grid sm:grid-cols-3 gap-4">{[['Available Requests',available.length],['Active Jobs',active.length],['Completed',completed.length]].map(([label,count]) => <div key={String(label)} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5"><p className="text-xs text-slate-500">{label}</p><strong className="text-2xl text-slate-900 dark:text-white">{count}</strong></div>)}</div>
            <section className="space-y-3"><h2 className="font-extrabold text-slate-900 dark:text-white">{lang === 'en' ? 'Available Requests' : 'Mga Available na Request'}</h2>{available.length ? <div className="grid lg:grid-cols-2 gap-4">{available.map((r) => renderRequest(r,'available'))}</div> : <p className="rounded-2xl bg-white dark:bg-slate-900 p-8 text-center text-slate-500">No available requests.</p>}</section>
            {active.length > 0 && <section className="space-y-3"><h2 className="font-extrabold text-slate-900 dark:text-white">Active Jobs</h2><div className="grid lg:grid-cols-2 gap-4">{active.map((r) => renderRequest(r,'active'))}</div></section>}
            {myOffers.filter((item) => item.serviceType === selectedService).length > 0 && <section className="space-y-3"><h2 className="font-extrabold text-slate-900 dark:text-white">My Published Offers</h2>{myOffers.filter((item) => item.serviceType === selectedService).map((item) => <div key={item.id} className="rounded-xl bg-white dark:bg-slate-900 border p-4 flex items-center justify-between gap-3"><div><strong className="text-slate-900 dark:text-white">{item.title}</strong><p className="text-xs text-slate-500">{item.capacity} • {item.rateInfo}</p></div><div className="flex gap-2"><button onClick={() => { if (!item.isAvailable) props.onToggleOfferedServiceStatus(item.id); else askConfirmation(lang === 'en' ? `Pause “${item.title}”? Farmers will temporarily stop seeing it.` : `I-pause ang “${item.title}”? Pansamantalang hindi ito makikita ng mga farmer.`, () => props.onToggleOfferedServiceStatus(item.id), { confirmLabel: lang === 'en' ? 'Pause Service' : 'I-pause' }); }} className="rounded-lg border px-3 py-2 text-xs font-bold cursor-pointer">{item.isAvailable ? 'Pause' : 'Activate'}</button><button onClick={() => askConfirmation(lang === 'en' ? `Delete “${item.title}” permanently?` : `Permanenteng burahin ang “${item.title}”?`, () => props.onDeleteOfferedService(item.id), { tone: 'danger', confirmLabel: lang === 'en' ? 'Delete Service' : 'Burahin' })} className="rounded-lg border border-red-400 px-3 py-2 text-xs font-bold text-red-500 cursor-pointer">Delete</button></div></div>)}</section>}
          </>}
        </div>; })()}
      </main>
    </div>
    {serviceToggleConfirmation && (() => {
      const profile = serviceDrafts[serviceToggleConfirmation] || EMPTY_PROFILE;
      const meta = SERVICE_META[serviceToggleConfirmation];
      const enabling = !profile.enabled;
      return <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="service-toggle-title">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <button type="button" aria-label="Close popup" onClick={() => setServiceToggleConfirmation(null)} className="float-right relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-slate-500/20">&times;</button>
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${enabling ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950' : 'bg-amber-100 text-amber-600 dark:bg-amber-950'}`}>{enabling ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}</div>
          <h2 id="service-toggle-title" className="text-center text-xl font-extrabold text-slate-900 dark:text-white">{lang === 'en' ? `${enabling ? 'Turn on' : 'Turn off'} ${meta.label}?` : `${enabling ? 'I-on' : 'I-off'} ang ${meta.tl}?`}</h2>
          <p className="mt-2 text-center text-sm leading-6 text-slate-600 dark:text-slate-300">{enabling
            ? (lang === 'en' ? 'This service will be enabled and sent for admin approval after you save your changes.' : 'Ie-enable ang serbisyong ito at ipapadala para sa admin approval pagkatapos mong i-save.')
            : (lang === 'en' ? 'This service will be disabled and marked unavailable after you save your changes.' : 'Idi-disable ang serbisyong ito at mamarkahang unavailable pagkatapos mong i-save.')}</p>
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setServiceToggleConfirmation(null)} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer">{lang === 'en' ? 'Cancel' : 'Kanselahin'}</button>
            <button type="button" onClick={() => toggleOwnedService(serviceToggleConfirmation)} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white transition-colors cursor-pointer ${enabling ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}>{lang === 'en' ? `Yes, turn ${enabling ? 'on' : 'off'}` : `Oo, i-${enabling ? 'on' : 'off'}`}</button>
          </div>
        </div>
      </div>;
    })()}
  </div>;
}
