import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, map } from 'rxjs';

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

export interface UnreadMessageCountResponse {
  count?: number;
  total?: number;
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

  private readonly refreshSubject = new Subject<void>();
  readonly refresh$ = this.refreshSubject.asObservable();

  create(message: DiscussionMessage): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, message);
  }

  getUnreadCount(params: {
    userId: string;
    role?: number;
    organisationId?: number | null;
  }): Observable<number> {
    let httpParams = new HttpParams().set('userId', params.userId);
    if (params.role !== undefined && params.role !== null) {
      httpParams = httpParams.set('role', String(params.role));
    }
    if (params.organisationId !== undefined && params.organisationId !== null) {
      httpParams = httpParams.set('organisationId', String(params.organisationId));
    }

    return this.http
      .get<number | UnreadMessageCountResponse>(`${this.viewApiUrl}/unread-count`, {
        params: httpParams,
      })
      .pipe(
        map((response) => {
          if (typeof response === 'number') {
            return response;
          }
          return response?.count ?? response?.total ?? 0;
        }),
      );
  }

  getUnreadDiscussions(params: {
    userId: string;
    role?: number;
    organisationId?: number | null;
  }): Observable<number[]> {
    let httpParams = new HttpParams().set('userId', params.userId);
    if (params.role !== undefined && params.role !== null) {
      httpParams = httpParams.set('role', String(params.role));
    }
    if (params.organisationId !== undefined && params.organisationId !== null) {
      httpParams = httpParams.set('organisationId', String(params.organisationId));
    }

    return this.http.get<number[]>(`${this.viewApiUrl}/unread-discussions`, { params: httpParams });
  }

  markRead(payload: MarkMessagesReadPayload): Observable<any> {
    return this.http.post(`${this.viewApiUrl}/mark-read`, payload);
  }

  refreshBadge(): void {
    this.refreshSubject.next();
  }
}
