import { apiClient } from './client';
import type { ParticipantCertificate, PaginatedCertificates } from '../../types/master-data.types';

export interface FetchCertificatesParams {
  page?: number;
  limit?: number;
  search?: string;
  designationName?: string;
  status?: string;
  lineId?: string;
  plantId?: string;
}

export function fetchCertificates(params: FetchCertificatesParams): Promise<PaginatedCertificates> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.designationName) query.set('designationName', params.designationName);
  if (params.status) query.set('status', params.status);
  if (params.lineId) query.set('lineId', params.lineId);
  if (params.plantId) query.set('plantId', params.plantId);
  const queryString = query.toString();
  return apiClient.get<PaginatedCertificates>(`/admin/certificates${queryString ? `?${queryString}` : ''}`);
}

export function fetchCertificate(attemptId: string): Promise<ParticipantCertificate> {
  return apiClient.get<ParticipantCertificate>(`/certificates/${attemptId}`);
}

export type { ParticipantCertificate, PaginatedCertificates };
