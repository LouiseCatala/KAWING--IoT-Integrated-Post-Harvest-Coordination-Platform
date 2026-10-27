import { BusinessCapability, BusinessCapabilityProfile, UserAccount } from '../types';

const legacyCapability: Partial<Record<UserAccount['role'], BusinessCapability>> = {
  buyer: 'buyer', truck: 'transport', storage: 'storage', dryer: 'drying', miller: 'milling',
};

export function getBusinessCapability(user: UserAccount, capability: BusinessCapability): BusinessCapabilityProfile | undefined {
  const current = user.businessCapabilities?.[capability];
  if (current) return current;
  // Loan settings are the provider's explicit opt-in. Older business accounts
  // may not have a separate loan_provider capability row, so do not hide an
  // approved lender merely because that derived row has not been written yet.
  if (capability === 'loan_provider' && user.role !== 'farmer' && user.loanConfig?.enabled) {
    return { enabled: true, approvalStatus: user.isApproved === false ? 'pending' : 'approved', isAvailable: true };
  }
  if (capability === 'buyer' && user.role === 'buyer') return { enabled: true, approvalStatus: user.isApproved === false ? 'pending' : 'approved' };
  if (capability !== 'buyer' && capability !== 'loan_provider') {
    const legacy = user.logisticsServices?.[capability];
    if (legacy) return { ...legacy, approvalStatus: legacy.approvalStatus };
  }
  if (legacyCapability[user.role] === capability) return { enabled: true, approvalStatus: user.isApproved === false ? 'pending' : 'approved', isAvailable: user.isAvailable !== false };
  return undefined;
}

export const hasBusinessCapability = (user: UserAccount, capability: BusinessCapability) => getBusinessCapability(user, capability)?.enabled === true;
export const hasApprovedBusinessCapability = (user: UserAccount, capability: BusinessCapability) => {
  const profile = getBusinessCapability(user, capability);
  return user.isApproved !== false && profile?.enabled === true && profile.approvalStatus === 'approved';
};
export const hasPendingBusinessCapability = (user: UserAccount, capability: BusinessCapability) => {
  const profile = getBusinessCapability(user, capability);
  return profile?.enabled === true && profile.approvalStatus === 'pending';
};
