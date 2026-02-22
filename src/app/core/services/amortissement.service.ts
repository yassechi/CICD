import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Amortissement {
  id: number;
  veloId: number;
  dateDebut: string;
  dureeMois: number;
  valeurInit: number;
  valeurResiduelleFinale: number;
  isActif: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AmortissementService {
  private apiUrl = `${environment.urls.coreApi}/Amortissement`;

  private readonly http = inject(HttpClient);

  getAll(): Observable<Amortissement[]> {
    return this.http.get<Amortissement[]>(`${this.apiUrl}/get-all`);
  }

  getOne(id: number): Observable<Amortissement> {
    return this.http.get<Amortissement>(`${this.apiUrl}/${id}`);
  }

  getByVelo(veloId: number): Observable<Amortissement[]> {
    return this.http.get<Amortissement[]>(`${this.apiUrl}/get-by-velo/${veloId}`);
  }

  create(amortissement: Amortissement): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, amortissement);
  }

  update(amortissement: Amortissement): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, amortissement);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
