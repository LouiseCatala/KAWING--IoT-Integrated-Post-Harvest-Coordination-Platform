import type { ServiceRequest } from '../types';

export const isAvailableServiceRequestFor = (request: ServiceRequest, userEmail?: string): boolean =>
  request.type !== 'buyer'
  && request.status === 'pending'
  && (!request.operatorEmail || request.operatorEmail.toLowerCase() === userEmail?.toLowerCase());
