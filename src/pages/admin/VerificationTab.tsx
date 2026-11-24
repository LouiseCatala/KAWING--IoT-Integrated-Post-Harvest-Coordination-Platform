import React, { useState } from 'react';
import { CheckSquare, Search, Check, X, Eye, RefreshCw, FileText, Trash2 } from 'lucide-react';
import { BusinessCapabilityProfile, UserAccount } from '../../types';
import { NotificationBadge } from '../../lib/notificationRouting';

const capabilityProfiles = (user: UserAccount, lang: 'en' | 'tl') => {
  const capabilityLabels: Record<string, string> = lang === 'en' ? {
    buyer: 'Buy / Trade Palay', loan_provider: 'Production Loans', transport: 'Transportation', storage: 'Storage', drying: 'Drying', milling: 'Milling',
  } : {
    buyer: 'Bumili / Magkalakal ng Palay', loan_provider: 'Pautang sa Produksyon', transport: 'Transportasyon', storage: 'Imbakan', drying: 'Pagpapatuyo', milling: 'Paggiling',
  };
  const fieldLabels: Record<string, string> = lang === 'en' ? {
    vehicleType: 'Vehicle type', plateNumber: 'Plate number', carryingCapacity: 'Carrying capacity', capacity: 'Capacity', storageType: 'Storage type', storageCapacity: 'Storage capacity', facilityLocation: 'Facility location', dryerType: 'Dryer type', batchCapacity: 'Batch capacity', millType: 'Mill type', millingCapacity: 'Milling capacity', locationCoverage: 'Service coverage', rateInfo: 'Rate information', notes: 'Notes',
  } : {
    vehicleType: 'Uri ng sasakyan', plateNumber: 'Plaka ng sasakyan', carryingCapacity: 'Kakayahang magdala', capacity: 'Kapasidad', storageType: 'Uri ng imbakan', storageCapacity: 'Kapasidad ng imbakan', facilityLocation: 'Lokasyon ng pasilidad', dryerType: 'Uri ng patuyuan', batchCapacity: 'Kapasidad bawat batch', millType: 'Uri ng gilingan', millingCapacity: 'Kapasidad ng gilingan', locationCoverage: 'Lugar na pinagsisilbihan', rateInfo: 'Impormasyon sa bayad', notes: 'Mga tala',
  };
  return Object.entries({ ...(user.logisticsServices || {}), ...(user.businessCapabilities || {}) } as Record<string, BusinessCapabilityProfile | undefined>)
    .filter(([, profile]) => Boolean(profile?.enabled))
    .map(([type, profile]) => ({
      type,
      title: capabilityLabels[type] || type,
      details: Object.entries(profile as unknown as Record<string, unknown>)
        .filter(([key, value]) => typeof value === 'string' && value.trim() && !/document|approvalStatus|enabled|isAvailable|^documents$/i.test(key))
        .map(([key, value]) => ({ label: fieldLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, first => first.toUpperCase()), value: String(value) })),
    }));
};

