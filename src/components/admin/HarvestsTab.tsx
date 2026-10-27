import { IconConfetti, IconWheat } from '@tabler/icons-react';
import React, { useState } from 'react';
import { 
  Sprout, 
  Search, 
  Filter, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Tag, 
  Printer, 
  Trash2, 
  Check, 
  X, 
  FileText 
} from 'lucide-react';
import { Harvest } from '../../types';

interface HarvestsTabProps {
  lang: 'en' | 'tl';
  harvestsList: Harvest[];
  onDeleteHarvest: (harvestId: string) => void;
  onDeleteHarvests: (harvestIds: string[]) => void;
}

export default function HarvestsTab({ lang, harvestsList, onDeleteHarvest, onDeleteHarvests }: HarvestsTabProps) {
  const [search, setSearch] = useState('');
  const [cropFilter, setCropFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDelete, setBulkDelete] = useState<string[] | null>(null);

  const itemsPerPage = 8;

  // Compile unique crops for filter
  const uniqueCrops = Array.from(new Set(harvestsList.map(h => h.cropType)));

  // Filter lists
  const filteredHarvests = harvestsList.filter(h => {
    const matchesCrop = cropFilter === 'all' || h.cropType === cropFilter;
    const matchesStatus = statusFilter === 'all' || h.status === statusFilter;
    const matchesSearch = 
      h.farmerName.toLowerCase().includes(search.toLowerCase()) ||
      h.cropType.toLowerCase().includes(search.toLowerCase()) ||
      h.location.toLowerCase().includes(search.toLowerCase()) ||
      h.id.toLowerCase().includes(search.toLowerCase());
    return matchesCrop && matchesStatus && matchesSearch;
  });

  // Pagination calculations
  const totalItems = filteredHarvests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHarvests = filteredHarvests.slice(startIndex, startIndex + itemsPerPage);

  // Selection handlers
  const isAllSelected = paginatedHarvests.length > 0 && paginatedHarvests.every(h => selectedIds.includes(h.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !paginatedHarvests.some(h => h.id === id)));
    } else {
      const pageIds = paginatedHarvests.map(h => h.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setBulkDelete(selectedIds);
  };

  const handleDeleteAll = () => {
    if (filteredHarvests.length === 0) return;
    setBulkDelete(filteredHarvests.map(h => h.id));
  };

  // PDF Report Generation Handler
  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setSuccessMessage(lang === 'en' ? 'Please allow popups to print or save the report as PDF.' : 'Mangyaring payagan ang popups para ma-download o ma-print ang PDF.');
      return;
    }

    const rowsHtml = filteredHarvests.map(h => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 12px 8px; font-family: monospace; font-weight: bold; color: #64748b;">${h.id}</td>
        <td style="padding: 12px 8px; font-weight: bold; color: #1e293b;">${h.farmerName}</td>
        <td style="padding: 12px 8px; color: #059669; font-weight: 600;"> ${h.cropType}</td>
        <td style="padding: 12px 8px; font-weight: bold; color: #1e293b;">${h.quantity} ${h.unit}</td>
        <td style="padding: 12px 8px; color: #475569;">${h.harvestDate}</td>
        <td style="padding: 12px 8px; color: #334155;">${h.location}</td>
        <td style="padding: 12px 8px;">
          <span style="padding: 3px 8px; border-radius: 9999px; font-size: 9px; font-weight: bold; text-transform: uppercase; ${
            h.spoilageRisk === 'high' ? 'background-color: #fef2f2; color: #b91c1c;' :
            h.spoilageRisk === 'medium' ? 'background-color: #fffbeb; color: #b45309;' :
            'background-color: #f0fdf4; color: #15803d;'
          }">
            ${h.spoilageRisk} Risk
          </span>
        </td>
        <td style="padding: 12px 8px; text-transform: uppercase; font-weight: 800; color: ${
          h.status === 'completed' ? '#15803d' : h.status === 'in_progress' ? '#1d4ed8' : '#64748b'
        }; font-size: 10px;">
          ${h.status.replace('_', ' ')}
        </td>
      </tr>
    `).join('');

    const totalWeight = filteredHarvests.reduce((sum, h) => sum + h.quantity, 0);

    printWindow.document.write(`
      <html>
        <head>
          <title>KAWING Harvest Registry - Report Generated on ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; background: white; }
            .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 26px; font-weight: 900; letter-spacing: -0.05em; color: #047857; }
            .meta { text-align: right; font-size: 11px; color: #4b5563; line-height: 1.6; }
            .title { font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
            .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 12px; }
            .stat-title { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #4b5563; margin-bottom: 4px; }
            .stat-val { font-size: 20px; font-weight: 900; color: #111827; }
            table { width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 40px; }
            th { padding: 12px 8px; background-color: #f3f4f6; font-weight: bold; font-size: 11px; color: #374151; text-transform: uppercase; border-bottom: 1px solid #d1d5db; }
            .footer-text { border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 10px; color: #9ca3af; text-align: center; }
            .btn { background-color: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px; }
            @media print {
              .no-print { display: none !important; }
              body { padding: 0px; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: right; margin-bottom: 20px;">
            <button class="btn" onclick="window.print();"> Print / Save PDF</button>
          </div>
          <div class="header-container">
            <div>
              <div class="logo"> KAWING NETWORK</div>
              <div style="font-size: 11px; color: #047857; font-weight: bold; margin-top: 4px;">Sentralisadong Sistema para sa Magsasaka at Logistics</div>
            </div>
            <div class="meta">
              <div><strong>Ulat:</strong> Master Registry of Harvested Crops</div>
              <div><strong>Petsa ng Pag-ulat:</strong> ${new Date().toLocaleString()}</div>
              <div><strong>Administrator:</strong> Master Admin Access</div>
            </div>
          </div>

          <div class="title">${lang === 'en' ? 'Harvest Records Summary Report' : 'Ulat ng Talaan ng Ani at mga Pananim'}</div>
          
          <div class="grid">
            <div class="stat-card">
              <div class="stat-title">${lang === 'en' ? 'Active Records Listed' : 'Bilang ng mga Nakatalang Ani'}</div>
              <div class="stat-val">${filteredHarvests.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">${lang === 'en' ? 'Accumulated Volume' : 'Kabuuang Dami ng Ani'}</div>
              <div class="stat-val">${totalWeight.toLocaleString()} kg/sacks</div>
            </div>
            <div class="stat-card">
              <div class="stat-title" style="color: #ef4444;">${lang === 'en' ? 'Critical Spoilage Risk' : 'Mataas na Peligro ng Pagkasira'}</div>
              <div class="stat-val" style="color: #ef4444;">${filteredHarvests.filter(h => h.spoilageRisk === 'high').length}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>${lang === 'en' ? 'Farmer' : 'Magsasaka'}</th>
                <th>${lang === 'en' ? 'Crop' : 'Klase ng Ani'}</th>
                <th>${lang === 'en' ? 'Qty' : 'Dami'}</th>
                <th>${lang === 'en' ? 'Date' : 'Petsa'}</th>
                <th>${lang === 'en' ? 'Location' : 'Lokasyon'}</th>
                <th>${lang === 'en' ? 'Spoilage' : 'Peligro'}</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer-text">
            KAWING Direct Agricultural Ledger Network © 2026. This report was generated on a secure workstation. All transaction identities are audited.
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const executeDelete = (id: string) => {
    onDeleteHarvest(id);
    setConfirmDeleteId(null);
    setSuccessMessage(lang === 'en' ? 'Harvest record deleted successfully.' : 'Matagumpay na na-delete ang record ng ani.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
            {lang === 'en' ? 'Centralized Harvest Registry' : 'Sentral na Talaan ng Ani (Harvests)'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'en' 
              ? 'Track standing crops, harvested volume, and crop storage urgency markers.' 
              : 'Subaybayan ang dami, petsa, lokasyon, at panganib ng pagkasira ng ani.'}
          </p>
        </div>

        {/* Buttons & Search controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Save/Print PDF Button */}
          <button
            onClick={handleDownloadPDF}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title={lang === 'en' ? 'Print or Save List to PDF' : 'I-print o i-save sa PDF'}
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'en' ? 'Save as PDF / Print' : 'I-save sa PDF / I-print'}</span>
          </button>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={lang === 'en' ? 'Search farmer, crop...' : 'Maghanap ng magsasaka, ani...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white w-52"
            />
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 rounded-xl text-xs font-bold transition-all"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconConfetti size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{successMessage}
        </div>
      )}

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-bold">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Filters:</span>
        </div>

        {/* Crop Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Crop:</span>
          <select
            value={cropFilter}
            onChange={(e) => {
              setCropFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white"
          >
            <option value="all">All Crops</option>
            {uniqueCrops.map(crop => (
              <option key={crop} value={crop}>{crop}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="posted">Posted</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {filteredHarvests.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-red-50/50 dark:bg-red-950/10 p-4 rounded-2xl border border-red-150 dark:border-red-900/30 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
            <span>Selected: <strong>{selectedIds.length}</strong> of <strong>{filteredHarvests.length}</strong> records</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              title={lang === 'en' ? 'Delete Selected' : 'Burahin ang mga Napili'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Selected' : 'Mga Napili'} ({selectedIds.length})</span>
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

      {/* Harvests Registry Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
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
                <th className="p-4">{lang === 'en' ? 'Harvest ID' : 'ID ng Ani'}</th>
                <th className="p-4">{lang === 'en' ? 'Farmer Name' : 'Magsasaka'}</th>
                <th className="p-4">{lang === 'en' ? 'Crop Type' : 'Klase ng Ani'}</th>
                <th className="p-4">{lang === 'en' ? 'Quantity' : 'Dami'}</th>
                <th className="p-4">{lang === 'en' ? 'Harvest Date' : 'Araw ng Pag-ani'}</th>
                <th className="p-4">{lang === 'en' ? 'Farm Location' : 'Lokasyon'}</th>
                <th className="p-4">{lang === 'en' ? 'Spoilage Risk' : 'Peligro'}</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">{lang === 'en' ? 'Actions' : 'Aksyon'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedHarvests.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    No harvest records match your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedHarvests.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(h.id)}
                        onChange={() => handleSelectOne(h.id)}
                        className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                      />
                    </td>
                    {/* Harvest ID */}
                    <td className="p-4 font-mono font-bold text-slate-500 dark:text-slate-400">
                      {h.id}
                    </td>

                    {/* Farmer Name */}
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {h.farmerName}
                    </td>

                    {/* Crop Type with Icon */}
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-600"><span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></span>
                        <span>{h.cropType}</span>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-100">
                      {h.quantity} {h.unit}
                    </td>

                    {/* Harvest Date */}
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{h.harvestDate}</span>
                      </div>
                    </td>

                    {/* Farm Location */}
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{h.location}</span>
                      </div>
                    </td>

                    {/* Spoilage Risk Badge */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        h.spoilageRisk === 'high'
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/20'
                          : h.spoilageRisk === 'medium'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20'
                      }`}>
                        {h.spoilageRisk === 'high' && <AlertTriangle className="w-2.5 h-2.5" />}
                        <span>{h.spoilageRisk} Risk</span>
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                        h.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40'
                          : h.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {h.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Action Panel for deletion */}
                    <td className="p-4">
                      <div className="flex items-center justify-center">
                        {confirmDeleteId === h.id ? (
                          <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/30 p-1 rounded-lg border border-red-200 dark:border-red-900/40 animate-fade-in">
                            <button
                              onClick={() => executeDelete(h.id)}
                              className="p-1 text-red-600 hover:text-white hover:bg-red-600 rounded cursor-pointer transition-all"
                              title={lang === 'en' ? 'Confirm delete' : 'Kumpirmahin ang pag-delete'}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer transition-all"
                              title={lang === 'en' ? 'Cancel' : 'I-cancel'}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(h.id)}
                            className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 dark:bg-slate-850 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                            title={lang === 'en' ? 'Delete harvest record' : 'I-delete ang record'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">
            Showing {filteredHarvests.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, filteredHarvests.length)} of {filteredHarvests.length} records
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
      {bulkDelete && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 text-center shadow-2xl"><AlertTriangle className="mx-auto h-8 w-8 text-red-400" /><h3 className="mt-3 text-lg font-extrabold text-slate-900 dark:text-white">Delete harvest records?</h3><p className="mt-2 text-sm text-slate-700 dark:text-slate-300">Permanently delete {bulkDelete.length} record{bulkDelete.length === 1 ? '' : 's'}?</p><div className="mt-6 flex gap-3"><button type="button" onClick={() => setBulkDelete(null)} className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200">Cancel</button><button type="button" onClick={() => { onDeleteHarvests(bulkDelete); setSelectedIds([]); setBulkDelete(null); setSuccessMessage('Harvest records deleted successfully.'); }} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">Confirm</button></div></div></div>}
    </div>
  );
}
