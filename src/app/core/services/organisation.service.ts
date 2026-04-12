import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface OrganisationLogo {
  id: number;
  organisationId: number;
  fichier: string;
  nomFichier: string;
  typeFichier: string;
  isActif: boolean;
  createdAt?: string;
}

export interface OrganisationLogoPayload {
  organisationId: number;
  fichier: string;
  nomFichier: string;
  typeFichier: string;
  isActif?: boolean;
}

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
  providedIn: 'root',
})
export class OrganisationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.urls.coreApi}/Organisation`;
  private readonly logoApiUrl = `${environment.urls.coreApi}/OrganisationLogo`;

  getAll(): Observable<Organisation[]> {
    return this.http.get<Organisation[]>(`${this.apiUrl}/get-all`);
  }

  getList(params?: {
    isActif?: boolean | null;
    search?: string | null;
  }): Observable<Organisation[]> {
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

  create(organisation: Organisation): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, organisation);
  }

  update(organisation: Organisation): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, organisation);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }

  getLogosByOrganisation(organisationId: number): Observable<OrganisationLogo[]> {
    return this.http.get<OrganisationLogo[]>(
      `${this.logoApiUrl}/get-by-organisation/${organisationId}`,
    );
  }

  getActiveLogo(organisationId: number): Observable<OrganisationLogo | null> {
    return this.getLogosByOrganisation(organisationId).pipe(
      map((logos) => logos.find((logo) => logo.isActif) ?? logos[0] ?? null),
    );
  }

  createLogo(payload: OrganisationLogoPayload): Observable<any> {
    return this.http.post(`${this.logoApiUrl}/add`, payload);
  }

  updateLogo(payload: OrganisationLogo): Observable<any> {
    return this.http.put(`${this.logoApiUrl}/update`, payload);
  }

  setLogoActive(logoId: number): Observable<any> {
    return this.http.put(`${this.logoApiUrl}/set-active/${logoId}`, {});
  }

  deleteLogo(id: number): Observable<any> {
    return this.http.delete(`${this.logoApiUrl}/delete/${id}`);
  }

  //return un URL
  buildLogoDataUrl(logo: OrganisationLogo | null | undefined): string | null {
    if (!logo?.fichier || !logo.typeFichier) return null;
    return `data:${logo.typeFichier};base64,${logo.fichier}`;
  }
}
