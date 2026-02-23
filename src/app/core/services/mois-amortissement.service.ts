import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MoisAmortissement {
  id?: number;
  amortissementId: number;
  numeroMois: number;
  montant: number;
  isActif?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MoisAmortissementService {
  private apiUrl = `${environment.urls.coreApi}/MoisAmortissement`;
  private readonly http = inject(HttpClient);

  getAll(): Observable<MoisAmortissement[]> {
    return this.http.get<MoisAmortissement[]>(`${this.apiUrl}/get-all`);
  }

  getOne(id: number): Observable<MoisAmortissement> {
    return this.http.get<MoisAmortissement>(`${this.apiUrl}/get-one/${id}`);
  }

  getByAmortissement(amortissementId: number): Observable<MoisAmortissement[]> {
    return this.http.get<MoisAmortissement[]>(
      `${this.apiUrl}/get-by-amortissement/${amortissementId}`,
    );
  }

  getByContrat(contratId: number): Observable<MoisAmortissement[]> {
    return this.http.get<MoisAmortissement[]>(`${this.apiUrl}/get-by-contrat/${contratId}`);
  }

  create(item: MoisAmortissement): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, item);
  }

  update(item: MoisAmortissement): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, item);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
