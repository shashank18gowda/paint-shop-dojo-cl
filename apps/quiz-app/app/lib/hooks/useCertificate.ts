"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchCertificate } from "../api/certificate.api";
import { useSessionStore } from "../../store/session";
import { QUERY_KEYS } from "../../constants/queryKeys";

export function useCertificate(attemptId: string) {
  const token = useSessionStore((s) => s.token);
  return useQuery({
    queryKey: QUERY_KEYS.certificate(attemptId),
    queryFn: () => fetchCertificate(attemptId),
    enabled: !!token && !!attemptId,
  });
}
