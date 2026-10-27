export type LegacyUserRole = 'buyer' | 'logistics' | 'truck' | 'storage' | 'dryer' | 'miller';
export type PrimaryUserRole = 'farmer' | 'agricultural_business' | 'admin';
/** Includes legacy values only while persisted accounts are being migrated. */
export type UserRole = PrimaryUserRole | LegacyUserRole;
export type BusinessCapability = 'buyer' | 'loan_provider' | 'transport' | 'storage' | 'drying' | 'milling';
export type BusinessCapabilityApprovalStatus = 'inactive' | 'pending' | 'approved' | 'rejected' | 'suspended';
export type LogisticsServiceType = 'transport' | 'storage' | 'drying' | 'milling';
export type LogisticsServiceApprovalStatus = BusinessCapabilityApprovalStatus;

export interface LogisticsServiceProfile {
  enabled: boolean;
  approvalStatus: LogisticsServiceApprovalStatus;
  isAvailable?: boolean;
  capacity?: string;
  rateInfo?: string;
  locationCoverage?: string;
  notes?: string;
  vehicleType?: string;
  plateNumber?: string;
  carryingCapacity?: string;
  orCrDocument?: string;
  orCrDocumentData?: string;
  proofOfOwnershipDocument?: string;
  proofOfOwnershipDocumentData?: string;
  storageCapacity?: string;
  dryerType?: string;
  batchCapacity?: string;
  millingCapacity?: string;
  facilityLocation?: string;
}

export interface BusinessCapabilityProfile extends LogisticsServiceProfile {
  approvalStatus: BusinessCapabilityApprovalStatus;
  documents?: Record<string, unknown>;
}

export interface UserAccount {
  userId?: string;
  name: string;
  fullName?: string;
  email?: string;
  password?: string;
  role: UserRole;
  rating?: number;
  isApproved?: boolean; // if false, needs admin approval
  contactNumber?: string;
  address?: string;
  businessName?: string;
  rsbsaNumber?: string;
  contactPersonName?: string;
  legalCompanyName?: string;
  serviceCoverageArea?: string;
  operatingAddress?: string;
  avatarUrl?: string;
  bio?: string;
  isAvailable?: boolean; // toggle status for service providers (truck, storage, dryer, miller)
  emailNotificationsEnabled?: boolean;
  emailNotificationConsentAsked?: boolean;
  emailNotificationConsentAt?: string;
  logisticsServices?: Partial<Record<LogisticsServiceType, LogisticsServiceProfile>>;
  businessCapabilities?: Partial<Record<BusinessCapability, BusinessCapabilityProfile>>;
  loanConfig?: BuyerLoanConfig; // Production loan config for Buyers/Traders
  buyerLogisticsEnabled?: boolean; // buyer opted into trucking/logistics functions
  documents?: {
    govId?: string; // stored filename or base64 thumbnail
    govIdData?: string; // actual base64
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
  };
}

export interface Harvest {
  id: string;
  cropType: string; // e.g. "Palay (NSIC Rc222)"
  riceVariety?: string; // e.g. "NSIC Rc222", "NSIC Rc160", "Dinorado", "Jasmine", "Others"
  quantity: number;
  unit: string;
  harvestDate: string;
  location: string;
  barangay?: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'posted' | 'in_progress' | 'completed';
  spoilageRisk: 'low' | 'medium' | 'high';
  farmerEmail: string;
  farmerName: string;
  farmerRating: number;
  farmerPhone?: string;
  targetBuyerEmail?: string;
  targetBuyerName?: string;
  moistureLevel?: string; // e.g. "18.4%"
  photoUrl?: string; // main photo preview
  photos?: string[]; // array of 2 to 5 photo URLs
  targetPrice?: number; // target price per kg
  sellingMethod?: 'fixed_price' | 'bidding'; // normal asking price or competitive buyer bidding
  totalPrice?: number; // total harvest value based on quantity × target price
  marketRefPrice?: number; // PSA/DA reference price e.g., 22.80
  priceUnit?: string; // "per kg" | "per sack"
  preferredScheduleDate?: string;
  preferredScheduleTime?: string;
  additionalNotes?: string;
  notes?: string;
  remarks?: string;
  truckType?: string;
  quantityAccuracy?: 'actual' | 'estimated';
  estimatedWeightKg?: number;
  containerType?: 'plastic_bags' | 'sacks';
  containerQuantity?: number;
  estimatedKgPerContainer?: number;
  pickupLocation?: string;
  dropLocation?: string;
  requestedProviderEmail?: string;
  requestedProviderName?: string;
}

