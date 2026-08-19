import { UserRole } from '../../auth/models/login-response.model';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
