import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

export interface VeloAcf {
  prix?: number;
  prix_par_mois?: number;
  type?: string;
  assistance?: string;
  genre?: string;
}

export interface VeloItem {
  id: number;
  title: { rendered: string };
  velos_brand?: number[];
  acf?: VeloAcf;
  yoast_head_json: any;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url?: string;
      media_details?: { sizes?: Record<string, { source_url?: string }> };
    }>;
  };
}

export interface VeloBrand {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class VeloCatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.urls.cmsApi;

  private mapVelo(item: VeloItemApi): VeloItem {
    return {
      ...item,
      velos_brand: item.bikes_brand,
    };
  }

  getVelos(): Observable<VeloItem[]> {
    const params = new HttpParams().set('_embed', '1');
    return this.http
      .get<VeloItemApi[]>(`${this.baseUrl}/bikes`, { params })
      .pipe(map((items) => items.map((item) => this.mapVelo(item))));
  }

  getVeloById(id: number): Observable<VeloItem> {
    const params = new HttpParams().set('_embed', '1');
    return this.http
      .get<VeloItemApi>(`${this.baseUrl}/bikes/${id}`, { params })
      .pipe(map((item) => this.mapVelo(item)));
  }

  getBrands(): Observable<VeloBrand[]> {
    return this.http.get<VeloBrand[]>(`${this.baseUrl}/bikes_brand`);
  }
}

type VeloItemApi = Omit<VeloItem, 'velos_brand'> & { bikes_brand?: number[] };
