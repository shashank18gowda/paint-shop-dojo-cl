"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { login, register, uploadPhoto, updateProfile, fetchParticipantStats } from "../api/auth.api";
import type { RegisterPayload } from "../../types/api.types";
import { QUERY_KEYS } from "../../constants/queryKeys";

export function useLogin() {
  return useMutation({
    mutationFn: (employeeCode: string) => login(employeeCode),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
  });
}

export function useUploadPhoto() {
  return useMutation({
    mutationFn: (photo: Blob) => uploadPhoto(photo),
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: { name?: string; designationId?: string; lineId?: string }) =>
      updateProfile(data),
  });
}

export function useParticipantStats(code: string) {
  return useQuery({
    queryKey: QUERY_KEYS.participantStats(code),
    queryFn: () => fetchParticipantStats(code),
    enabled: !!code,
    staleTime: 60_000,
  });
}
