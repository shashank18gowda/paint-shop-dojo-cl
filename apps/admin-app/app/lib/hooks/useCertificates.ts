import { useQuery } from '@tanstack/react-query';
import { fetchCertificates, type FetchCertificatesParams, type PaginatedCertificates } from '../api/certificates.api';

export function useCertificates(params: FetchCertificatesParams) {
  return useQuery<PaginatedCertificates, Error>({
    queryKey: ['certificates', params],
    queryFn: () => fetchCertificates(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    retry: 1,
  });
}

export type { FetchCertificatesParams, PaginatedCertificates } from '../api/certificates.api';
