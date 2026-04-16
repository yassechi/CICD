import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models/user.model';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type { User } from '../models/user.model';
export { UserRole } from '../models/user.model';

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phoneNumber?: string | null;
  password: string;
  confirmPassword?: string | null;
  role: number;
  tailleCm?: number | null;
  isActif?: boolean | null;
  organisationId: number;
}

export interface UpdateUserPayload {
  id?: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phoneNumber?: string | null;
  password?: string | null;
  confirmPassword?: string | null;
  role: number;
  tailleCm?: number | null;
  isActif?: boolean | null;
  organisationId: number | User['organisationId'];
}

@Injectable({
  providedIn: 'root',
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

  // Parametres
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

  create(user: CreateUserPayload): Observable<any> {
    return this.http.post(`${this.authUrl}/register`, user);
  }

  update(user: UpdateUserPayload): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, user);
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
