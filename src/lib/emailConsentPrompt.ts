import type { UserAccount } from '../types';

const key = (email: string) => 'kawing_email_prompt:' + email.trim().toLowerCase();

export function resetEmailConsentPrompt(email?: string) {
  if (email) sessionStorage.removeItem(key(email));
}

export function takeEmailConsentPrompt(user: UserAccount): boolean {
  if (!user.email || user.role === 'admin') return false;
  const storageKey = key(user.email);
  if (user.emailNotificationsEnabled === true) {
    sessionStorage.setItem(storageKey, 'shown');
    return false;
  }
  if (sessionStorage.getItem(storageKey)) return false;
  // Survives refresh and sidebar remounts; a successful login resets it.
  sessionStorage.setItem(storageKey, 'shown');
  return true;
}
