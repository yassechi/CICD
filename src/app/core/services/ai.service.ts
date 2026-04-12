import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AiAskResponse {
  response: string;
}

export interface AiUploadSingleResponse {
  message: string;
}

export interface AiUploadMultipleResponse {
  uploades: string[];
  erreurs: string[];
}

export interface AiPdfInfo {
  fileName: string;
  sizeBytes: number;
  lastModifiedUtc: string;
}

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.urls.coreApi}/Ai`;

  askAdmin(question: string): Observable<AiAskResponse> {
    return this.http.post<AiAskResponse>(`${this.apiUrl}/admin/ask`, { question });
  }

  askClient(question: string): Observable<AiAskResponse> {
    return this.http.post<AiAskResponse>(`${this.apiUrl}/client/ask`, { question });
  }

  uploadAdminSingle(file: File): Observable<AiUploadSingleResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<AiUploadSingleResponse>(`${this.apiUrl}/admin/upload`, formData);
  }

  uploadAdminMultiple(files: File[]): Observable<AiUploadMultipleResponse> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file, file.name));
    return this.http.post<AiUploadMultipleResponse>(
      `${this.apiUrl}/admin/upload/multiple`,
      formData,
    );
  }

  uploadClientSingle(file: File): Observable<AiUploadSingleResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<AiUploadSingleResponse>(`${this.apiUrl}/client/upload`, formData);
  }

  uploadClientMultiple(files: File[]): Observable<AiUploadMultipleResponse> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file, file.name));
    return this.http.post<AiUploadMultipleResponse>(
      `${this.apiUrl}/client/upload/multiple`,
      formData,
    );
  }

  getAdminFiles(): Observable<AiPdfInfo[]> {
    return this.http.get<AiPdfInfo[]>(`${this.apiUrl}/admin/files`);
  }

  getClientFiles(): Observable<AiPdfInfo[]> {
    return this.http.get<AiPdfInfo[]>(`${this.apiUrl}/client/files`);
  }

  deleteAdminFile(fileName: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/admin/files/${encodeURIComponent(fileName)}`,
    );
  }

  deleteClientFile(fileName: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/client/files/${encodeURIComponent(fileName)}`,
    );
  }
}
