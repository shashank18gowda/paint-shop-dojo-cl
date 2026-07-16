"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchPlants,
  fetchPlant,
  createPlant,
  updatePlant,
  deletePlant,
  type CreatePlantInput,
  type UpdatePlantInput,
} from "../api/plants.api";

const PLANT_KEY = ["plants"] as const;
const plantOneKey = (id: string) => ["plants", id] as const;

export function usePlants() {
  return useQuery({
    queryKey: PLANT_KEY,
    queryFn: fetchPlants,
  });
}

export function usePlant(id: string) {
  return useQuery({
    queryKey: plantOneKey(id),
    queryFn: () => fetchPlant(id),
    enabled: !!id,
  });
}

export function useCreatePlant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlantInput) => createPlant(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PLANT_KEY });
    },
  });
}

export function useUpdatePlant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePlantInput }) =>
      updatePlant(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PLANT_KEY });
    },
  });
}

export function useDeletePlant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePlant(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PLANT_KEY });
    },
  });
}
