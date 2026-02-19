import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { Observable, Subscription, combineLatest, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged, tap } from 'rxjs/operators';
import { FirebaseService } from '@services/firebase.service';
import { SessionData, SessionViewerProps } from '@models/session.model';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-session-viewer',
  templateUrl: './session-viewer.component.html',
  styleUrls: ['./session-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionViewerComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() sessionId: string = environment.defaultSessionId;
  @Input() organizationId: string = environment.defaultOrganizationId;
  @Input() typewriterSpeed: number = environment.typewriterSpeed;

  @ViewChild('deltaContainer') deltaContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('accumulatedContainer') accumulatedContainer!: ElementRef<HTMLDivElement>;

  // Observables
  sessionData$!: Observable<SessionData | null>;
  typewriterText$!: Observable<string>;
  isTyping$ = new BehaviorSubject<boolean>(false);
  
  // State
  accumulatedText = '';
  loading = true;
  error: string | null = null;
  lastDeltaKey = 0;
  isUserScrolledUp = false;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    this.setupObservables();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewChecked(): void {
    this.handleAutoScroll();
  }

  private setupObservables(): void {
    // Observable para dados da sessão
    this.sessionData$ = this.firebaseService.listenToSession(this.sessionId).pipe(
      tap(sessionData => {
        if (sessionData) {
          this.loading = false;
          this.error = null;
          
          // Validação de organização
          if (!this.firebaseService.validateSessionOrganization(sessionData, this.organizationId)) {
            this.error = `Session does not belong to organization: ${this.organizationId}`;
            return;
          }

          // Acumular texto
          if (sessionData.lastDelta) {
            this.accumulateText(sessionData.lastDelta);
            this.lastDeltaKey++;
          }
        } else {
          this.error = `Session "${this.sessionId}" not found in Firestore`;
          this.loading = false;
        }
      }),
      distinctUntilChanged((prev, curr) => 
        prev?.lastDelta === curr?.lastDelta && 
        prev?.status === curr?.status
      )
    );

    // Observable para efeito typewriter
    this.typewriterText$ = this.sessionData$.pipe(
      map(sessionData => sessionData?.lastDelta || ''),
      distinctUntilChanged(),
      tap(lastDelta => {
        if (lastDelta) {
          this.isTyping$.next(true);
        }
      }),
      map(lastDelta => this.firebaseService.createTypewriterStream(lastDelta, this.typewriterSpeed)),
      // Aplanar o Observable interno
      map(typewriterStream => typewriterStream),
      tap({
        complete: () => this.isTyping$.next(false)
      })
    );
  }

  private setupSubscriptions(): void {
    // Subscription para typewriter
    const typewriterSub = this.typewriterText$.subscribe();
    this.subscriptions.push(typewriterSub);

    // Subscription para scroll automático
    const scrollSub = this.isTyping$.subscribe(isTyping => {
      if (isTyping && this.deltaContainer) {
        this.firebaseService.scrollToBottom(this.deltaContainer.nativeElement);
      }
    });
    this.subscriptions.push(scrollSub);
  }

  private accumulateText(newDelta: string): void {
    // Verifica se o final do texto acumulado já contém o delta para evitar duplicidade
    if (!this.accumulatedText.endsWith(newDelta)) {
      this.accumulatedText += newDelta;
    }
  }

  private handleAutoScroll(): void {
    if (this.accumulatedContainer && !this.isUserScrolledUp) {
      const container = this.accumulatedContainer.nativeElement;
      if (this.firebaseService.isAtBottom(container)) {
        this.firebaseService.scrollToBottom(container);
      }
    }
  }

  onScroll(event: Event): void {
    const container = event.target as HTMLDivElement;
    this.isUserScrolledUp = !this.firebaseService.isAtBottom(container);
  }

  getStatusColorClass(status: string): string {
    return this.firebaseService.getStatusColorClass(status);
  }

  formatTimestamp(timestamp: any): string {
    return this.firebaseService.formatTimestamp(timestamp);
  }

  // Template helpers
  get isLoading(): boolean {
    return this.loading;
  }

  get hasError(): boolean {
    return this.error !== null;
  }

  get errorMessage(): string {
    return this.error || '';
  }

  get sessionInfo(): { sessionId: string, organizationId: string } {
    return {
      sessionId: this.sessionId,
      organizationId: this.organizationId
    };
  }
}