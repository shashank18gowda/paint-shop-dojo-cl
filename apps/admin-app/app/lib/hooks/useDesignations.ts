"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDesignations,
  fetchDesignation,
  createDesignation,
  updateDesignation,
  deleteDesignation,
  type CreateDesignationInput,
  type UpdateDesignationInput,
} from "../api/designations.api";

const DESIGNATION_KEY = ["designations"] as const;
const designationOneKey = (id: string) => ["designations", id] as const;

export function useDesignations() {
  return useQuery({
    queryKey: DESIGNATION_KEY,
    queryFn: fetchDesignations,
  });
}

export function useDesignation(id: string) {
  return useQuery({
    queryKey: designationOneKey(id),
    queryFn: () => fetchDesignation(id),
    enabled: !!id,
  });
}

export function useCreateDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDesignationInput) => createDesignation(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DESIGNATION_KEY });
    },
  });
}

export function useUpdateDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDesignationInput }) =>
      updateDesignation(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DESIGNATION_KEY });
    },
  });
}

export function useDeleteDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDesignation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DESIGNATION_KEY });
    },
  });
}
