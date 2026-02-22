import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ActivityFeedItem {
  title: string;
  detail: string;
  time: string;
}

export interface AdminDashboard {
  pendingDemandes: number;
  activeContrats: number;
  budgetTotal: number;
  activityFeed: ActivityFeedItem[];
  veloTypeCounts: Array<{ label: string; value: number }>;
}

export interface ManagerDashboard {
  totalEmployes: number;
  totalDemandes: number;
  totalContrats: number;
  demandesEnCours: number;
  demandesAttente: number;
  demandesAttenteCompagnie: number;
  demandesValide: number;
  contratsEnCours: number;
  contratsTermine: number;
}

export interface UserDashboard {
  totalDemandes: number;
  totalContrats: number;
  demandesEnCours: number;
  contratsActifs: number;
  demandesAttente: number;
  demandesAttenteCompagnie: number;
  demandesValide: number;
  contratsEnCours: number;
  contratsTermine: number;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.urls.coreApi}/Dashboard`;

  getAdminDashboard(): Observable<AdminDashboard> {
    return this.http.get<AdminDashboard>(`${this.apiUrl}/admin`);
  }

  getManagerDashboard(organisationId: number): Observable<ManagerDashboard> {
    return this.http.get<ManagerDashboard>(`${this.apiUrl}/manager/${organisationId}`);
  }

  getUserDashboard(userId: string): Observable<UserDashboard> {
    return this.http.get<UserDashboard>(`${this.apiUrl}/user/${encodeURIComponent(userId)}`);
  }
}
