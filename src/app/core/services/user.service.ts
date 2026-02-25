import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models/user.model';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type { User } from '../models/user.model';
export { UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private authUrl = `${environment.urls.coreApi}/Auth`;
  private apiUrl = `${environment.urls.coreApi}/User`;

  private readonly http = inject(HttpClient);

  getAll(): Observable<User[]> {
    return this.http.request<User[]>('GET', `${this.apiUrl}/get-all`);
  }

  getOne(id: string): Observable<User> {
    return this.http.request<User>('GET', `${this.apiUrl}/get-one/${id}`);
  }

  getMe(): Observable<User> {
    return this.http.request<User>('GET', `${this.apiUrl}/me`);
  }

  getByOrganisation(organisationId: number, role?: number): Observable<User[]> {
    const params = role !== undefined ? `?role=${encodeURIComponent(String(role))}` : '';
    return this.http.request<User[]>(
      'GET',
      `${this.apiUrl}/get-by-organisation/${organisationId}${params}`,
    );
  }

  getList(params?: {
    role?: number | null;
    isActif?: boolean | null;
    search?: string | null;
    organisationId?: number | null;
  }): Observable<User[]> {
    const query = new URLSearchParams();
    if (params?.role !== null && params?.role !== undefined) {
      query.set('role', String(params.role));
    }
    if (params?.isActif !== null && params?.isActif !== undefined) {
      query.set('isActif', String(params.isActif));
    }
    if (params?.search) {
      query.set('search', params.search);
    }
    if (params?.organisationId) {
      query.set('organisationId', String(params.organisationId));
    }
    const suffix = query.toString();
    return this.http.request<User[]>('GET', `${this.apiUrl}/list${suffix ? `?${suffix}` : ''}`);
  }

  create(user: any): Observable<any> {
    const confirmPassword = user.confirmPassword ?? user.password;
    const payload = {
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      password: user.password,
      confirmPassword,
      role: Number(user.role),
      tailleCm: Number(user.tailleCm) || 177,
      isActif: Boolean(user.isActif),
      organisationId: Number(user.organisationId)
    };


    return this.http.request('POST', `${this.authUrl}/register`, { body: payload });
  }

  update(user: any): Observable<any> {
    const confirmPassword = user.confirmPassword ?? user.password;
    const payload = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: Number(user.role),
      tailleCm: Number(user.tailleCm) || 177,
      isActif: Boolean(user.isActif),
      organisationId: Number(user.organisationId)
    };

    if (user.password && user.password.trim() !== '') {
      (payload as any).password = user.password;
      (payload as any).confirmPassword = confirmPassword;
    }

    return this.http.request('PUT', `${this.apiUrl}/update`, { body: payload });
  }

  delete(id: string): Observable<any> {
    return this.http.request('DELETE', `${this.apiUrl}/delete/${id}`);
  }

  getRoleLabel(role: UserRole): string {
    switch (role) {
      case UserRole.Admin:
        return 'Administrateur';
      case UserRole.Manager:
        return 'Manager';
      case UserRole.User:
        return 'Utilisateur';
      default:
        return 'Inconnu';
    }
  }
}
