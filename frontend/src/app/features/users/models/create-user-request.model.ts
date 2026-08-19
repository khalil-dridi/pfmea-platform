import { UserRole } from '../../auth/models/login-response.model';

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}
