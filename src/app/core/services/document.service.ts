import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Document {
  id: number;
  contratId: number;
  fichier: string; // Base64 string
  nomFichier: string;
  typeFichier: string;
  isActif: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private apiUrl = `${environment.urls.coreApi}/Document`;

  private readonly http = inject(HttpClient);

  getAll(): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.apiUrl}/get-all`);
  }

  getOne(id: number): Observable<Document> {
    return this.http.get<Document>(`${this.apiUrl}/get-one/${id}`);
  }

  getByContrat(contratId: number): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.apiUrl}/get-by-contrat/${contratId}`);
  }

  create(document: Document): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, document);
  }

  update(document: Document): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, document);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }

  /////////////////////////////////////////////////////////
  downloadDocument(doc: Document): void {
    // Convertir base64 en Blob
    const byteCharacters = atob(doc.fichier);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.nomFichier;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
