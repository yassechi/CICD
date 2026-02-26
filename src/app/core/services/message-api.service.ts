import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

export interface DiscussionMessage {
  id?: number;
  createdDate?: string;
  modifiedDate?: string;
  modifiedBy?: string;
  createdBy?: string;
  isActif?: boolean;
  contenu: string;
  dateEnvoi?: string;
  userId: string;
  discussionId: number;
}

export interface MarkMessagesReadPayload {
  userId: string;
  discussionId?: number | null;
  messageIds?: number[];
}

@Injectable({
  providedIn: 'root',
})
export class MessageApiService {
  private apiUrl = `${environment.urls.coreApi}/Message`;
  private viewApiUrl = `${environment.urls.coreApi}/VuesMessage`;
  private readonly http = inject(HttpClient);
  readonly refreshSignal = signal(0);

  create(message: DiscussionMessage): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, message);
  }

  private buildParams(params: {
    userId: string;
    role?: number;
    organisationId?: number | null;
  }): HttpParams {
    let httpParams = new HttpParams().set('userId', params.userId);
    if (params.role !== undefined && params.role !== null) {
      httpParams = httpParams.set('role', String(params.role));
    }
    if (params.organisationId !== undefined && params.organisationId !== null) {
      httpParams = httpParams.set('organisationId', String(params.organisationId));
    }
    return httpParams;
  }

  getUnreadCount(params: {
    userId: string;
    role?: number;
    organisationId?: number | null;
  }): Observable<number> {
    return this.http.get<number>(`${this.viewApiUrl}/unread-count`, {
      params: this.buildParams(params),
    });
  }

  getUnreadDiscussions(params: {
    userId: string;
    role?: number;
    organisationId?: number | null;
  }): Observable<number[]> {
    return this.http.get<number[]>(`${this.viewApiUrl}/unread-discussions`, {
      params: this.buildParams(params),
    });
  }

  markRead(payload: MarkMessagesReadPayload): Observable<any> {
    return this.http.post(`${this.viewApiUrl}/mark-read`, payload);
  }

  refreshBadge(): void {
    this.refreshSignal.update((v) => v + 1);
  }
}
