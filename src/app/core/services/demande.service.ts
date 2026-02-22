import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum DemandeStatus {
  Encours = 1,
  AttenteComagnie = 2,
  Finalisation = 3,
  Valide = 4,
  Refuse = 5,
}

export interface Demande {
  id?: number;
  status: DemandeStatus;
  idUser: string;
  idVelo: number;
  discussionId?: number;
  isActif?: boolean;
  createdAt?: string;
  accessoiresObligatoires?: string;
  accessoiresSouhaites?: string;
}

export interface AdminDemandeListItem {
  id: number;
  status: DemandeStatus;
  idUser: string;
  userName: string;
  organisationId: number;
  organisationName: string;
  idVelo: number;
  veloMarque: string;
  veloModele: string;
  veloType?: string | null;
  veloPrixAchat?: number | null;
  discussionId?: number;
  createdAt?: string | null;
}

export interface DemandeMessage {
  id: number;
  contenu: string;
  dateEnvoi?: string | null;
  createdDate?: string | null;
  userId: string;
  roleLabel: string;
}

export interface DemandeDetail {
  id: number;
  status: DemandeStatus;
  idUser: string;
  userName: string;
  userEmail: string;
  idVelo: number;
  veloMarque: string;
  veloModele: string;
  veloType?: string | null;
  veloPrixAchat?: number | null;
  discussionId: number;
  veloCmsId?: number | null;
  accessoiresSouhaites?: string | null;
  messages: DemandeMessage[];
}

export interface VeloSnapshotPayload {
  cmsId: number;
  marque: string;
  modele: string;
  type?: string | null;
  prixAchat: number;
}

export interface CreateDemandeWithVeloPayload {
  idUser: string;
  mojoId?: string | null;
  velo: VeloSnapshotPayload;
}

export interface CreateDemandeWithVeloResponse {
  success?: boolean;
  message?: string;
  id?: number;
  demandeId?: number;
  veloId?: number;
  discussionId?: number;
  messageId?: number;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DemandeService {
  private apiUrl = `${environment.urls.coreApi}/Demande`;

  private readonly http = inject(HttpClient);

  getAll(): Observable<Demande[]> {
    return this.http.get<Demande[]>(`${this.apiUrl}/get-all`);
  }

  getOne(id: number): Observable<Demande> {
    return this.http.get<Demande>(`${this.apiUrl}/get-one/${id}`);
  }

  getDetail(id: number): Observable<DemandeDetail> {
    return this.http.get<DemandeDetail>(`${this.apiUrl}/get-detail/${id}`);
  }

  getByUser(userId: string): Observable<Demande[]> {
    return this.http.get<Demande[]>(`${this.apiUrl}/get-by-user/${encodeURIComponent(userId)}`);
  }

  getByOrganisation(organisationId: number): Observable<Demande[]> {
    return this.http.get<Demande[]>(`${this.apiUrl}/get-by-organisation/${organisationId}`);
  }

  getList(params?: {
    status?: number | null;
    type?: string | null;
    search?: string | null;
    organisationId?: number | null;
    userId?: string | null;
  }): Observable<AdminDemandeListItem[]> {
    const query = new URLSearchParams();
    if (params?.status !== null && params?.status !== undefined) {
      query.set('status', String(params.status));
    }
    if (params?.type) {
      query.set('type', params.type);
    }
    if (params?.search) {
      query.set('search', params.search);
    }
    if (params?.organisationId) {
      query.set('organisationId', String(params.organisationId));
    }
    if (params?.userId) {
      query.set('userId', params.userId);
    }
    const suffix = query.toString();
    return this.http.get<AdminDemandeListItem[]>(`${this.apiUrl}/list${suffix ? `?${suffix}` : ''}`);
  }

  exportCsv(params?: {
    status?: number | null;
    type?: string | null;
    search?: string | null;
    organisationId?: number | null;
    userId?: string | null;
  }): Observable<Blob> {
    const query = new URLSearchParams();
    if (params?.status !== null && params?.status !== undefined) {
      query.set('status', String(params.status));
    }
    if (params?.type) {
      query.set('type', params.type);
    }
    if (params?.search) {
      query.set('search', params.search);
    }
    if (params?.organisationId) {
      query.set('organisationId', String(params.organisationId));
    }
    if (params?.userId) {
      query.set('userId', params.userId);
    }
    const suffix = query.toString();
    return this.http.get(`${this.apiUrl}/export${suffix ? `?${suffix}` : ''}`, {
      responseType: 'blob',
    });
  }

  create(demande: Demande): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, demande);
  }

  createWithVelo(payload: CreateDemandeWithVeloPayload): Observable<CreateDemandeWithVeloResponse> {
    const { velo, ...rest } = payload;
    return this.http.post<CreateDemandeWithVeloResponse>(`${this.apiUrl}/create-with-bike`, { ...rest, bike: velo });
  }

  update(demande: Demande): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, demande);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }

  updateStatus(id: number, status: DemandeStatus): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-status/${id}`, { status });
  }

  getStatusLabel(status: DemandeStatus): string {
    switch (status) {
      case DemandeStatus.Encours:
        return 'En cours';
      case DemandeStatus.AttenteComagnie:
        return 'Attente Compagnie';
      case DemandeStatus.Finalisation:
        return 'Finalisation';
      case DemandeStatus.Valide:
        return 'Valide';
      case DemandeStatus.Refuse:
        return 'Refuse';
      default:
        return 'Inconnu';
    }
  }

  getStatusSeverity(
    status: DemandeStatus,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case DemandeStatus.Encours:
        return 'success';
      case DemandeStatus.AttenteComagnie:
        return 'success';
      case DemandeStatus.Finalisation:
        return 'success';
      case DemandeStatus.Valide:
        return 'success';
      case DemandeStatus.Refuse:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getStatusClass(status: DemandeStatus): string {
    switch (status) {
      case DemandeStatus.Encours:
        return 'status-tag status-encours';
      case DemandeStatus.AttenteComagnie:
        return 'status-tag status-attente';
      case DemandeStatus.Finalisation:
        return 'status-tag status-finalisation';
      case DemandeStatus.Valide:
        return 'status-tag status-valide';
      case DemandeStatus.Refuse:
        return 'status-tag status-refuse';
      default:
        return 'status-tag';
    }
  }
}
