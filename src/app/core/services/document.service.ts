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
  //data =>  l’URL contient directement le fichier
  //application/pdf => type PDF
  //base64 => encodé en base64
  //${doc.fichier} => contenu du PDF encodé en base64
  downloadDocument(doc: Document): void {
    const link = document.createElement('a');
    link.href = `data:application/pdf; base64, ${doc.fichier}`;
    link.download = doc.nomFichier;
    link.click();
  }
}
