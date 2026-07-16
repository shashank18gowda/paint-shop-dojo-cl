"use client";
import { useQuery } from "@tanstack/react-query";
import {
  fetchLanguages,
  fetchLines,
  fetchParticipantTypes,
  fetchDesignations,
  fetchPlants,
} from "../api/reference.api";
import { QUERY_KEYS } from "../../constants/queryKeys";

export function useLanguages() {
  return useQuery({
    queryKey: QUERY_KEYS.languages,
    queryFn: fetchLanguages,
    staleTime: Infinity,
  });
}

export function useLines() {
  return useQuery({
    queryKey: QUERY_KEYS.lines,
    queryFn: fetchLines,
    staleTime: Infinity,
  });
}

export function useParticipantTypes() {
  return useQuery({
    queryKey: QUERY_KEYS.participantTypes,
    queryFn: fetchParticipantTypes,
    staleTime: Infinity,
  });
}

export function useDesignations() {
  return useQuery({
    queryKey: QUERY_KEYS.designations,
    queryFn: fetchDesignations,
    staleTime: Infinity,
  });
}

export function usePlants() {
  return useQuery({
    queryKey: QUERY_KEYS.plants,
    queryFn: fetchPlants,
    staleTime: Infinity,
  });
}
