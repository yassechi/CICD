import { OrganisationService } from '../../../core/services/organisation.service';
import { MessageService } from '../../../core/services/message.service';
import { AiService } from '../../../core/services/ai.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, inject, signal } from '@angular/core';
import { TextareaModule } from 'primeng/textarea';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

type QuestionnaireKey = 'usage' | 'distance' | 'terrain' | 'assistance' | 'budget' | 'cargo';

interface QuestionnaireOption {
  label: string;
  value: string;
  hint: string;
}

interface QuestionnaireQuestion {
  key: QuestionnaireKey;
  title: string;
  subtitle: string;
  options: QuestionnaireOption[];
}

const QUESTIONS: QuestionnaireQuestion[] = [
  {
    key: 'usage',
    title: 'Usage principal',
    subtitle: 'Comment allez-vous utiliser votre velo ? ',
    options: [
      { label: 'Domicile-travail', value: 'domicile-travail', hint: 'Trajets quotidiens' },
      { label: 'Loisir', value: 'loisir', hint: 'Balades et week-ends' },
      { label: 'Sport', value: 'sport', hint: 'Sorties sportives' },
      { label: 'Mixte', value: 'mixte', hint: 'Un peu de tout' },
    ],
  },
  {
    key: 'distance',
    title: 'Distance moyenne',
    subtitle: 'Distance par trajet ou sortie',
    options: [
      { label: '0-5 km', value: '0-5', hint: 'Tres court' },
      { label: '5-10 km', value: '5-10', hint: 'Court' },
      { label: '10-20 km', value: '10-20', hint: 'Moyen' },
      { label: '20+ km', value: '20+', hint: 'Long' },
    ],
  },
  {
    key: 'terrain',
    title: 'Type de terrain',
    subtitle: 'Profil de vos trajets',
    options: [
      { label: 'Plat', value: 'plat', hint: 'Routes plates' },
      { label: 'Mixte', value: 'mixte', hint: 'Un peu de relief' },
      { label: 'Montagne', value: 'montagne', hint: 'Forte pente' },
      { label: 'Ville', value: 'ville', hint: 'Circulation urbaine' },
    ],
  },
  {
    key: 'assistance',
    title: 'Assistance electrique',
    subtitle: 'Souhaitez-vous un moteur ?',
    options: [
      { label: 'Aucune', value: 'aucune', hint: 'Velo classique' },
      { label: 'Electrique', value: 'electrique', hint: 'Assistance E-bike' },
    ],
  },
  {
    key: 'budget',
    title: 'Budget',
    subtitle: 'Fourchette de prix',
    options: [
      { label: '500-1000 EUR', value: '500-1000', hint: 'Entree de gamme' },
      { label: '1000-2000 EUR', value: '1000-2000', hint: 'Milieu de gamme' },
      { label: '2000-3000 EUR', value: '2000-3000', hint: 'Premium' },
      { label: '3000+ EUR', value: '3000+', hint: 'Haut de gamme' },
    ],
  },
  {
    key: 'cargo',
    title: 'Besoin de charge',
    subtitle: 'Transport de sac ou de materiel',
    options: [
      { label: 'Aucun', value: 'aucun', hint: 'Rien a transporter' },
      { label: 'Leger', value: 'leger', hint: 'Sac ou ordinateur' },
      { label: 'Important', value: 'important', hint: 'Charge lourde' },
    ],
  },
];

const DEFAULT_ANSWERS: Record<QuestionnaireKey, string | null> = {
  usage: null,
  distance: null,
  terrain: null,
  assistance: null,
  budget: null,
  cargo: null,
};

@Component({
  selector: 'app-questionnaire-guide',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TextareaModule],
  templateUrl: './questionnaire-guide.html',
  styleUrls: ['./questionnaire-guide.scss'],
})
export class QuestionnaireGuideComponent {
  readonly questions = QUESTIONS;
  answers = signal<Record<QuestionnaireKey, string | null>>({ ...DEFAULT_ANSWERS });
  aiResponse = signal<string | null>(null);
  askLoading = signal(false);
  notes = '';

  firstName = '';
  lastName = '';
  organisationName = '';
  organisationLogoUrl: string | null = null;
  organisationId: number | null = null;

  private readonly router = inject(Router);
  private readonly params = inject(ActivatedRoute).snapshot.queryParams;
  private readonly organisationService = inject(OrganisationService);
  private readonly aiService = inject(AiService);
  private readonly messageService = inject(MessageService);

  constructor() {
    this.firstName = this.params['firstName'] || '';
    this.lastName = this.params['lastName'] || '';
    this.organisationName = this.params['organisationName'] || '';
    this.organisationId = this.params['organisationId'] ? Number(this.params['organisationId']) : null;
    if (this.organisationId) {
      this.organisationService.getActiveLogo(this.organisationId).subscribe({
        next: (logo) => {
          this.organisationLogoUrl = this.organisationService.buildLogoDataUrl(logo);
        },
        error: () => {},
      });
    }
  }

  selectAnswer(key: QuestionnaireKey, value: string): void {
    this.answers.update((current) => ({ ...current, [key]: value }));
  }

  isOptionActive(key: QuestionnaireKey, value: string): boolean {
    return this.answers()[key] === value;
  }

  answeredCount(): number {
    return Object.values(this.answers()).filter((value) => !!value).length;
  }

  progressPercent(): number {
    return Math.round((this.answeredCount() / this.questions.length) * 100);
  }

  isComplete(): boolean {
    return this.answeredCount() === this.questions.length;
  }

  reset(): void {
    this.answers.set({ ...DEFAULT_ANSWERS });
    this.notes = '';
    this.aiResponse.set(null);
  }

  goBack(): void {
    this.router.navigate(['/choix-parcours'], { queryParams: this.queryParams() });
  }

  askAi(): void {
    if (this.askLoading()) return;
    if (!this.isComplete()) {
      this.messageService.showWarn('Merci de repondre a toutes les questions.');
      return;
    }

    this.askLoading.set(true);
    const question = this.buildPrompt();

    this.aiService.askClient(question).subscribe({
      next: (response) => {
        const text = response?.response?.trim() || 'Aucune reponse disponible.';
        this.aiResponse.set(text);
      },
      error: () => {
        this.messageService.showError("Impossible d'obtenir une reponse IA.");
        this.askLoading.set(false);
      },
      complete: () => this.askLoading.set(false),
    });
  }

  private buildPrompt(): string {
    const answers = this.answers();
    const lines = [
      'Tu es un conseiller velo pour entreprise.',
      'Analyse le profil ci-dessous et recommande 3 velos maximum.',
      'Reponds en francais et reste concis.',
      '',
      'Profil:',
      `Organisation: ${this.organisationName || 'non precisee'}`,
      `Usage: ${answers.usage}`,
      `Distance: ${answers.distance}`,
      `Terrain: ${answers.terrain}`,
      `Assistance: ${answers.assistance}`,
      `Budget: ${answers.budget}`,
      `Charge: ${answers.cargo}`,
    ];

    const note = this.notes.trim();
    if (note) {
      lines.push(`Notes: ${note}`);
    }

    return lines.join('\n');
  }

  private queryParams(): Record<string, string> {
    const p: Record<string, string> = {};
    if (this.firstName) p['firstName'] = this.firstName;
    if (this.lastName) p['lastName'] = this.lastName;
    if (this.organisationName) p['organisationName'] = this.organisationName;
    if (this.organisationId) p['organisationId'] = String(this.organisationId);
    return p;
  }
}
