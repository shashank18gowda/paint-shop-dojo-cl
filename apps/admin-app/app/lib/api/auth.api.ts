import { apiClient } from "./client";
import type { Admin } from "../../store/session";

export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface AdminLoginResult {
  token: string;
  admin: Admin;
}

export function adminLogin(input: AdminLoginInput): Promise<AdminLoginResult> {
  return apiClient.publicPost<AdminLoginResult>("/auth/admin/login", input);
}
