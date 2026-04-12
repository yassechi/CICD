// src/app/core/i18n/i18n.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { FR } from '../i18n/fr';
import { NL } from '../i18n/nl';

export type Lang = 'fr' | 'nl';
type ContratsTranslations = typeof FR['contrats'] & Record<string, string>;
export type Translations = Omit<typeof FR, 'contrats'> & { contrats: ContratsTranslations };

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly STORAGE_KEY = 'mojo_lang';

  readonly lang = signal<Lang>(this.loadLang());
  readonly t = computed<Translations>(() => {
    return this.lang() === 'nl'
      ? (this.mergeTranslations(FR, NL) as Translations)
      : FR;
  });

  toggle(): void {
    const next: Lang = this.lang() === 'fr' ? 'nl' : 'fr';
    this.lang.set(next);
    localStorage.setItem(this.STORAGE_KEY, next);
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
  }

  get(path: string): string {
    const parts = path.split('.');
    let value: any = this.t();
    for (const key of parts) {
      if (value == null || typeof value !== 'object') return path;
      value = value[key];
    }
    return typeof value === 'string' ? value : path;
  }

  format(path: string, params: Record<string, string | number> = {}): string {
    const template = this.get(path);
    return template.replace(/\{(\w+)\}/g, (_, key: string) => {
      const val = params[key];
      return val === undefined || val === null ? '' : String(val);
    });
  }

  private loadLang(): Lang {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored === 'nl' ? 'nl' : 'fr';
  }

  private mergeTranslations(base: any, override: any): any {
    if (Array.isArray(base)) {
      return Array.isArray(override) ? override : base;
    }
    if (base && typeof base === 'object') {
      const result: Record<string, any> = { ...base };
      if (override && typeof override === 'object') {
        Object.keys(override).forEach((key) => {
          result[key] = this.mergeTranslations(base[key], override[key]);
        });
      }
      return result;
    }
    return override ?? base;
  }
}
