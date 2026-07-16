import { apiClient } from "./client";
import type { GameEligibility } from "../../types/api.types";

export function fetchGameEligibility(): Promise<GameEligibility> {
  return apiClient.get<GameEligibility>("/game/eligibility");
}
