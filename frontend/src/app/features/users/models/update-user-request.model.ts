import { UserRole } from '../../auth/models/login-response.model';

export interface UpdateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}
