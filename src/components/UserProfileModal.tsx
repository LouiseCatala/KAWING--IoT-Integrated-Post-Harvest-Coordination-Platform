import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserAccount } from '../types';
import { User, Phone, MapPin, Building, ShieldCheck, Star, Mail, FileText, X, Edit3, Camera, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';

interface UserProfileModalProps {
  user: UserAccount;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser?: (originalName: string, updated: UserAccount, before?: UserAccount) => void;
}


export default function UserProfileModal({
  user,
  isOpen,
  onClose,
  onUpdateUser,
}: UserProfileModalProps) {
  const { lang } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const formBaseline = useRef(user);
  // Form states
  const [name, setName] = useState(user.name || '');
  const [contactNumber, setContactNumber] = useState(user.contactNumber || '');
  const [address, setAddress] = useState(user.address || '');
  const [businessName, setBusinessName] = useState(user.businessName || user.legalCompanyName || '');
  const [rsbsaNumber, setRsbsaNumber] = useState(user.rsbsaNumber || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [avatarFailed, setAvatarFailed] = useState(false);
  useEffect(() => setAvatarFailed(false), [avatarUrl]);
  const [bio, setBio] = useState(user.bio || '');
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(user.emailNotificationsEnabled === true);


  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updatedUser: UserAccount = {
      ...user,
      name: name.trim(),
      contactNumber: contactNumber.trim(),
      address: address.trim(),
      businessName: businessName.trim(),
      rsbsaNumber: rsbsaNumber.trim(),
      avatarUrl: avatarUrl,
      bio: bio.trim(),
      emailNotificationsEnabled,
      emailNotificationConsentAsked: true,
      emailNotificationConsentAt: new Date().toISOString(),
    };

    if (onUpdateUser) {
      onUpdateUser(user.name, updatedUser, formBaseline.current);
    }

    setIsEditing(false);
  };


  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'farmer': return lang === 'en' ? 'Verified Farmer' : 'Verified Magsasaka';
      case 'buyer': return lang === 'en' ? 'Grains Buyer / Trader' : 'Mamimili ng Palay at Bigas';
      case 'agricultural_business': return lang === 'en' ? 'Agricultural Business' : 'Negosyong Pang-agrikultura';
      case 'logistics': return lang === 'en' ? 'Logistics & Processing Provider' : 'Provider ng Logistics at Processing';
      case 'truck': return lang === 'en' ? 'Logistics / Trucker' : 'Byahero ng Palay (Trucking)';
      case 'storage': return lang === 'en' ? 'Storage Operator' : 'Tagapamahala ng Imbakan';
      case 'dryer': return lang === 'en' ? 'Dryer Facility Operator' : 'Patuyuan ng Palay';
      case 'miller': return lang === 'en' ? 'Rice Mill Operator' : 'Gilingan ng Bigas';
      case 'admin': return lang === 'en' ? 'System Administrator' : 'Kawing Admin';
      default: return role;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[2000] overflow-y-auto bg-black/60 p-3 backdrop-blur-xs md:flex md:items-center md:justify-center md:p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="mx-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Modal Header */}
        <div className="relative flex shrink-0 items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-4 text-white md:px-6 md:py-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg font-display">
                {lang === 'en' ? 'User Profile' : 'Aking Profile at Impormasyon'}
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                {lang === 'en' ? 'View and update your personal information' : 'Tingnan at baguhin ang iyong personal na impormasyon'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-4 md:p-6">
          {/* User Header Badge & Avatar */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="relative shrink-0">
              {avatarUrl && !avatarFailed ? <img
                src={avatarUrl}
                alt={user.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
                onError={() => setAvatarFailed(true)}
              /> : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <User className="h-8 w-8" aria-hidden="true" />
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 text-white rounded-full border-2 border-white dark:border-slate-900 text-[10px]">
                <ShieldCheck className="w-3 h-3" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white truncate font-display">
                  {name || user.name}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 uppercase tracking-wider shrink-0">
                  {user.isApproved !== false ? (lang === 'en' ? 'Verified' : 'Inaprubahan') : 'Pending Approval'}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {getRoleTitle(user.role)}
              </p>

              <div className="flex items-center gap-3 mt-2 text-xs">
                {user.rating && (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {user.rating.toFixed(1)} {lang === 'en' ? 'Rating' : 'Marka'}
                  </span>
                )}
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {user.email || 'user@kawing.com'}
                </span>
              </div>
            </div>
          </div>

          {!isEditing ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    {lang === 'en' ? 'Phone Number' : 'Numero ng Telepono'}
                  </span>
                  <strong className="text-sm font-bold text-slate-800 dark:text-slate-200 block font-mono">
                    {contactNumber}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    {lang === 'en' ? 'Barangay & Address' : 'Barangay at Lokasyon'}
                  </span>
                  <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                    {address}
                  </strong>
                </div>
              </div>

              {/* Role Specific Registration Info */}
              {user.role === 'farmer' && (
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1">
                  <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    {lang === 'en' ? 'RSBSA Farmer Number (Registry ID)' : 'RSBSA Number (ID sa Talaan ng Farmer)'}
                  </span>
                  <strong className="text-xs font-bold font-mono text-emerald-900 dark:text-emerald-200 block">
                    {rsbsaNumber || 'RSBSA-03-4912-8821'}
                  </strong>
                </div>
              )}

              {(user.role === 'buyer' || user.role === 'logistics' || user.role === 'truck' || user.role === 'storage' || user.role === 'dryer' || user.role === 'miller') && (
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1">
                  <span className="text-[10px] font-extrabold text-blue-800 dark:text-blue-300 uppercase tracking-wider block flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    {lang === 'en' ? 'Registered Business Name' : 'Pangalan ng Kumpanya / Business'}
                  </span>
                  <strong className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                    {businessName || `${user.name} Trading`}
                  </strong>
                </div>
              )}

              {bio && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {lang === 'en' ? 'Bio / Notes' : 'Mensahe / Karagdagang Impormasyon'}
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 text-xs">{bio}</p>
                </div>
              )}

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" />
                    {lang === 'en' ? 'Email Notifications' : 'Mga Abiso sa Email'}
                  </span>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300 break-all">{user.email}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase ${emailNotificationsEnabled ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                  {emailNotificationsEnabled ? (lang === 'en' ? 'Enabled' : 'Naka-enable') : (lang === 'en' ? 'Disabled' : 'Naka-disable')}
                </span>
              </div>

              {/* Verified ID Preview */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {lang === 'en' ? 'Government ID or RSBSA Proof' : 'Government ID o Katibayan ng RSBSA'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-extrabold">Verified Document</span>
                </div>
                <div className="h-24 w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 relative">
                  <img
                    src={user.documents?.govIdData || 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=500&auto=format&fit=crop&q=60'}
                    alt="Gov ID"
                    className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-all"
                  />
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded font-mono">
                    ID-VERIFIED-0091
                  </div>
                </div>
              </div>

              {/* Edit Profile Trigger Button */}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>{lang === 'en' ? 'Edit Profile Details' : 'I-edit ang Aking Impormasyon'}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6 text-sm">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block uppercase text-xs">
                  {lang === 'en' ? 'Full Name' : 'Buong Pangalan'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-sm"
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
                <div>
                  <label htmlFor="profile-email-notifications" className="font-bold text-slate-700 dark:text-slate-300 block uppercase text-xs">
                    {lang === 'en' ? 'Email Notifications' : 'Mga Abiso sa Email'}
                  </label>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {lang === 'en' ? 'Receive important KAWING activity updates.' : 'Tumanggap ng mahahalagang update mula sa KAWING.'}
                  </p>
                </div>
                <button
                  id="profile-email-notifications"
                  type="button"
                  role="switch"
                  aria-checked={emailNotificationsEnabled}
                  onClick={() => setEmailNotificationsEnabled((current) => !current)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors cursor-pointer ${emailNotificationsEnabled ? 'bg-emerald-600' : 'bg-slate-400 dark:bg-slate-600'}`}
                >
                  <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${emailNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block uppercase text-xs">
                    {lang === 'en' ? 'Contact Phone' : 'Numero ng Telepono'}
                  </label>
                  <input
                    type="text"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block uppercase text-xs">
                    {lang === 'en' ? 'Barangay & Address' : 'Barangay at Lokasyon'}
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-sm"
                  />
                </div>
              </div>

              {user.role === 'farmer' ? (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block uppercase text-xs">
                    {lang === 'en' ? 'RSBSA Number (Farmer Registry ID)' : 'RSBSA Number (ID sa Talaan ng Farmer)'}
                  </label>
                  <input
                    type="text"
                    value={rsbsaNumber}
                    onChange={(e) => setRsbsaNumber(e.target.value)}
                    placeholder="e.g. RSBSA-03-4912-8821"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-sm"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block uppercase text-xs">
                    {lang === 'en' ? 'Registered Business Name' : 'Pangalan ng Kumpanya'}
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. San Jose Grains Trading"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-sm"
                  />
                </div>
              )}

              {/* Profile Photo Upload (Optional) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block uppercase text-xs flex items-center justify-between">
                  <span>{lang === 'en' ? 'Profile Photo' : 'Larawan sa Profile'}</span>
                  <span className="text-slate-400 font-normal text-xs lowercase">(optional)</span>
                </label>
                <div className="flex items-center gap-3">
                  {avatarUrl && !avatarFailed && (
                    <img
                      src={avatarUrl}
                      alt="Avatar preview"
                      onError={() => setAvatarFailed(true)}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                  )}
                  <div className="relative flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (reader.result) {
                              setAvatarUrl(reader.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="profile-page-avatar-upload"
                    />
                    <label
                      htmlFor="profile-page-avatar-upload"
                      className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer transition-all w-full"
                    >
                      <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{avatarUrl ? (lang === 'en' ? 'Change Photo (Optional)' : 'Palitan ang Larawan (Optional)') : (lang === 'en' ? 'Upload Photo (Optional)' : 'Mag-upload ng Larawan (Optional)')}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block uppercase text-xs">
                  {lang === 'en' ? 'Short Bio / Remarks' : 'Karagdagang Impormasyon'}
                </label>
                <textarea
                  rows={2}
                  ref={(field) => {
                    if (!field) return;
                    field.style.height = 'auto';
                    field.style.height = `${field.scrollHeight + field.offsetHeight - field.clientHeight}px`;
                  }}
                  style={{ overflow: 'hidden' }}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Specialized in high-quality Dinorado and RC222 grains."
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 px-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  {lang === 'en' ? 'Cancel' : 'Kanselahin'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Save Changes' : 'I-save ang Pagbabago'}</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
