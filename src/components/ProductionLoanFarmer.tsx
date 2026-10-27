import { IconWheat } from '@tabler/icons-react';
import React, { useEffect, useRef, useState } from 'react';
import { UserAccount, ProductionLoanRequest, ProductionLoanPurpose, ProductionLoanStatus } from '../types';
import { Landmark, AlertCircle, CheckCircle2, Clock, XCircle, FileText, ChevronRight, Filter, ShieldAlert, Sparkles, Send, Ban, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import AnimatedButton from './AnimatedButton';
import { hasApprovedBusinessCapability } from '../lib/businessCapabilities';

interface ProductionLoanFarmerProps {
  user: UserAccount;
  registeredUsers: UserAccount[];
  loanRequests: ProductionLoanRequest[];
  onSubmitLoanRequest: (request: Omit<ProductionLoanRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  onCancelLoanRequest: (requestId: string) => void;
}

const RICE_PURPOSES: ProductionLoanPurpose[] = [
  'Rice Seeds',
  'Fertilizer',
  'Pesticides and Crop Protection',
  'Land Preparation',
  'Farm Labor',
  'Irrigation',
  'Rice Harvesting',
  'Transportation of Harvested Rice Grain',
  'Mechanical Drying',
  'Rice Grain Storage',
  'Rice Milling',
  'Other Rice Production-Related Expenses',
];

export default function ProductionLoanFarmer({
  user,
  registeredUsers,
  loanRequests,
  onSubmitLoanRequest,
  onCancelLoanRequest,
}: ProductionLoanFarmerProps) {
  const { lang } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'available' | 'my_requests'>('available');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [selectedBuyer, setSelectedBuyer] = useState<UserAccount | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedApprovedRequest, setSelectedApprovedRequest] = useState<ProductionLoanRequest | null>(null);

  const [detailsBuyer, setDetailsBuyer] = useState<UserAccount | null>(null);
  const detailsDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (detailsBuyer) detailsDialog.current?.showModal();
  }, [detailsBuyer]);

  // Form State
  const [requestedAmount, setRequestedAmount] = useState<number | ''>('');
  const [farmAreaHectares, setFarmAreaHectares] = useState<number | ''>('');
  const [purpose, setPurpose] = useState<ProductionLoanPurpose>('Rice Seeds');
  const [customPurpose, setCustomPurpose] = useState('');
  const [plantingSeason, setPlantingSeason] = useState('Wet Season 2026 (Tag-ulan)');
  const [preferredRepaymentPeriod, setPreferredRepaymentPeriod] = useState('4 Months / Upon Harvest');
  const [repaymentMethod, setRepaymentMethod] = useState('Harvest-Based Repayment (Farmer as Planter - Harvest allocated to Buyer)');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  // Cancel Confirmation
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  // Filter available buyers with active loaning config
  const availableBuyers = registeredUsers.filter(
    u => hasApprovedBusinessCapability(u, 'loan_provider') && u.loanConfig?.enabled === true
  );

  // Filter my loan requests
  const myRequests = loanRequests.filter(
    r => r.farmerEmail === user.email || r.farmerName === user.name
  );

  const approvedRequests = myRequests.filter(r => r.status === 'Approved' || r.status === 'Active');
  const hasApprovedLoan = approvedRequests.length > 0;

  const filteredMyRequests = myRequests.filter(r => {
    if (statusFilter === 'all') return true;
    return r.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const handleOpenRequestModal = (buyer: UserAccount) => {
    setSelectedBuyer(buyer);
    setRequestedAmount(buyer.loanConfig?.minAmount || 5000);
    setPurpose('Rice Seeds');
    setCustomPurpose('');
    setPlantingSeason('Wet Season 2026 (Tag-ulan)');
    setPreferredRepaymentPeriod(buyer.loanConfig?.repaymentPeriod || '4 Months / Upon Harvest');
    setRepaymentMethod(buyer.loanConfig?.repaymentMethod || 'Harvest-Based Repayment (Farmer as Planter - Harvest allocated to Buyer)');
    setAdditionalNotes('');
    setFarmAreaHectares('');
    setValidationError('');
    setShowRequestModal(true);
  };

  const handleValidateForm = () => {
    setValidationError('');
    if (!selectedBuyer || !selectedBuyer.loanConfig) return;

    const amt = Number(requestedAmount);
    const min = selectedBuyer.loanConfig.minAmount;
    const max = selectedBuyer.loanConfig.maxAmount;
    const fund = selectedBuyer.loanConfig.availableFund;

    if (!amt || isNaN(amt) || amt <= 0) {
      setValidationError(lang === 'en' ? 'Please enter a valid loan amount.' : 'Mangyaring maglagay ng tamang halaga ng pautang.');
      return;
    }

    if (amt < min) {
      setValidationError(
        lang === 'en'
          ? `Requested amount must be at least ₱${min.toLocaleString()}.`
          : `Ang hiling na halaga ay dapat hindi bababa sa ₱${min.toLocaleString()}.`
      );
      return;
    }

    if (amt > max) {
      setValidationError(
        lang === 'en'
          ? `Requested amount cannot exceed maximum limit of ₱${max.toLocaleString()}.`
          : `Ang hiling na halaga ay hindi maaaring lumampas sa sukdulang ₱${max.toLocaleString()}.`
      );
      return;
    }

    if (amt > fund) {
      setValidationError(
        lang === 'en'
          ? `Requested amount exceeds the buyer's available fund of ₱${fund.toLocaleString()}.`
          : `Ang hiling na halaga ay lumampas sa natitirang pondo ng buyer na ₱${fund.toLocaleString()}.`
      );
      return;
    }

    if (farmAreaHectares === '' || Number(farmAreaHectares) <= 0) {
      setValidationError(
        lang === 'en'
          ? 'Please enter the farm area that will use the loan.'
          : 'Ilagay ang lawak ng sakahan na paggagamitan ng loan.'
      );
      return;
    }

    if (!purpose) {
      setValidationError(lang === 'en' ? 'Please select the purpose of the loan.' : 'Piliin ang layunin ng pautang.');
      return;
    }

    if (!plantingSeason.trim()) {
      setValidationError(lang === 'en' ? 'Please select the planting or harvest season.' : 'Piliin ang panahon ng pagtatanim o pag-aani.');
      return;
    }

    if (!preferredRepaymentPeriod.trim()) {
      setValidationError(lang === 'en' ? 'Please enter the preferred repayment period.' : 'Ilagay ang gustong termino ng pagbabayad.');
      return;
    }

    if (purpose === 'Other Rice Production-Related Expenses' && !customPurpose.trim()) {
      setValidationError(
        lang === 'en'
          ? 'Please specify the exact rice production purpose.'
          : 'Mangyaring linawin ang tiyak na layunin para sa pagtatanim ng palay.'
      );
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    if (!selectedBuyer) return;

    onSubmitLoanRequest({
      farmerName: user.name,
      farmerEmail: user.email || 'magsasaka@kawing.com',
      farmerPhone: user.contactNumber || '0917-888-9999',
      farmerLocation: user.address || 'San Jose, Nueva Ecija',
      buyerName: selectedBuyer.name,
      buyerEmail: selectedBuyer.email || 'buyer@kawing.com',
      buyerCompanyName: selectedBuyer.businessName || `${selectedBuyer.name} Rice Trading`,
      requestedAmount: Number(requestedAmount),
      farmAreaHectares: Number(farmAreaHectares),
      purpose,
      customPurpose: purpose === 'Other Rice Production-Related Expenses' ? customPurpose.trim() : undefined,
      plantingSeason,
      preferredRepaymentPeriod,
      repaymentMethod,
      additionalNotes,
    });

    setShowConfirmModal(false);
    setShowRequestModal(false);
    setActiveSubTab('my_requests');
  };

  const getStatusBadge = (status: ProductionLoanStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" /> Pending Approval
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <Sparkles className="w-3.5 h-3.5" /> Active Loan
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-950/80 dark:text-green-300 border border-green-300 dark:border-green-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Fully Paid / Completed
          </span>
        );
      case 'Declined':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5" /> Declined
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Ban className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3 md:gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 snap-x">
          <button
            onClick={() => setActiveSubTab('available')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'available'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>{lang === 'en' ? 'Available Loan Providers' : 'Mga Nagpapautang na Buyer'}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[11px]">
              {availableBuyers.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('my_requests');
              if (hasApprovedLoan && approvedRequests.length > 0) {
                setSelectedApprovedRequest(approvedRequests[0]);
              }
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer relative ${
              activeSubTab === 'my_requests'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{lang === 'en' ? 'My Loan Requests' : 'Aking Mga Hiling na Pautang'}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[11px]">
              {myRequests.length}
            </span>

            {hasApprovedLoan && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-rose-600 text-white font-black text-xs shadow-md border border-rose-300 animate-pulse">
                {approvedRequests.length}
              </span>
            )}
          </button>
        </div>

        {activeSubTab === 'my_requests' && (
          <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-end">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
            >
              <option value="all">{lang === 'en' ? 'All Statuses' : 'Lahat ng Status'}</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="declined">Declined</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: AVAILABLE BUYERS FOR PRODUCTION LOANS */}
      {activeSubTab === 'available' && (
        <div className="space-y-4">
          {availableBuyers.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Landmark className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {lang === 'en' ? 'No Active Loan Providers Yet' : 'Wala pa kasalukuyang Nagpapautang na Buyer'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {lang === 'en'
                    ? 'Buyers and traders appear here when they enable rice production loans.'
                    : 'Lalabas dito ang verified buyers at traders kapag nag-enable sila ng pautang sa palay.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {availableBuyers.map(buyer => {
                const config = buyer.loanConfig!;
                const fullRepaymentMethod = config.repaymentMethod || 'Harvest-Based Repayment (Farmer as Planter - Harvest allocated to Buyer)';
                const shortRepaymentMethod = fullRepaymentMethod.split('(')[0].trim();
                return (
                  <div key={buyer.name} className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                    <div className="grid min-w-[1000px] grid-cols-[1.3fr_1fr_0.7fr_1fr_1.2fr_auto] items-center gap-5">
                      <div className="min-w-0 space-y-2">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span>Verified Buyer / Trader</span>
                        </div>
                        <h3 className="break-words text-xl font-extrabold text-slate-900 dark:text-white">{buyer.businessName || `${buyer.name} Trading`}</h3>
                      </div>
                      <div className="contents text-base">
                        <div>
                          <span className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Loan Amount' : 'Halaga ng Pautang'}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">₱{config.minAmount.toLocaleString()} – ₱{config.maxAmount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Interest Rate' : 'Interest Rate'}</span>
                          <span className="font-bold text-amber-700 dark:text-amber-400">{config.interestRate ?? 5}%</span>
                        </div>
                        <div>
                          <span className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Repayment Terms' : 'Panahon ng Pagbabayad'}</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{config.repaymentPeriod}</span>
                        </div>
                        <div>
                          <span className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Repayment Method' : 'Paraan ng Bayad'}</span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">{shortRepaymentMethod}</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => setDetailsBuyer(buyer)} className="cursor-pointer whitespace-nowrap rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900">
                        {lang === 'en' ? 'View details' : 'Tingnan ang detalye'}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {detailsBuyer && (
        <dialog ref={detailsDialog} aria-labelledby="loan-details-title" onCancel={() => setDetailsBuyer(null)} onClose={() => setDetailsBuyer(null)} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl backdrop:bg-slate-950/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 id="loan-details-title" className="text-lg font-extrabold">{detailsBuyer.businessName || `${detailsBuyer.name} Trading`}</h3>
              <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Verified Buyer / Trader</p>
            </div>
            <button type="button" autoFocus onClick={() => setDetailsBuyer(null)} aria-label={lang === 'en' ? 'Close loan details' : 'Isara ang detalye'} className="rounded-lg p-2 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:hover:bg-slate-800"><XCircle className="h-5 w-5" /></button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800">
            <div><p className="text-xs text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Loan Amount' : 'Halaga ng Pautang'}</p><p className="mt-1 font-bold">&#8369;{detailsBuyer.loanConfig!.minAmount.toLocaleString()} - &#8369;{detailsBuyer.loanConfig!.maxAmount.toLocaleString()}</p></div>
            <div><p className="text-xs text-slate-500 dark:text-slate-400">Interest Rate</p><p className="mt-1 font-bold">{detailsBuyer.loanConfig!.interestRate ?? 5}%</p></div>
            <div className="col-span-2"><p className="text-xs text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Repayment Terms' : 'Panahon ng Pagbabayad'}</p><p className="mt-1 font-semibold">{detailsBuyer.loanConfig!.repaymentPeriod}</p></div>
          </div>
                      <div className="mt-3 grid gap-4 border-t border-slate-100 pt-4 text-slate-600 dark:border-slate-800 dark:text-slate-300 sm:grid-cols-2">
                        <div>
                          <p className="font-bold">{lang === 'en' ? 'Contact Person' : 'Kinatawan'}</p>
                          <p className="mt-1 break-words">{detailsBuyer.name}</p>
                          {detailsBuyer.address && <p className="mt-1 break-words">{detailsBuyer.address}</p>}
                        </div>
                        <div>
                          <p className="font-bold">{lang === 'en' ? 'Available Loan Fund' : 'Natitirang Pondo'}</p>
                          <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400">₱{detailsBuyer.loanConfig!.availableFund.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="font-bold">{lang === 'en' ? 'Repayment Method' : 'Paraan ng Bayad'}</p>
                          <p className="mt-1 leading-relaxed">{detailsBuyer.loanConfig!.repaymentMethod || 'Harvest-Based Repayment (Farmer as Planter - Harvest allocated to Buyer)'}</p>
                        </div>
                        <div>
                          <p className="font-bold">{lang === 'en' ? 'Loan Conditions & Requirements' : 'Mga Kondisyon sa Pautang'}</p>
                          <p className="mt-1 whitespace-pre-line break-words leading-relaxed">{detailsBuyer.loanConfig!.termsAndConditions || (lang === 'en' ? 'Contact the buyer for requirements.' : 'Makipag-ugnayan sa buyer para sa mga kinakailangan.')}</p>
                        </div>
                      </div>

          <AnimatedButton onClick={() => { handleOpenRequestModal(detailsBuyer); setDetailsBuyer(null); }} className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500">
            <Send className="h-4 w-4" />
            {lang === 'en' ? 'Apply for Loan' : 'Mag-apply ng Pautang'}
          </AnimatedButton>
        </dialog>
      )}

      {/* TAB 2: MY LOAN REQUESTS TRACKER */}
      {activeSubTab === 'my_requests' && (
        <div className="space-y-4">
          {filteredMyRequests.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                {lang === 'en' ? 'No Loan Requests Found' : 'Walang Nahanap na Hiling na Pautang'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'en'
                  ? 'You have not submitted any Production Loan requests under this filter.'
                  : 'Wala ka pang naipapadalang hiling sa pautang sa ilalim ng kategoryang ito.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMyRequests.map(req => {
                const isApproved = req.status === 'Approved' || req.status === 'Active';
                return (
                  <div
                    key={req.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all space-y-3 relative overflow-hidden ${
                      isApproved
                        ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* YELLOW GRAIN NOTIFICATION BANNER IF APPROVED */}
                    {isApproved && (
                      <div
                        onClick={() => setSelectedApprovedRequest(req)}
                        className="p-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 rounded-xl flex items-center justify-between gap-3 shadow-md cursor-pointer hover:brightness-105 transition-all animate-pulse"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-3 w-3 relative shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-900"></span>
                          </span>
                          <p className="text-xs font-black tracking-wide">
                            {lang === 'en'
                              ? <span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"LOAN APPROVED! Your request loan was approved, please contact the buyer/loaner."}</span>
                              : <span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"PAUTANG INAPRUBAHAN! Inaprubahan ang iyong hiling, pakikipag-ugnayan sa buyer/loaner."}</span>}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-slate-900 text-amber-300 rounded-lg text-[11px] font-extrabold uppercase shrink-0 shadow-xs">
                          {lang === 'en' ? 'View Details' : 'Tingnan'}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">ID: {req.id}</span>
                        {getStatusBadge(req.status)}
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {req.buyerCompanyName || req.buyerName}
                      </h4>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-slate-400 block">{lang === 'en' ? 'Requested Amount' : 'Hiling na Halaga'}</span>
                      <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                        ₱{req.requestedAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                    <div>
                      <span className="text-slate-400 text-[11px] block">{lang === 'en' ? 'Purpose of Loan' : 'Layunin ng Pautang'}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {req.purpose === 'Other Rice Production-Related Expenses' ? req.customPurpose : req.purpose}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block">{lang === 'en' ? 'Planting Season' : 'Panahon ng Pagtatanim'}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {req.plantingSeason}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block">{lang === 'en' ? 'Repayment Term' : 'Termino ng Bayad'}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {req.preferredRepaymentPeriod}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block">{lang === 'en' ? 'Repayment Method' : 'Paraan ng Bayad'}</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1"><span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{req.repaymentMethod || 'Harvest-Based Repayment (Farmer as Planter)'}
                      </span>
                    </div>
                  </div>


                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>{lang === 'en' ? 'Submitted on: ' : 'Naipadala noong: '}{req.createdAt}</span>

                    {req.status === 'Pending' && (
                      <button
                        onClick={() => setCancelTargetId(req.id)}
                        className="px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-semibold transition-colors cursor-pointer"
                      >
                        {lang === 'en' ? 'Cancel Request' : 'Kanselahin ang Hiling'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}

      {/* Production loan platform limitation notice */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-start gap-3.5 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            {lang === 'en' ? 'Important Notice on Production Loans:' : 'Mahalagang Paalala sa Pautang:'}
          </p>
          <p className="leading-relaxed opacity-90">
            {lang === 'en'
              ? 'Loans are for rice planting, production, harvest, and post-harvest work only. KAWING coordinates requests, approvals, records, and monitoring; it does not process, hold, transfer, or collect money. Farmers and buyers arrange fund release and repayment directly outside KAWING.'
              : 'Para lang sa pagtatanim, produksyon, pag-aani, at post-harvest ng palay ang pautang. KAWING ang nag-uugnay at nagtatala ng hiling, approval, at pagsubaybay; hindi ito humahawak, naglilipat, o nagtatago ng pera. Direkta sa labas ng KAWING ang pagbigay at pagbabayad ng pondo.'}
          </p>
        </div>
      </div>

      {/* MODAL 1: SUBMIT LOAN REQUEST FORM */}
      {showRequestModal && selectedBuyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="flex max-h-[90dvh] w-full max-w-7xl min-w-0 flex-col overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 relative gap-5"
          >
            {/* Modal Header */}
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {lang === 'en' ? 'Production Loan Application' : 'Aplikasyon sa Pautang sa Pagtatanim'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'en' ? 'To: ' : 'Para kay: '}<span className="font-bold text-slate-800 dark:text-slate-200">{selectedBuyer.businessName || selectedBuyer.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto space-y-6 pr-1">
            {/* Config Summary Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl text-sm grid gap-4 sm:grid-cols-2 xl:grid-cols-4 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex flex-col gap-1">
                <span className="text-slate-500">{lang === 'en' ? 'Buyer Loan Limit:' : 'Limitasyon ng Buyer:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ₱{selectedBuyer.loanConfig?.minAmount.toLocaleString()} - ₱{selectedBuyer.loanConfig?.maxAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-500">{lang === 'en' ? 'Money Still Available:' : 'Natitirang Pondong Maaaring Hiramin:'}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ₱{selectedBuyer.loanConfig?.availableFund.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-500">{lang === 'en' ? 'Interest Rate:' : 'Interest Rate:'}</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{selectedBuyer.loanConfig?.interestRate ?? 5}%</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-500">{lang === 'en' ? 'Default Repayment:' : 'Kondisyon ng Bayad:'}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedBuyer.loanConfig?.repaymentPeriod}
                </span>
              </div>
            </div>

            {/* Validation Error Banner */}
            {validationError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 items-start gap-x-8 gap-y-5 text-base md:grid-cols-2">
              {/* Requested Amount */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>
                    {lang === 'en' ? 'Requested Loan Amount (₱)' : 'Hiling na Halaga ng Pautang (₱)'}
                    <span className="text-rose-500"> *</span>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-normal">
                    Min ₱{selectedBuyer.loanConfig?.minAmount.toLocaleString()}
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 font-bold">₱</span>
                  <input
                    type="number"
                    required
                    value={requestedAmount}
                    onChange={e => setRequestedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 15000"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Farm area covered by the loan */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'en' ? 'Farm Area Covered by Loan (hectares)' : 'Lawak ng Sakahan na Paggagamitan ng Loan (hectares)'}
                  <span className="text-rose-500"> *</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={farmAreaHectares}
                    onChange={e => setFarmAreaHectares(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={lang === 'en' ? 'e.g. 2.5' : 'hal. 2.5'}
                    className="w-full px-3.5 pr-24 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3.5 top-3 text-slate-400 font-semibold">hectares</span>
                </div>
              </div>

              {/* Purpose of Loan Dropdown */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'en' ? 'Purpose of Loan (Rice-Related Only)' : 'Layunin ng Pautang (Para sa Palay Lamang)'}
                  <span className="text-rose-500"> *</span>
                </label>
                <select
                  required
                  value={purpose}
                  onChange={e => setPurpose(e.target.value as ProductionLoanPurpose)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {RICE_PURPOSES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Custom Purpose input if Other is selected */}
              {purpose === 'Other Rice Production-Related Expenses' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    {lang === 'en' ? 'Specify Rice Production Purpose' : 'Tiyaking Layunin para sa Pagtatanim ng Palay'}
                    <span className="text-rose-500"> *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customPurpose}
                    onChange={e => setCustomPurpose(e.target.value)}
                    placeholder={lang === 'en' ? 'e.g., Harvester Fuel, Bio-fertilizer' : 'hal. Krudo ng Harvester, Bio-fertilizer'}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Rice Planting / Harvest Season */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'en' ? 'Rice Planting / Harvest Season' : 'Panahon ng Pagtatanim / Pag-aani'}
                  <span className="text-rose-500"> *</span>
                </label>
                <select
                  required
                  value={plantingSeason}
                  onChange={e => setPlantingSeason(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="Wet Season 2026 (Tag-ulan)">Wet Season 2026 (Tag-ulan)</option>
                  <option value="Dry Season 2026 (Tag-araw)">Dry Season 2026 (Tag-araw)</option>
                  <option value="Upcoming Crop Cycle 2026-2027">Upcoming Crop Cycle 2026-2027</option>
                </select>
              </div>

              {/* Preferred Repayment Period */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'en' ? 'Preferred Repayment Period' : 'Gusto na Termino ng Pagbabayad'}
                  <span className="text-rose-500"> *</span>
                </label>
                <input
                  type="text"
                  required
                  value={preferredRepaymentPeriod}
                  onChange={e => setPreferredRepaymentPeriod(e.target.value)}
                  placeholder="e.g. 4 Months / Upon Harvest"
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Additional Notes */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'en' ? 'Additional Notes / Farm Details (Optional)' : 'Karagdagang Tala / Detalye ng Bukid (Opsyonal)'}
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={e => setAdditionalNotes(e.target.value)}
                  rows={3}
                  placeholder={lang === 'en' ? 'e.g. Farm size in Candaba, expected harvest yield...' : 'hal. Sukat ng bukid, tantiya ng aanihing palay...'}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            </div>

            {/* Modal Actions */}
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2.5 rounded-xl text-base font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'Cancel' : 'Kanselahin'}
              </button>

              <AnimatedButton
                onClick={handleValidateForm}
                className="px-5 py-2.5 rounded-xl text-base font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>{lang === 'en' ? 'Review Application' : 'Suriin ang Aplikasyon'}</span>
                <ChevronRight className="w-4 h-4" />
              </AnimatedButton>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: CONFIRMATION POPUP */}
      {showConfirmModal && selectedBuyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 md:p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className="my-auto w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {lang === 'en' ? 'Confirm Loan Request Submission' : 'Kumpirmahin ang Hiling na Pautang'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {lang === 'en'
                  ? 'Before sending your loan request, review the amount, purpose, repayment period, and conditions.'
                  : 'Bago ipadala ang hiling, suriin ang halaga, layunin, panahon ng pagbabayad, at kondisyon.'}
              </p>
            </div>

            {/* Summary Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl text-xs space-y-1.5 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex justify-between">
                <span className="text-slate-500">{lang === 'en' ? 'Buyer Name:' : 'Pangalan ng Buyer:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedBuyer.businessName || selectedBuyer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{lang === 'en' ? 'Requested Amount:' : 'Hiling na Halaga:'}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">₱{Number(requestedAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{lang === 'en' ? 'Farm Area:' : 'Lawak ng Sakahan:'}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{Number(farmAreaHectares).toLocaleString()} hectares</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{lang === 'en' ? 'Purpose:' : 'Layunin:'}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {purpose === 'Other Rice Production-Related Expenses' ? customPurpose : purpose}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="shrink-0 text-slate-500">{lang === 'en' ? 'Season:' : 'Panahon:'}</span>
                <span className="text-right font-semibold text-slate-700 dark:text-slate-300">{plantingSeason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{lang === 'en' ? 'Repayment Term:' : 'Termino ng Bayad:'}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{preferredRepaymentPeriod}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="shrink-0 text-slate-500">{lang === 'en' ? 'Repayment Method:' : 'Paraan ng Bayad:'}</span>
                <span className="text-right font-semibold text-slate-700 dark:text-slate-300">{repaymentMethod}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'Back to Edit' : 'Bumalik at Ayusin'}
              </button>

              <AnimatedButton
                onClick={handleConfirmSubmit}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === 'en' ? 'Confirm & Submit' : 'Kumpirmahin at Isumite'}</span>
              </AnimatedButton>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL 3: CANCEL REQUEST CONFIRMATION */}
      {cancelTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="my-auto w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'en' ? 'Cancel Production Loan Request?' : 'Kanselahin ang Hiling na Pautang?'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'en'
                ? 'Are you sure you want to cancel this pending loan request? The buyer will be notified.'
                : 'Sigurado ka bang gusto mong kanselahin ang hiling na ito? Malalaman ito ng buyer.'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelTargetId(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {lang === 'en' ? 'Keep Pending' : 'Huwag muna'}
              </button>
              <button
                onClick={() => {
                  onCancelLoanRequest(cancelTargetId);
                  setCancelTargetId(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm"
              >
                {lang === 'en' ? 'Yes, Cancel Request' : 'Oo, Kanselahin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: APPROVED LOAN NOTIFICATION POPUP */}
      {selectedApprovedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 md:p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-500 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 relative space-y-5 md:my-8"
          >
            {/* Header Grain Yellow Banner */}
            <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 p-4 rounded-2xl shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-950/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-950/80 block">
                  {lang === 'en' ? 'CONFIRMED & APPROVED LOAN' : 'KUMPIRMADO AT INAPRUBAHANG PAUTANG'}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold leading-tight text-slate-950">
                  {lang === 'en'
                    ? 'Your request loan was approved please contact the buyer/loaner.'
                    : 'Inaprubahan ang iyong hiling na pautang, pakikipag-ugnayan sa buyer/loaner.'}
                </h3>
              </div>
            </div>

            {/* Approved Details Summary */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500 font-medium">{lang === 'en' ? 'Approved Loan Amount:' : 'Inaprubahang Halaga:'}</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  ₱{(selectedApprovedRequest.approvedAmount || selectedApprovedRequest.requestedAmount).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500 font-medium">{lang === 'en' ? 'Buyer / Loaner Name:' : 'Pangalan ng Buyer / Loaner:'}</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-100">
                  {selectedApprovedRequest.buyerCompanyName || selectedApprovedRequest.buyerName}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500 font-medium">{lang === 'en' ? 'Loan Purpose:' : 'Layunin ng Pautang:'}</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {selectedApprovedRequest.purpose === 'Other Rice Production-Related Expenses'
                    ? selectedApprovedRequest.customPurpose
                    : selectedApprovedRequest.purpose}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{lang === 'en' ? 'Repayment Method:' : 'Paraan ng Bayad:'}</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconWheat size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{selectedApprovedRequest.repaymentMethod || 'Harvest-Based Repayment'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedApprovedRequest(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'Close' : 'Isara'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
