import { AppNotification, UserRole } from '../types';

export function notificationDestination(notification: AppNotification, role: UserRole, availableTabs: string[]): string {
  const explicitTab = notification.emailDetails?.Page;
  if (explicitTab && availableTabs.includes(explicitTab)) return explicitTab;
  const title = notification.title.toLowerCase();
  const text = `${notification.title} ${notification.message}`.toLowerCase();
  if (Boolean(notification.emailDetails?.Announcement) || /announcement|anunsyo/.test(text)) return 'announcements';

  if (role === 'admin') {
    if (/account registration|verification|logistics service approval|applicant|provider/.test(text)) return 'users';
    if (/harvest|ani/.test(text)) return 'harvests';
    if (/service|serbisyo|logistics|transport|storage|drying|milling/.test(text)) return 'services';
    if (/offer|alok|transaction/.test(text)) return 'offers';
    return 'analytics';
  }
  if (role === 'farmer') {
    if (/loan|pautang/.test(text)) return 'loans';
    if (/service|serbisyo|kahilingan|logistics/.test(title)) return 'directory';
    if (/ani na-post|harvest posted|matagumpay na na-post/.test(text)) return 'harvests';
    if (/offer|alok|buyer|mamimili/.test(text)) return 'interests';
    if (/service|serbisyo|kahilingan|transport|storage|drying|milling/.test(text)) return 'directory';
    return 'harvests';
  }
  if (role === 'buyer' || role === 'agricultural_business') {
    if (notification.emailDetails?.Status === 'New Booking Request' || /booking request directly|new .*service request/.test(text)) return 'services';
    if (/logistics job/.test(text)) return 'logistics_jobs';
    if (/serbisyo na-post|service posted/.test(text)) return 'posted_services';
    if (/loan|pautang/.test(text)) return 'loans';
    if (/offer|alok|tinanggihan ang impormasyon/.test(title) && !/new harvest/.test(title)) return 'offers';
    if (/harvest|ani|palay/.test(text) && !/offer accepted|offer update|tinanggap|tinanggihan/.test(text)) return 'marketplace';
    if (/offer|alok/.test(text)) return 'offers';
    if (/new .*service request|logistics job/.test(text)) return 'logistics_jobs';
    if (/service|serbisyo|kahilingan/.test(text)) return 'services';
    return 'marketplace';
  }
  if (role === 'logistics') {
    if (/approval|approved|manage/.test(text)) return 'services_settings';
    if (/storage|imbakan/.test(text)) return 'service_storage';
    if (/drying|dryer|patuy/.test(text)) return 'service_drying';
    if (/milling|mill|giling/.test(text)) return 'service_milling';
    return 'service_transport';
  }
  if (/active|accepted|tinanggap/.test(text)) return 'active';
  if (/complete|completed|nakumpleto|history/.test(text)) return 'history';
  return 'available';
}

export function unreadCountForDestination(notifications: AppNotification[], email: string | undefined, role: UserRole, availableTabs: string[], destination: string): number {
  if (!email) return 0;
  const normalizedEmail = email.toLowerCase();
  return notifications.filter(notification =>
    notification.userEmail.toLowerCase() === normalizedEmail
    && !notification.isRead
    && notificationDestination(notification, role, availableTabs) === destination
  ).length;
}

export function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-black leading-none text-white shadow-sm" aria-label={`${count} new notifications`}>{count > 99 ? '99+' : count}</span>;
}
