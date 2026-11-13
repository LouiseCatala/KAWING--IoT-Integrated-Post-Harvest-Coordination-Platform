import type { UserAccount } from '../types';

export function normalizeAdditionalContactNumbers(primary: string | undefined, values: string[] | undefined): string[] {
  const primaryValue = primary?.trim().toLowerCase() || '';
  const seen = new Set<string>();
  return (values || []).flatMap((value) => {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || key === primaryValue || seen.has(key)) return [];
    seen.add(key);
    return [trimmed];
  });
}

export function getContactNumbers(user: Pick<UserAccount, 'contactNumber' | 'additionalContactNumbers'>): string[] {
  const primary = user.contactNumber?.trim();
  return [...(primary ? [primary] : []), ...normalizeAdditionalContactNumbers(primary, user.additionalContactNumbers)];
}
