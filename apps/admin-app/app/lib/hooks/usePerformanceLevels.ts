import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchPerformanceLevels,
  createPerformanceLevel,
  updatePerformanceLevel,
  deletePerformanceLevel,
  CreatePerformanceLevelInput,
  UpdatePerformanceLevelInput,
} from "../api/performance-levels.api";

const QUERY_KEY = ["performance-levels"];

export function usePerformanceLevels() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchPerformanceLevels,
    staleTime: 60_000,
  });
}

export function useCreatePerformanceLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePerformanceLevelInput) => createPerformanceLevel(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdatePerformanceLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePerformanceLevelInput }) =>
      updatePerformanceLevel(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeletePerformanceLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePerformanceLevel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
