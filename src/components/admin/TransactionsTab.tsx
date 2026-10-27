import { IconWheat } from '@tabler/icons-react';
import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Check, 
  X, 
  CheckCircle, 
  Eye, 
  Users, 
  Phone, 
  UserCheck,
  MessageSquare,
  ExternalLink,
  Info
} from 'lucide-react';
import { Offer } from '../../types';

interface TransactionsTabProps {
  lang: 'en' | 'tl';
  offersList: Offer[];
  onViewDoc?: (name: string, type: string, data: string) => void;
}

export default function TransactionsTab({ 
  lang, 
  offersList = [], 
  onViewDoc 
}: TransactionsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'logistics' | 'buyer_interest'>('logistics');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Real-looking simulated logistics matches with contacts instead of money/escrow
  const [connections, setConnections] = useState([
    { 
      id: 'MCH-8219', 
      farmer: 'Mang Juan Dela Cruz', 
      farmerPhone: '0917-555-0192', 
      provider: 'Bayanihan Logistics', 
      providerPhone: '0918-333-4921', 
      crop: 'Rice (Palay)', 
      qty: '120 sacks', 
      status: 'In Progress', 
      date: '2026-07-11' 
    },
    { 
      id: 'MCH-9041', 
      farmer: 'Tatay Pedring Ramos', 
      farmerPhone: '0919-444-2391', 
      provider: 'Central Luzon Dryer', 
      providerPhone: '0922-888-1122', 
      crop: 'Palay (Wet - Basa)', 
      qty: '80 sacks', 
      status: 'Completed', 
      date: '2026-07-10' 
    },
    { 
      id: 'MCH-4831', 
      farmer: 'Mang Juan Dela Cruz', 
      farmerPhone: '0917-555-0192', 
      provider: 'Sariaya Cold Storage', 
      providerPhone: '0939-777-8833', 
      crop: 'Palay (Dry - Tuyo)', 
      qty: '2,500 kg', 
      status: 'In Progress', 
      date: '2026-07-09' 
    },
    { 
      id: 'MCH-1055', 
      farmer: 'Aling Maria Santos', 
      farmerPhone: '0915-222-3103', 
      provider: 'Bayanihan Logistics', 
      providerPhone: '0918-333-4921', 
      crop: 'Palay (Premium - RC 160)', 
      qty: '1,500 kg', 
      status: 'Completed', 
      date: '2026-07-08' 
    },
    { 
      id: 'MCH-7369', 
      farmer: 'Tatay Pedring Ramos', 
      farmerPhone: '0919-444-2391', 
      provider: 'Sariaya Cold Storage', 
      providerPhone: '0939-777-8833', 
      crop: 'Palay (Premium - RC 218)', 
      qty: '200 sacks', 
      status: 'In Progress', 
      date: '2026-07-07' 
    },
    { 
      id: 'MCH-2190', 
      farmer: 'Aling Maria Santos', 
      farmerPhone: '0915-222-3103', 
      provider: 'Central Luzon Dryer', 
      providerPhone: '0922-888-1122', 
      crop: 'Palay (Regular - Basa)', 
      qty: '120 sacks', 
      status: 'Completed', 
      date: '2026-07-05' 
    }
  ]);

  // Success alert state for visual feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'In Progress' ? 'Completed' : 'In Progress';
    setConnections(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    triggerSuccess(
      lang === 'en' 
        ? `Updated matching connection ${id} status to ${newStatus}.` 
        : `Na-update ang koneksyon ng matching ${id} bilang ${newStatus === 'Completed' ? 'Tapos na' : 'Sinasagawa'}.`
    );
  };

  // 1. Filtering for Logistics Matching tab
  const filteredConnections = connections.filter(c => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesSearch = 
      c.farmer.toLowerCase().includes(search.toLowerCase()) ||
      c.provider.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.crop.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // 2. Filtering for Buyer interest tab
  const filteredOffers = offersList.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch = 
      o.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      o.farmerName.toLowerCase().includes(search.toLowerCase()) ||
      o.cropType.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Current list items based on subtab selection
  const currentListLength = activeSubTab === 'logistics' ? filteredConnections.length : filteredOffers.length;
  const totalPages = Math.ceil(currentListLength / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  
  const paginatedConnections = filteredConnections.slice(startIndex, startIndex + itemsPerPage);
  const paginatedOffers = filteredOffers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
            {lang === 'en' ? 'KAWING Network Connections & Contacts Directory' : 'Talaan ng mga Koneksyon at Kontak sa Kawing'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'en' 
              ? 'Keep contact details current so farmers, buyers, and providers can coordinate.' 
              : 'Panatilihing tama ang contact details para madaling makipag-ugnayan.'}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'logistics'
                ? (lang === 'en' ? 'Search ID, farmer, partner...' : 'Maghanap ng ID, magsasaka, kasama...')
                : (lang === 'en' ? 'Search Buyer, Farmer, Crop...' : 'Maghanap ng Buyer, Magsasaka, Ani...')
            }
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white w-64 shadow-sm"
          />
        </div>
      </div>

      {/* Info Banner on Platform Role */}
      <div className="bg-slate-50 border border-slate-150 dark:bg-slate-950/20 dark:border-slate-800 p-4 rounded-xl text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-800 dark:text-slate-200">
            {lang === 'en' ? 'Platform Policy: Information Sharing & Privacy Consent' : 'Patakaran: Pagbabahagi ng Impormasyon at Kontak'}
          </p>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            {lang === 'en' 
              ? 'KAWING connects users; it does not process payments, hold escrow, or charge commissions. Users agree on prices and pay directly. Contacts are shared with verified consent.' 
              : 'Nag-uugnay lamang ang KAWING. Walang bayaran o escrow sa platform. Direktang pinag-uusapan ng users ang presyo at bayad.'}
          </p>
        </div>
      </div>

      {/* Segment Tab Controls */}
      <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit">
        <button
          onClick={() => {
            setActiveSubTab('logistics');
            setStatusFilter('all');
            setSearch('');
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'logistics'
              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <History className="w-4 h-4 text-emerald-600" />
          <span>{lang === 'en' ? 'Logistics Match Registry' : 'Talaan ng Tugmang Logistika'}</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('buyer_interest');
            setStatusFilter('all');
            setSearch('');
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'buyer_interest'
              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>{lang === 'en' ? 'Direct Buyer-Farmer Connections' : 'Koneksyon ng Buyer at Magsasaka'}</span>
          {offersList.filter(o => o.status === 'pending').length > 0 && (
            <span className="bg-red-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full font-extrabold">
              {offersList.filter(o => o.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Success notification alert */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl text-xs flex items-center gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 animate-bounce" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-bold">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Status Filter:</span>
        </div>
        {activeSubTab === 'logistics' ? (
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs cursor-pointer focus:outline-none dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed Match</option>
          </select>
        ) : (
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs cursor-pointer focus:outline-none dark:text-white"
          >
            <option value="all">All Connections</option>
            <option value="pending">Awaiting Verification</option>
            <option value="accepted">Verified & Connected</option>
            <option value="declined">Declined Request</option>
          </select>
        )}
      </div>

      {/* Transactions & Connections Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {activeSubTab === 'logistics' ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-slate-150 dark:border-slate-800 font-bold text-emerald-800 dark:text-emerald-200">
                  <th className="p-4">Match ID</th>
                  <th className="p-4">{lang === 'en' ? 'Farmer Name & Contact' : 'Magsasaka at Kontak'}</th>
                  <th className="p-4">{lang === 'en' ? 'Logistics Partner & Contact' : 'Logistiko at Kontak'}</th>
                  <th className="p-4">{lang === 'en' ? 'Produce / Service' : 'Paninda o Serbisyo'}</th>
                  <th className="p-4">Date Merged</th>
                  <th className="p-4">Matching Status</th>
                  <th className="p-4 text-center">Connection Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedConnections.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No active matching connections found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedConnections.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                      <td className="p-4 font-mono font-bold text-slate-400">{c.id}</td>
                      
                      {/* Farmer Name & Contact */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{c.farmer}</div>
                        <div className="flex items-center gap-1 mt-1 text-slate-500 dark:text-slate-400">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span className="font-semibold text-[11px]">{c.farmerPhone}</span>
                        </div>
                      </td>

                      {/* Service Partner & Contact */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{c.provider}</div>
                        <div className="flex items-center gap-1 mt-1 text-slate-500 dark:text-slate-400">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span className="font-semibold text-[11px]">{c.providerPhone}</span>
                        </div>
                      </td>

                      {/* Produce */}
                      <td className="p-4 text-slate-700 dark:text-slate-200">
                        <span className="font-bold text-slate-900 dark:text-slate-100"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconWheat size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{c.crop}</span> 
                        <div className="text-[11px] text-slate-400">{c.qty}</div>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-slate-400 font-mono text-[11px]">{c.date}</td>
                      
                      {/* Status */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          c.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                        }`}>
                          {c.status === 'Completed' ? 'Completed Match' : 'In Progress'}
                        </span>
                      </td>

                      {/* Toggle status control button */}
                      <td className="p-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleStatus(c.id, c.status)}
                            className={`px-3 py-1.5 font-bold rounded-lg text-[10px] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer border ${
                              c.status === 'In Progress'
                                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {c.status === 'In Progress' 
                                ? (lang === 'en' ? 'Mark Completed' : 'Markahan bilang Tapos') 
                                : (lang === 'en' ? 'Reopen Match' : 'Buksan Muli')}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-slate-150 dark:border-slate-800 font-bold text-emerald-800 dark:text-emerald-200">
                  <th className="p-4">Deal ID</th>
                  <th className="p-4">{lang === 'en' ? 'Buyer Name' : 'Mamimili (Buyer)'}</th>
                  <th className="p-4">{lang === 'en' ? 'Farmer Name' : 'Magsasaka (Farmer)'}</th>
                  <th className="p-4">{lang === 'en' ? 'Interested Crop' : 'Interesadong Ani'}</th>
                  <th className="p-4">Direct Contacts</th>
                  <th className="p-4">Submitted Date</th>
                  <th className="p-4">Approval Status</th>
                  <th className="p-4 text-center">Identity & ID Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedOffers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No active buyer-farmer interest records found.
                    </td>
                  </tr>
                ) : (
                  paginatedOffers.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                      <td className="p-4 font-mono font-bold text-slate-400">{o.id}</td>
                      <td className="p-4 font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{o.buyerName}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{o.farmerName}</td>
                      <td className="p-4 text-slate-700 dark:text-slate-200">
                        <span className="font-bold">{o.cropType}</span> ({o.quantity} {o.unit})
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300 font-semibold flex flex-col justify-center">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span className="font-bold text-slate-900 dark:text-white">{o.buyerPhone || 'N/A'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 truncate">{o.buyerEmail}</span>
                      </td>
                      <td className="p-4 text-slate-400 font-mono text-[11px]">{o.createdAt || '2026-07-13'}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          o.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : o.status === 'declined'
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 animate-pulse'
                        }`}>
                          {o.status === 'accepted' ? 'Approved & Connected' : o.status === 'declined' ? 'Declined' : 'Pending Verification'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          {o.govIdData ? (
                            <button
                              onClick={() => onViewDoc?.(o.buyerName, 'Buyer Verification Government ID', o.govIdData || '')}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-[10px] border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                              title="Inspect Buyer Submitted Identity ID"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>View submitted Gov ID</span>
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No ID uploaded</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">
            Showing {currentListLength > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, currentListLength)} of {currentListLength} entries
          </span>
          <div className="flex gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 text-slate-700 dark:text-slate-300 font-bold transition-all"
            >
              Previous
            </button>
            <span className="px-3 py-1 font-bold text-slate-700 dark:text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 text-slate-700 dark:text-slate-300 font-bold transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
