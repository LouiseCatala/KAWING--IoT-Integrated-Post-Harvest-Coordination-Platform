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
import { Offer, ServiceRequest, UserAccount } from '../../types';

interface TransactionsTabProps {
  lang: 'en' | 'tl';
  offersList: Offer[];
  serviceRequests: ServiceRequest[];
  registeredUsers: UserAccount[];
  onViewDoc?: (name: string, type: string, data: string) => void;
}

export default function TransactionsTab({ 
  lang, 
  offersList = [], 
  serviceRequests = [],
  registeredUsers = [],
  onViewDoc 
}: TransactionsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'logistics' | 'buyer_interest'>('logistics');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const connections = serviceRequests
    .filter(request => request.operatorEmail && ['matched', 'completed'].includes(request.status))
    .map(request => {
      const farmer = registeredUsers.find(account => account.email?.toLowerCase() === request.farmerEmail.toLowerCase());
      const provider = registeredUsers.find(account => account.email?.toLowerCase() === request.operatorEmail?.toLowerCase());
      return {
        id: request.id,
        farmer: request.farmerName || farmer?.name || request.farmerEmail,
        farmerPhone: request.farmerPhone || farmer?.contactNumber || '',
        provider: request.operatorName || provider?.businessName || provider?.name || request.operatorEmail || '',
        providerPhone: provider?.contactNumber || '',
        crop: request.cropType || request.type,
        qty: `${request.quantity} ${request.unit}`,
        status: request.status === 'completed' ? 'Completed' : 'In Progress',
        date: request.acceptedAt || request.createdAt,
      };
    });

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

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-bold">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>{lang === 'en' ? 'Status Filter:' : 'Salain ayon sa Kalagayan:'}</span>
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
            <option value="all">{lang === 'en' ? 'All Status' : 'Lahat ng Kalagayan'}</option>
            <option value="In Progress">{lang === 'en' ? 'In Progress' : 'Isinasagawa'}</option>
            <option value="Completed">{lang === 'en' ? 'Completed Match' : 'Nakumpletong Pagtutugma'}</option>
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
            <option value="all">{lang === 'en' ? 'All Connections' : 'Lahat ng Koneksyon'}</option>
            <option value="pending">{lang === 'en' ? 'Awaiting Verification' : 'Naghihintay ng Beripikasyon'}</option>
            <option value="accepted">{lang === 'en' ? 'Verified & Connected' : 'Beripikado at Nakakonekta'}</option>
            <option value="declined">{lang === 'en' ? 'Declined Request' : 'Tinanggihang Hiling'}</option>
          </select>
        )}
      </div>

      {/* Transactions & Connections Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {activeSubTab === 'logistics' ? (
            <table className="mobile-records w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-slate-150 dark:border-slate-800 font-bold text-emerald-800 dark:text-emerald-200">
                  <th className="p-4">{lang === 'en' ? 'Match ID' : 'ID ng Pagtutugma'}</th>
                  <th className="p-4">{lang === 'en' ? 'Farmer Name & Contact' : 'Magsasaka at Kontak'}</th>
                  <th className="p-4">{lang === 'en' ? 'Logistics Partner & Contact' : 'Logistiko at Kontak'}</th>
                  <th className="p-4">{lang === 'en' ? 'Produce / Service' : 'Paninda o Serbisyo'}</th>
                  <th className="p-4">{lang === 'en' ? 'Date Merged' : 'Petsa ng Pagtutugma'}</th>
                  <th className="p-4">{lang === 'en' ? 'Matching Status' : 'Kalagayan ng Pagtutugma'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedConnections.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      {lang === 'en' ? 'No active matching connections found matching your filter criteria.' : 'Walang aktibong koneksyong tumutugma sa iyong filter.'}
                    </td>
                  </tr>
                ) : (
                  paginatedConnections.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                      <td data-label={lang === 'en' ? 'Match ID' : 'ID ng Pagtutugma'} className="p-4 font-mono font-bold text-slate-400">{c.id}</td>
                      
                      {/* Farmer Name & Contact */}
                      <td data-label={lang === 'en' ? 'Farmer Name & Contact' : 'Magsasaka at Kontak'} className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{c.farmer}</div>
                        <div className="flex items-center gap-1 mt-1 text-slate-500 dark:text-slate-400">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span className="font-semibold text-[11px]">{c.farmerPhone}</span>
                        </div>
                      </td>

                      {/* Service Partner & Contact */}
                      <td data-label={lang === 'en' ? 'Logistics Partner & Contact' : 'Logistiko at Kontak'} className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{c.provider}</div>
                        <div className="flex items-center gap-1 mt-1 text-slate-500 dark:text-slate-400">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span className="font-semibold text-[11px]">{c.providerPhone}</span>
                        </div>
                      </td>

                      {/* Produce */}
                      <td data-label={lang === 'en' ? 'Produce / Service' : 'Paninda o Serbisyo'} className="p-4 text-slate-700 dark:text-slate-200">
                        <span className="font-bold text-slate-900 dark:text-slate-100"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconWheat size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{c.crop}</span> 
                        <div className="text-[11px] text-slate-400">{c.qty}</div>
                      </td>

                      {/* Date */}
                      <td data-label={lang === 'en' ? 'Date Merged' : 'Petsa ng Pagtutugma'} className="p-4 text-slate-400 font-mono text-[11px]">{c.date}</td>
                      
                      {/* Status */}
                      <td data-label={lang === 'en' ? 'Matching Status' : 'Kalagayan ng Pagtutugma'} className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          c.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                        }`}>
                          {c.status === 'Completed' ? 'Completed Match' : 'In Progress'}
                        </span>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="mobile-records w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-slate-150 dark:border-slate-800 font-bold text-emerald-800 dark:text-emerald-200">
                  <th className="p-4">{lang === 'en' ? 'Deal ID' : 'ID ng Kasunduan'}</th>
                  <th className="p-4">{lang === 'en' ? 'Buyer Name' : 'Pangalan ng Mamimili'}</th>
                  <th className="p-4">{lang === 'en' ? 'Farmer Name' : 'Pangalan ng Magsasaka'}</th>
                  <th className="p-4">{lang === 'en' ? 'Interested Crop' : 'Interesadong Ani'}</th>
                  <th className="p-4">{lang === 'en' ? 'Direct Contacts' : 'Direktang Kontak'}</th>
                  <th className="p-4">{lang === 'en' ? 'Submitted Date' : 'Petsa ng Pagsumite'}</th>
                  <th className="p-4">{lang === 'en' ? 'Approval Status' : 'Kalagayan ng Pag-apruba'}</th>
                  <th className="p-4 text-center">{lang === 'en' ? 'Identity & ID Review' : 'Pagsuri ng Pagkakakilanlan at ID'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedOffers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      {lang === 'en' ? 'No active buyer-farmer interest records found.' : 'Walang aktibong tala ng interes ng mamimili sa magsasaka.'}
                    </td>
                  </tr>
                ) : (
                  paginatedOffers.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                      <td data-label={lang === 'en' ? 'Deal ID' : 'ID ng Kasunduan'} className="p-4 font-mono font-bold text-slate-400">{o.id}</td>
                      <td data-label={lang === 'en' ? 'Buyer Name' : 'Pangalan ng Mamimili'} className="p-4 font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{o.buyerName}</span>
                      </td>
                      <td data-label={lang === 'en' ? 'Farmer Name' : 'Pangalan ng Magsasaka'} className="p-4 font-bold text-slate-700 dark:text-slate-300">{o.farmerName}</td>
                      <td data-label={lang === 'en' ? 'Interested Crop' : 'Interesadong Ani'} className="p-4 text-slate-700 dark:text-slate-200">
                        <span className="font-bold">{o.cropType}</span> ({o.quantity} {o.unit})
                      </td>
                      <td data-label={lang === 'en' ? 'Direct Contacts' : 'Direktang Kontak'} className="p-4 text-slate-600 dark:text-slate-300 font-semibold flex flex-col justify-center">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span className="font-bold text-slate-900 dark:text-white">{o.buyerPhone || 'N/A'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 truncate">{o.buyerEmail}</span>
                      </td>
                      <td data-label={lang === 'en' ? 'Submitted Date' : 'Petsa ng Pagsumite'} className="p-4 text-slate-400 font-mono text-[11px]">{o.createdAt || '—'}</td>
                      <td data-label={lang === 'en' ? 'Approval Status' : 'Kalagayan ng Pag-apruba'} className="p-4">
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
                      <td data-label={lang === 'en' ? 'Identity & ID Review' : 'Pagsuri ng Pagkakakilanlan at ID'} className="p-4">
                        <div className="flex justify-center">
                          {o.govIdData ? (
                            <button
                              onClick={() => onViewDoc?.(o.buyerName, 'Buyer Verification Government ID', o.govIdData || '')}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-[10px] border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                              title="Inspect Buyer Submitted Identity ID"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{lang === 'en' ? 'View submitted Government ID' : 'Tingnan ang isinumiteng ID ng gobyerno'}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'No ID uploaded' : 'Walang ID na na-upload'}</span>
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
            {lang === 'en' ? 'Showing' : 'Ipinapakita'} {currentListLength > 0 ? startIndex + 1 : 0} {lang === 'en' ? 'to' : 'hanggang'} {Math.min(startIndex + itemsPerPage, currentListLength)} {lang === 'en' ? 'of' : 'sa'} {currentListLength} {lang === 'en' ? 'entries' : 'tala'}
          </span>
          <div className="flex gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 text-slate-700 dark:text-slate-300 font-bold transition-all"
            >
              {lang === 'en' ? 'Previous' : 'Nakaraan'}
            </button>
            <span className="px-3 py-1 font-bold text-slate-700 dark:text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 text-slate-700 dark:text-slate-300 font-bold transition-all"
            >
              {lang === 'en' ? 'Next' : 'Susunod'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
