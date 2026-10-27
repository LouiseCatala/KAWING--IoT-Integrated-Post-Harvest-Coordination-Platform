import type { FaqItem } from '../data/faqs';
import type { UserAccount, BusinessCapability } from '../types';
import { getBusinessCapability } from './businessCapabilities';

const aliases: Record<string, string> = {
  mc: 'moisture', humidity: 'moisture', pautang: 'loan', loans: 'loan', borrowing: 'loan',
  ani: 'harvest', harvests: 'harvest', bidding: 'bid', bids: 'bid', presyo: 'price',
  offers: 'offer', alok: 'offer', hauling: 'transport', truck: 'transport', trucking: 'transport',
  dryer: 'drying', patuyuan: 'drying', patuyo: 'drying', gilingan: 'milling', imbakan: 'storage',
  rehistro: 'registration', register: 'registration', gmail: 'google', notifications: 'notification',
};
const stop = new Set('what are the is of a an how do i my to for in on and it this that can please about ang ng mga ako ko ba po paano ano saan'.split(' '));
const tokens = (text: string) => new Set((text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).map(t => aliases[t] || t).filter(t => !stop.has(t) && t.length > 1));

export function relevantGrainyFaqs(question: string, faqs: FaqItem[], limit = 8): FaqItem[] {
  const query = tokens(question);
  return faqs.map((faq, index) => {
    const title = tokens(`${faq.questionEn} ${faq.questionTl}`);
    const body = tokens(`${faq.answerEn} ${faq.answerTl}`);
    const score = [...query].reduce((sum, word) => sum + (title.has(word) ? 3 : body.has(word) ? 1 : 0), 0);
    return { faq, index, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, limit).map(item => item.faq);
}

export function grainyAccountContext(user: UserAccount, screen: string): string {
  const capabilities: BusinessCapability[] = ['buyer', 'loan_provider', 'transport', 'storage', 'drying', 'milling'];
  return JSON.stringify({
    screen, role: user.role, accountApproved: user.isApproved ?? 'unknown',
    emailNotificationsEnabled: user.emailNotificationsEnabled === true,
    capabilities: capabilities.map(name => {
      const profile = getBusinessCapability(user, name);
      return { name, enabled: profile?.enabled === true, approval: profile?.approvalStatus ?? 'not configured', available: profile?.isAvailable ?? 'unknown' };
    }),
  });
}

// Reviewed against form validation, sidebar navigation and dashboard actions.
export const GRAINY_WORKFLOWS = `
HOW TO HELP ACROSS THE WEBSITE
Classify the user's intent before answering: definition/classification, comparison, navigation, eligibility, form validation, troubleshooting, calculation, or live status. Give the requested type of answer first. Do not answer every mention of a topic with the same navigation steps. Understand MC, palay, ani, pautang, hauling, patuyuan, and ordinary spelling variants.
Use the supplied active screen for "here" and the recent conversation for "that", "why", and follow-ups. Screen context identifies navigation only: it does not reveal any open form, selected record, or live data. Ask which item if needed.

HARVEST CREATION AND EDITING
Farmer > My Harvest Posts > Post Harvest. Rice variety, positive quantity, positive asking/starting price, harvest date and a fresh PalaySense reading are validated. Do not instruct manual moisture entry as a bypass. Fixed Asking Price states the requested price; Open for Bidding accepts competing price offers. A summary is reviewed before submission. Managing a harvest lets the farmer inspect/edit its details. Do not assume an unsaved edit reached the server.
Quantity conversions must use the actual declared bag/sack weight. Never assume every sack weighs 50 kg. Total weight = number of sacks times kg per sack; estimated value = kg times price per kg. If a required number is missing, ask for it. DA reference price is a reference benchmark, not a guaranteed buyer offer or a live price feed available to Grainy.

PRICE OFFERS
Business > Buy Harvests to browse and make offers; My Price Offers to track them. Farmer > Price Offers Received to review incoming offers. Explain asking price versus offered price, quantity and total amount. A pending offer is awaiting a decision, not a purchase or payment. Do not conflate posting a harvest, bidding, accepting an offer, and settlement.

SERVICE REQUESTS AND PUBLICATION
Farmer > KAWING Partner Hub to find partners and request transport, storage, drying or milling. A request needs at least one service, rice variety and positive estimated weight; transport additionally validates Pick-up Place and Drop Place. Review before Submit Request. Do not route a business owner trying to publish a service into a farmer booking form.
Agricultural Business > Logistics > My Posted Services. Posting validates service category, title, capacity and coverage; rate, contact and notes describe the offer. Confirm publication. Available Jobs and My Booked Services are separate from the service listing. An enabled capability, its administrator approval, its availability, and an accepted booking are different states. Base answers about this user's settings only on supplied capability context; otherwise describe where to check.

LOANS
Farmer > Farm Loans to inspect providers, apply and track requests. Provider > Loan Management to set published terms and review applications. One loan service can be configured by the provider. Explain requested amount versus provider minimum/maximum and available fund. Interest, repayment period, repayment method, terms, and requirements come from the selected provider; do not invent values. Fund release and repayment are arranged between parties outside the platform. Neither a request nor an approval means money was transferred.

ACCOUNT AND APPROVAL
New account categories are Farmer and Agricultural Business; older buyer/logistics roles exist for compatibility. Business ownership selections can be skipped. No selected services means no Service Coverage Area requirement; Operating Address remains required. Registration needs administrator review. Service approval is separate from account approval. Explain the required document type without asking the user to upload IDs to chat. Never suggest sharing passwords.

PROFILE, ALERTS AND POPUPS
Open the sidebar profile and Edit for supported details, optional photo and bio, then Save. Email Notifications controls consent; it does not guarantee SMTP delivery. In-app notifications and email are separate. Announcements Board displays administrator notices. Popup backdrops do not dismiss cards; use the explicit close/control buttons. Textareas cannot be manually resized; the profile bio grows with text.

TROUBLESHOOTING
For a disabled/missing module, check account role, capability enablement, approval and availability separately. For failed save, explain the exact error and avoid claiming success; duplicate email addresses must be corrected. AI-provider availability and speech are distinct. Text can work while voice fails. Local help cannot reason like the online AI. Never claim deployment to cPanel is required to use local development.
The assistant cannot click, submit, approve, delete, pay, send email, access private records, inspect sensors or verify real-time market prices. Do not invent those abilities. It can explain the product and reason over values the user supplies.
`;
