import type { UserAccount, Harvest, ServiceRequest, Offer, OfferedService, ProductionLoanRequest, AppNotification, AppSettings } from '../types';

export interface DatabaseSnapshot {
  users: UserAccount[];
  harvests: Harvest[];
  services: ServiceRequest[];
  offers: Offer[];
  offeredServices: OfferedService[];
  productionLoans: ProductionLoanRequest[];
  notifications: AppNotification[];
  settings: AppSettings;
}
export const COLLECTIONS = ['users', 'harvests', 'services', 'offers', 'offeredServices', 'productionLoans', 'notifications', 'settings'] as const;
export type Collection = typeof COLLECTIONS[number];
type Row = Record<string, unknown>;
export interface RecordChange { collection: Collection; id: string; before: Row | null; after: Row | null }
export const equal = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const left = Object.keys(a), right = Object.keys(b);
  return left.length === right.length && left.every(key => Object.prototype.hasOwnProperty.call(b, key) && equal((a as Row)[key], (b as Row)[key]));
};
function rows(snapshot: DatabaseSnapshot, collection: Collection): Row[] {
  return collection === 'settings' ? [{ id: 'settings', ...snapshot.settings }] : snapshot[collection] as unknown as Row[];
}
const key = (collection: Collection, row: Row) => String(collection === 'users' ? row.email ?? '' : row.id ?? '');
export function changesBetween(before: DatabaseSnapshot, after: DatabaseSnapshot, admin = true): RecordChange[] {
  return COLLECTIONS.flatMap(collection => {
    if (!admin && (collection === 'users' || collection === 'settings')) return [];
    const oldRows = new Map(rows(before, collection).map(row => [key(collection, row), row]));
    const newRows = new Map(rows(after, collection).map(row => [key(collection, row), row]));
    return [...new Set([...oldRows.keys(), ...newRows.keys()])].flatMap(id => {
      if (!id) return [];
      const oldRow = oldRows.get(id) ?? null, newRow = newRows.get(id) ?? null;
      return equal(oldRow, newRow) ? [] : [{ collection, id, before: oldRow, after: newRow }];
    });
  });
}
// Keep edits made while a request was in flight, without writing received data back.
export function rebaseSnapshot(base: DatabaseSnapshot, local: DatabaseSnapshot, remote: DatabaseSnapshot, admin = true): DatabaseSnapshot {
  const result = { ...remote };
  for (const change of changesBetween(base, local, admin)) {
    if (change.collection === 'settings') {
      const settings = { ...result.settings } as unknown as Row;
      for (const field of new Set([...Object.keys(change.before ?? {}), ...Object.keys(change.after ?? {})])) {
        if (field === 'id' || equal(change.before?.[field], change.after?.[field])) continue;
        if (change.after && field in change.after) settings[field] = change.after[field];
        else delete settings[field];
      }
      result.settings = settings as unknown as AppSettings;
      continue;
    }
    const list = [...result[change.collection]] as unknown as Row[];
    const index = list.findIndex(row => key(change.collection, row) === change.id);
    if (!change.after) {
      if (index >= 0) list.splice(index, 1);
    } else if (!change.before || index < 0) {
      if (index >= 0) list[index] = change.after; else list.push(change.after);
    } else {
      const merged = { ...list[index] };
      for (const field of new Set([...Object.keys(change.before), ...Object.keys(change.after)])) {
        if (equal(change.before[field], change.after[field])) continue;
        if (field in change.after) merged[field] = change.after[field]; else delete merged[field];
      }
      list[index] = merged;
    }
    (result as unknown as Record<string, unknown>)[change.collection] = list;
  }
  return result;
}
