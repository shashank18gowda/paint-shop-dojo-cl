"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCertificate } from "../api/certificates.api";

export function useCertificate(attemptId: string) {
  return useQuery({
    queryKey: ["certificate", attemptId],
    queryFn: () => fetchCertificate(attemptId),
    enabled: !!attemptId,
  });
}