const documentsForReview = (user: UserAccount, lang: 'en' | 'tl') => {
  const capabilityLabels: Record<string, string> = lang === 'en' ? {
    buyer: 'Buy / Trade Palay', loan_provider: 'Production Loans', transport: 'Transportation', storage: 'Storage', drying: 'Drying', milling: 'Milling',
  } : {
    buyer: 'Bumili / Magkalakal ng Palay', loan_provider: 'Pautang sa Produksyon', transport: 'Transportasyon', storage: 'Imbakan', drying: 'Pagpapatuyo', milling: 'Paggiling',
  };
  const documents: { label: string; filename?: string; data?: string }[] = [];
  const seenData = new Set<string>();
  const add = (label: string, filename: unknown, data: unknown) => {
    const file = typeof filename === 'string' ? filename : undefined;
    const preview = typeof data === 'string' ? data : undefined;
    if (!file && !preview) return;
    if (preview && seenData.has(preview)) return;
    if (preview) seenData.add(preview);
    documents.push({ label, filename: file, data: preview });
  };
  const rootDocs = user.documents as Record<string, unknown> | undefined;
  const documentLabels: Record<string, string> = {
    avatar: lang === 'en' ? 'Profile photo' : 'Larawan sa profile', govId: user.role === 'farmer' ? 'RSBSA ID' : (lang === 'en' ? 'Company registration ID' : 'ID ng rehistro ng negosyo'),
    license: lang === 'en' ? "Driver's license" : 'Lisensya sa pagmamaneho', orCr: 'OR/CR', proofOwnership: lang === 'en' ? 'Proof of ownership' : 'Katibayan ng pagmamay-ari',
    transportOrCr: lang === 'en' ? 'Transport OR/CR' : 'OR/CR ng sasakyan', storageProof: lang === 'en' ? 'Storage proof' : 'Katibayan ng imbakan', dryingProof: lang === 'en' ? 'Drying proof' : 'Katibayan ng patuyuan', millingProof: lang === 'en' ? 'Milling proof' : 'Katibayan ng gilingan',
  };
  Object.entries(documentLabels).forEach(([key, label]) => add(label, rootDocs?.[key], rootDocs?.[`${key}Data`]));
  const profiles = { ...(user.logisticsServices || {}), ...(user.businessCapabilities || {}) };
  Object.entries(profiles).forEach(([service, profile]) => {
    if (!profile) return;
    Object.entries(profile as unknown as Record<string, unknown>).forEach(([key, value]) => {
      if (!/documentData$/i.test(key) || typeof value !== 'string') return;
      const nameKey = key.replace(/Data$/, '');
      const docName = String((profile as unknown as Record<string, unknown>)[nameKey] || '');
      const detailName = nameKey.replace(/Document$/i, '').replace(/([A-Z])/g, ' $1').trim();
      const label = `${capabilityLabels[service] || service}: ${lang === 'en' ? detailName : detailName.replace(/proof of ownership/i, 'katibayan ng pagmamay-ari').replace(/transport/i, 'sasakyan').replace(/storage/i, 'imbakan').replace(/drying/i, 'patuyuan').replace(/milling/i, 'gilingan')}`;
      add(label, docName, value);
    });
  });
  return documents;
};

interface VerificationTabProps {
  lang: 'en' | 'tl';
  pendingUsers: UserAccount[];
  resubmissionRequests: string[];
  rejectedApplications: UserAccount[];
  onApprove: (name: string) => void;
  onReject: (name: string, reason: string) => void;
  onRequestResubmission: (name: string, reason: string) => void;
  onViewDoc: (name: string, type: string, data: string) => void;
  onDeleteUser: (name: string) => void;
  pendingNotificationCount: number;
  onMarkPendingNotificationsRead: () => void;
}

