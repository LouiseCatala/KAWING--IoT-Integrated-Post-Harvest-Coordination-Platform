import React, { useState } from 'react';
import { CheckSquare, AlertCircle, Calendar, Phone, MapPin, Check, X, ArrowUpRight, Eye, RefreshCw, FileText, Trash2 } from 'lucide-react';
import { UserAccount } from '../../types';

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
  onDeleteUser
}: VerificationTabProps) {
  const [subTab, setSubTab] = useState<'pending' | 'rejected' | 'resubmission'>('pending');
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);
  const [decision, setDecision] = useState<{ user: UserAccount; action: 'approve' | 'reject' | 'correction' } | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const accountTypeLabel = (user: UserAccount) =>
    user.role === 'farmer'
      ? (lang === 'en' ? 'Farmer' : 'Magsasaka')
      : 'Agricultural Business User';

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
          {lang === 'en' ? 'Account Approval Requests' : 'Mga Account na Kailangang Aprubahan'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {lang === 'en' ? 'Review submitted requirements for Farmer and Agricultural Business User accounts.' : 'Suriin ang requirements ng mga Magsasaka at Agricultural Business User.'}
        </p>
      </div>

      {/* Verification Filter Tabs */}
      <div className="flex gap-1.5 flex-wrap border-b border-slate-150 dark:border-slate-800 pb-px">
        <button
          onClick={() => setSubTab('pending')}
          className={`pb-3 text-xs font-bold px-2.5 transition-all relative cursor-pointer ${
            subTab === 'pending'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
          }`}
        >
          {lang === 'en' ? 'Pending Applications' : 'Mga Naghihintay (Pending)'}
          {pendingUsers.length > 0 && (
            <span className="ml-1.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold font-mono">
              {pendingUsers.length}
            </span>
          )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pendingUsers.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-12 text-center rounded-3xl">
              <CheckSquare className="w-12 h-12 text-emerald-100 dark:text-emerald-950/60 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                {lang === 'en' ? 'Registration Review Inbox is Clear' : 'Walang Naghihintay na Registration Review'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'en' ? 'No new Farmer or Agricultural Business User applications require review right now.' : 'Walang bagong application ng Magsasaka o Agricultural Business User na kailangang suriin ngayon.'}
              </p>
            </div>
          ) : (
            pendingUsers.map((u) => (
              <div 
                key={`${u.name}-${u.role}-${u.email || ''}`} 
                className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:shadow transition-all relative overflow-hidden"
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
                        {u.name}
                      </h3>
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
                  <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-b border-slate-100 dark:border-slate-800 py-3.5">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.contactNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.address || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Submitted Documents Section */}
                  <div className="mt-4 space-y-2">
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {lang === 'en' ? 'Documents Provided by the Applicant' : 'Mga Dokumentong Ipinasa ng Aplikante'}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {u.documents?.govIdData && (
                        <button
                          type="button"
                          onClick={() => onViewDoc(u.name, lang === 'en' ? 'Government ID' : 'Government ID', u.documents?.govIdData || '')}
                          className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-xl text-left border border-slate-100 dark:border-slate-800 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">Govt ID</span>
                          </div>
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      )}
                      
                      {u.documents?.licenseData && (
                        <button
                          type="button"
                          onClick={() => onViewDoc(u.name, lang === 'en' ? "Driver's License" : 'Lisensya sa Pagmamaneho', u.documents?.licenseData || '')}
                          className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-xl text-left border border-slate-100 dark:border-slate-800 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">License</span>
                          </div>
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      )}

                      {u.documents?.orCrData && (
                        <button
                          type="button"
                          onClick={() => onViewDoc(u.name, 'OR/CR', u.documents?.orCrData || '')}
                          className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-xl text-left border border-slate-100 dark:border-slate-800 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">OR/CR Document</span>
                          </div>
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      )}

                      {u.documents?.proofOwnershipData && (
                        <button
                          type="button"
                          onClick={() => onViewDoc(u.name, lang === 'en' ? 'Proof of Ownership' : 'Dokumento ng Pagmamay-ari', u.documents?.proofOwnershipData || '')}
                          className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-xl text-left border border-slate-100 dark:border-slate-800 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">Proof Owner</span>
                          </div>
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      )}
                    </div>
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
          {resubmissionRequests.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              No users currently queued for document resubmission.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {resubmissionRequests.map((name) => (
                <div key={name} className="py-3 flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">{name}</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                    Waiting for upload
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
          {rejectedApplications.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              No rejected applications in the system logs.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {rejectedApplications.map((u) => (
                <div key={`${u.name}-${u.role}-${u.email || ''}`} className="py-3.5 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{u.name}</span>
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase text-[8px] font-bold">
                      {accountTypeLabel(u)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-red-600 font-bold bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded">
                      Rejected Archive
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
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{decision.action === 'approve' ? 'Approve Registration' : decision.action === 'reject' ? 'Reject Registration' : 'Request Corrections'}</h3>
            <p className="mt-2 text-sm text-slate-500">Applicant: <b>{decision.user.name}</b></p>
            {decision.action !== 'approve' && <textarea autoFocus required value={decisionReason} onChange={(e) => setDecisionReason(e.target.value)} placeholder={decision.action === 'reject' ? 'Explain why the application is rejected…' : 'List the documents or information that must be corrected…'} className="mt-4 min-h-28 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />}
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setDecision(null)} className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-300">Cancel</button>
              <button type="button" disabled={decision.action !== 'approve' && !decisionReason.trim()} onClick={() => { if (decision.action === 'approve') onApprove(decision.user.name); else if (decision.action === 'reject') onReject(decision.user.name, decisionReason.trim()); else onRequestResubmission(decision.user.name, decisionReason.trim()); setDecision(null); }} className={`flex-1 rounded-xl py-3 text-sm font-black text-white disabled:opacity-50 ${decision.action === 'reject' ? 'bg-red-600' : 'bg-emerald-600'}`}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
