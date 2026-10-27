import { IconArrowLeft, IconArrowRight, IconCheck, IconCoin, IconFileText, IconHeartHandshake, IconPackage, IconPhoto, IconTruck, IconWheat, IconWind } from '@tabler/icons-react';
import React, { useState, useEffect } from 'react';
import riceFieldBackground from '../assets/images/rice_field_bg_1783944116925.jpg';
import kawingLogo from '../assets/images/kawing_logo_new_1784129186773.jpg';
import { motion } from 'motion/react';
import { BusinessCapability, LogisticsServiceType, UserAccount, UserRole } from '../types';
import { Leaf, ShieldAlert, Globe, User, Lock, Phone, MapPin, Mail, Upload, CheckCircle, RefreshCw, Briefcase, Eye, EyeOff, Check, Circle, AlertCircle, FileText, ArrowLeft, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import AnimatedButton from './AnimatedButton';
import ThemeToggle from './ThemeToggle';

const CAPTCHA_COLORS = [
  { id: 'red', labelEn: 'Red', labelTl: 'Pula', className: 'bg-red-500' },
  { id: 'blue', labelEn: 'Blue', labelTl: 'Asul', className: 'bg-blue-500' },
  { id: 'green', labelEn: 'Green', labelTl: 'Berde', className: 'bg-emerald-500' },
  { id: 'yellow', labelEn: 'Yellow', labelTl: 'Dilaw', className: 'bg-yellow-400' },
] as const;

interface AuthProps {
  onBack?: () => void;
  onAuthSuccess: (user: UserAccount) => void;
  registeredUsers: UserAccount[];
  onRegisterUser: (user: UserAccount) => Promise<UserAccount>;
}

export default function Auth({ onBack, onAuthSuccess, registeredUsers, onRegisterUser }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationStep, setRegistrationStep] = useState<1 | 2 | 3>(1);
  const passwordRules = {
    minimumLength: password.length >= 8,
    hasLetter: /[A-Za-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialCharacter: /[^A-Za-z0-9]/.test(password),
  };
  const isPasswordStrong = Object.values(passwordRules).every(Boolean);
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [fullName, setFullName] = useState('');
  const [rsbsaNumber, setRsbsaNumber] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [legalCompanyName, setLegalCompanyName] = useState('');
  const [serviceCoverageArea, setServiceCoverageArea] = useState('');
  const [operatingAddress, setOperatingAddress] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [carryingCapacity, setCarryingCapacity] = useState('');
  const [storageCapacity, setStorageCapacity] = useState('');
  const [storageFacilityLocation, setStorageFacilityLocation] = useState('');
  const [dryerType, setDryerType] = useState('');
  const [dryingBatchCapacity, setDryingBatchCapacity] = useState('');
  const [dryingFacilityLocation, setDryingFacilityLocation] = useState('');
  const [millingCapacity, setMillingCapacity] = useState('');
  const [millingFacilityLocation, setMillingFacilityLocation] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [selectedLogisticsServices, setSelectedLogisticsServices] = useState<BusinessCapability[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [showRegistrationSummary, setShowRegistrationSummary] = useState(false);
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);

  // Google Auth State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [isCustomGoogleInput, setIsCustomGoogleInput] = useState(false);

  // Inline login CAPTCHA state
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaColorIndex, setCaptchaColorIndex] = useState(() => Math.floor(Math.random() * CAPTCHA_COLORS.length));
  const [captchaError, setCaptchaError] = useState('');
  const [loginRetrySeconds, setLoginRetrySeconds] = useState(0);

  useEffect(() => {
    if (loginRetrySeconds <= 0) return;
    const timer = window.setInterval(() => {
      setLoginRetrySeconds(current => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [loginRetrySeconds > 0]);

  const refreshCaptcha = () => {
    setCaptchaVerified(false);
    setCaptchaError('');
    setCaptchaColorIndex(current => (current + 1) % CAPTCHA_COLORS.length);
  };

  // Listen for OAuth popup response message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data?.user) {
        const { name, email } = event.data.user;
        handleGoogleAccountSelect(name || 'Google User', email || 'google_user@gmail.com');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [registeredUsers]);

  const handleStartGoogleAuth = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();
      if (data.configured && data.url) {
        const width = 500;
        const height = 650;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;
        window.open(
          data.url,
          'google_oauth_popup',
          `width=${width},height=${height},top=${top},left=${left},status=no,menubar=no,toolbar=no`
        );
      } else {
        setErrorMsg(data.error || 'Google authentication is not configured. Please use your username and password.');
      }
    } catch (err) {
      console.error('Failed to initialize Google OAuth:', err);
      setErrorMsg('Google authentication is currently unavailable. Please use your username and password.');
    }
  };

  // Google Authentication Account Handler
  const handleGoogleAccountSelect = (selectedName: string, selectedEmail: string) => {
    setShowGoogleModal(false);
    setErrorMsg('');
    setSuccessMsg('');

    // Search registeredUsers by email or name
    const existingUser = registeredUsers.find(
      u => (u.email && u.email.toLowerCase() === selectedEmail.toLowerCase()) ||
           (u.name && u.name.toLowerCase() === selectedName.toLowerCase())
    );

    if (existingUser) {
      if (existingUser.isApproved === false) {
        setErrorMsg(
          lang === 'en'
            ? `This Google account (${selectedEmail}) is registered and waiting for approval. You can sign in after an administrator approves it.`
            : `Ang Google account (${selectedEmail}) ay nakarehistro na, ngunit naghihintay pa ng approval mula sa Admin. Mangyaring maghintay ng beripikasyon.`
        );
      } else {
        setSuccessMsg(
          lang === 'en'
            ? `Google Authentication Successful! Logging in as ${existingUser.name}...`
            : `Matagumpay ang Google Authentication! Naglo-login bilang ${existingUser.name}...`
        );
        setTimeout(() => {
          void fetch('/api/auth/me', { credentials: 'include' })
            .then(response => response.ok ? response.json() : Promise.reject(new Error('Google session was not established')))
            .then(data => onAuthSuccess(data.user as UserAccount))
            .catch(() => setErrorMsg(
              lang === 'en'
                ? 'Google was verified, but this KAWING account could not be authenticated.'
                : 'Na-verify ang Google, ngunit hindi ma-authenticate ang KAWING account na ito.'
            ));
        }, 600);
      }
    } else {
      // User is NOT registered yet -> Pre-fill registration form
      setIsLogin(false);
      setName(selectedName);
      setEmail(selectedEmail);
      setSuccessMsg(
        lang === 'en'
          ? `Google Account (${selectedEmail}) connected! Please choose your role and complete the required details below to submit for Admin approval.`
          : `Naka-connect na ang Google Account (${selectedEmail})! Pakipili ang iyong kategorya at kumpletuhin ang mga detalye sa ibaba upang maisumite sa Admin approval.`
      );
    }
  };

  // File Upload states (Stores filename & base64 preview data)
  const [uploadedDocs, setUploadedDocs] = useState<{
    avatar?: string;
    avatarData?: string;
    govId?: string;
    govIdData?: string;
    license?: string;
    licenseData?: string;
    orCr?: string;
    orCrData?: string;
    proofOwnership?: string;
    proofOwnershipData?: string;
    transportOrCr?: string;
    transportOrCrData?: string;
    storageProof?: string;
    storageProofData?: string;
    dryingProof?: string;
    dryingProofData?: string;
    millingProof?: string;
    millingProofData?: string;
  }>({});

  // AI ID Scanning states
  const [scanningStatus, setScanningStatus] = useState<Record<string, 'idle' | 'scanning' | 'success' | 'failed'>>({});
  const [scanResults, setScanResults] = useState<Record<string, {
    verified: boolean;
    reason: string;
    extractedName: string;
    extractedDetails: string;
  }>>({});

  const { lang, theme, toggleLanguage, toggleTheme, t } = useApp();

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'govId' | 'license' | 'orCr' | 'proofOwnership' | 'transportOrCr' | 'storageProof' | 'dryingProof' | 'millingProof'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isJpegOrPng = ['image/jpeg', 'image/png'].includes(file.type)
      || /\.(jpe?g|png)$/i.test(file.name);
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    const imageOnly = type === 'avatar' || type === 'transportOrCr';
    if (!isJpegOrPng && !(isPdf && !imageOnly)) {
      setErrorMsg(imageOnly
        ? (lang === 'en' ? 'Please upload a JPG, JPEG, or PNG image.' : 'Mag-upload ng JPG, JPEG, o PNG image.')
        : (lang === 'en' ? 'Please upload a JPG, JPEG, PNG, or PDF file.' : 'Mag-upload ng JPG, JPEG, PNG, o PDF file.'));
      e.target.value = '';
      return;
    }

    const maximumDocumentSize = 8 * 1024 * 1024;
    if (file.size > maximumDocumentSize) {
      setErrorMsg(lang === 'en' ? 'The selected file is too large. Upload an image or PDF no larger than 8 MB.' : 'Masyadong malaki ang file. Mag-upload ng image o PDF na hindi lalampas sa 8 MB.');
      e.target.value = '';
      return;
    }

    // To prevent exceeding localStorage 5MB quota, read as a compressed thumbnail or metadata
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      setUploadedDocs(prev => ({
        ...prev,
        [type]: file.name,
        [`${type}Data`]: base64Data,
      }));

      // Profile photos are not identity documents and must never be sent to the checker.
      if (type === 'avatar') return;

      setScanningStatus(prev => ({ ...prev, [type]: 'scanning' }));
      try {
        const response = await fetch('/api/analyze-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Data,
            role,
            filename: file.name,
            documentType: type,
            applicantName: role === 'agricultural_business' ? contactPersonName.trim() : fullName.trim(),
          }),
        });
        if (!response.ok) throw new Error('The server-side document checker is unavailable');
        const parsed = await response.json() as Partial<{ verified: boolean; reason: string; extractedName: string; extractedDetails: string }>;
        const result = {
          verified: parsed.verified === true,
          reason: String(parsed.reason || 'The document could not be confidently checked. Final review is required.'),
          extractedName: String(parsed.extractedName || 'Unknown'),
          extractedDetails: String(parsed.extractedDetails || 'No safe details extracted'),
        };
        setScanResults(prev => ({ ...prev, [type]: result }));
        setScanningStatus(prev => ({ ...prev, [type]: result.verified ? 'success' : 'failed' }));
      } catch (err: unknown) {
        console.error('Scan error:', err);
        setScanningStatus(prev => ({ ...prev, [type]: 'failed' }));
        setScanResults(prev => ({
          ...prev,
          [type]: {
            verified: false,
            reason: lang === 'en' 
              ? 'File saved. Automatic checking is unavailable; an admin must review it.' 
              : 'Nai-save ang file. Walang automatic check; kailangan itong suriin ng admin.',
            extractedName: 'Manual Review Required',
            extractedDetails: 'Automatic verification not completed'
          }
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyCaptchaClick = (selectedColor: string) => {
    if (captchaVerified) return;

    if (selectedColor !== CAPTCHA_COLORS[captchaColorIndex].id) {
      setCaptchaError(lang === 'en' ? 'That is not the correct color. Please try again.' : 'Hindi iyon ang tamang kulay. Subukan muli.');
      setCaptchaColorIndex((current) => (current + 1) % CAPTCHA_COLORS.length);
      return;
    }

    setCaptchaError('');
    setCaptchaVerified(true);
  };

  const executeAuthAction = async () => {
    if (isLogin) {
      let user: UserAccount | undefined;
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), password }),
        });
        if (response.status === 429) {
          const data = await response.json().catch(() => ({})) as { error?: string; retryAfterSeconds?: number };
          const headerSeconds = Number(response.headers.get('Retry-After'));
          const remaining = Math.max(1, Number(data.retryAfterSeconds) || headerSeconds || 300);
          setLoginRetrySeconds(remaining);
          refreshCaptcha();
          setErrorMsg(lang === 'en' ? 'Too many login attempts.' : 'Masyadong maraming pagtatangkang mag-login.');
          return;
        }
        if (response.status === 403) {
          const data = await response.json().catch(() => ({})) as { code?: string; error?: string };
          if (data.code === 'ACCOUNT_PENDING_APPROVAL') {
            setErrorMsg(
              lang === 'en'
                ? 'Your account is awaiting admin approval. Log in once approved.'
                : 'Hinihintay ang admin approval. Mag-login kapag aprubado na ang account.'
            );
            return;
          }
          throw new Error(data.error || 'Login was not permitted.');
        }
        if (response.ok) {
          const restored = await fetch('/api/auth/me', { credentials: 'include' });
          if (!restored.ok) throw new Error('Authenticated session could not be restored');
          const data = await restored.json();
          user = data.user as UserAccount;
        } else if (response.status === 401) {
          refreshCaptcha();
        } else {
          throw new Error('Login API unavailable');
        }
      } catch {
        setErrorMsg(lang === 'en' ? 'The secure login service is unavailable.' : 'Hindi ma-access ang secure login service.');
        return;
      }

      if (user) {
        if (user.isApproved === false) {
          setErrorMsg(
            lang === 'en'
              ? 'Your account is waiting for approval. You can sign in after an administrator approves it.'
              : 'Hindi pa aprubado ng Admin ang iyong account. Mangyaring maghintay para sa beripikasyon.'
          );
        } else {
          // Credentials are used only for this request. Do not retain them in
          // component state when the dashboard is opened.
          setName('');
          setPassword('');
          setConfirmPassword('');
          onAuthSuccess(user);
        }
      } else {
        setErrorMsg(
          lang === 'en'
            ? 'Incorrect name or password.'
            : 'Maling pangalan o password.'
        );
      }
    } else {
      const newUser: UserAccount = {
        name: name.trim(),
        fullName: role === 'farmer' || role === 'buyer' ? fullName.trim() : undefined,
        email: email.trim(),
        password,
        role,
        isApproved: false, // Must be approved by Admin user
        contactNumber,
        address,
        rsbsaNumber: role === 'farmer' ? rsbsaNumber.trim() : undefined,
        contactPersonName: role === 'agricultural_business' ? contactPersonName.trim() : undefined,
        legalCompanyName: role === 'agricultural_business' ? legalCompanyName.trim() : undefined,
        businessName: role === 'agricultural_business' ? legalCompanyName.trim() : undefined,
        serviceCoverageArea: role === 'agricultural_business' && selectedLogisticsServices.length > 0 ? serviceCoverageArea.trim() : undefined,
        operatingAddress: role === 'agricultural_business' ? operatingAddress.trim() : undefined,
        documents: uploadedDocs,
        rating: 5.0,
        businessCapabilities: role === 'agricultural_business'
          ? Object.fromEntries([
            ['buyer', { enabled: true, approvalStatus: 'pending', isAvailable: false }],
            ...selectedLogisticsServices.map((service) => [service, {
              enabled: true,
              approvalStatus: 'pending',
              isAvailable: false,
              locationCoverage: serviceCoverageArea.trim(),
              ...(service === 'transport' ? {
                vehicleType: vehicleType.trim(), plateNumber: plateNumber.trim(), carryingCapacity: carryingCapacity.trim(),
                capacity: carryingCapacity.trim(), orCrDocument: uploadedDocs.transportOrCr, orCrDocumentData: uploadedDocs.transportOrCrData,
              } : {}),
              ...(service === 'storage' ? {
                storageCapacity: storageCapacity.trim(), capacity: storageCapacity.trim(), facilityLocation: storageFacilityLocation.trim(),
                proofOfOwnershipDocument: uploadedDocs.storageProof, proofOfOwnershipDocumentData: uploadedDocs.storageProofData,
              } : {}),
              ...(service === 'drying' ? {
                dryerType: dryerType.trim(), batchCapacity: dryingBatchCapacity.trim(), capacity: dryingBatchCapacity.trim(), facilityLocation: dryingFacilityLocation.trim(),
                proofOfOwnershipDocument: uploadedDocs.dryingProof, proofOfOwnershipDocumentData: uploadedDocs.dryingProofData,
              } : {}),
              ...(service === 'milling' ? {
                millingCapacity: millingCapacity.trim(), capacity: millingCapacity.trim(), facilityLocation: millingFacilityLocation.trim(),
                proofOfOwnershipDocument: uploadedDocs.millingProof, proofOfOwnershipDocumentData: uploadedDocs.millingProofData,
              } : {}),
            }] as const),
          ])
          : undefined,
      };

      setIsSubmittingRegistration(true);
      try {
        await onRegisterUser(newUser);
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : 'Registration could not be saved. Please try again.');
        setShowRegistrationSummary(false);
        setIsSubmittingRegistration(false);
        return;
      }
      setIsSubmittingRegistration(false);

      setSuccessMsg(
        lang === 'en'
          ? 'Application sent! An administrator will review it. You can sign in after it is approved.'
          : 'Naipadala ang aplikasyon. Susuriin ng admin ang mga dokumento. Hintayin ang approval bago mag-login.'
      );
      // Never carry registration credentials into the login form.
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setContactNumber('');
      setAddress('');
      setFullName('');
      setRsbsaNumber('');
      setContactPersonName('');
      setLegalCompanyName('');
      setServiceCoverageArea('');
      setOperatingAddress('');
      setSelectedLogisticsServices([]);
      setUploadedDocs({});
      setShowPassword(false);
      setRegistrationStep(1);
      setIsLogin(true);
      setShowRegistrationSummary(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name || !password) {
      setErrorMsg(
        lang === 'en'
          ? 'Please provide your username/company name and password.'
          : 'Mangyaring ilagay ang username/pangalan ng kompanya at password.'
      );
      return;
    }

    if (!isLogin) {
      if (!isPasswordStrong) {
        setErrorMsg(
          lang === 'en'
            ? 'Password must have at least 8 characters, including a letter, number, and special character.'
            : 'Ang password ay dapat may hindi bababa sa 8 character, kasama ang letra, numero, at special character.'
        );
        return;
      }

      if (!confirmPassword) {
        setErrorMsg(lang === 'en' ? 'Please confirm your password.' : 'Pakikumpirma ang iyong password.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMsg(lang === 'en' ? 'Passwords do not match. Please try again.' : 'Hindi magkapareho ang mga password. Pakisubukan muli.');
        return;
      }

      if (!email.trim()) {
        setErrorMsg(
          lang === 'en'
            ? 'Please provide an email address for account notifications.'
            : 'Maglagay ng email address para sa mga notification ng account.'
        );
        return;
      }

      if (!contactNumber.trim() || !address.trim()) {
        setErrorMsg(lang === 'en' ? 'Contact number and complete contact address are required.' : 'Kailangan ang contact number at kumpletong contact address.');
        return;
      }

      // Sign-up process with verification requirements
      const exists = registeredUsers.some(
        u => u.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (exists) {
        setErrorMsg(
          lang === 'en'
            ? 'This username/company name is already registered. Please choose another name.'
            : 'Nakarehistro na ang username/pangalan ng kompanya. Pumili ng ibang pangalan.'
        );
        return;
      }

      // Check required documents depending on role
      if (role === 'farmer') {
        if (!fullName.trim() || !rsbsaNumber.trim() || !uploadedDocs.govId) {
          setErrorMsg(
            lang === 'en'
              ? 'Farmer requires a full name, RSBSA number, and uploaded RSBSA Registration ID.'
              : 'Kailangan ng Farmer ang Pangalan, Contact Number, Address, at RSBSA Registration ID.'
          );
          return;
        }
      } else if (role === 'truck') {
        if (!contactNumber || !uploadedDocs.govId || !uploadedDocs.license || !uploadedDocs.orCr) {
          setErrorMsg(
            lang === 'en'
              ? "Trucker requires Government ID, Driver's License, OR/CR, and Contact Number."
              : 'Kailangan ng Trucker ang Government ID, Lisensya, OR/CR ng sasakyan, at Contact Number.'
          );
          return;
        }
      } else if (role === 'storage' || role === 'dryer' || role === 'miller') {
        if (!uploadedDocs.govId || !uploadedDocs.proofOwnership) {
          setErrorMsg(
            lang === 'en'
              ? 'This role requires Government ID and Proof of Ownership o Management.'
              : 'Kailangan sa role na ito ang Government ID at Patunay ng Pagmamay-ari o Pamamahala.'
          );
          return;
        }
      } else if (role === 'buyer') {
        if (!fullName.trim() || !uploadedDocs.govId) {
          setErrorMsg(
            lang === 'en'
              ? 'Buyer requires a full name and Government ID, together with the required contact details.'
              : 'Kailangan ng Buyer ang Pangalan, Contact Number, Kumpletong Address, at Government ID.'
          );
          return;
        }
      } else if (role === 'agricultural_business') {
        if (!contactPersonName.trim() || !legalCompanyName.trim() || !operatingAddress.trim() || !uploadedDocs.govId) {
          setErrorMsg(
            lang === 'en'
              ? 'Logistics provider requires a contact person, legal company name, operating address, and company registration ID.'
              : 'Kailangan ng Logistics Provider ang Pangalan ng Kompanya, Contact Number, Address, at Company ID o Registration.'
          );
          return;
        }
        if (selectedLogisticsServices.length > 0 && !serviceCoverageArea.trim()) {
          setErrorMsg(lang === 'en' ? 'Please enter the service coverage area for your selected services.' : 'Ilagay ang sakop na lugar para sa mga napiling serbisyo.');
          return;
        }
        if (selectedLogisticsServices.includes('transport') && (!uploadedDocs.transportOrCr || !vehicleType.trim() || !plateNumber.trim() || !carryingCapacity.trim())) {
          setErrorMsg(lang === 'en' ? 'Trucking requires an OR/CR image, vehicle type, plate number, and carrying capacity.' : 'Kailangan sa trucking ang OR/CR image, uri ng sasakyan, plate number, at carrying capacity.');
          return;
        }
        if (selectedLogisticsServices.includes('storage') && (!uploadedDocs.storageProof || !storageCapacity.trim() || !storageFacilityLocation.trim())) {
          setErrorMsg(lang === 'en' ? 'Storage requires proof of ownership/management, storage capacity, and facility location.' : 'Kailangan sa storage ang patunay ng ownership/management, kapasidad, at lokasyon ng pasilidad.');
          return;
        }
        if (selectedLogisticsServices.includes('drying') && (!uploadedDocs.dryingProof || !dryerType.trim() || !dryingBatchCapacity.trim() || !dryingFacilityLocation.trim())) {
          setErrorMsg(lang === 'en' ? 'Drying requires proof of ownership/management, dryer type, batch capacity, and facility location.' : 'Kailangan sa drying ang patunay ng ownership/management, dryer type, batch capacity, at lokasyon.');
          return;
        }
        if (selectedLogisticsServices.includes('milling') && (!uploadedDocs.millingProof || !millingCapacity.trim() || !millingFacilityLocation.trim())) {
          setErrorMsg(lang === 'en' ? 'Milling requires proof of ownership/management, milling capacity, and facility location.' : 'Kailangan sa milling ang patunay ng ownership/management, milling capacity, at lokasyon.');
          return;
        }
      }
    }

    if (isLogin && !captchaVerified) {
      setCaptchaError(lang === 'en' ? 'Please answer the color check before logging in.' : 'Sagutin muna ang tanong tungkol sa kulay bago mag-login.');
      return;
    }

    if (isLogin) {
      executeAuthAction();
    } else {
      setShowRegistrationSummary(true);
    }
  };

  // Only display the 5 category options, hide 'admin'
  const allowedRoles: UserRole[] = ['farmer', 'agricultural_business'];

  const roleLabels: Record<UserRole, { titleTL: string; titleEN: string; descTL: string; descEN: string }> = {
    farmer: {
      titleTL: 'Magsasaka',
      titleEN: 'Farmer',
      descTL: 'Mag-post ng ani at humiling ng patuyuan o imbakan.',
      descEN: 'Post harvests, request dry/storage, and find buyers.',
    },
    agricultural_business: {
      titleTL: 'Agricultural Business User',
      titleEN: 'Agricultural Business User',
      descTL: 'Bumili ng palay, magpautang, o magbigay ng transport, imbakan, patuyuan, at paggiling.',
      descEN: 'Buy or trade palay, provide loans, transport, storage, drying, or milling services.',
    },
    buyer: {
      titleTL: 'Mamimili',
      titleEN: 'Buyer',
      descTL: 'Maghanap ng sariwang ani at mag-alok ng presyo.',
      descEN: 'Browse fresh crops and make offers directly.',
    },
    logistics: {
      titleTL: 'Logistics at Processing Provider',
      titleEN: 'Logistics & Processing Provider',
      descTL: 'Mag-alok ng trucking, imbakan, patuyuan, o gilingan gamit ang isang account.',
      descEN: 'Offer trucking, storage, drying, or milling from one account.',
    },
    truck: {
      titleTL: 'Bumibyahe',
      titleEN: 'Truck Operator',
      descTL: 'Maghatid ng mga produkto sa tamang panahon.',
      descEN: 'Provide transport services to farmers.',
    },
    storage: {
      titleTL: 'Imbakan',
      titleEN: 'Storage Facility',
      descTL: 'Mag-alok ng ligtas na bodega para panatilihing tuyo ang mga sako ng palay.',
      descEN: 'Provide secure storage to keep Palay bags dry.',
    },
    dryer: {
      titleTL: 'Patuyuan',
      titleEN: 'Dryer Operator',
      descTL: 'Magpatuyo ng basang palay bago ito i-imbak o gilingin.',
      descEN: 'Offer mechanical drying services for harvested Palay.',
    },
    miller: {
      titleTL: 'Gilingan',
      titleEN: 'Miller Operator',
      descTL: 'Maggiling ng palay upang gawing de-kalidad na bigas.',
      descEN: 'Offer mechanical milling to convert Palay into polished white rice.',
    },
    admin: {
      titleTL: 'Admin',
      titleEN: 'Admin',
      descTL: 'Mamahala ng system at mag-verify ng mga aplikasyon.',
      descEN: 'Manage system and verify registration forms.',
    },
  };

  return (
    <div id="auth-page" className="relative min-h-screen text-slate-900 dark:text-slate-100 flex flex-col justify-center py-6 md:py-12 px-3 md:px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300 overflow-x-hidden overflow-y-auto md:overflow-hidden">
      
      {/* Mount Arayat Background Image Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src={riceFieldBackground}
          alt="Mount Arayat Pampanga"
          className="w-full h-full object-cover object-center filter brightness-[0.4] contrast-105"
        />
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full">
      {/* Top Floating Controls Bar */}
      <div className="absolute -top-8 right-0 sm:-top-6 flex items-center gap-2 z-20 flex-wrap justify-end">
        <ThemeToggle variant="floating" />
        {onBack && (
          <button
            id="back-to-lobby-btn"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title={lang === 'en' ? 'Back to Lobby' : 'Bumalik sa Lobby'}
          >
            <ArrowLeft className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{lang === 'en' ? 'Back to Lobby' : 'Bumalik sa Lobby'}</span>
          </button>
        )}

        <button
          id="lang-toggle-btn"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <Globe className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{lang === 'en' ? 'Tagalog (TL)' : 'English (EN)'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-emerald-600 dark:bg-emerald-700 shadow-xl shadow-emerald-500/20 overflow-hidden border-2 border-emerald-400/40">
            <img
              src={kawingLogo}
              alt="Kawing Logo"
              className="w-full h-full object-cover scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-white font-display drop-shadow-md">
          {isLogin ? (lang === 'en' ? 'Log in to Kawing' : 'Mag-login sa Kawing') : (lang === 'en' ? 'Create your Account' : 'Gumawa ng Account')}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-300 font-medium">
          {isLogin 
            ? (lang === 'en' ? "Don't have an account?" : 'Wala pang account?') 
            : (lang === 'en' ? 'Already have an account?' : 'Mayroon nang account?')}
          {' '}
          <button
            id="toggle-auth-mode"
            onClick={() => {
              setIsLogin(!isLogin);
              setRegistrationStep(1);
              setName('');
              setPassword('');
              setConfirmPassword('');
              setErrorMsg('');
              setSuccessMsg('');
              setCaptchaVerified(false);
              setCaptchaError('');
              setCaptchaColorIndex(Math.floor(Math.random() * CAPTCHA_COLORS.length));
            }}
            className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer underline underline-offset-2"
          >
            {isLogin 
              ? (lang === 'en' ? 'Sign up here' : 'Magrehistro dito') 
              : (lang === 'en' ? 'Log in here' : 'Mag-login dito')}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <motion.div
          layout
          className="bg-white/90 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 py-6 md:py-8 px-4 shadow-2xl rounded-2xl md:rounded-3xl sm:px-10 border border-slate-200 dark:border-slate-800 backdrop-blur-xl"
        >
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm rounded-xl flex items-start gap-2.5"
            >
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                {errorMsg}
                {loginRetrySeconds > 0 && (
                  <strong className="mt-1 block font-extrabold">
                    {lang === 'en' ? 'Try again in' : 'Subukan muli pagkatapos ng'}{' '}
                    {Math.floor(loginRetrySeconds / 60)}:{String(loginRetrySeconds % 60).padStart(2, '0')}
                  </strong>
                )}
              </span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 text-sm rounded-xl flex items-start gap-2.5"
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}



          <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off" data-lpignore="true" data-1p-ignore="true">
            {!isLogin && (
              <div className="grid grid-cols-3 gap-2" aria-label="Registration progress">
                {[
                  [1, lang === 'en' ? 'Category' : 'Kategorya'],
                  [2, lang === 'en' ? 'Account' : 'Account'],
                  [3, lang === 'en' ? 'Requirements' : 'Requirements'],
                ].map(([step, label]) => (
                  <div key={step} className={`rounded-xl border px-2 py-2 text-center text-[10px] font-extrabold uppercase tracking-wide ${registrationStep === step ? 'border-emerald-400 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : Number(step) < registrationStep ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-500' : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <span className="mr-1">{step}.</span>{label}
                  </div>
                ))}
              </div>
            )}
            
            {/* NAME FIELD */}
            <div className={`space-y-1 ${!isLogin && registrationStep !== 2 ? 'hidden' : ''}`}>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="manual-account-entry">
                {isLogin
                  ? (lang === 'en' ? 'Username / Company Name' : 'Username / Pangalan ng Kompanya')
                  : role === 'agricultural_business'
                    ? (lang === 'en' ? 'Company Name' : 'Pangalan ng Kompanya')
                    : 'Username'}
                {!isLogin && <span className="text-red-500"> *</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-600 dark:text-slate-500" />
                </div>
                <input
                  id="manual-account-entry"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  name={isLogin ? 'manual-account-entry' : 'username'}
                  autoComplete={isLogin ? 'off' : 'username'}
                  data-lpignore={isLogin ? 'true' : undefined}
                  data-1p-ignore={isLogin ? 'true' : undefined}
                  placeholder={role === 'agricultural_business' && !isLogin ? 'e.g. Bayanihan Logistics' : 'e.g. juancruz26'}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-250 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white text-sm transition-all"
                />
              </div>
            </div>

            {/* PASSWORD FIELD */}
            <div className={`space-y-1 ${!isLogin && registrationStep !== 2 ? 'hidden' : ''}`}>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="manual-secret-entry">
                {lang === 'en' ? 'Password' : 'Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-600 dark:text-slate-500" />
                </div>
                <input
                  id="manual-secret-entry"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  name={isLogin ? 'manual-secret-entry' : 'new-password'}
                  autoComplete="new-password"
                  data-lpignore={isLogin ? 'true' : undefined}
                  data-1p-ignore={isLogin ? 'true' : undefined}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-250 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white text-sm transition-all"
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-600 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {!isLogin && registrationStep === 2 && (
              <div className="grid grid-cols-1 gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/60 p-3 sm:grid-cols-2">
                {[
                  [passwordRules.minimumLength, lang === 'en' ? 'At least 8 characters' : 'Hindi bababa sa 8 character'],
                  [passwordRules.hasLetter, lang === 'en' ? 'Contains a letter' : 'May letra'],
                  [passwordRules.hasNumber, lang === 'en' ? 'Contains a number' : 'May numero'],
                  [passwordRules.hasSpecialCharacter, lang === 'en' ? 'Contains a special character' : 'May special character'],
                ].map(([passed, label]) => (
                  <p key={String(label)} className={`flex items-center gap-1.5 text-[11px] font-semibold ${passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {passed ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}{label}
                  </p>
                ))}
              </div>
            )}

            {!isLogin && registrationStep === 2 && (
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="auth-confirm-password">
                  {lang === 'en' ? 'Confirm Password' : 'Kumpirmahin ang Password'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-600 dark:text-slate-500" />
                  </div>
                  <input
                    id="auth-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    aria-invalid={confirmPassword.length > 0 && password !== confirmPassword}
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-white text-sm transition-all ${confirmPassword.length > 0 && password !== confirmPassword ? 'border-red-400 focus:ring-red-500' : confirmPassword.length > 0 ? 'border-emerald-400 focus:ring-emerald-500' : 'border-slate-250 dark:border-slate-700 focus:ring-emerald-500'}`}
                  />
                </div>
                {confirmPassword.length > 0 && (
                  <p className={`text-xs font-semibold ${password === confirmPassword ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {password === confirmPassword
                      ? (lang === 'en' ? 'Passwords match.' : 'Magkapareho ang mga password.')
                      : (lang === 'en' ? 'Passwords do not match.' : 'Hindi magkapareho ang mga password.')}
                  </p>
                )}
              </div>
            )}

            {/* INLINE COLOR CAPTCHA (Login Only) */}
            {isLogin && (
              <div className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {lang === 'en' ? 'What color is this circle?' : 'Ano ang kulay ng bilog na ito?'}
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {lang === 'en' ? 'Choose the correct color to enable Log In.' : 'Piliin ang tamang kulay para ma-enable ang Mag-login.'}
                    </p>
                  </div>
                  <div
                    aria-label={lang === 'en' ? 'Circle color to identify' : 'Kulay ng bilog na kikilalanin'}
                    className={`h-14 w-14 shrink-0 rounded-full shadow-lg ring-4 ring-slate-700 ${CAPTCHA_COLORS[captchaColorIndex].className}`}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" aria-label={lang === 'en' ? 'Color choices' : 'Mga pagpipiliang kulay'}>
                  {CAPTCHA_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      disabled={captchaVerified}
                      onClick={() => handleVerifyCaptchaClick(color.id)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-70 transition-all cursor-pointer"
                    >
                      <span className={`h-4 w-4 rounded-full border border-white/20 ${color.className}`} />
                      {lang === 'en' ? color.labelEn : color.labelTl}
                    </button>
                  ))}
                </div>

                {captchaVerified ? (
                  <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <Check className="h-4 w-4" />
                    {lang === 'en' ? 'Correct. You can now log in.' : 'Tama. Maaari ka nang mag-login.'}
                  </p>
                ) : captchaError ? (
                  <p role="alert" className="text-xs font-semibold text-red-700 dark:text-red-400">{captchaError}</p>
                ) : null}
              </div>
            )}

            {/* SIGN UP SPECIAL CONDITIONAL INPUTS */}
            {!isLogin && registrationStep === 3 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4"
              >
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'en' ? 'Requirement Details for Registration' : 'Mga Kinakailangang Detalye para sa Pagpaparehistro'}
                </h4>

                {role === 'agricultural_business' && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-sm font-bold text-slate-900 dark:text-white">{lang === 'en' ? 'Which services do you own?' : 'Aling mga serbisyo ang pag-aari mo?'}</p><p className="text-xs text-slate-600 dark:text-slate-400">{lang === 'en' ? 'Optional. Select functions now or enable them later from your account.' : 'Opsyonal. Pumili ngayon o i-enable ang mga ito sa iyong account kalaunan.'}</p></div>
                      <span className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-right text-[9px] font-bold leading-tight text-amber-700 dark:text-amber-300">
                        {lang === 'en' ? "Skip logistics services if you don't provide them" : 'Laktawan ang logistics kung wala kang ganitong serbisyo'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        ['buyer', ' Buy / Trade Palay', ' Bumili / Mag-trade ng Palay'],
                        ['loan_provider', ' Provide Production Loans', ' Magbigay ng Production Loan'],
                        ['transport', ' Transportation / Hauling', ' Pagbibiyahe / Paghakot'],
                        ['storage', ' Storage', ' Imbakan'],
                        ['drying', ' Drying', ' Patuyuan'],
                        ['milling', ' Milling', ' Gilingan'],
                      ] as [BusinessCapability, string, string][]).map(([service, en, tl]) => {
                        const selected = selectedLogisticsServices.includes(service);
                        return <button key={service} type="button" onClick={() => setSelectedLogisticsServices(selected ? selectedLogisticsServices.filter((item) => item !== service) : [...selectedLogisticsServices, service])} className={`rounded-xl border p-3 text-left text-xs font-bold cursor-pointer ${selected ? 'border-emerald-400 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}><span className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5">{React.createElement(({ buyer: IconHeartHandshake, loan_provider: IconCoin, transport: IconTruck, storage: IconPackage, drying: IconWind, milling: IconWheat })[service], { size: 20, stroke: 2, className: 'inline-block shrink-0', 'aria-hidden': true })}{lang === 'en' ? en.trim() : tl.trim()}</span>{selected && <Check className="w-4 h-4" />}</span></button>;
                      })}
                    </div>
                  </div>
                )}

                {role === 'farmer' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">RSBSA Number <span className="text-red-500">*</span></label>
                    <input required value={rsbsaNumber} onChange={(e) => setRsbsaNumber(e.target.value)} placeholder="e.g. 03-01-02-123456" className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs" />
                  </div>
                )}

                {(role === 'farmer' || role === 'buyer') && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                      {lang === 'en' ? 'Full Name' : 'Buong Pangalan'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      placeholder="e.g. Juan Dela Cruz"
                      className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                    <p className="text-[10px] text-slate-500">Use the same full name shown on your submitted identification.</p>
                  </div>
                )}

                {role === 'agricultural_business' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 p-4">
                    {[
                      ['Contact-person Full Name', contactPersonName, setContactPersonName, 'e.g. Maria Santos'],
                      ['Legal Company Name', legalCompanyName, setLegalCompanyName, 'Registered business name'],
                      ...(selectedLogisticsServices.length > 0 ? [['Service Coverage Area', serviceCoverageArea, setServiceCoverageArea, 'e.g. Pampanga and Tarlac']] : []),
                      ['Operating Address', operatingAddress, setOperatingAddress, 'Complete business address'],
                    ].map(([label, value, setter, placeholder]) => (
                      <div className="space-y-1" key={label as string}>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">{label as string} <span className="text-red-500">*</span></label>
                        <input required value={value as string} onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)} placeholder={placeholder as string} className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs" />
                      </div>
                    ))}
                  </div>
                )}

                {/* EMAIL ADDRESS */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400" htmlFor="auth-email">
                    {lang === 'en' ? 'Email Address' : 'Email Address'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <input
                      id="auth-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. juan@example.com"
                      className="block w-full pl-10 pr-3 py-2 border border-slate-250 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white text-xs"
                    />
                  </div>
                </div>

                {/* CONTACT NUMBER (Used by Farmer, Truck, Buyer) */}
                {(role === 'farmer' || role === 'truck' || role === 'buyer' || role === 'agricultural_business') && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                      {lang === 'en' ? 'Contact Number' : 'Numero ng Telepono / Mobile'} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="e.g. 0917-123-4567"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-250 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* COMPLETE ADDRESS (Used by Farmer, Buyer) */}
                {(role === 'farmer' || role === 'buyer' || role === 'agricultural_business') && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                      {lang === 'en' ? 'Complete Address' : 'Kumpletong Tirahan'} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Brgy. San Juan, Cabanatuan, Nueva Ecija"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-250 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                )}

                {role === 'agricultural_business' && selectedLogisticsServices.includes('transport') && (
                  <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/15 p-4 space-y-3">
                    <h5 className="text-sm font-extrabold text-cyan-800 dark:text-cyan-300"><span className="inline-flex items-center gap-1.5 align-middle"><IconTruck size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Trucking Requirements"}</span></h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[['Vehicle Type', vehicleType, setVehicleType, 'e.g. 6-wheel truck'], ['Plate Number', plateNumber, setPlateNumber, 'e.g. ABC 1234'], ['Carrying Capacity', carryingCapacity, setCarryingCapacity, 'e.g. 8,000 kg']].map(([label, value, setter, placeholder]) => <div className="space-y-1" key={label as string}><label className="text-xs font-bold text-slate-700 dark:text-slate-300">{label as string} <span className="text-red-500">*</span></label><input required value={value as string} onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)} placeholder={placeholder as string} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 outline-none" /></div>)}
                    </div>
                    <input id="transport-orcr" type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" required={!uploadedDocs.transportOrCr} onChange={(e) => handleFileChange(e, 'transportOrCr')} className="hidden" />
                    <label htmlFor="transport-orcr" className="flex justify-center px-3 py-2 rounded-xl border border-dashed border-cyan-500/50 text-xs font-bold text-cyan-800 dark:text-cyan-300 cursor-pointer"><Upload className="w-4 h-4 mr-2" />{uploadedDocs.transportOrCr ? `OR/CR uploaded: ${uploadedDocs.transportOrCr}` : 'Upload OR/CR image *'}</label>
                  </div>
                )}

                {role === 'agricultural_business' && selectedLogisticsServices.includes('storage') && (
                  <div className="rounded-2xl border border-violet-500/30 bg-violet-950/15 p-4 space-y-3">
                    <h5 className="text-sm font-extrabold text-violet-800 dark:text-violet-300"><span className="inline-flex items-center gap-1.5 align-middle"><IconPackage size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Storage Requirements"}</span></h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input required value={storageCapacity} onChange={(e) => setStorageCapacity(e.target.value)} placeholder="Storage capacity (e.g. 5,000 sacks)" className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs" />
                      <input required value={storageFacilityLocation} onChange={(e) => setStorageFacilityLocation(e.target.value)} placeholder="Complete facility location" className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs" />
                    </div>
                    <input id="storage-proof" type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" required={!uploadedDocs.storageProof} onChange={(e) => handleFileChange(e, 'storageProof')} className="hidden" />
                    <label htmlFor="storage-proof" className="flex justify-center px-3 py-2 rounded-xl border border-dashed border-violet-500/50 text-xs font-bold text-violet-800 dark:text-violet-300 cursor-pointer"><Upload className="w-4 h-4 mr-2" />{uploadedDocs.storageProof ? `Proof uploaded: ${uploadedDocs.storageProof}` : 'Upload proof of ownership/management *'}</label>
                  </div>
                )}

                {role === 'agricultural_business' && selectedLogisticsServices.includes('drying') && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-950/15 p-4 space-y-3">
                    <h5 className="text-sm font-extrabold text-amber-700 dark:text-amber-300"><span className="inline-flex items-center gap-1.5 align-middle"><IconWind size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Drying Requirements"}</span></h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input required value={dryerType} onChange={(e) => setDryerType(e.target.value)} placeholder="Dryer type" className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs" />
                      <input required value={dryingBatchCapacity} onChange={(e) => setDryingBatchCapacity(e.target.value)} placeholder="Batch capacity (kg)" className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs" />
                      <input required value={dryingFacilityLocation} onChange={(e) => setDryingFacilityLocation(e.target.value)} placeholder="Facility location" className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs" />
                    </div>
                    <input id="drying-proof" type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" required={!uploadedDocs.dryingProof} onChange={(e) => handleFileChange(e, 'dryingProof')} className="hidden" />
                    <label htmlFor="drying-proof" className="flex justify-center px-3 py-2 rounded-xl border border-dashed border-amber-500/50 text-xs font-bold text-amber-700 dark:text-amber-300 cursor-pointer"><Upload className="w-4 h-4 mr-2" />{uploadedDocs.dryingProof ? `Proof uploaded: ${uploadedDocs.dryingProof}` : 'Upload proof of ownership/management *'}</label>
                  </div>
                )}

                {role === 'agricultural_business' && selectedLogisticsServices.includes('milling') && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-4 space-y-3">
                    <h5 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300"><span className="inline-flex items-center gap-1.5 align-middle"><IconWheat size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" />{"Milling Requirements"}</span></h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input required value={millingCapacity} onChange={(e) => setMillingCapacity(e.target.value)} placeholder="Milling capacity (e.g. kg/hour)" className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs" />
                      <input required value={millingFacilityLocation} onChange={(e) => setMillingFacilityLocation(e.target.value)} placeholder="Complete facility location" className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs" />
                    </div>
                    <input id="milling-proof" type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" required={!uploadedDocs.millingProof} onChange={(e) => handleFileChange(e, 'millingProof')} className="hidden" />
                    <label htmlFor="milling-proof" className="flex justify-center px-3 py-2 rounded-xl border border-dashed border-emerald-500/50 text-xs font-bold text-emerald-700 dark:text-emerald-300 cursor-pointer"><Upload className="w-4 h-4 mr-2" />{uploadedDocs.millingProof ? `Proof uploaded: ${uploadedDocs.millingProof}` : 'Upload proof of ownership/management *'}</label>
                  </div>
                )}

                {/* FILE UPLOADS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">

                  {/* Profile Photo (Optional for All Roles) */}
                  <div className="p-3 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{lang === 'en' ? 'Profile Photo' : 'Larawan sa Profile'}</span>
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-normal lowercase">(optional)</span>
                    </label>
                    <p className="text-[10px] text-slate-600 dark:text-slate-500 mb-2">
                      {lang === 'en' ? 'Clear photo or business icon' : 'Larawan ng mukha o logo'}
                    </p>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        onChange={(e) => handleFileChange(e, 'avatar')}
                        className="hidden"
                        id="upload-profile-photo"
                      />
                      <label
                        htmlFor="upload-profile-photo"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadedDocs.avatar ? <span className="inline-flex items-center gap-1.5 align-middle">{"Uploaded"}<IconCheck size={14} stroke={2} aria-hidden="true" className="inline-block shrink-0 text-emerald-500" /></span> : (lang === 'en' ? 'Choose photo' : 'Pumili ng larawan')}</span>
                      </label>
                    </div>
                    {uploadedDocs.avatar && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5 block truncate font-mono"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconPhoto size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{uploadedDocs.avatar}
                      </span>
                    )}
                  </div>
                  
                  {/* Required identity document changes with the selected role. */}
                  <div className="p-3 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{role === 'farmer' ? 'RSBSA Registration ID' : role === 'agricultural_business' ? 'Company ID / Registration' : 'Government ID'}</span>
                      </span>
                      <span className="text-[10px] text-red-500 font-bold">* required</span>
                    </label>
                    <p className="text-[10px] text-slate-600 dark:text-slate-500 mb-2">
                      {role === 'farmer' ? 'Upload your valid Registry System for Basic Sectors in Agriculture (RSBSA) ID.' : role === 'agricultural_business' ? 'Upload a DTI, SEC, cooperative, or company registration ID.' : "UMID, Driver's License, Passport, Voter's ID, etc."}
                    </p>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                        onChange={(e) => handleFileChange(e, 'govId')}
                        className="hidden"
                        id="upload-gov-id"
                      />
                      <label
                        htmlFor="upload-gov-id"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadedDocs.govId ? <span className="inline-flex items-center gap-1.5 align-middle">{"Uploaded"}<IconCheck size={14} stroke={2} aria-hidden="true" className="inline-block shrink-0 text-emerald-500" /></span> : (role === 'farmer' ? 'Choose RSBSA ID' : role === 'agricultural_business' ? 'Choose Company ID' : 'Choose Government ID')}</span>
                      </label>
                    </div>
                    {uploadedDocs.govId && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5 block truncate font-mono"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconFileText size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{uploadedDocs.govId}
                      </span>
                    )}

                    {/* AI Scanning Government ID Feedback */}
                    {scanningStatus['govId'] === 'scanning' && (
                      <div className="mt-2.5 flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-750 text-[10px] text-slate-500 font-semibold animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />
                        <span>{lang === 'en' ? 'AI Scanning Document...' : 'Sinusuri ng AI ang ID...'}</span>
                      </div>
                    )}
                    {scanningStatus['govId'] === 'success' && scanResults['govId'] && (
                      <div className="mt-2.5 p-2 bg-emerald-50/55 dark:bg-emerald-950/20 rounded-lg border border-emerald-100/50 dark:border-emerald-900/40 text-[10px]">
                        <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                          <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
                          <span>{lang === 'en' ? <span className="inline-flex items-center gap-1.5 align-middle">{"AI Verified"}<IconCheck size={14} stroke={2} aria-hidden="true" className="inline-block shrink-0 text-emerald-500" /></span> : <span className="inline-flex items-center gap-1.5 align-middle">{"Na-verify ng AI"}<IconCheck size={14} stroke={2} aria-hidden="true" className="inline-block shrink-0 text-emerald-500" /></span>}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-350 leading-relaxed font-sans">{scanResults['govId'].reason}</p>
                        {scanResults['govId'].extractedName && scanResults['govId'].extractedName !== 'Unknown' && (
                          <p className="text-slate-500 dark:text-slate-400 mt-1 font-semibold text-[9px]">
                            {lang === 'en' ? 'Name on ID:' : 'Pangalan sa ID:'} <span className="text-slate-800 dark:text-slate-200">{scanResults['govId'].extractedName}</span>
                          </p>
                        )}
                      </div>
                    )}
                    {scanningStatus['govId'] === 'failed' && scanResults['govId'] && (
                      <div className="mt-2.5 p-2 bg-amber-50/55 dark:bg-amber-950/20 rounded-lg border border-amber-100/50 dark:border-amber-900/40 text-[10px]">
                        <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-500 mb-1">
                          <AlertCircle className="w-3 h-3 text-amber-500" />
                          <span>{lang === 'en' ? 'AI Checked' : 'Pagsusuri ng AI'}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-350 leading-relaxed font-sans">{scanResults['govId'].reason}</p>
                      </div>
                    )}
                  </div>

                  {/* Driver's License (Truck only) */}
                  {role === 'truck' && (
                    <div className="p-3 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                        <span>Driver's License</span>
                      </label>
                      <p className="text-[10px] text-slate-600 dark:text-slate-500 mb-2">
                        Valid professional driver's license
                      </p>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                          onChange={(e) => handleFileChange(e, 'license')}
                          className="hidden"
                          id="upload-license"
                        />
                        <label
                          htmlFor="upload-license"
                          className="flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer transition-all"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadedDocs.license ? <span className="inline-flex items-center gap-1.5 align-middle">{"Uploaded"}<IconCheck size={14} stroke={2} aria-hidden="true" className="inline-block shrink-0 text-emerald-500" /></span> : 'Choose file'}</span>
                        </label>
                      </div>
                      {uploadedDocs.license && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5 block truncate font-mono"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconFileText size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{uploadedDocs.license}
                        </span>
                      )}

                      {/* AI Scanning License Feedback */}
                      {scanningStatus['license'] === 'scanning' && (
                        <div className="mt-2.5 flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-750 text-[10px] text-slate-500 font-semibold animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />
                          <span>{lang === 'en' ? 'AI Scanning License...' : 'Sinusuri ng AI ang Lisensya...'}</span>
                        </div>
                      )}
                      {scanningStatus['license'] === 'success' && scanResults['license'] && (
                        <div className="mt-2.5 p-2 bg-emerald-50/55 dark:bg-emerald-950/20 rounded-lg border border-emerald-100/50 dark:border-emerald-900/40 text-[10px]">
                          <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                            <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
                            <span>{lang === 'en' ? <span className="inline-flex items-center gap-1.5 align-middle">{"AI Verified"}<IconCheck size={14} stroke={2} aria-hidden="true" className="inline-block shrink-0 text-emerald-500" /></span> : <span className="inline-flex items-center gap-1.5 align-middle">{"Na-verify ng AI"}<IconCheck size={14} stroke={2} aria-hidden="true" className="inline-block shrink-0 text-emerald-500" /></span>}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-350 leading-relaxed font-sans">{scanResults['license'].reason}</p>
                        </div>
                      )}
                      {scanningStatus['license'] === 'failed' && scanResults['license'] && (
                        <div className="mt-2.5 p-2 bg-amber-50/55 dark:bg-amber-950/20 rounded-lg border border-amber-100/50 dark:border-amber-900/40 text-[10px]">
                          <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-500 mb-1">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            <span>{lang === 'en' ? 'AI Checked' : 'Pagsusuri ng AI'}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-350 leading-relaxed font-sans">{scanResults['license'].reason}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* OR/CR ng sasakyan (Truck only) */}
                  {role === 'truck' && (
                    <div className="p-3 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                        <span>OR/CR ng Sasakyan</span>
                      </label>
                      <p className="text-[10px] text-slate-600 dark:text-slate-500 mb-2">
                        Official Receipt & Certificate of Registration
                      </p>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                          onChange={(e) => handleFileChange(e, 'orCr')}
                          className="hidden"
                          id="upload-orcr"
                        />
                        <label
                          htmlFor="upload-orcr"
                          className="flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer transition-all"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadedDocs.orCr ? <span className="inline-flex items-center gap-1.5 align-middle">{"Uploaded"}<IconCheck size={14} stroke={2} aria-hidden="true" className="inline-block shrink-0 text-emerald-500" /></span> : 'Choose file'}</span>
                        </label>
                      </div>
                      {uploadedDocs.orCr && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5 block truncate font-mono"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconFileText size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{uploadedDocs.orCr}
                        </span>
                      )}

                      {/* AI Scanning OR/CR Feedback */}
                      {scanningStatus['orCr'] === 'scanning' && (
                        <div className="mt-2.5 flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-750 text-[10px] text-slate-500 font-semibold animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />
                          <span>{lang === 'en' ? 'AI Scanning OR/CR...' : 'Sinusuri ng AI ang OR/CR...'}</span>
                        </div>
                      )}
                      {scanningStatus['orCr'] === 'success' && scanResults['orCr'] && (
                        <div className="mt-2.5 p-2 bg-emerald-50/55 dark:bg-emerald-950/20 rounded-lg border border-emerald-100/50 dark:border-emerald-900/40 text-[10px]">
                          <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                            <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
                            <span>{lang === 'en' ? <span className="inline-flex items-center gap-1.5 align-middle">{"AI Verified"}<IconCheck size={14} stroke={2} aria-hidden="true" className="inline-block shrink-0 text-emerald-500" /></span> : <span className="inline-flex items-center gap-1.5 align-middle">{"Na-verify ng AI"}<IconCheck size={14} stroke={2} aria-hidden="true" className="inline-block shrink-0 text-emerald-500" /></span>}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-350 leading-relaxed font-sans">{scanResults['orCr'].reason}</p>
                        </div>
                      )}
                      {scanningStatus['orCr'] === 'failed' && scanResults['orCr'] && (
                        <div className="mt-2.5 p-2 bg-amber-50/55 dark:bg-amber-950/20 rounded-lg border border-amber-100/50 dark:border-amber-900/40 text-[10px]">
                          <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-500 mb-1">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            <span>{lang === 'en' ? 'AI Checked' : 'Pagsusuri ng AI'}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-350 leading-relaxed font-sans">{scanResults['orCr'].reason}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Proof of Ownership (Storage & Dryer & Miller only) */}
                  {(role === 'storage' || role === 'dryer' || role === 'miller') && (
                    <div className="p-3 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-purple-500" />
                        <span>Proof of Ownership</span>
                      </label>
                      <p className="text-[10px] text-slate-600 dark:text-slate-500 mb-2">
                        DTI Permit, Land Title, Lease Contract
                      </p>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                          onChange={(e) => handleFileChange(e, 'proofOwnership')}
                          className="hidden"
                          id="upload-proof"
                        />
                        <label
                          htmlFor="upload-proof"
                          className="flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer transition-all"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadedDocs.proofOwnership ? <span className="inline-flex items-center gap-1.5 align-middle">{"Uploaded"}<IconCheck size={14} stroke={2} aria-hidden="true" className="inline-block shrink-0 text-emerald-500" /></span> : 'Choose file'}</span>
                        </label>
                      </div>
                      {uploadedDocs.proofOwnership && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5 block truncate font-mono"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconFileText size={16} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{uploadedDocs.proofOwnership}
                        </span>
                      )}

                      {/* AI Scanning Proof of Ownership Feedback */}
                      {scanningStatus['proofOwnership'] === 'scanning' && (
                        <div className="mt-2.5 flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-750 text-[10px] text-slate-500 font-semibold animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />
                          <span>{lang === 'en' ? 'AI Scanning Document...' : 'Sinusuri ng AI ang Patunay...'}</span>
                        </div>
                      )}
                      {scanningStatus['proofOwnership'] === 'success' && scanResults['proofOwnership'] && (
                        <div className="mt-2.5 p-2 bg-emerald-50/55 dark:bg-emerald-950/20 rounded-lg border border-emerald-100/50 dark:border-emerald-900/40 text-[10px]">
                          <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                            <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
                            <span>{lang === 'en' ? <span className="inline-flex items-center gap-1.5 align-middle">{"AI Verified"}<IconCheck size={14} stroke={2} aria-hidden="true" className="inline-block shrink-0 text-emerald-500" /></span> : <span className="inline-flex items-center gap-1.5 align-middle">{"Na-verify ng AI"}<IconCheck size={14} stroke={2} aria-hidden="true" className="inline-block shrink-0 text-emerald-500" /></span>}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-350 leading-relaxed font-sans">{scanResults['proofOwnership'].reason}</p>
                        </div>
                      )}
                      {scanningStatus['proofOwnership'] === 'failed' && scanResults['proofOwnership'] && (
                        <div className="mt-2.5 p-2 bg-amber-50/55 dark:bg-amber-950/20 rounded-lg border border-amber-100/50 dark:border-amber-900/40 text-[10px]">
                          <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-500 mb-1">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            <span>{lang === 'en' ? 'AI Checked' : 'Pagsusuri ng AI'}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-350 leading-relaxed font-sans">{scanResults['proofOwnership'].reason}</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </motion.div>
            )}

            {/* ROLE / CATEGORY SELECTION (Registration Only) */}
            {!isLogin && registrationStep === 1 && (
              <div className="space-y-2 pt-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'en' ? 'Choose your Registration Category' : 'Pumili ng iyong Kategorya sa Pagpaparehistro'}
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800/80 rounded-xl bg-slate-50/30 dark:bg-slate-900/10">
                  {allowedRoles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      id={`role-btn-${r}`}
                      onClick={() => setRole(r)}
                      className={`flex flex-col items-start p-3.5 border rounded-xl text-left transition-all cursor-pointer ${
                        role === r
                          ? 'border-emerald-500 bg-emerald-50/45 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20 dark:ring-emerald-400/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <span className="text-sm font-bold text-slate-900 dark:text-white capitalize flex items-center gap-1.5 font-display">
                        <Briefcase className={`w-4 h-4 ${role === r ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`} />
                        {lang === 'en' ? roleLabels[r].titleEN : roleLabels[r].titleTL}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal line-clamp-2">
                        {lang === 'en' ? roleLabels[r].descEN : roleLabels[r].descTL}
                      </span>
                    </button>
                  ))}
                </div>

              </div>
            )}

            {/* SUBMIT BUTTON */}
            {!isLogin && registrationStep < 3 && (
              <div className="flex gap-3 pt-2">
                {registrationStep === 2 && (
                  <button type="button" onClick={() => { setRegistrationStep(1); setErrorMsg(''); }} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                    {lang === 'en' ? 'Back' : 'Bumalik'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    if (registrationStep === 1) {
                      setRegistrationStep(2);
                      return;
                    }
                    if (!name.trim() || !password) {
                      setErrorMsg(lang === 'en' ? 'Enter your username/company name and password.' : 'Ilagay ang username/pangalan ng kompanya at password.');
                      return;
                    }
                    if (!isPasswordStrong) {
                      setErrorMsg(lang === 'en' ? 'Use at least 8 characters with a letter, number, and special character.' : 'Gumamit ng 8 character pataas na may letra, numero, at special character.');
                      return;
                    }
                    if (!confirmPassword || password !== confirmPassword) {
                      setErrorMsg(lang === 'en' ? 'The password confirmation must match.' : 'Dapat magkapareho ang password at confirmation.');
                      return;
                    }
                    setRegistrationStep(3);
                  }}
                  className="flex-[1.5] rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-500"
                >
                  {lang === 'en' ? 'Continue' : 'Magpatuloy'}<span className="inline-flex items-center gap-1.5 align-middle"><IconArrowRight size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span></button>
              </div>
            )}

            {!isLogin && registrationStep === 3 && (
              <button type="button" onClick={() => { setRegistrationStep(2); setErrorMsg(''); }} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconArrowLeft size={20} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>{lang === 'en' ? 'Back to Account Information' : 'Bumalik sa Account Information'}
              </button>
            )}

            {(isLogin || registrationStep === 3) && <div>
              <AnimatedButton
                type="submit"
                id="auth-submit-btn"
                variant="primary"
                disabled={isLogin && (!captchaVerified || loginRetrySeconds > 0)}
                className="w-full py-4 text-sm tracking-wide"
              >
                {isLogin 
                  ? loginRetrySeconds > 0
                    ? `${lang === 'en' ? 'Try again in' : 'Maghintay'} ${Math.floor(loginRetrySeconds / 60)}:${String(loginRetrySeconds % 60).padStart(2, '0')}`
                    : (lang === 'en' ? 'Login' : 'Mag-login')
                  : (lang === 'en' ? 'Submit Registration for Approval' : 'Isumite ang Rehistrasyon')}
              </AnimatedButton>
            </div>}

          </form>
        </motion.div>
      </div>
      </div>

      {showRegistrationSummary && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-3 md:p-4 backdrop-blur-md"

        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-summary-title"
            onClick={(event) => event.stopPropagation()}
            className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-2xl md:rounded-3xl border border-emerald-500/30 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl"
          >
            <div className="bg-gradient-to-r from-emerald-700 to-teal-600 px-6 py-5">
              <button type="button" aria-label="Close popup" onClick={() => setShowRegistrationSummary(false)} className="float-right relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-slate-500/20">&times;</button>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100">Final Review</p>
              <h2 id="registration-summary-title" className="mt-1 text-xl font-black">
                {lang === 'en' ? 'Registration Summary' : 'Buod ng Rehistrasyon'}
              </h2>
              <p className="mt-1 text-xs text-emerald-100">
                {lang === 'en' ? 'Check your information before sending it for administrator approval.' : 'Suriin ang impormasyon bago ipadala para sa approval ng administrator.'}
              </p>
            </div>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4 md:p-6">
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><span className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Account category</span><strong>{lang === 'en' ? roleLabels[role].titleEN : roleLabels[role].titleTL}</strong></div>
                <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><span className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Username / company</span><strong className="break-words">{name.trim()}</strong></div>
                {(fullName.trim() || contactPersonName.trim()) && <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><span className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Full name / contact person</span><strong className="break-words">{fullName.trim() || contactPersonName.trim()}</strong></div>}
                <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><span className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Email</span><strong className="break-all">{email.trim()}</strong></div>
                <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><span className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Contact number</span><strong>{contactNumber.trim()}</strong></div>
                <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><span className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Complete address</span><strong className="break-words">{address.trim()}</strong></div>
              </div>

              {role === 'farmer' && <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm"><span className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">RSBSA number</span><strong>{rsbsaNumber.trim()}</strong></div>}
              {role === 'agricultural_business' && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <span className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Selected business functions</span>
                  <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedLogisticsServices.length ? selectedLogisticsServices.map(service => service.replace('_', ' ')).join(', ') : 'None — enable later from your account'}</p>
                </div>
              )}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm"><span className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Uploaded documents</span><strong>{Object.keys(uploadedDocs).filter(key => !key.endsWith('Data')).length} file(s)</strong></div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-slate-200 dark:border-slate-800 p-4 min-[390px]:grid-cols-2 md:grid-cols-2 md:p-5">
              <button type="button" onClick={() => setShowRegistrationSummary(false)} className="rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                {lang === 'en' ? 'Back and Edit' : 'Bumalik at I-edit'}
              </button>
              <button type="button" disabled={isSubmittingRegistration} onClick={() => void executeAuthAction()} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmittingRegistration ? 'Saving…' : (lang === 'en' ? 'Confirm Registration' : 'Kumpirmahin')}
              </button>
            </div>
          </motion.div>
        </div>
      )}


      {/* GOOGLE SIGN-IN MODAL POPUP */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-5 md:p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 relative space-y-6"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Google Identity Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
                {lang === 'en' ? 'Sign in with Google' : 'Mag-sign in sa Google'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'en' 
                  ? 'Choose an account to proceed to KAWING Platform' 
                  : 'Pumili ng account para magpatuloy sa KAWING Platform'}
              </p>
            </div>

            {/* Quick Select Accounts */}
            <div className="space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-500 tracking-wider block">
                {lang === 'en' ? 'Saved Google Accounts' : 'Mga Naka-save na Google Accounts'}
              </span>

              {/* Account 1: Approved Farmer */}
              <button
                type="button"
                onClick={() => handleGoogleAccountSelect('Mang Juan Dela Cruz', 'magsasaka@kawing.com')}
                className="w-full flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl bg-slate-50/60 dark:bg-slate-800/50 hover:bg-emerald-50/30 dark:hover:bg-slate-800 text-left transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                  MJ
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                    Mang Juan Dela Cruz
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                    magsasaka@kawing.com
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-md shrink-0">
                  Approved
                </span>
              </button>

              {/* Account 2: Approved Buyer */}
              <button
                type="button"
                onClick={() => handleGoogleAccountSelect('Aling Maria Santos', 'mamimili@kawing.com')}
                className="w-full flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl bg-slate-50/60 dark:bg-slate-800/50 hover:bg-emerald-50/30 dark:hover:bg-slate-800 text-left transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                  AM
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                    Aling Maria Santos
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                    mamimili@kawing.com
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-md shrink-0">
                  Approved
                </span>
              </button>

              {/* Account 3: Pending Approval Farmer */}
              <button
                type="button"
                onClick={() => handleGoogleAccountSelect('Tatay Pedring Ramos', 'pedring.ramos@gmail.com')}
                className="w-full flex items-center gap-3 p-3 border border-amber-200 dark:border-amber-900/60 hover:border-amber-500 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/80 text-left transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                  TP
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
                    Tatay Pedring Ramos
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                    pedring.ramos@gmail.com
                  </p>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-400 px-2 py-0.5 rounded-md shrink-0">
                  Pending Admin
                </span>
              </button>
            </div>

            {/* Custom Google Account Input */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-500 tracking-wider block">
                {lang === 'en' ? 'Or sign in with another Google Email' : 'O mag-login gamit ang ibang Google Email'}
              </span>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder={lang === 'en' ? 'Google Account Name (e.g., Juan Cruz)' : 'Pangalan sa Google (e.g., Juan Cruz)'}
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder={lang === 'en' ? 'Google Email (e.g., juan@gmail.com)' : 'Google Email (e.g., juan@gmail.com)'}
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!customGoogleName.trim() || !customGoogleEmail.trim()}
                  onClick={() => handleGoogleAccountSelect(customGoogleName.trim(), customGoogleEmail.trim())}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>
                    {lang === 'en' ? 'Authenticate Google Account' : 'I-authenticate ang Google Account'}
                  </span>
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}

    </div>
  );
}
