import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, map } from 'rxjs';
import { environment } from '../../../environments/environment';

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
export class MessageViewService {
  private apiUrl = `${environment.urls.coreApi}/VuesMessage`;

  private readonly http = inject(HttpClient);

  // Subject = un signal pour diffusion global dans l'app
  private readonly refreshSubject = new Subject<void>();

  readonly refresh$ = this.refreshSubject.asObservable();

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
      .get<number | UnreadMessageCountResponse>(`${this.apiUrl}/unread-count`, {
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

    return this.http.get<number[]>(`${this.apiUrl}/unread-discussions`, { params: httpParams });
  }

  markRead(payload: MarkMessagesReadPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/mark-read`, payload);
  }

  refreshBadge(): void {
    this.refreshSubject.next();
  }

}
