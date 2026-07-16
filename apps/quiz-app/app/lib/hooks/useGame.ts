"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchGameEligibility } from "../api/game.api";
import { QUERY_KEYS } from "../../constants/queryKeys";

export function useGameEligibility() {
  return useQuery({
    queryKey: QUERY_KEYS.gameEligibility,
    queryFn: fetchGameEligibility,
    staleTime: 60_000,
  });
}
