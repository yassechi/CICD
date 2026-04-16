import { OrganisationService } from '../../../core/services/organisation.service';
import { MessageService } from '../../../core/services/message.service';
import { AiService } from '../../../core/services/ai.service';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/I18n.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, computed, inject, signal } from '@angular/core';
import { TextareaModule } from 'primeng/textarea';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { UserRole } from '../../../core/models/user.model';

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
  readonly questions = computed<QuestionnaireQuestion[]>(
    () => this.i18n.t().questionnaire.questions as QuestionnaireQuestion[],
  );
  answers = signal<Record<QuestionnaireKey, string | null>>({ ...DEFAULT_ANSWERS });
  aiResponse = signal<string | null>(null);
  askLoading = signal(false);
  notes = '';
  fromSidebar = false;

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
  private readonly authService = inject(AuthService);
  readonly i18n = inject(I18nService);

  constructor() {
    this.fromSidebar = this.params['entry'] === 'sidebar';
    this.firstName = this.params['firstName'] || '';
    this.lastName = this.params['lastName'] || '';
    this.organisationName = this.params['organisationName'] || '';
    this.organisationId = this.params['organisationId']
      ? Number(this.params['organisationId'])
      : null;
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
    const total = this.questions().length;
    if (!total) return 0;
    return Math.round((this.answeredCount() / total) * 100);
  }

  isComplete(): boolean {
    return this.answeredCount() === this.questions().length;
  }

  reset(): void {
    this.answers.set({ ...DEFAULT_ANSWERS });
    this.notes = '';
    this.aiResponse.set(null);
  }

  goBack(): void {
    if (this.fromSidebar) {
      const user = this.authService.getCurrentUser();
      switch (user?.role) {
        case UserRole.Admin:
          this.router.navigate(['/admin/dashboard']);
          return;
        case UserRole.Manager:
          this.router.navigate(['/manager/dashboard']);
          return;
        case UserRole.User:
          this.router.navigate(['/user/dashboard']);
          return;
        default:
          break;
      }
    }
    this.router.navigate(['/choix-parcours'], { queryParams: this.queryParams() });
  }

  askAi(): void {
    if (this.askLoading()) return;
    if (!this.isComplete()) {
      this.messageService.showWarn(this.i18n.get('questionnaire.completeWarning'));
      return;
    }

    this.askLoading.set(true);
    const question = this.buildPrompt();

    this.aiService.askClient(question).subscribe({
      next: (response) => {
        const text = response?.response?.trim() || this.i18n.get('questionnaire.noResponse');
        this.aiResponse.set(text);
      },
      error: () => {
        this.messageService.showError(this.i18n.get('questionnaire.aiError'));
        this.askLoading.set(false);
      },
      complete: () => this.askLoading.set(false),
    });
  }

  private buildPrompt(): string {
    const t = this.i18n.t().questionnaire;
    const answers = this.answers();
    const lines = [
      t.promptRole,
      t.promptTask,
      t.promptLanguage,
      '',
      t.promptProfile,
      `${t.promptOrganisation}: ${this.organisationName || t.promptNotSpecified}`,
      `${t.promptUsage}: ${answers.usage}`,
      `${t.promptDistance}: ${answers.distance}`,
      `${t.promptTerrain}: ${answers.terrain}`,
      `${t.promptAssistance}: ${answers.assistance}`,
      `${t.promptBudget}: ${answers.budget}`,
      `${t.promptCargo}: ${answers.cargo}`,
    ];

    const note = this.notes.trim();
    if (note) {
      lines.push(`${t.promptNotes}: ${note}`);
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
