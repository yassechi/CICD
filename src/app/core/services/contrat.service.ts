import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { I18nService } from './I18n.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum StatutContrat {
  EnCours = 1,
  Termine = 2,
  Resilie = 3,
}

export interface Contrat {
  id?: number;
  ref: string;
  veloId: number;
  beneficiaireId: string;
  userRhId: string;
  dateDebut: string;
  dateFin: string;
  duree: number;
  loyerMensuelHT: number;
  statutContrat: StatutContrat;
  isActif?: boolean;
  veloMarque?: string;
  veloModele?: string;
  veloNumeroSerie?: string | null;
  beneficiaireName?: string;
  userRhName?: string;
}

export interface ContratEditUser {
  id: string;
  userName?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  role?: number;
  isActif?: boolean;
  organisationId?: number;
}

export interface ContratEditVelo {
  id: number;
  numeroSerie: string;
  marque: string;
  modele: string;
  type?: string | null;
  prixAchat?: number;
  status?: boolean;
}

export interface ContratEditData {
  contrat: Contrat;
  users: ContratEditUser[];
  velos: ContratEditVelo[];
}

export interface ContratListParams {
  type?: string | null;
  search?: string | null;
  endingSoon?: boolean | null;
  withIncidents?: boolean | null;
  organisationId?: number | null;
  userId?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ContratService {
  private apiUrl = `${environment.urls.coreApi}/Contrat`;

  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);

  getAll(): Observable<Contrat[]> {
    return this.http.request<Contrat[]>('GET', `${this.apiUrl}/get-all`);
  }

  getOne(id: number): Observable<Contrat> {
    return this.http.request<Contrat>('GET', `${this.apiUrl}/get-one/${id}`);
  }

  getDetail(id: number): Observable<Contrat> {
    return this.http.request<Contrat>('GET', `${this.apiUrl}/get-one/${id}`);
  }

  getEditData(id: number): Observable<ContratEditData> {
    return this.http.request<ContratEditData>('GET', `${this.apiUrl}/edit-data/${id}`);
  }

  getByOrganisation(organisationId: number): Observable<Contrat[]> {
    return this.http.request<Contrat[]>(
      'GET',
      `${this.apiUrl}/get-by-organisation/${organisationId}`,
    );
  }

  getList(params?: ContratListParams): Observable<Contrat[]> {
    const suffix = this.buildQueryParams(params);
    return this.http.get<Contrat[]>(`${this.apiUrl}/list${suffix ? `?${suffix}` : ''}`);
  }

  exportCsv(params?: ContratListParams): Observable<Blob> {
    const suffix = this.buildQueryParams(params);
    return this.http.get(`${this.apiUrl}/export${suffix ? `?${suffix}` : ''}`, {
      responseType: 'blob',
    });
  }

  private buildQueryParams(params?: ContratListParams): string {
    const query = new URLSearchParams();
    if (params?.type) {
      query.set('type', params.type);
    }
    if (params?.search) {
      query.set('search', params.search);
    }
    if (params?.endingSoon !== null && params?.endingSoon !== undefined) {
      query.set('endingSoon', String(params.endingSoon));
    }
    if (params?.withIncidents !== null && params?.withIncidents !== undefined) {
      query.set('withIncidents', String(params.withIncidents));
    }
    if (params?.organisationId) {
      query.set('organisationId', String(params.organisationId));
    }
    if (params?.userId) {
      query.set('userId', params.userId);
    }
    return query.toString();
  }

  create(contrat: Contrat): Observable<any> {
    return this.http.request('POST', `${this.apiUrl}/add`, { body: contrat });
  }

  update(contrat: Contrat): Observable<any> {
    return this.http.request('PUT', `${this.apiUrl}/update`, { body: contrat });
  }

  delete(id: number): Observable<any> {
    return this.http.request('DELETE', `${this.apiUrl}/delete/${id}`);
  }

  getStatutLabel(statut: StatutContrat): string {
    const t = this.i18n.t();
    switch (statut) {
      case StatutContrat.EnCours:
        return t.contratStatus.enCours;
      case StatutContrat.Termine:
        return t.contratStatus.termine;
      case StatutContrat.Resilie:
        return t.contratStatus.resilie;
      default:
        return t.common.inconnu;
    }
  }
}