export default function VerificationTab({
  lang,
  pendingUsers,
  resubmissionRequests,
  rejectedApplications,
  onApprove,
  onReject,
  onRequestResubmission,
  onViewDoc,
  onDeleteUser,
  pendingNotificationCount,
  onMarkPendingNotificationsRead,
}: VerificationTabProps) {
  const [subTab, setSubTab] = useState<'pending' | 'rejected' | 'resubmission'>('pending');
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);
  const [decision, setDecision] = useState<{ user: UserAccount; action: 'approve' | 'reject' | 'correction' } | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const matchesUser = (user: UserAccount) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const profiles = capabilityProfiles(user, lang).flatMap(profile => [profile.title, ...profile.details.flatMap(detail => [detail.label, detail.value])]);
    const documents = documentsForReview(user, lang).flatMap(document => [document.label, document.filename || '']);
    return [
      user.name, user.fullName, user.email, user.contactNumber, ...(user.additionalContactNumbers || []), user.address,
      user.rsbsaNumber, user.contactPersonName, user.legalCompanyName, user.businessName, user.serviceCoverageArea,
      user.operatingAddress, ...profiles, ...documents,
    ].filter(Boolean).join(' ').toLowerCase().includes(query);
  };
  const filteredPendingUsers = pendingUsers.filter(matchesUser);
  const filteredRejectedApplications = rejectedApplications.filter(matchesUser);
  const filteredResubmissions = resubmissionRequests.filter(name => name.toLowerCase().includes(searchQuery.trim().toLowerCase()));
  const accountTypeLabel = (user: UserAccount) =>
    user.role === 'farmer'
      ? (lang === 'en' ? 'Farmer' : 'Magsasaka')
      : (lang === 'en' ? 'Agricultural Business User' : 'Negosyong Pang-agrikultura');

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
            {lang === 'en' ? 'Account Approval Requests' : 'Mga Account na Kailangang Aprubahan'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'en' ? 'Review the applicant’s complete details and submitted documents.' : 'Suriin ang buong impormasyon at mga dokumentong ipinasa ng aplikante.'}
          </p>
        </div>
        <label className="relative block w-full xl:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder={lang === 'en' ? 'Search name, email, contact, service…' : 'Maghanap ng pangalan, email, contact, serbisyo…'} className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
        </label>
      </div>

      {/* Verification Filter Tabs */}
      <div className="flex gap-1.5 flex-wrap border-b border-slate-150 dark:border-slate-800 pb-px">
        <button
          onClick={() => { setSubTab('pending'); onMarkPendingNotificationsRead(); }}
          className={`pb-3 text-xs font-bold px-2.5 transition-all relative cursor-pointer ${
            subTab === 'pending'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
          }`}
        >
          {lang === 'en' ? 'Pending Applications' : 'Mga Naghihintay na Aplikasyon'}
          <NotificationBadge count={Math.max(pendingUsers.length, pendingNotificationCount)} />
        </button>

        <button
          onClick={() => setSubTab('resubmission')}
          className={`pb-3 text-xs font-bold px-2.5 transition-all relative cursor-pointer ${
            subTab === 'resubmission'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
          }`}
        >
          {lang === 'en' ? 'Requested Resubmissions' : 'Kailangan I-resubmit'}
          {resubmissionRequests.length > 0 && (
            <span className="ml-1.5 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold font-mono">
              {resubmissionRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('rejected')}
          className={`pb-3 text-xs font-bold px-2.5 transition-all relative cursor-pointer ${
            subTab === 'rejected'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
          }`}
        >
          {lang === 'en' ? 'Rejected Archives' : 'Tinanggihang Application'}
          {rejectedApplications.length > 0 && (
            <span className="ml-1.5 bg-slate-400 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold font-mono">
              {rejectedApplications.length}
            </span>
          )}
        </button>
      </div>

      {/* CONTENT BOARDS BASED ON SUB TAB */}
      {subTab === 'pending' && (
        <div className="space-y-4">
          {filteredPendingUsers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center rounded-2xl">
              {pendingNotificationCount > 0 && <p className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-300"><NotificationBadge count={pendingNotificationCount} />{lang === 'en' ? 'New account approval notice' : 'May bagong abiso para sa approval ng account'}</p>}
              <CheckSquare className="w-12 h-12 text-emerald-100 dark:text-emerald-950/60 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                {searchQuery ? (lang === 'en' ? 'No applications match your search.' : 'Walang aplikasyong tumutugma sa iyong paghahanap.') : lang === 'en' ? 'No pending applications' : 'Walang nakabinbing aplikasyon'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery ? (lang === 'en' ? 'Try another name, email, contact, or service.' : 'Subukan ang ibang pangalan, email, contact, o serbisyo.') : (lang === 'en' ? 'New farmer and agricultural business applications will appear here.' : 'Dito lalabas ang mga bagong aplikasyon ng magsasaka at negosyong pang-agrikultura.')}
              </p>
            </div>
          ) : (
            filteredPendingUsers.map((u) => (
              <div 
                key={`${u.name}-${u.role}-${u.email || ''}`} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Header Section */}
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        u.role === 'farmer' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' 
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
                      }`}>
                        {accountTypeLabel(u)}
                      </span>
                      <h3 className="text-md font-extrabold text-slate-900 dark:text-white font-display mt-2">
                        {u.role === 'agricultural_business' ? u.legalCompanyName || u.businessName || u.name : u.fullName || u.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{u.role === 'agricultural_business' ? `${lang === 'en' ? 'Account' : 'Account'}: ${u.name}` : u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg">
                        {lang === 'en' ? 'Pending registration' : 'Naghihintay ng approval'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeletingUser(u)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg transition-all cursor-pointer border border-red-100 dark:border-red-900/40"
                        title={lang === 'en' ? 'Delete Application / Account' : 'Burahin ang Application / Account'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <section className="mt-4 border-y border-slate-100 py-4 dark:border-slate-800">
                    <h4 className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">{lang === 'en' ? 'Applicant Information' : 'Impormasyon ng Aplikante'}</h4>
                    <div className="grid grid-cols-1 gap-x-8 gap-y-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
                      <div><span className="block text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Account name' : 'Pangalan ng account'}</span><strong className="mt-0.5 block break-words text-slate-900 dark:text-slate-100">{u.name}</strong></div>
                      <div><span className="block text-slate-500 dark:text-slate-400">{u.role === 'farmer' ? (lang === 'en' ? 'Full name' : 'Buong pangalan') : (lang === 'en' ? 'Contact person' : 'Taong kokontakin')}</span><strong className="mt-0.5 block break-words text-slate-900 dark:text-slate-100">{u.fullName || u.contactPersonName || (lang === 'en' ? 'Not provided' : 'Hindi inilagay')}</strong></div>
                      <div><span className="block text-slate-500 dark:text-slate-400">Email</span><strong className="mt-0.5 block break-all text-slate-900 dark:text-slate-100">{u.email || (lang === 'en' ? 'Not provided' : 'Hindi inilagay')}</strong></div>
                      <div><span className="block text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Primary contact' : 'Pangunahing numero ng kontak'}</span><strong className="mt-0.5 block break-words text-slate-900 dark:text-slate-100">{u.contactNumber || (lang === 'en' ? 'Not provided' : 'Hindi inilagay')}</strong></div>
                      {u.additionalContactNumbers?.length ? <div><span className="block text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Additional contacts' : 'Karagdagang numero ng kontak'}</span><strong className="mt-0.5 block break-words text-slate-900 dark:text-slate-100">{u.additionalContactNumbers.join(', ')}</strong></div> : null}
                      <div className="sm:col-span-2 lg:col-span-1"><span className="block text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Contact address' : 'Address'}</span><strong className="mt-0.5 block break-words text-slate-900 dark:text-slate-100">{u.address || (lang === 'en' ? 'Not provided' : 'Hindi inilagay')}</strong></div>
                      {u.avatarUrl && <div><span className="block text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Profile photo' : 'Larawan sa profile'}</span><strong className="mt-0.5 block break-words text-slate-900 dark:text-slate-100">{lang === 'en' ? 'Provided' : 'Ipinasa'}</strong></div>}
                      {u.role === 'farmer' ? (
                        <div><span className="block text-slate-500 dark:text-slate-400">{lang === 'en' ? 'RSBSA number' : 'Numero ng RSBSA'}</span><strong className="mt-0.5 block break-words text-slate-900 dark:text-slate-100">{u.rsbsaNumber || (lang === 'en' ? 'Not provided' : 'Hindi inilagay')}</strong></div>
                      ) : <>
                        <div><span className="block text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Legal company name' : 'Rehistradong pangalan ng negosyo'}</span><strong className="mt-0.5 block break-words text-slate-900 dark:text-slate-100">{u.legalCompanyName || u.businessName || (lang === 'en' ? 'Not provided' : 'Hindi inilagay')}</strong></div>
                        <div><span className="block text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Operating address' : 'Address ng operasyon'}</span><strong className="mt-0.5 block break-words text-slate-900 dark:text-slate-100">{u.operatingAddress || (lang === 'en' ? 'Not provided' : 'Hindi inilagay')}</strong></div>
                        <div><span className="block text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Service coverage' : 'Lugar na pinagsisilbihan'}</span><strong className="mt-0.5 block break-words text-slate-900 dark:text-slate-100">{u.serviceCoverageArea || (lang === 'en' ? 'Not provided' : 'Hindi inilagay')}</strong></div>
                      </>}
                    </div>
                  </section>

                  {u.role === 'agricultural_business' && (
                    <section className="mt-4">
                      <h4 className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">{lang === 'en' ? 'Registered Business Services' : 'Mga Rehistradong Serbisyo ng Negosyo'}</h4>
                      {capabilityProfiles(u, lang).length ? <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {capabilityProfiles(u, lang).map(profile => <div key={profile.type} className="border-t border-slate-200 pt-3 dark:border-slate-700">
                          <strong className="text-xs text-slate-900 dark:text-slate-100">{profile.title}</strong>
                          {profile.details.length ? <dl className="mt-2 space-y-1.5">{profile.details.map(detail => <div key={`${profile.type}-${detail.label}`} className="text-xs"><dt className="inline text-slate-500 dark:text-slate-400">{detail.label}: </dt><dd className="inline break-words font-semibold text-slate-800 dark:text-slate-200">{detail.value}</dd></div>)}</dl> : <p className="mt-1 text-xs text-slate-500">{lang === 'en' ? 'No extra details provided.' : 'Walang karagdagang detalyeng inilagay.'}</p>}
                        </div>)}
                      </div> : <p className="text-xs text-slate-500 dark:text-slate-400">{lang === 'en' ? 'No business services selected.' : 'Walang piniling serbisyo ng negosyo.'}</p>}
                    </section>
                  )}

                  {u.role === 'agricultural_business' && u.loanConfig && (
                    <section className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                      <h4 className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">{lang === 'en' ? 'Production Loan Details' : 'Detalye ng Pautang sa Produksyon'}</h4>
                      <div className="grid grid-cols-1 gap-x-8 gap-y-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
                        <div><span className="block text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Loan amount range' : 'Saklaw ng halaga ng pautang'}</span><strong className="mt-0.5 block text-slate-900 dark:text-slate-100">&#8369;{u.loanConfig.minAmount.toLocaleString()} – &#8369;{u.loanConfig.maxAmount.toLocaleString()}</strong></div>
                        <div><span className="block text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Available funds' : 'Pondong magagamit'}</span><strong className="mt-0.5 block text-slate-900 dark:text-slate-100">&#8369;{u.loanConfig.availableFund.toLocaleString()}</strong></div>
                        <div><span className="block text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Interest rate' : 'Interest rate'}</span><strong className="mt-0.5 block text-slate-900 dark:text-slate-100">{u.loanConfig.interestRate ?? 5}%</strong></div>
                        <div><span className="block text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Repayment period' : 'Panahon ng pagbabayad'}</span><strong className="mt-0.5 block text-slate-900 dark:text-slate-100">{u.loanConfig.repaymentPeriod}</strong></div>
                        {u.loanConfig.repaymentMethod && <div><span className="block text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Repayment method' : 'Paraan ng pagbabayad'}</span><strong className="mt-0.5 block text-slate-900 dark:text-slate-100">{u.loanConfig.repaymentMethod}</strong></div>}
                        {u.loanConfig.contactNumber && <div><span className="block text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Loan contact' : 'Kontak para sa pautang'}</span><strong className="mt-0.5 block text-slate-900 dark:text-slate-100">{u.loanConfig.contactNumber}</strong></div>}
                        <div className="sm:col-span-2 lg:col-span-3"><span className="block text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Terms and conditions' : 'Mga tuntunin at kundisyon'}</span><strong className="mt-0.5 block whitespace-pre-wrap break-words text-slate-900 dark:text-slate-100">{u.loanConfig.termsAndConditions || (lang === 'en' ? 'Not provided' : 'Hindi inilagay')}</strong></div>
                        {u.loanConfig.additionalRequirements && <div className="sm:col-span-2 lg:col-span-3"><span className="block text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Additional requirements' : 'Karagdagang kailangan'}</span><strong className="mt-0.5 block whitespace-pre-wrap break-words text-slate-900 dark:text-slate-100">{u.loanConfig.additionalRequirements}</strong></div>}
                        {u.loanConfig.notes && <div className="sm:col-span-2 lg:col-span-3"><span className="block text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Loan notes' : 'Mga tala tungkol sa pautang'}</span><strong className="mt-0.5 block whitespace-pre-wrap break-words text-slate-900 dark:text-slate-100">{u.loanConfig.notes}</strong></div>}
                      </div>
                    </section>
                  )}

                  {/* Submitted Documents Section */}
                  <div className="mt-4 space-y-2">
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {lang === 'en' ? 'Documents Provided by the Applicant' : 'Mga Dokumentong Ipinasa ng Aplikante'}
                    </h4>
                    {u.registrationSource === 'kiosk' && (u.registrationDocumentStatus === 'pending_physical_verification' || u.rsbsaDocumentStatus === 'pending_physical_verification') && (
                      <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                        {lang === 'en' ? 'Kiosk registration: check the applicant’s physical registration ID and any selected service documents (OR/CR or facility proof) before approving.' : 'Kiosk registration: suriin ang pisikal na registration ID at mga dokumento ng napiling serbisyo (OR/CR o patunay ng pasilidad) bago aprubahan.'}
                      </p>
                    )}
                    {documentsForReview(u, lang).length ? <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {documentsForReview(u, lang).map((document, index) => document.data ? (
                        <button key={`${document.label}-${index}`} type="button" onClick={() => onViewDoc(u.name, document.label, document.data!)} className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20">
                          <span className="flex min-w-0 items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" /><span className="min-w-0"><span className="block truncate text-xs font-bold text-slate-800 dark:text-slate-100">{document.label}</span>{document.filename && <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{document.filename}</span>}</span></span><Eye className="h-4 w-4 shrink-0 text-slate-400" />
                        </button>
                    ) : <div key={`${document.label}-${index}`} className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700"><FileText className="h-4 w-4 shrink-0 text-slate-400" /><span className="min-w-0"><span className="block text-xs font-bold text-slate-800 dark:text-slate-100">{document.label}</span><span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{document.filename || (lang === 'en' ? 'Preview unavailable' : 'Hindi makita ang preview')}</span></span></div>)}
                    </div> : <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">{lang === 'en' ? 'No files were uploaded.' : 'Walang na-upload na file.'}</p>}
                  </div>
                </div>

                {/* Verification Control Buttons */}
                <div className="mt-6 flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setDecisionReason(''); setDecision({ user: u, action: 'reject' }); }}
                    className="flex-grow py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Reject' : 'Tanggihan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setDecisionReason(''); setDecision({ user: u, action: 'correction' }); }}
                    className="flex-grow py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 text-blue-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Resubmit' : 'I-resubmit'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setDecisionReason(''); setDecision({ user: u, action: 'approve' }); }}
                    className="flex-grow py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Approve' : 'Pagtibayin'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Resubmissions List sub tab */}
      {subTab === 'resubmission' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6">
          <h3 className="text-sm font-extrabold text-slate-950 dark:text-white font-display mb-4">
            {lang === 'en' ? 'Active Resubmission Requests' : 'Naka-pending na Hiling ng Pag-re-submit'}
          </h3>
          {filteredResubmissions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              {searchQuery ? (lang === 'en' ? 'No resubmission requests match your search.' : 'Walang kahilingan sa muling pagpapasa na tumutugma sa paghahanap mo.') : (lang === 'en' ? 'No users currently queued for document resubmission.' : 'Walang nakapilang gumagamit para muling magpasa ng dokumento.')}
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredResubmissions.map((name) => (
                <div key={name} className="py-3 flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">{name}</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                    {lang === 'en' ? 'Waiting for upload' : 'Naghihintay ng upload'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rejected Archives List sub tab */}
      {subTab === 'rejected' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6">
          <h3 className="text-sm font-extrabold text-slate-950 dark:text-white font-display mb-4 text-red-600">
            {lang === 'en' ? 'Rejected Applications Logs' : 'Archive ng mga Tinanggihang Application'}
          </h3>
          {filteredRejectedApplications.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              {searchQuery ? (lang === 'en' ? 'No rejected applications match your search.' : 'Walang tinanggihang aplikasyon na tumutugma sa iyong paghahanap.') : (lang === 'en' ? 'No rejected applications in the system logs.' : 'Walang tinanggihang aplikasyon sa talaan ng sistema.')}
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredRejectedApplications.map((u) => (
                <div key={`${u.name}-${u.role}-${u.email || ''}`} className="py-3.5 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{u.name}</span>
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase text-[8px] font-bold">
                      {accountTypeLabel(u)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-red-600 font-bold bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded">
                      {lang === 'en' ? 'Rejected Archive' : 'Mga Tinanggihang Aplikasyon'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeletingUser(u)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg transition-all cursor-pointer border border-red-100 dark:border-red-900/40"
                      title={lang === 'en' ? 'Delete Account Permanently' : 'Permanenteng Burahin'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center overflow-y-auto p-3 md:p-4 z-55">
          <div className="my-auto bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl max-w-sm w-full overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-6 text-xs text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm font-display">
                {lang === 'en' ? 'Delete Account / Application' : 'Burahin ang Account / Application'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {lang === 'en' 
                  ? `Are you sure you want to permanently delete the application/account of ${deletingUser.name}? This action cannot be undone.` 
                  : `Sigurado ka bang nais mong permanenteng burahin ang application/account ni ${deletingUser.name}? Hindi na ito mababawi.`}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-grow py-2.5 text-center text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                {lang === 'en' ? 'Cancel' : 'I-cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUser(deletingUser.name);
                  setDeletingUser(null);
                }}
                className="flex-grow py-2.5 text-center text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-sm transition-all cursor-pointer"
              >
                {lang === 'en' ? 'Delete Permanently' : 'Burahin'}
              </button>
            </div>
          </div>
        </div>
      )}
      {decision && (
        <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 md:p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl md:rounded-3xl border border-slate-700 bg-white p-4 md:p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{decision.action === 'approve' ? (lang === 'en' ? 'Approve Registration' : 'Aprubahan ang Rehistrasyon') : decision.action === 'reject' ? (lang === 'en' ? 'Reject Registration' : 'Tanggihan ang Rehistrasyon') : (lang === 'en' ? 'Request Corrections' : 'Humingi ng Pagwawasto')}</h3>
            <p className="mt-2 text-sm text-slate-500">{lang === 'en' ? 'Applicant:' : 'Aplikante:'} <b>{decision.user.name}</b></p>
            {decision.action !== 'approve' && <textarea autoFocus required value={decisionReason} onChange={(e) => setDecisionReason(e.target.value)} placeholder={decision.action === 'reject' ? (lang === 'en' ? 'Explain why the application is rejected…' : 'Ipaliwanag kung bakit tinatanggihan ang aplikasyon…') : (lang === 'en' ? 'List the documents or information that must be corrected…' : 'Ilista ang mga dokumento o impormasyong kailangang itama…')} className="mt-4 min-h-28 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />}
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setDecision(null)} className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-300">{lang === 'en' ? 'Cancel' : 'Kanselahin'}</button>
              <button type="button" disabled={decision.action !== 'approve' && !decisionReason.trim()} onClick={() => { if (decision.action === 'approve') onApprove(decision.user.name); else if (decision.action === 'reject') onReject(decision.user.name, decisionReason.trim()); else onRequestResubmission(decision.user.name, decisionReason.trim()); setDecision(null); }} className={`flex-1 rounded-xl py-3 text-sm font-black text-white disabled:opacity-50 ${decision.action === 'reject' ? 'bg-red-600' : 'bg-emerald-600'}`}>{lang === 'en' ? 'Confirm' : 'Kumpirmahin'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
