import { IconCash, IconPackage, IconWheat } from '@tabler/icons-react';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { UserAccount, BuyerLoanConfig, ProductionLoanRequest, ProductionLoanStatus } from '../types';
import { Landmark, AlertTriangle, CheckCircle2, Clock, XCircle, FileText, Settings, Sparkles, DollarSign, Power, Edit3, ShieldAlert, Check, X, Info, UserCheck, Lock, Unlock, PlusCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import AnimatedButton from './AnimatedButton';

interface ProductionLoanBuyerProps {
  user: UserAccount;
  loanRequests: ProductionLoanRequest[];
  onUpdateUser: (originalName: string, updated: UserAccount, before?: UserAccount) => void;
  onApproveLoanRequest: (requestId: string, approvedAmount: number, buyerNotes?: string) => void;
  onDeclineLoanRequest: (requestId: string, buyerNotes?: string) => void;
  onUpdateLoanStatus: (requestId: string, status: ProductionLoanStatus) => void;
  onCancel?: () => void;
}

export default function ProductionLoanBuyer({
  user,
  loanRequests,
  onUpdateUser,
  onApproveLoanRequest,
  onDeclineLoanRequest,
  onUpdateLoanStatus,
  onCancel,
}: ProductionLoanBuyerProps) {
  const { lang } = useApp();
  const hasLoanService = Boolean(user.loanConfig);
  const formBaseline = useRef(user);
  const currentConfig: BuyerLoanConfig = user.loanConfig || {
    enabled: false,
    minAmount: 5000,
    maxAmount: 20000,
    interestRate: 5,
    availableFund: 100000,
    repaymentPeriod: '4 Months / Upon Harvest',
    repaymentMethod: 'Harvest-Based Repayment (Farmer as Planter - Harvest allocated to Buyer)',
    termsAndConditions: 'For registered rice farmers only. Palay output delivery priority during harvest season.',
    additionalRequirements: 'Valid ID and RSBSA Registration Number',
    notes: 'Direct farm visits may be scheduled prior to loan releasing.',
  };

  const [activeTab, setActiveTab] = useState<'incoming' | 'active' | 'completed' | 'settings'>('incoming');
  // Opening loan management must not create or publish a default loan offer.
  // Providers publish only after completing the Post Loan Service form.
  const [isPageLocked, setIsPageLocked] = useState(false);
  const [showEnableWarningModal, setShowEnableWarningModal] = useState(false);
  const [showPostLoanModal, setShowPostLoanModal] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [showExistingLoanNotice, setShowExistingLoanNotice] = useState(false);

  useEffect(() => {
    if (!hasLoanService && activeTab === 'settings') setActiveTab('incoming');
  }, [hasLoanService, activeTab]);

  useEffect(() => {
    if (currentConfig.enabled) {
      setIsPageLocked(false);
    }
  }, [currentConfig.enabled]);

  // Edit Configuration Form State
  const [minAmount, setMinAmount] = useState<number | ''>('');
  const [maxAmount, setMaxAmount] = useState<number | ''>('');
  const [interestRate, setInterestRate] = useState<number | ''>(currentConfig.interestRate ?? '');
  const [availableFund, setAvailableFund] = useState<number | ''>('');
  const [repaymentPeriod, setRepaymentPeriod] = useState<string>('');
  const [repaymentMethod, setRepaymentMethod] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [termsAndConditions, setTermsAndConditions] = useState<string>('');
  const [additionalRequirements, setAdditionalRequirements] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);
  const isCashRepayment = repaymentMethod.includes('Cash');

  // Action Modal State
  const [selectedRequest, setSelectedRequest] = useState<ProductionLoanRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'decline' | null>(null);
  const [approvedAmtInput, setApprovedAmtInput] = useState<number>(0);

  // Filter requests for this buyer
  const buyerRequests = loanRequests.filter(
    r => r.buyerEmail === user.email || r.buyerName === user.name
  );

  const pendingRequests = buyerRequests.filter(r => r.status === 'Pending');
  const activeLoans = buyerRequests.filter(r => r.status === 'Approved' || r.status === 'Active');
  const completedOrDeclinedLoans = buyerRequests.filter(r => r.status === 'Completed' || r.status === 'Declined' || r.status === 'Cancelled');

  // Unlock and Enable handler from Pop-Up
  const handleUnlockAndEnable = () => {
    const updatedConfig: BuyerLoanConfig = {
      ...currentConfig,
      enabled: true,
      minAmount: minAmount === '' ? (currentConfig.minAmount || 5000) : Number(minAmount),
      maxAmount: maxAmount === '' ? (currentConfig.maxAmount || 50000) : Number(maxAmount),
      interestRate: interestRate === '' ? (currentConfig.interestRate || 5) : Number(interestRate),
      availableFund: availableFund === '' ? (currentConfig.availableFund || 150000) : Number(availableFund),
      repaymentPeriod: repaymentPeriod.trim() || currentConfig.repaymentPeriod || '4 Months / Upon Harvest',
      repaymentMethod: repaymentMethod.trim() || currentConfig.repaymentMethod || 'Harvest-Based Repayment (Farmer as Planter - Harvest allocated to Buyer)',
      contactNumber: contactNumber.trim() || currentConfig.contactNumber || user.contactNumber || '',
      termsAndConditions: termsAndConditions.trim() || currentConfig.termsAndConditions || 'For registered rice farmers only.',
      additionalRequirements: additionalRequirements.trim() || currentConfig.additionalRequirements || 'Valid Government ID and RSBSA Registration Number',
      notes,
    };
    onUpdateUser(user.name, { ...user, loanConfig: updatedConfig });
    setIsPageLocked(false);
  };

  const handleUnlockOnly = () => {
    setIsPageLocked(false);
  };

  const handleConfirmEnableLoaning = () => {
    const updatedConfig: BuyerLoanConfig = {
      ...currentConfig,
      enabled: true,
      minAmount: minAmount === '' ? (currentConfig.minAmount || 5000) : Number(minAmount),
      maxAmount: maxAmount === '' ? (currentConfig.maxAmount || 50000) : Number(maxAmount),
      interestRate: interestRate === '' ? (currentConfig.interestRate || 5) : Number(interestRate),
      availableFund: availableFund === '' ? (currentConfig.availableFund || 150000) : Number(availableFund),
      repaymentPeriod: repaymentPeriod.trim() || currentConfig.repaymentPeriod || '4 Months / Upon Harvest',
      repaymentMethod: repaymentMethod.trim() || currentConfig.repaymentMethod || 'Harvest-Based Repayment (Farmer as Planter - Harvest allocated to Buyer)',
      contactNumber: contactNumber.trim() || currentConfig.contactNumber || user.contactNumber || '',
      termsAndConditions: termsAndConditions.trim() || currentConfig.termsAndConditions || 'For registered rice farmers only.',
      additionalRequirements: additionalRequirements.trim() || currentConfig.additionalRequirements || 'Valid Government ID and RSBSA Registration Number',
      notes,
    };
    onUpdateUser(user.name, { ...user, loanConfig: updatedConfig });
    setShowEnableWarningModal(false);
  };

  const handleSaveConfig = () => {
    if (showPostLoanModal && hasLoanService) {
      setShowPostLoanModal(false);
      setShowExistingLoanNotice(true);
      return;
    }
    if (!showPostLoanModal && !hasLoanService) return;
    if (isCashRepayment && (interestRate === '' || Number(interestRate) <= 0)) {
      alert(lang === 'en' ? 'Please enter a valid interest rate.' : 'Maglagay ng wastong interest rate.');
      return;
    }
    const updatedConfig: BuyerLoanConfig = {
      ...currentConfig,
      enabled: true,
      minAmount: minAmount === '' ? (currentConfig.minAmount || 5000) : Number(minAmount),
      maxAmount: maxAmount === '' ? (currentConfig.maxAmount || 50000) : Number(maxAmount),
      interestRate: isCashRepayment ? Number(interestRate) : 0,
      availableFund: availableFund === '' ? (currentConfig.availableFund || 150000) : Number(availableFund),
      repaymentPeriod: repaymentPeriod.trim() || currentConfig.repaymentPeriod || '4 Months / Upon Harvest',
      repaymentMethod: repaymentMethod.trim() || currentConfig.repaymentMethod || 'Harvest-Based Repayment (Farmer as Planter - Harvest allocated to Buyer)',
      contactNumber: contactNumber.trim() || currentConfig.contactNumber || user.contactNumber || '',
      termsAndConditions: termsAndConditions.trim() || currentConfig.termsAndConditions || 'For registered rice farmers only.',
      additionalRequirements: additionalRequirements.trim() || currentConfig.additionalRequirements || 'Valid Government ID and RSBSA Registration Number',
      notes,
    };
    onUpdateUser(user.name, { ...user, loanConfig: updatedConfig }, formBaseline.current);
    if (showPostLoanModal) {
      setShowPublishSuccess(true);
      setTimeout(() => setShowPublishSuccess(false), 3500);
    } else {
      setConfigSaveSuccess(true);
      setTimeout(() => setConfigSaveSuccess(false), 2500);
    }
    setShowPostLoanModal(false);
  };

  const handleOpenLoanManager = () => {
    if (!hasLoanService) return;
    formBaseline.current = user;
    setMinAmount(currentConfig.minAmount ?? '');
    setMaxAmount(currentConfig.maxAmount ?? '');
    setInterestRate(currentConfig.interestRate ?? '');
    setAvailableFund(currentConfig.availableFund ?? '');
    setRepaymentPeriod(currentConfig.repaymentPeriod ?? '');
    setRepaymentMethod(currentConfig.repaymentMethod ?? '');
    setContactNumber(currentConfig.contactNumber ?? user.contactNumber ?? '');
    setTermsAndConditions(currentConfig.termsAndConditions ?? '');
    setAdditionalRequirements(currentConfig.additionalRequirements ?? '');
    setNotes(currentConfig.notes ?? '');
    setActiveTab('settings');
  };

  const handlePostLoanClick = () => {
    if (hasLoanService) {
      handleOpenLoanManager();
      return;
    }
    setShowPostLoanModal(true);
    formBaseline.current = user;
  };

  const handleDeleteLoanService = () => {
    const confirmed = window.confirm(
      lang === 'en'
        ? 'Delete this published loan service? Farmers will no longer see or apply to it.'
        : 'Burahin ang naka-publish na loan service? Hindi na ito makikita o maa-apply-an ng mga magsasaka.'
    );
    if (!confirmed) return;

    onUpdateUser(user.name, { ...user, loanConfig: undefined });
    setMinAmount('');
    setMaxAmount('');
    setInterestRate('');
    setAvailableFund('');
    setRepaymentPeriod('');
    setRepaymentMethod('');
    setContactNumber('');
    setTermsAndConditions('');
    setAdditionalRequirements('');
    setNotes('');
    setActiveTab('incoming');
  };

  const handleOpenActionModal = (req: ProductionLoanRequest, type: 'approve' | 'decline') => {
    setSelectedRequest(req);
    setActionType(type);
    setApprovedAmtInput(req.requestedAmount);
  };

  const handleExecuteAction = () => {
    if (!selectedRequest || !actionType) return;

    if (actionType === 'approve') {
      onApproveLoanRequest(selectedRequest.id, Number(approvedAmtInput), '');
    } else {
      onDeclineLoanRequest(selectedRequest.id, '');
    }

    setSelectedRequest(null);
    setActionType(null);
  };

  return (
    <div>
      {/* POP-UP MODAL TO UNLOCK LOAN MANAGEMENT PAGE */}
      {isPageLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl md:rounded-3xl shadow-2xl p-5 md:p-8 sm:p-12 space-y-5 md:space-y-8 relative md:overflow-hidden">
            
            {/* Top Accent Line */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500" />

            <div className="border-b border-slate-100 dark:border-slate-800 pb-6 text-center">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {lang === 'en' ? 'Loan Management' : 'Pamamahala ng Pautang'}
              </h3>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              {!currentConfig.enabled ? (
                <>
                  <button
                    type="button"
                    onClick={handleUnlockAndEnable}
                    className="w-full sm:flex-1 py-4 px-8 rounded-2xl text-base font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{lang === 'en' ? 'Enable' : 'I-enable'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onCancel) {
                        onCancel();
                      }
                    }}
                    className="w-full sm:flex-1 py-4 px-8 rounded-2xl text-base font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                    <span>{lang === 'en' ? 'Cancel' : 'Kanselahin'}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleUnlockOnly}
                    className="w-full sm:flex-1 py-4 px-8 rounded-2xl text-base font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Unlock className="w-5 h-5" />
                    <span>{lang === 'en' ? 'Unlock & Enter Dashboard' : 'I-unlock at Pumasok sa Dashboard'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onCancel) {
                        onCancel();
                      }
                    }}
                    className="w-full sm:flex-1 py-4 px-8 rounded-2xl text-base font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                    <span>{lang === 'en' ? 'Cancel' : 'Kanselahin'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAGE CONTENT - HIDDEN UNTIL UNLOCKED */}
      <div className={`space-y-6 ${isPageLocked ? 'hidden' : ''}`}>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl md:rounded-3xl p-4 md:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Landmark className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'en' ? 'Buyer Production Loan Management' : 'Pamamahala ng Pautang sa Pagtatanim'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {lang === 'en' ? 'Rice Farmer Production Financing' : 'Pondo para sa Magsasaka ng Palay'}
            </h1>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
              {lang === 'en'
                ? 'Offer rice production loans for seeds, fertilizer, harvest, and post-harvest work to secure palay supply.'
                : 'Magpautang para sa binhi, abono, pag-aani, at pagpapatuyo kapalit ng suplay ng palay.'}
            </p>
          </div>

          <div className="flex items-center shrink-0">
            <AnimatedButton
              onClick={handlePostLoanClick}
              variant="outline"
              className="px-4 py-2 text-xs font-bold rounded-xl border-emerald-400/80 text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition-all shadow-sm whitespace-nowrap flex items-center gap-2"
            >
              {hasLoanService ? <Edit3 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              <span>{hasLoanService
                ? (lang === 'en' ? 'Edit Loan Service' : 'I-edit ang Pautang')
                : (lang === 'en' ? 'Post Loan Service' : 'Mag-post ng Pautang')}</span>
            </AnimatedButton>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'incoming'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{lang === 'en' ? 'Incoming Loan Requests' : 'Mga Bagong Hiling'}</span>
          {pendingRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-extrabold animate-pulse">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'active'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{lang === 'en' ? 'Active & Approved Loans' : 'Mga Aktibong Pautang'}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[11px]">
            {activeLoans.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{lang === 'en' ? 'Loan Records History' : 'Kasaysayan ng Pautang'}</span>
        </button>

        {hasLoanService && <button
          onClick={handleOpenLoanManager}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === 'settings'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>{lang === 'en' ? 'Edit Loan Service' : 'I-edit ang Pautang'}</span>
        </button>}
      </div>

      {/* TAB 1: INCOMING LOAN REQUESTS */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <Clock className="w-12 h-12 text-slate-700 dark:text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                {lang === 'en' ? 'No Pending Loan Requests' : 'Walang Nakatenggang Hiling sa Pautang'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {currentConfig.enabled
                  ? (lang === 'en' ? 'New requests from rice farmers will appear here for your review and approval.' : 'Lalabas dito ang mga hiling mula sa mga magsasaka kapag may nag-apply.')
                  : (lang === 'en' ? 'Production Loaning is currently disabled. Enable it under Settings to receive requests.' : 'Naka-disable ang pautang. I-enable sa Settings upang makatanggap ng hiling.')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(req => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">Request ID: {req.id}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          Pending Review
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>{req.farmerName}</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {req.farmerLocation} • {req.farmerPhone}
                      </p>
                    </div>

                    <div className="text-left sm:text-right bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium block">
                        {lang === 'en' ? 'Requested Loan Amount' : 'Hiling na Halaga'}
                      </span>
                      <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        ₱{req.requestedAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Loan Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl">
                    <div>
                      <span className="text-slate-400 text-[11px] block">{lang === 'en' ? 'Purpose of Loan' : 'Layunin ng Pautang'}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
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
                      <span className="text-slate-400 text-[11px] block">{lang === 'en' ? 'Requested Term' : 'Hiling na Termino'}</span>
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

                  {req.farmAreaHectares && (
                    <div className="text-xs bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                        {lang === 'en' ? 'Farm Area Covered by Loan:' : 'Lawak ng Sakahan na Gagamitan ng Loan:'}
                      </span>
                      <p className="font-extrabold text-emerald-700 dark:text-emerald-400">{req.farmAreaHectares.toLocaleString()} hectares</p>
                    </div>
                  )}

                  {req.additionalNotes && (
                    <div className="text-xs bg-slate-50 dark:bg-slate-800/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                        {lang === 'en' ? 'Farmer Notes / Farm Details:' : 'Tala ng Magsasaka / Detalye:'}
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{req.additionalNotes}</p>
                    </div>
                  )}

                  {/* Approve / Decline Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleOpenActionModal(req, 'decline')}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>{lang === 'en' ? 'Decline Request' : 'Tanggihan'}</span>
                    </button>

                    <AnimatedButton
                      onClick={() => handleOpenActionModal(req, 'approve')}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{lang === 'en' ? 'Approve Loan' : 'Aprubahan ang Pautang'}</span>
                    </AnimatedButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE LOANS */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeLoans.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <Sparkles className="w-12 h-12 text-slate-700 dark:text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                {lang === 'en' ? 'No Active Loans' : 'Walang Aktibong Pautang'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'en' ? 'Approved loans currently active in the field will be listed here.' : 'Lalabas dito ang mga inaprubahang pautang na kasalukuyang aktibo sa bukid.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeLoans.map(req => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        {req.status}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                        {req.farmerName}
                      </h3>
                      <p className="text-xs text-slate-500">{req.farmerLocation} • {req.farmerPhone}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">{lang === 'en' ? 'Approved Amount' : 'Inaprubahang Halaga'}</span>
                      <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                        ₱{(req.approvedAmount || req.requestedAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl">
                    <div>
                      <span className="text-slate-400 text-[11px] block">{lang === 'en' ? 'Purpose' : 'Layunin'}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{req.purpose}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">{lang === 'en' ? 'Season' : 'Panahon'}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{req.plantingSeason}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">{lang === 'en' ? 'Term' : 'Termino'}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{req.preferredRepaymentPeriod}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => { if (window.confirm(lang === 'en' ? `Mark ${req.farmerName}'s loan as fully completed?` : `Markahan na fully completed ang loan ni ${req.farmerName}?`)) onUpdateLoanStatus(req.id, 'Completed'); }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-500 text-white shadow-md shadow-green-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{lang === 'en' ? 'Mark Loan Fully Paid / Completed' : 'Markahang Bayad na / Kumpleto'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPLETED / DECLINED / HISTORY */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {completedOrDeclinedLoans.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <FileText className="w-12 h-12 text-slate-700 dark:text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                {lang === 'en' ? 'No Historical Loan Records' : 'Walang Nakaraang Tala ng Pautang'}
              </h3>
            </div>
          ) : (
            <div className="space-y-3">
              {completedOrDeclinedLoans.map(req => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{req.farmerName}</span>
                    <span className="text-slate-500">{req.purpose} • ₱{req.requestedAmount.toLocaleString()}</span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    req.status === 'Completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MANAGE PUBLISHED LOAN SERVICE */}
      {activeTab === 'settings' && hasLoanService && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {lang === 'en' ? 'Edit Loan Service' : 'I-edit ang Pautang'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'en' ? 'View and update the service below, or delete it when it is no longer offered.' : 'Tingnan at i-update ang serbisyo, o burahin ito kapag hindi na inaalok.'}
              </p>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Minimum Loan Amount */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                {lang === 'en' ? 'Minimum Loan Amount (₱)' : 'Minimum na Halaga ng Pautang (₱)'}
              </label>
              <input
                type="number"
                value={minAmount}
                onChange={e => setMinAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            {/* Maximum Loan Amount */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                {lang === 'en' ? 'Maximum Loan Amount (₱) [e.g. ₱2,000 or ₱20,000]' : 'Maximum na Halaga ng Pautang (₱)'}
              </label>
              <input
                type="number"
                value={maxAmount}
                onChange={e => setMaxAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-emerald-600 dark:text-emerald-400"
              />
            </div>

            {isCashRepayment && (
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                {lang === 'en' ? 'Interest Rate (%)' : 'Interest Rate (%)'}
              </label>
              <input
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                value={interestRate}
                onChange={e => setInterestRate(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Sample: 5%"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-emerald-600 dark:text-emerald-400"
              />
            </div>
            )}

            {/* Available Fund Pool */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                {lang === 'en' ? 'Total Money Available for Loans (₱)' : 'Kabuuang Pondong Maaaring Ipautang (₱)'}
              </label>
              <input
                type="number"
                value={availableFund}
                onChange={e => setAvailableFund(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {lang === 'en' ? 'This is the full amount you can lend across all farmers.' : 'Ito ang kabuuang halagang maaari mong ipautang sa lahat ng farmer.'}
              </p>
            </div>

            {/* Repayment Period */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                {lang === 'en' ? 'Standard Repayment Period' : 'Kondisyon ng Panahon ng Bayad'}
              </label>
              <input
                type="text"
                value={repaymentPeriod}
                onChange={e => setRepaymentPeriod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>

            {/* Repayment Method */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>{lang === 'en' ? 'How the Farmer Will Repay' : 'Paano Magbabayad ang Farmer'}</span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconWheat size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Harvest Repayment' : 'Bayad-Ani'}
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-1">
                <button
                  type="button"
                  onClick={() => setRepaymentMethod('Harvest-Based Repayment (Farmer as Planter - Harvest allocated to Buyer)')}
                  className={`p-2.5 text-left rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    repaymentMethod.includes('Harvest-Based') || repaymentMethod.includes('Planter')
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="font-extrabold text-emerald-700 dark:text-emerald-400 mb-0.5"><span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Harvest-Based (Planter)"}</span></div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Repay the buyer with the harvested crop.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRepaymentMethod('Palay Grain Delivery (Paitang / Direct Output Allocation)')}
                  className={`p-2.5 text-left rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    repaymentMethod.includes('Paitang') || repaymentMethod.includes('Palay Grain')
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="font-extrabold text-emerald-700 dark:text-emerald-400 mb-0.5"><span className="inline-flex items-center gap-1.5 align-middle"><IconPackage size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Palay Grain Delivery"}</span></div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Deliver dried palay sacks after harvest.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRepaymentMethod('Cash Payment upon Harvest Sale')}
                  className={`p-2.5 text-left rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    repaymentMethod.includes('Cash')
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="font-extrabold text-emerald-700 dark:text-emerald-400 mb-0.5"><span className="inline-flex items-center gap-1.5 align-middle"><IconCash size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Cash upon Sale"}</span></div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Repay in cash after selling the harvest.</div>
                </button>
              </div>

              <input
                type="text"
                value={repaymentMethod}
                onChange={e => setRepaymentMethod(e.target.value)}
                placeholder="Custom Repayment Method details..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs"
              />
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                {lang === 'en' ? 'Loan Terms and Conditions' : 'Mga Kondisyon at Kasunduan sa Pautang'}
              </label>
              <textarea
                value={termsAndConditions}
                onChange={e => setTermsAndConditions(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>

            {/* Additional Requirements */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                {lang === 'en' ? 'Additional Requirements (e.g. Valid ID, RSBSA)' : 'Karagdagang Rekisito'}
              </label>
              <input
                type="text"
                value={additionalRequirements}
                onChange={e => setAdditionalRequirements(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-2">
            {user.loanConfig && (
              <button
                type="button"
                onClick={handleDeleteLoanService}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300 px-5 py-3 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="w-4 h-4" />
                <span>{lang === 'en' ? 'Delete Loan Service' : 'Burahin ang Loan Service'}</span>
              </button>
            )}
            <AnimatedButton
              onClick={handleSaveConfig}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-500"
            >
              <Check className="w-4 h-4" />
              <span>{lang === 'en' ? 'Update Loan Service' : 'I-update ang Loan Service'}</span>
            </AnimatedButton>
          </div>
        </div>
      )}

      {/* Production loan platform limitation notice */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-start gap-3.5 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            {lang === 'en' ? 'Important System Notice:' : 'Mahalagang Paalala:'}
          </p>
          <p className="leading-relaxed opacity-90">
            {lang === 'en'
              ? 'KAWING coordinates loan requests, approvals, records, and monitoring. It does not process, hold, transfer, or collect money. Buyers and farmers release and repay funds directly outside KAWING.'
              : 'Tumutulong ang KAWING sa hiling, approval, tala, at koordinasyon ng pautang. Hindi ito humahawak, naglilipat, o nagtatago ng pera. Direkta sa labas ng platform ang pagbigay at pagbabayad.'}
          </p>
        </div>
      </div>

      {/* ENABLE LOANING WARNING POPUP MODAL */}
      {showEnableWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 md:p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className="my-auto w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 space-y-5"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {lang === 'en' ? 'Enable Production Loaning Feature' : 'I-enable ang Pautang sa Pagtatanim'}
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-amber-50 dark:bg-amber-950/50 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60">
                Enabling loans makes your terms visible to registered rice farmers, who can apply for rice production and post-harvest loans. Check your limits, repayment terms, and conditions before continuing.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEnableWarningModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'Cancel' : 'Kanselahin'}
              </button>

              <AnimatedButton
                onClick={handleConfirmEnableLoaning}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{lang === 'en' ? 'Enable Loaning' : 'I-enable ang Pautang'}</span>
              </AnimatedButton>
            </div>
          </motion.div>
        </div>
      )}

      {/* ACTION MODAL: APPROVE OR DECLINE LOAN REQUEST */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="my-auto w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {actionType === 'approve'
                ? (lang === 'en' ? 'Approve Production Loan Request' : 'Aprubahan ang Pautang')
                : (lang === 'en' ? 'Decline Production Loan Request' : 'Tanggihan ang Pautang')}
            </h3>

            <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
              <p><span className="text-slate-400">Farmer:</span> <strong className="text-slate-800 dark:text-slate-200">{selectedRequest.farmerName}</strong></p>
              <p><span className="text-slate-400">Purpose:</span> <strong>{selectedRequest.purpose}</strong></p>
              <p><span className="text-slate-400">Requested Amount:</span> <strong className="text-emerald-600">₱{selectedRequest.requestedAmount.toLocaleString()}</strong></p>
            </div>

            {actionType === 'approve' && (
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'en' ? 'Approved Loan Amount (₱)' : 'Inaprubahang Halaga ng Pautang (₱)'}
                </label>
                <input
                  type="number"
                  value={approvedAmtInput}
                  onChange={e => setApprovedAmtInput(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-emerald-600 text-sm"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => { setSelectedRequest(null); setActionType(null); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                {lang === 'en' ? 'Cancel' : 'Kanselahin'}
              </button>

              <button
                onClick={handleExecuteAction}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md ${
                  actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {actionType === 'approve'
                  ? (lang === 'en' ? 'Confirm Approval' : 'Kumpirmahin ang Pag-aprub')
                  : (lang === 'en' ? 'Confirm Decline' : 'Kumpirmahin ang Pagtanggi')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POST LOAN SERVICE POPUP MODAL */}
      <AnimatePresence>
        {showPostLoanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-7xl my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] md:max-h-[96vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {lang === 'en' ? 'Post Production Loan Service' : 'I-post ang Serbisyong Pautang'}
                    </h3>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300">
                      {lang === 'en' ? 'Configure loan boundaries & repayment conditions for rice farmers' : 'I-set ang limitasyon ng pautang at mga kondisyon sa pagbabayad'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPostLoanModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-5 py-10 sm:px-6 sm:py-12 overflow-y-auto space-y-5 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Minimum Loan Amount */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      {lang === 'en' ? 'Minimum Loan Amount (₱)' : 'Minimum na Halaga ng Pautang (₱)'}
                    </label>
                    <input
                      type="number"
                      value={minAmount}
                      onChange={e => setMinAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Sample: 5,000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  {/* Maximum Loan Amount */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      {lang === 'en' ? 'Maximum Loan Amount (₱)' : 'Maximum na Halaga ng Pautang (₱)'}
                    </label>
                    <input
                      type="number"
                      value={maxAmount}
                      onChange={e => setMaxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Sample: 50,000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>

                  {isCashRepayment && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      {lang === 'en' ? 'Interest Rate (%)' : 'Interest Rate (%)'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      required
                      value={interestRate}
                      onChange={e => setInterestRate(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Sample: 5%"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  )}

                  {/* Repayment Period */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      {lang === 'en' ? 'Repayment Period / Timeline' : 'Panahon ng Pagbabayad'}
                    </label>
                    <input
                      type="text"
                      value={repaymentPeriod}
                      onChange={e => setRepaymentPeriod(e.target.value)}
                      placeholder="Sample: 4 Months / Upon Harvest"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs"
                    />
                  </div>

                  {/* Repayment Method */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>{lang === 'en' ? 'How the Farmer Will Repay' : 'Paano Magbabayad ang Farmer'}</span>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconWheat size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Harvest Repayment' : 'Bayad-Ani'}
                      </span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-1">
                      <button
                        type="button"
                        onClick={() => setRepaymentMethod('Harvest-Based Repayment (Farmer as Planter - Harvest allocated to Buyer)')}
                        className={`p-2.5 text-left rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          repaymentMethod.includes('Harvest-Based') || repaymentMethod.includes('Planter')
                            ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-extrabold text-emerald-700 dark:text-emerald-400 mb-0.5"><span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Harvest-Based (Planter)"}</span></div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Repay the buyer with the harvested crop.</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRepaymentMethod('Palay Grain Delivery (Paitang / Direct Output Allocation)')}
                        className={`p-2.5 text-left rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          repaymentMethod.includes('Paitang') || repaymentMethod.includes('Palay Grain')
                            ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-extrabold text-emerald-700 dark:text-emerald-400 mb-0.5"><span className="inline-flex items-center gap-1.5 align-middle"><IconPackage size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Palay Grain Delivery"}</span></div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Deliver dried palay sacks after harvest.</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRepaymentMethod('Cash Payment upon Harvest Sale')}
                        className={`p-2.5 text-left rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          repaymentMethod.includes('Cash')
                            ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-extrabold text-emerald-700 dark:text-emerald-400 mb-0.5"><span className="inline-flex items-center gap-1.5 align-middle"><IconCash size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Cash upon Sale"}</span></div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Repay in cash after selling the harvest.</div>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={repaymentMethod}
                      readOnly
                      disabled
                      placeholder="Select a repayment card above..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-not-allowed select-none"
                    />
                  </div>

                  {/* Terms and Conditions */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      {lang === 'en' ? 'Loan Terms and Conditions' : 'Mga Kondisyon at Kasunduan sa Pautang'}
                    </label>
                    <textarea
                      value={termsAndConditions}
                      onChange={e => setTermsAndConditions(e.target.value)}
                      placeholder="Example: Registered rice farmers only. Priority palay delivery at harvest."
                      rows={3}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs"
                    />
                  </div>

                  {/* Additional Requirements */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      {lang === 'en' ? 'Additional Requirements (e.g. Valid ID, RSBSA)' : 'Karagdagang Rekisito'}
                    </label>
                    <input
                      type="text"
                      value={additionalRequirements}
                      onChange={e => setAdditionalRequirements(e.target.value)}
                      placeholder="Sample: Valid Government ID and RSBSA Registration Number"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPostLoanModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'Cancel' : 'Kanselahin'}
                </button>

                <AnimatedButton
                  onClick={handleSaveConfig}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Publish & Save Loan Service' : 'I-post at I-save ang Pautang'}</span>
                </AnimatedButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Existing published loan notice */}
      <AnimatePresence>
        {showExistingLoanNotice && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="existing-loan-title"
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              className="relative w-full max-w-sm rounded-2xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 p-6 text-center shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setShowExistingLoanNotice(false)}
                aria-label={lang === 'en' ? 'Close notice' : 'Isara ang abiso'}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Info className="h-7 w-7" />
              </div>
              <h3 id="existing-loan-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
                {lang === 'en' ? 'Loan Already Posted' : 'May Naka-post Nang Loan'}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {lang === 'en'
                  ? 'Only one loan service is allowed. Edit or delete yours in Edit Loan Service.'
                  : 'Isang pautang lang ang puwedeng i-post. Baguhin o burahin ito sa I-edit ang Pautang.'}
              </p>

              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowExistingLoanNotice(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {lang === 'en' ? 'Close' : 'Isara'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExistingLoanNotice(false);
                    handleOpenLoanManager();
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-colors"
                >
                  {lang === 'en' ? 'Edit Loan Service' : 'I-edit ang Pautang'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {typeof document !== 'undefined' && createPortal(<AnimatePresence>
        {configSaveSuccess && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/35 backdrop-blur-sm">
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              className="relative w-full max-w-sm rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 p-6 text-center shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setConfigSaveSuccess(false)}
                aria-label={lang === 'en' ? 'Close confirmation' : 'Isara ang kumpirmasyon'}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {lang === 'en' ? 'Loan Service Updated!' : 'Na-update ang Loan Service!'}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {lang === 'en' ? 'Your loan information has been saved.' : 'Nai-save na ang impormasyon ng inyong pautang.'}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>, document.body)}

      {/* Loan published confirmation */}
      {typeof document !== 'undefined' && createPortal(<AnimatePresence>
        {showPublishSuccess && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/35 backdrop-blur-sm">
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              className="relative w-full max-w-sm rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 p-6 text-center shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setShowPublishSuccess(false)}
                aria-label={lang === 'en' ? 'Close confirmation' : 'Isara ang kumpirmasyon'}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {lang === 'en' ? 'Loan Service Published!' : 'Na-publish na ang Loan Service!'}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {lang === 'en'
                  ? 'Your loan service is now available to farmers. Thank you!'
                  : 'Available na sa mga magsasaka ang iyong loan service. Salamat!'}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>, document.body)}
      </div>
    </div>
  );
}
