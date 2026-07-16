"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSessionStore } from "../../store/session";
import { useFlowStore } from "../../store/flow";

export function useEndSession() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearSession = useSessionStore((s) => s.clearSession);
  const reset = useFlowStore((s) => s.reset);

  return () => {
    clearSession();
    reset();
    queryClient.clear();
    router.replace("/");
  };
}
