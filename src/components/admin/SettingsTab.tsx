import React, { useEffect, useState } from 'react';
import { Settings, Save, Shield, CheckCircle, Sliders, Bell, Thermometer, Sparkles, Landmark } from 'lucide-react';
import type { UserAccount } from '../../types';
import AdminConfirmationModal from './AdminConfirmationModal';

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
  const [confirmation, setConfirmation] = useState<{ title: string; message: string; confirmLabel: string; action: () => void | Promise<void> } | null>(null);

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
    setConfirmation({ title: lang === 'en' ? 'Save administrator profile?' : 'I-save ang profile ng admin?', message: lang === 'en' ? 'Save the profile details currently entered on this page?' : 'I-save ang mga detalye ng profile na inilagay mo?', confirmLabel: lang === 'en' ? 'Save Profile' : 'I-save ang Profile', action: () => triggerSuccess(lang === 'en' ? 'Administrative profile updated successfully.' : 'Matagumpay na na-update ang profile ng admin.') });
  };

  const savePassword = async () => {
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

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (isChangingPassword || !currentPassword || !newPassword) return;
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setConfirmation({ title: lang === 'en' ? 'Update administrator password?' : 'Palitan ang password ng admin?', message: lang === 'en' ? 'The current password will be replaced with the new password entered.' : 'Mapapalitan ang kasalukuyang password ng bagong password na inilagay mo.', confirmLabel: lang === 'en' ? 'Update Password' : 'Palitan ang Password', action: savePassword });
  };

  const handleSaveDAReferencePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(daReferencePrice) || daReferencePrice <= 0) return;
    const price = Number(daReferencePrice.toFixed(2));
    setConfirmation({
      title: lang === 'en' ? 'Save DA reference price?' : 'I-save ang reference price ng DA?',
      message: lang === 'en' ? `Confirm the new reference price of ₱${price.toFixed(2)} per kg.` : `Kumpirmahin ang bagong reference price na ₱${price.toFixed(2)} kada kilo.`,
      confirmLabel: lang === 'en' ? 'Save Price' : 'I-save ang Presyo',
      action: () => {
        onUpdateDAReferencePrice(price);
        triggerSuccess(`DA reference price updated to ₱${price.toFixed(2)} per kg.`);
      },
    });
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
          <label className="block font-bold text-slate-500">{lang === 'en' ? 'Admin Account Name' : 'Pangalan ng Account ng Admin'}</label>
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none"
              />
            </div>

            <div className="space-y-1">
          <label className="block font-bold text-slate-500">{lang === 'en' ? 'Contact Email' : 'Email para sa Kontak'}</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none"
              />
            </div>

            <div className="space-y-1">
          <label className="block font-bold text-slate-500">{lang === 'en' ? 'Regional Authority Scope' : 'Saklaw ng Rehiyon'}</label>
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
              <span>{lang === 'en' ? 'Save Changes' : 'I-save ang mga Pagbabago'}</span>
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
              <label className="block font-bold text-slate-500">{lang === 'en' ? 'Current Password' : 'Kasalukuyang Password'}</label>
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
              <label className="block font-bold text-slate-500">{lang === 'en' ? 'New Password' : 'Bagong Password'}</label>
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
              <label className="block font-bold text-slate-500">{lang === 'en' ? 'Confirm New Password' : 'Kumpirmahin ang Bagong Password'}</label>
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

            <p className="text-[10px] text-slate-500">{lang === 'en' ? 'Use at least 8 characters with a letter, number, and special character.' : 'Gumamit ng hindi bababa sa 8 character na may letra, numero, at espesyal na simbolo.'}</p>
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
                <span className="block font-bold text-slate-800 dark:text-white">{lang === 'en' ? 'Email Advisory Bulletins' : 'Mga Paunawa sa Email'}</span>
                <span className="text-sm text-slate-600 dark:text-slate-300">{lang === 'en' ? 'Send published platform and agricultural advisories by email.' : 'Ipadala sa email ang mga inilathalang paunawa ng platform at agrikultura.'}</span>
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
              onClick={() => setConfirmation({
                title: lang === 'en' ? 'Save email notification preference?' : 'I-save ang preference sa email?',
                message: lang === 'en' ? `Email notifications will be ${emailAlerts ? 'enabled' : 'disabled'} for the administrator account.` : `Ang mga abiso sa email ay ${emailAlerts ? 'i-on' : 'i-off'} para sa account ng admin.`,
                confirmLabel: lang === 'en' ? 'Save Preference' : 'I-save ang Preference',
                action: handleSaveEmailAlerts,
              })}
              disabled={isSavingEmailAlerts}
              className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingEmailAlerts ? (lang === 'en' ? 'Saving email preference…' : 'Sine-save ang preference sa email…') : (lang === 'en' ? 'Save Email Notification Preference' : 'I-save ang Preference sa Email')}
            </button>
            {emailAlertsError && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">{emailAlertsError}</p>}

            {/* Push alerts switch */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div>
                <span className="block font-bold text-slate-800 dark:text-white">{lang === 'en' ? 'New Registration Approval Notifications' : 'Mga Abiso sa Bagong Rehistrasyon'}</span>
                <span className="text-sm text-slate-600 dark:text-slate-300">{lang === 'en' ? 'Receive alerts when new farmer documents are uploaded.' : 'Tumanggap ng abiso kapag may bagong dokumentong ipinasa ang magsasaka.'}</span>
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
                <span className="text-slate-600">{lang === 'en' ? 'Maximum Connection Match Radius' : 'Pinakamalayong Saklaw ng Pagpapares'}</span>
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
              <span className="text-[10px] text-slate-400">{lang === 'en' ? 'The maximum distance for matching logistics providers and buyers.' : 'Pinakamalayong distansya para maitugma ang logistics provider at mga buyer.'}</span>
            </div>

            {/* Slider 2: Spoilage Temp Limit */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-600">{lang === 'en' ? 'Max Temperature Spoilage Threshold' : 'Pinakamataas na Temperatura para sa Babala ng Pagkasira'}</span>
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
              <span className="text-[10px] text-slate-400">{lang === 'en' ? 'Triggers a warning if storage temperature exceeds this limit.' : 'Magbibigay ng babala kapag lumampas sa limitasyong ito ang temperatura sa imbakan.'}</span>
            </div>

            {/* Slider 3: Spoilage humidity limit */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-600">{lang === 'en' ? 'Relative Humidity Warning Level' : 'Antas ng Babala sa Halumigmig'}</span>
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
              <span className="text-[10px] text-slate-400">{lang === 'en' ? 'High humidity triggers guidance to arrange mechanical drying.' : 'Kapag mataas ang halumigmig, magbibigay ng gabay para magpa-mechanical drying.'}</span>
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
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">{lang === 'en' ? 'Production Ready' : 'Handa para sa Production'}</span>
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {lang === 'en' 
              ? 'KAWING includes a MySQL schema and PHP API for XAMPP, Apache, cPanel, or Linux deployment.'
              : 'May MySQL schema at PHP API ang KAWING para sa deployment sa XAMPP, cPanel, o Linux.'}
          </p>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white">{lang === 'en' ? 'Active PHP API Routes:' : 'Mga Aktibong PHP API Route:'}</div>
            <div>- /api/ (PHP router for account, harvest, service, offer, loan, and notification data)</div>
            <div>- /api/ratings (Transaction and service ratings)</div>
            <div>- /api/moisture-readings (Temporary PalaySense reading relay)</div>
          </div>
        </div>
      </div>
      {confirmation && <AdminConfirmationModal title={confirmation.title} message={confirmation.message} confirmLabel={confirmation.confirmLabel} cancelLabel={lang === 'en' ? 'Cancel' : 'Kanselahin'} onConfirm={confirmation.action} onCancel={() => setConfirmation(null)} />}
    </div>
  );
}
