import { Component, DestroyRef, ElementRef, Input, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, filter, interval, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { DemandeMessage, DemandeService } from '../../../core/services/demande.service';
import { AuthService } from '../../../core/services/auth.service';
import { MessageApiService } from '../../../core/services/message.service';
import { MessageViewService } from '../../../core/services/message-view.service';

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
  private readonly messageViewService = inject(MessageViewService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (this.demandeId) {
      this.demandeService
        .getDetail(this.demandeId)
        .subscribe((demande) => this.chargerMessages(demande));
    }

    interval(4000)
      .pipe(
        filter(() => !!this.demandeId),
        switchMap(() =>
          this.demandeService.getDetail(this.demandeId!).pipe(catchError(() => EMPTY)),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
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
    const currentUser = this.authService.getCurrentUser();
    return message.userId === currentUser?.id;
  }

  private markDiscussionReadIfNeeded(messages: DemandeMessage[]): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id || !this.discussionId) return;

    const relevant = messages.filter((message) => message.userId !== currentUser.id);
    if (relevant.length === 0) return;

    const newestId = Math.max(...relevant.map((message) => message.id));
    if (newestId <= this.lastMarkedMessageId) return;

    this.messageViewService
      .markRead({
        userId: currentUser.id,
        discussionId: this.discussionId,
      })
      .subscribe({
        next: () => {
          this.lastMarkedMessageId = newestId;
          this.messageViewService.refreshBadge();
        },
      });
  }
}
