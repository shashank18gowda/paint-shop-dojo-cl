export type JwtKind = 'participant' | 'admin';

export interface JwtPayload {
  sub: string;
  kind?: JwtKind; // defaults to 'participant' for backwards compat
  code?: string;
  designationId?: string;
  email?: string;
  role?: string;
}
