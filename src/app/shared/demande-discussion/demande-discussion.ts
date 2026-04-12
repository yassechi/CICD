import { Component, ElementRef, Input, OnInit, ViewChild, inject } from '@angular/core';
import { DemandeMessage, DemandeService } from '../../core/services/demande.service';
import { MessageApiService } from '../../core/services/message-api.service';
import { I18nService } from '../../core/services/I18n.service';
import { filter, interval, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TextareaModule } from 'primeng/textarea';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-demande-discussion',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TextareaModule],
  templateUrl: './demande-discussion.html',
  styleUrls: ['./demande-discussion.scss'],
})
export class DemandeDiscussionComponent implements OnInit {
  @Input() demandeId: number | null = null;
  @ViewChild('messageList') private messageList?: ElementRef<HTMLDivElement>;

  messages: DemandeMessage[] = [];
  messageText = '';

  private discussionId: number | null = null;
  private lastMarkedMessageId = 0;

  private readonly demandeService = inject(DemandeService);
  private readonly authService = inject(AuthService);
  private readonly messageApiService = inject(MessageApiService);
  readonly i18n = inject(I18nService);

  ngOnInit(): void {
    if (this.demandeId)
      this.demandeService
        .getDetail(this.demandeId)
        .subscribe((demande) => this.chargerMessages(demande));
  }

  private chargerMessages(demande: any): void {
    this.discussionId = demande.discussionId ?? null;
    this.messages = demande.messages ?? [];
    this.markDiscussionReadIfNeeded(this.messages);
    setTimeout(() => {
      const el = this.messageList?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  sendMessage(): void {
    const content = this.messageText.trim();
    if (!content || !this.discussionId) return;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) return;

    const now = new Date(Date.now() - 1000).toISOString();

    this.messageApiService
      .create({
        id: 0,
        createdDate: now,
        modifiedDate: now,
        createdBy: currentUser.id,
        modifiedBy: currentUser.id,
        isActif: true,
        contenu: content,
        dateEnvoi: now,
        userId: currentUser.id,
        discussionId: this.discussionId,
      })
      .subscribe(() => {
        this.messageText = '';
        this.demandeService
          .getDetail(this.demandeId!)
          .subscribe((demande) => this.chargerMessages(demande));
      });
  }

  isOwnMessage(message: DemandeMessage): boolean {
    return message.userId === this.authService.getCurrentUser()?.id;
  }

  private markDiscussionReadIfNeeded(messages: DemandeMessage[]): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id || !this.discussionId) return;

    const relevant = messages.filter((message) => message.userId !== currentUser.id);
    if (relevant.length === 0) return;

    const newestId = Math.max(...relevant.map((message) => message.id));
    if (newestId <= this.lastMarkedMessageId) return;

    this.messageApiService
      .markRead({ userId: currentUser.id, discussionId: this.discussionId })
      .subscribe(() => {
        this.lastMarkedMessageId = newestId;
        this.messageApiService.refreshBadge();
      });
  }
}
