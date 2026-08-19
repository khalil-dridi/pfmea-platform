export type UserRole = 'ADMIN' | 'SUPER_ADMIN';

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}