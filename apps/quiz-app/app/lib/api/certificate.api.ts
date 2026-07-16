import { apiClient } from "./client";
import type { CertData } from "../../types/api.types";

export function fetchCertificate(attemptId: string): Promise<CertData> {
  return apiClient.get<CertData>(`/certificates/${attemptId}`);
}
