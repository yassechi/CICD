import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Velo {
  id?: number;
  createdDate?: string;
  modifiedDate?: string;
  modifiedBy?: string;
  createdBy?: string;
  numeroSerie: string;
  marque: string;
  modele: string;
  prixAchat: number;
  status: boolean;
  isActif: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class VeloService {
  private apiUrl = `${environment.urls.coreApi}/Velo`;

  private readonly http = inject(HttpClient);

  getAll(): Observable<Velo[]> {
    return this.http.get<Velo[]>(`${this.apiUrl}/get-all`);
  }

  getTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/get-types`);
  }

  getOne(id: number): Observable<Velo> {
    return this.http.get<Velo>(`${this.apiUrl}/get-one/${id}`);
  }

  create(velo: Velo): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, velo);
  }

  update(velo: Velo): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, velo);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
