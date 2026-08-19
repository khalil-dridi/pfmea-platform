import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UserProfile } from '../../auth/models/user-profile.model';
import { environment } from '../../../../environments/environment';
import { ChangePasswordRequest } from '../models/change-password-request.model';
import { UpdateProfileRequest } from '../models/update-profile-request.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly profileUrl = `${environment.apiUrl}/users/me`;
  private readonly changePasswordUrl = `${environment.apiUrl}/auth/change-password`;

  getCurrentProfile(): Observable<UserProfile> {
    return this.authService.loadCurrentProfile();
  }

  updateProfile(request: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(this.profileUrl, request).pipe(
      switchMap(profile => {
        if (profile?.id) {
          this.authService.applyProfile(profile);
          return of(profile);
        }

        return this.authService.loadCurrentProfile();
      })
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(this.changePasswordUrl, request);
  }
}
