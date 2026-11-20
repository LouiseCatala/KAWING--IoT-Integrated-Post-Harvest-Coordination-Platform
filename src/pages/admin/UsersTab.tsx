import React, { useState } from 'react';
import { Search, ShieldAlert, Eye, Trash2 } from 'lucide-react';
import { UserAccount } from '../../types';

interface UsersTabProps {
  lang: 'en' | 'tl';
  usersList: UserAccount[];
  suspendedUsers: string[];
  onToggleSuspend: (name: string) => void;
  onViewProfile: (user: UserAccount) => void;
  onDeleteUser: (name: string) => void;
  onDeleteUsers: (names: string[]) => void;
}

export default function UsersTab({
  lang,
  usersList,
  suspendedUsers,
  onToggleSuspend,
  onViewProfile,
  onDeleteUser,
  onDeleteUsers
}: UsersTabProps) {
  // Search and filter states
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'farmer' | 'agricultural_business'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Delete User Confirmation state
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState<{ title: string; message: string; action: () => void; confirmLabel?: string; intent?: 'primary' | 'danger' } | null>(null);

  // 1. Generate formatted user items (adding ID, checking suspend status)
  const processedUsers = usersList
    .filter(u => u.role !== 'admin')
    .map((u, idx) => {
      // Compute formatted ID based on role and name
      const prefix = u.role === 'farmer' ? 'FA' : 'AB';
      const paddedIndex = String(idx + 1001);
      const computedId = `KWG-${prefix}-${paddedIndex}`;

      return {
        ...u,
        computedId,
        isSuspended: suspendedUsers.includes(u.name)
      };
    });

  const legacyBusinessRoles = ['buyer', 'logistics', 'truck', 'storage', 'dryer', 'miller'];
  const isAgriculturalBusiness = (user: UserAccount) =>
    user.role === 'agricultural_business' || legacyBusinessRoles.includes(user.role);
  const accountTypeLabel = (user: UserAccount) =>
    user.role === 'farmer'
      ? (lang === 'en' ? 'Farmer' : 'Magsasaka')
      : (lang === 'en' ? 'Agricultural Business User' : 'Negosyong Pang-agrikultura');

  // 2. Filter users based on search string and selected role
  const filteredUsers = processedUsers.filter(u => {
    const matchesRole = roleFilter === 'all'
      || (roleFilter === 'farmer' && u.role === 'farmer')
      || (roleFilter === 'agricultural_business' && isAgriculturalBusiness(u));
    const matchesSearch = 
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.address && u.address.toLowerCase().includes(search.toLowerCase())) ||
      (u.contactNumber && u.contactNumber.includes(search)) ||
      u.computedId.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // 3. Pagination logic
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Selection handlers
  const isAllSelected = paginatedUsers.length > 0 && paginatedUsers.every(u => selectedNames.includes(u.name));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedNames(prev => prev.filter(name => !paginatedUsers.some(u => u.name === name)));
    } else {
      const pageNames = paginatedUsers.map(u => u.name);
      setSelectedNames(prev => Array.from(new Set([...prev, ...pageNames])));
    }
  };

  const handleSelectOne = (name: string) => {
    setSelectedNames(prev => 
      prev.includes(name) ? prev.filter(item => item !== name) : [...prev, name]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedNames.length === 0) return;
    setConfirmation({ title: lang === 'en' ? 'Delete selected users?' : 'Burahin ang mga napiling user?', message: lang === 'en' ? `Delete ${selectedNames.length} selected users permanently?` : `Permanenteng burahin ang ${selectedNames.length} napiling user?`, action: () => { onDeleteUsers(selectedNames); setSelectedNames([]); } });
  };

  const handleDeleteAll = () => {
    if (filteredUsers.length === 0) return;
    setConfirmation({ title: lang === 'en' ? 'Delete all filtered users?' : 'Burahin lahat ng sinalang user?', message: lang === 'en' ? `Delete all ${filteredUsers.length} filtered users permanently?` : `Permanenteng burahin ang lahat ng ${filteredUsers.length} sinalang user?`, action: () => { onDeleteUsers(filteredUsers.map(u => u.name)); setSelectedNames([]); } });
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
            {lang === 'en' ? 'People and Accounts' : 'Mga Tao at Account'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'en' ? 'Review registered Farmers and Agricultural Business Users.' : 'Suriin ang mga rehistradong Magsasaka at Agricultural Business User.'}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'en' ? 'Search ID, name, or location...' : 'Maghanap ng ID, pangalan, o lugar...'}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white w-64"
          />
        </div>
      </div>

      {/* Role Filters */}
      <div className="flex gap-1.5 flex-wrap bg-slate-200/60 dark:bg-slate-800/80 p-1 rounded-xl w-fit mb-6">
        {([
          { key: 'all', labelEN: 'All Roles', labelTL: 'Lahat' },
          { key: 'farmer', labelEN: 'Farmers', labelTL: 'Magsasaka' },
            { key: 'agricultural_business', labelEN: 'Agricultural Business Users', labelTL: 'Mga Negosyong Pang-agrikultura' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setRoleFilter(tab.key);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              roleFilter === tab.key
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-950'
            }`}
          >
            {lang === 'en' ? tab.labelEN : tab.labelTL}
          </button>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {filteredUsers.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-red-50/50 dark:bg-red-950/10 p-4 rounded-2xl border border-red-150 dark:border-red-900/30 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
            <span>{lang === 'en' ? 'Selected' : 'Napili'}: <strong>{selectedNames.length}</strong> {lang === 'en' ? 'of' : 'sa'} <strong>{filteredUsers.length}</strong> {lang === 'en' ? 'users' : 'user'}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDeleteSelected}
              disabled={selectedNames.length === 0}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              title={lang === 'en' ? 'Delete Selected' : 'Burahin ang mga Napili'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Selected' : 'Mga Napili'} ({selectedNames.length})</span>
            </button>
            <button
              onClick={handleDeleteAll}
              className="px-3.5 py-1.5 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              title={lang === 'en' ? 'Delete All Filtered' : 'Burahin Lahat ng Sinala'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'All Filtered' : 'Lahat ng Sinala'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Users Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="mobile-records w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-slate-150 dark:border-slate-800 font-bold text-emerald-800 dark:text-emerald-200">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                  />
                </th>
                <th className="p-4">{lang === 'en' ? 'User ID' : 'ID ng User'}</th>
                <th className="p-4">{lang === 'en' ? 'Full Name' : 'Pangalan'}</th>
                <th className="p-4">{lang === 'en' ? 'Role' : 'Kategorya'}</th>
                <th className="p-4">{lang === 'en' ? 'Contact Number' : 'Telepono'}</th>
                <th className="p-4">{lang === 'en' ? 'Verification Status' : 'Katayuan'}</th>
                <th className="p-4">{lang === 'en' ? 'Reliability Score' : 'Reliability'}</th>
                <th className="p-4 text-center">{lang === 'en' ? 'Actions' : 'Mga Aksyon'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    {lang === 'en' ? 'No users matching the search criteria.' : 'Walang nahanap na user sa kategoryang ito.'}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={`${u.name}-${u.role}-${u.email || ''}`} className={`hover:bg-slate-50/50 dark:hover:bg-slate-850/10 ${u.isSuspended ? 'bg-red-50/10 dark:bg-red-950/5' : ''}`}>
                    <td data-label={lang === 'en' ? 'Select' : 'Piliin'} className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedNames.includes(u.name)}
                        onChange={() => handleSelectOne(u.name)}
                        className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                      />
                    </td>
                    {/* User ID */}
                    <td data-label={lang === 'en' ? 'User ID' : 'ID ng User'} className="p-4 font-mono font-bold text-slate-500 dark:text-slate-400">
                      {u.computedId}
                    </td>

                    {/* Name */}
                    <td data-label={lang === 'en' ? 'Full Name' : 'Pangalan'} className="p-4 font-bold text-slate-900 dark:text-white">
                      {u.name}
                    </td>

                    {/* Role Tag */}
                    <td data-label={lang === 'en' ? 'Role' : 'Kategorya'} className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        u.role === 'farmer'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
                      }`}>
                        {accountTypeLabel(u)}
                      </span>
                    </td>

                    {/* Contact Number */}
                    <td data-label={lang === 'en' ? 'Contact Number' : 'Telepono'} className="p-4 text-slate-600 dark:text-slate-300">
                      {u.contactNumber || (lang === 'en' ? 'N/A' : 'Wala')}
                    </td>

                    {/* Verification Status */}
                    <td data-label={lang === 'en' ? 'Verification Status' : 'Katayuan'} className="p-4">
                      {u.isSuspended ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block animate-pulse" />
                          {lang === 'en' ? 'Suspended' : 'Sinuspinde'}
                        </span>
                      ) : !u.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                          {lang === 'en' ? 'Pending Review' : 'Naghihintay ng Pagsusuri'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                          {lang === 'en' ? 'Verified' : 'Beripikado'}
                        </span>
                      )}
                    </td>

                    {/* Reliability Score */}
                    <td data-label={lang === 'en' ? 'Reliability Score' : 'Reliability'} className="p-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${u.isSuspended ? 'bg-red-400' : 'bg-emerald-500'}`}
                            style={{ width: `${(u.rating || 5) * 20}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {((u.rating || 5) * 20).toFixed(0)}%
                        </span>
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td data-label={lang === 'en' ? 'Actions' : 'Mga Aksyon'} className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => onViewProfile(u)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-lg transition-all cursor-pointer"
                          title="View Profile Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Suspend / Unsuspend */}
                        <button
                          type="button"
                          onClick={() => setConfirmation({ title: u.isSuspended ? 'Restore account?' : 'Suspend account?', message: lang === 'en' ? `${u.isSuspended ? 'Restore' : 'Suspend'} ${u.name}'s account?` : `${u.isSuspended ? 'Ibalik' : 'I-suspend'} ang account ni ${u.name}?`, action: () => onToggleSuspend(u.name) })}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            u.isSuspended
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/10'
                              : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 dark:bg-red-950/10'
                          }`}
                          title={u.isSuspended ? 'Unsuspend Account' : 'Suspend Account'}
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete User */}
                        <button
                          type="button"
                          onClick={() => setDeletingUser(u)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg transition-all cursor-pointer border border-red-100 dark:border-red-900/40"
                          title={lang === 'en' ? 'Delete User Account' : 'Burahin ang Account'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">
            {lang === 'en' ? 'Showing' : 'Ipinapakita'} {filteredUsers.length > 0 ? startIndex + 1 : 0} {lang === 'en' ? 'to' : 'hanggang'} {Math.min(startIndex + itemsPerPage, filteredUsers.length)} {lang === 'en' ? 'of' : 'sa'} {filteredUsers.length} {lang === 'en' ? 'users' : 'gumagamit'}
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

      {/* DELETE CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center overflow-y-auto p-3 md:p-4 z-55">
          <div className="my-auto bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl max-w-sm w-full overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-800 p-4 md:p-6 text-xs text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm font-display">
                {lang === 'en' ? 'Delete Account' : 'Burahin ang Account'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {lang === 'en' 
                  ? `Are you sure you want to permanently delete the account of ${deletingUser.name}? This action cannot be undone.` 
                  : `Sigurado ka bang nais mong permanenteng burahin ang account ni ${deletingUser.name}? Hindi na ito mababawi.`}
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
      {confirmation && <div className="fixed inset-0 z-[56] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-center shadow-2xl"><ShieldAlert className="mx-auto h-8 w-8 text-amber-400" /><h3 className="mt-3 text-lg font-extrabold text-slate-900 dark:text-white">{confirmation.title}</h3><p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{confirmation.message}</p><div className="mt-6 flex gap-3"><button type="button" onClick={() => setConfirmation(null)} className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200">{lang === 'en' ? 'Cancel' : 'Kanselahin'}</button><button type="button" onClick={() => { confirmation.action(); setConfirmation(null); }} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white ${confirmation.intent === 'primary' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}>{confirmation.confirmLabel || (lang === 'en' ? 'Confirm' : 'Kumpirmahin')}</button></div></div></div>}
    </div>
  );
}
