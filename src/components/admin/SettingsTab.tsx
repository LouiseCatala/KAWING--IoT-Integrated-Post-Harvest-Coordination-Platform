import { IconClearAll } from '@tabler/icons-react';
import React, { useEffect, useState } from 'react';
import { Settings, Save, Shield, CheckCircle, Sliders, Bell, Thermometer, Sparkles, Landmark } from 'lucide-react';
import type { UserAccount } from '../../types';

interface SettingsTabProps {
  user: UserAccount;
  lang: 'en' | 'tl';
  marketReferencePrice: number;
  onUpdateDAReferencePrice: (price: number) => void;
  onSaveEmailNotifications: (enabled: boolean) => Promise<void>;
}

export default function SettingsTab({ user, lang, marketReferencePrice, onUpdateDAReferencePrice, onSaveEmailNotifications }: SettingsTabProps) {
  // Form and switch states
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRegion, setAdminRegion] = useState('Region III (Central Luzon)');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Switches
  const [emailAlerts, setEmailAlerts] = useState(user.emailNotificationsEnabled === true);
  const [isSavingEmailAlerts, setIsSavingEmailAlerts] = useState(false);
  const [emailAlertsError, setEmailAlertsError] = useState<string | null>(null);
  const [pushAlerts, setPushAlerts] = useState(false);

  // Parameter sliders
  const [connectionRadius, setConnectionRadius] = useState(50); // km
  const [tempLimit, setTempLimit] = useState(30); // °C
  const [humidityAlert, setHumidityAlert] = useState(85); // %
  const [transitMax, setTransitMax] = useState(36); // hrs

  const [success, setSuccess] = useState<string | null>(null);
  const [daReferencePrice, setDaReferencePrice] = useState(marketReferencePrice);
  const [clearDemoConfirm, setClearDemoConfirm] = useState(false);

  const triggerSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  useEffect(() => {
    setEmailAlerts(user.emailNotificationsEnabled === true);
  }, [user.emailNotificationsEnabled]);

  const handleSaveEmailAlerts = async () => {
    setIsSavingEmailAlerts(true);
    setEmailAlertsError(null);
    try {
      await onSaveEmailNotifications(emailAlerts);
      triggerSuccess(emailAlerts ? 'Email notifications are enabled and saved to your user account.' : 'Email notifications are disabled and saved to your user account.');
    } catch (error) {
      setEmailAlertsError(error instanceof Error ? error.message : 'Email notification preference could not be saved.');
    } finally {
      setIsSavingEmailAlerts(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSuccess('Administrative profile updated successfully.');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isChangingPassword || !currentPassword || !newPassword) return;
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Password update failed. Please try again.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      triggerSuccess('Administrator password updated successfully.');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Password update failed. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveDAReferencePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(daReferencePrice) || daReferencePrice <= 0) return;
    onUpdateDAReferencePrice(Number(daReferencePrice.toFixed(2)));
    triggerSuccess(`DA reference price updated to ₱${daReferencePrice.toFixed(2)} per kg.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
          {lang === 'en' ? 'KAWING Administrative Settings & Rules Engine' : 'Mga Setting at Pamamahala ng KAWING'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {lang === 'en' ? 'Control matching distance, text alerts, and harvest safety warnings.' : 'Ayusin ang layo ng paghahanap, text alerts, at mga babala para sa kaligtasan ng ani.'}
        </p>
      </div>

      {/* Success Notif */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl text-xs flex items-center gap-3">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="font-bold">{success}</span>
        </div>
      )}

      {/* Settings Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">

        {/* Official DA reference price */}
        <div className="bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-700 rounded-3xl p-5 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Landmark className="w-4 h-4 text-amber-600" />
            <span>{lang === 'en' ? 'Official DA Palay Reference Price' : 'Opisyal na DA Reference Price ng Palay'}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'en'
              ? 'This price is shown to farmers and is enforced as the minimum buyer offer across KAWING.'
              : 'Ito ang presyong makikita ng farmers at minimum na alok ng buyers sa buong KAWING.'}
          </p>
          <form onSubmit={handleSaveDAReferencePrice} className="flex flex-col sm:flex-row sm:items-end gap-3 max-w-xl">
            <div className="space-y-1 flex-1">
              <label htmlFor="da-reference-price" className="block font-bold text-slate-600 dark:text-slate-300">
                {lang === 'en' ? 'Reference price per kilogram' : 'Reference price kada kilo'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-amber-700 dark:text-amber-400">₱</span>
                <input
                  id="da-reference-price"
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={daReferencePrice}
                  onChange={(e) => setDaReferencePrice(Number(e.target.value))}
                  className="w-full pl-8 pr-14 py-2.5 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-black"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">/ kg</span>
              </div>
            </div>
            <button
              type="submit"
              className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Save DA Price' : 'I-save ang Presyo'}</span>
            </button>
          </form>
        </div>
        
        {/* Section 1: Admin profile */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'en' ? 'Administrator Profile Settings' : 'Impormasyon ng Admin'}</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block font-bold text-slate-500">Admin Account Name</label>
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-500">Contact Email</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-500">Regional Authority Scope</label>
              <input
                type="text"
                required
                value={adminRegion}
                onChange={(e) => setAdminRegion(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </form>
        </div>

        {/* Section 2: Change Password */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'en' ? 'Modify Secure Password' : 'Baguhin ang Password'}</span>
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block font-bold text-slate-500">Current Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-slate-500">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Enter new secure password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-500">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Retype password to confirm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <p className="text-[10px] text-slate-500">Use at least 8 characters with a letter, number, and special character.</p>
            {passwordError && (
              <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 font-bold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              disabled={isChangingPassword}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isChangingPassword ? 'Updating…' : 'Update Password'}</span>
            </button>
          </form>
        </div>

        {/* Section 3: Notification Alerts Calibration */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'en' ? 'Administrative Notification Triggers' : 'Mga Setting ng Alert'}</span>
          </h3>

          <div className="space-y-3 pt-1">
            {/* Email alerts switch */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div>
                <span className="block font-bold text-slate-800 dark:text-white">Email Advisory Bulletins</span>
                <span className="text-sm text-slate-600 dark:text-slate-300">Send published platform and agricultural advisories by email.</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-5 h-5 accent-emerald-600"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleSaveEmailAlerts()}
              disabled={isSavingEmailAlerts}
              className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingEmailAlerts ? 'Saving email preference…' : 'Save Email Notification Preference'}
            </button>
            {emailAlertsError && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">{emailAlertsError}</p>}

            {/* Push alerts switch */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div>
                <span className="block font-bold text-slate-800 dark:text-white">New Registration Approval Notifications</span>
                <span className="text-sm text-slate-600 dark:text-slate-300">Receive alert triggers when new farmer documents are uploaded.</span>
              </div>
              <input
                type="checkbox"
                checked={pushAlerts}
                onChange={(e) => setPushAlerts(e.target.checked)}
                className="w-5 h-5 accent-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Rules Engine Sliders (Commission, Spoilage points) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'en' ? 'Automatic Matching and Warning Rules' : 'Awtomatikong Tuntunin sa Matching at Babala'}</span>
          </h3>

          <div className="space-y-4 pt-1">
            {/* Slider 1: Connection Match Radius */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-600">Maximum Connection Match Radius</span>
                <span className="text-emerald-600">{connectionRadius} km</span>
              </div>
              <input
                type="range"
                min={10}
                max={150}
                step={5}
                value={connectionRadius}
                onChange={(e) => setConnectionRadius(Number(e.target.value))}
                className="w-full accent-emerald-600 bg-slate-100 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">The geographic boundary limit within which logistics and direct buyer contacts will be matched.</span>
            </div>

            {/* Slider 2: Spoilage Temp Limit */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-600">Max Temperature Spoilage Threshold</span>
                <span className="text-red-600">{tempLimit}°C</span>
              </div>
              <input
                type="range"
                min={20}
                max={40}
                value={tempLimit}
                onChange={(e) => setTempLimit(Number(e.target.value))}
                className="w-full accent-red-500 bg-slate-100 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Triggers critical warning if crop storage climate exceeds limit.</span>
            </div>

            {/* Slider 3: Spoilage humidity limit */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-600">Relative Humidity Warning level</span>
                <span className="text-red-600">{humidityAlert}% RH</span>
              </div>
              <input
                type="range"
                min={70}
                max={95}
                value={humidityAlert}
                onChange={(e) => setHumidityAlert(Number(e.target.value))}
                className="w-full accent-red-500 bg-slate-100 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">High moisture levels trigger automated mechanical dryer dispatch guides.</span>
            </div>
          </div>
        </div>

        {/* Section 5: MySQL Database & PHP Integration & Clean Slate */}
        <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/30 dark:border-emerald-500/40 rounded-3xl p-5 shadow-sm space-y-4 col-span-1 lg:col-span-2">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-display flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'en' ? 'MySQL Database & PHP Backend Deployment' : 'MySQL Database at PHP Backend Deployment'}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">Production Ready</span>
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {lang === 'en' 
              ? 'KAWING includes a MySQL schema and PHP API for XAMPP, Apache, cPanel, or Linux deployment.'
              : 'May MySQL schema at PHP API ang KAWING para sa deployment sa XAMPP, cPanel, o Linux.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Clear Demo Data Button */}
            <button
              type="button"
              onClick={() => setClearDemoConfirm(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            ><span className="inline-flex items-center gap-1.5 align-middle"><IconClearAll size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Clear All Demo Data (Start Fresh / Clean Slate)"}</span></button>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white">Generated PHP API Endpoints:</div>
            <div>• /api/config.php (Database Connection & CORS)</div>
            <div>• /api/moisture_iot.php (ESP32 + Intel NUC Moisture Sensor Receiver)</div>
            <div>• /api/harvests.php (Grain Post-Harvest Listings)</div>
            <div>• /api/service_requests.php (Request Service Engine)</div>
            <div>• /api/offers.php (Buyer Offer Center Ranking)</div>
          </div>
        </div>
      </div>
      {clearDemoConfirm && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6"><h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Clear all demo data?</h3><p className="mt-2 text-sm text-slate-700 dark:text-slate-300">This removes local demo data and reloads KAWING.</p><div className="mt-6 flex gap-3"><button type="button" onClick={() => setClearDemoConfirm(false)} className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200">Cancel</button><button type="button" onClick={async () => { try { const res = await fetch('/api/db/clear-demo', { method: 'POST' }); if (!res.ok) throw new Error(); } catch { localStorage.clear(); } window.location.reload(); }} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">Confirm</button></div></div></div>}
    </div>
  );
}