export interface ServiceRequest {
  id: string;
  type: 'transport' | 'storage' | 'drying' | 'milling' | 'buyer';
  harvestId: string;
  cropType: string;
  riceVariety?: string;
  quantity: number;
  unit: string;
  harvestDate?: string;
  servicesNeeded?: ('transport' | 'storage' | 'drying' | 'milling')[];
  preferredDate?: string;
  preferredTime?: string;
  additionalNotes?: string;
  status: 'pending' | 'matched' | 'rejected' | 'completed';
  createdAt: string;
  farmerEmail: string;
  farmerName: string;
  farmerPhone?: string;
  location: string;
  barangay?: string;
  truckType?: string;
  quantityAccuracy?: 'actual' | 'estimated';
  estimatedWeightKg?: number;
  containerType?: 'plastic_bags' | 'sacks';
  containerQuantity?: number;
  estimatedKgPerContainer?: number;
  pickupLocation?: string;
  dropLocation?: string;
  operatorEmail?: string;
  operatorName?: string;
  // Extra details depending on type
  details?: {
    distance?: string;
    duration?: string;
    temperature?: number;
    humidity?: number;
    daysRemaining?: number;
    progress?: number;
  };
}

export interface AppNotification {
  id: string;
  userEmail: string; // The user who should see this notification
  title: string;
  message: string;
  type: 'info' | 'success' | 'alert';
  createdAt: string;
  isRead: boolean;
  sendEmail?: boolean;
  actionUrl?: string;
  emailDetails?: Record<string, string>;
}

export interface Offer {
  id: string;
  harvestId: string;
  cropType: string;
  riceVariety?: string;
  quantity: number;
  unit: string;
  quantityWanted?: number;
  offerPrice: number; // e.g., 23.50
  priceUnit?: string; // "per kg" | "per sack"
  totalAmount?: number; // total value e.g. 47000
  marketRefPrice?: number; // benchmark PSA price e.g., 22.80
  preferredCollectionDate?: string;
  paymentMethod?: 'Cash' | 'Bank Transfer' | 'Other';
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
  buyerEmail: string;
  buyerName: string;
  buyerCompanyName?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  govIdData?: string;
  farmerEmail: string;
  farmerName: string;
  farmerPhone?: string;
  farmerLocation?: string;
  notes?: string;
  additionalMessage?: string;
  agreedTerms?: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
}

export interface OfferedService {
  id: string;
  providerEmail: string;
  providerName: string;
  providerPhone?: string;
  providerRole: UserRole; // 'buyer' | 'truck' | 'storage' | 'dryer' | 'miller'
  companyName?: string;
  serviceType: 'transport' | 'storage' | 'drying' | 'milling';
  title: string; // e.g., "Buyer 6-Wheeler Hauling Truck - Free Farm Pickup"
  truckType?: string; // e.g., "6-Wheeler Hauling Truck", "10-Wheeler", "Pickup Truck"
  capacity: string; // e.g., "5,000 kg (100 Sacks)"
  locationCoverage: string; // e.g., "Cabanatuan City, Arayat, San Jose"
  rateInfo: string; // e.g., "Free pickup for 2000kg+ palay sales" or "₱1.50/kg"
  notes?: string;
  isAvailable: boolean;
  createdAt: string;
}

export interface UserDataState {
  harvests: Harvest[];
  serviceRequests: ServiceRequest[];
  offers: Offer[];
  offeredServices?: OfferedService[];
  productionLoans?: ProductionLoanRequest[];
}

export interface AppSettings {
  daReferencePrice: number;
}

export interface BuyerLoanConfig {
  enabled: boolean;
  minAmount: number;
  maxAmount: number;
  interestRate?: number;
  availableFund: number;
  repaymentPeriod: string;
  repaymentMethod?: string;
  termsAndConditions: string;
  additionalRequirements?: string;
  contactNumber?: string;
  notes?: string;
}

export type ProductionLoanPurpose =
  | 'Rice Seeds'
  | 'Fertilizer'
  | 'Pesticides and Crop Protection'
  | 'Land Preparation'
  | 'Farm Labor'
  | 'Irrigation'
  | 'Rice Harvesting'
  | 'Transportation of Harvested Rice Grain'
  | 'Mechanical Drying'
  | 'Rice Grain Storage'
  | 'Rice Milling'
  | 'Other Rice Production-Related Expenses';

export type ProductionLoanStatus =
  | 'Pending'
  | 'Approved'
  | 'Declined'
  | 'Active'
  | 'Completed'
  | 'Cancelled';

export interface ProductionLoanRequest {
  id: string;
  farmerName: string;
  farmerEmail: string;
  farmerPhone?: string;
  farmerLocation?: string;
  buyerName: string;
  buyerEmail: string;
  buyerCompanyName?: string;
  requestedAmount: number;
  farmAreaHectares?: number;
  approvedAmount?: number;
  purpose: ProductionLoanPurpose;
  customPurpose?: string;
  plantingSeason: string;
  preferredRepaymentPeriod: string;
  repaymentMethod?: string;
  additionalNotes?: string;
  status: ProductionLoanStatus;
  createdAt: string;
  updatedAt: string;
  buyerNotes?: string;
}
