import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Organisation {
  id: number;
  name: string;
  code: string;
  address: string;
  contactEmail: string;
  isActif: boolean;
  logoUrl?: string;
  emailAutorise: string;
  idContact: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganisationService {
  private apiUrl = `${environment.urls.coreApi}/Organisation`;

  private readonly http = inject(HttpClient);

  getAll(): Observable<Organisation[]> {
    return this.http.get<Organisation[]>(`${this.apiUrl}/get-all`);
  }

  getList(params?: { isActif?: boolean | null; search?: string | null }): Observable<Organisation[]> {
    const query = new URLSearchParams();
    if (params?.isActif !== null && params?.isActif !== undefined) {
      query.set('isActif', String(params.isActif));
    }
    if (params?.search) {
      query.set('search', params.search);
    }
    const suffix = query.toString();
    return this.http.get<Organisation[]>(`${this.apiUrl}/list${suffix ? `?${suffix}` : ''}`);
  }

  getOne(id: number): Observable<Organisation> {
    return this.http.get<Organisation>(`${this.apiUrl}/get-one/${id}`);
  }

  resolveByEmailOrDomain(emailOrDomain: string): Observable<Organisation | null> {
    const value = encodeURIComponent(emailOrDomain || '');
    return this.http.get<Organisation | null>(`${this.apiUrl}/resolve?emailOrDomain=${value}`);
  }

  create(organisation: Organisation): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, organisation);
  }

  update(organisation: Organisation): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, organisation);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
