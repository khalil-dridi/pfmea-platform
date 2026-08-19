import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { LoginRequest } from '../../features/auth/models/login-request.model';
import { AuthenticatedUser, LoginResponse, UserRole } from '../../features/auth/models/login-response.model';
import { UserProfile } from '../../features/auth/models/user-profile.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly profileUrl = `${environment.apiUrl}/users/me`;
  private readonly tokenKey = 'access_token';
  private readonly userKey = 'auth_user';

  private readonly currentUserSignal = signal<AuthenticatedUser | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();

  readonly displayName = computed(() => {
    const user = this.currentUserSignal();

    if (!user) {
      return '';
    }

    const fullName = [user.firstName, user.lastName]
      .filter(part => !!part && part.trim().length > 0)
      .join(' ')
      .trim();

    return fullName || user.email;
  });

  readonly roleLabel = computed(() => {
    const role = this.currentUserSignal()?.role;

    if (role === 'SUPER_ADMIN') {
      return 'Super administrateur';
    }

    if (role === 'ADMIN') {
      return 'Administrateur';
    }

    return '';
  });

  constructor(private readonly http: HttpClient) {
    this.currentUserSignal.set(this.readStoredUser());
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, request)
      .pipe(
        tap(response => this.persistSession(response)),
        switchMap(response =>
          this.loadCurrentProfile().pipe(
            map(() => response),
            catchError(() => of(response))
          )
        )
      );
  }

  logout(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
    this.currentUserSignal.set(null);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): AuthenticatedUser | null {
    return this.currentUserSignal();
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  hasRole(...roles: UserRole[]): boolean {
    const role = this.currentUserSignal()?.role;
    return role !== undefined && roles.includes(role);
  }

  ensureProfileLoaded(): void {
    const user = this.currentUserSignal();

    if (!this.isAuthenticated()) {
      return;
    }

    if (user?.firstName && user.lastName) {
      return;
    }

    this.loadCurrentProfile().subscribe({
      error: () => undefined
    });
  }

  loadCurrentProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.profileUrl).pipe(
      tap(profile => this.applyProfile(profile))
    );
  }

  applyProfile(profile: UserProfile): void {
    this.storeUser({
      userId: profile.id,
      email: profile.email,
      role: profile.role,
      firstName: profile.firstName,
      lastName: profile.lastName
    });
  }

  private persistSession(response: LoginResponse): void {
    sessionStorage.setItem(this.tokenKey, response.accessToken);
    this.storeUser({
      userId: response.userId,
      email: response.email,
      role: response.role
    });
  }

  private storeUser(user: AuthenticatedUser): void {
    sessionStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  private readStoredUser(): AuthenticatedUser | null {
    const rawUser = sessionStorage.getItem(this.userKey);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as AuthenticatedUser;
    } catch {
      sessionStorage.removeItem(this.userKey);
      return null;
    }
  }
}
