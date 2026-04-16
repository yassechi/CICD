import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Intervention {
  id: number;
  veloId: number;
  typeIntervention: string;
  description: string;
  dateIntervention: string;
  cout: number;
  isActif: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class InterventionService {
  private apiUrl = `${environment.urls.coreApi}/Intervention`;

  private readonly http = inject(HttpClient);

  getAll(): Observable<Intervention[]> {
    return this.http.get<Intervention[]>(`${this.apiUrl}/get-all`);
  }

  getOne(id: number): Observable<Intervention> {
    return this.http.get<Intervention>(`${this.apiUrl}/get-one/${id}`);
  }

  getByVelo(veloId: number): Observable<Intervention[]> {
    return this.http.get<Intervention[]>(`${this.apiUrl}/get-by-velo/${veloId}`);
  }

  create(intervention: Intervention): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, intervention);
  }

  update(intervention: Intervention): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, intervention);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
