import { UserRole } from './login-response.model';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
