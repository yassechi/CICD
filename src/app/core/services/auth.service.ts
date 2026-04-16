import { AuthResponse, LoginRequest } from '../models/auth.model';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { User, UserRole } from '../models/user.model';
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.urls.coreApi}/Auth`;
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly currentUserSignal = signal<User | null>(this.loadStoredUser());

  readonly currentUser = this.currentUserSignal.asReadonly();

  public getCurrentUser(): User | null {
    return this.currentUserSignal();
  }

  login(
    identifiants: LoginRequest,
    options?: { redirectToDashboard?: boolean },
  ): Observable<AuthResponse> {
    const shouldRedirect = options?.redirectToDashboard !== false;
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, identifiants).pipe(
      tap((reponse) => {
        if (reponse && reponse.token) {
          localStorage.setItem('token', reponse.token);
          this.getUserInfo(reponse.id).subscribe((utilisateur) => {
            this.setCurrentUser(utilisateur);
            if (shouldRedirect) {
              this.redirectToRoleDashboard(utilisateur.role);
            }
          });
        }
      }),
    );
  }

  getUserInfo(userId: string): Observable<User> {
    return this.http.get<User>(`${environment.urls.coreApi}/User/get-one/${userId}`);
  }

  logout(): void {
    localStorage.removeItem('token');
    this.setCurrentUser(null);
    this.router.navigate(['/login']);
  }

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSignal.set(user);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!(this.getToken() || this.getCurrentUser());
  }

  private loadStoredUser(): User | null {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      return null;
    }
    try {
      // recharge le User du local storage As User..
      return JSON.parse(storedUser) as User;
    } catch {
      localStorage.removeItem('currentUser');
      return null;
    }
  }

  private redirectToRoleDashboard(role: UserRole): void {
    switch (role) {
      case UserRole.Admin:
        this.router.navigate(['/admin/dashboard']);
        break;
      case UserRole.Manager:
        this.router.navigate(['/manager/dashboard']);
        break;
      case UserRole.User:
        this.router.navigate(['/user/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

  resetPassword(payload: { email: string; token: string; newPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, payload);
  }

  forgotPassword(payload: { email: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, payload);
  }
}
