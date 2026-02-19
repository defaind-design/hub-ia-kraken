import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, from, of } from 'rxjs';
import { map, catchError, takeUntil } from 'rxjs/operators';
import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getFirestore, Firestore, doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { environment } from '@environments/environment';
import { SessionData } from '@models/session.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService implements OnDestroy {
  private app: FirebaseApp;
  private db: Firestore;
  private auth: Auth;
  private destroy$ = new Subject<void>();

  constructor() {
    // Inicializar Firebase apenas uma vez (similar ao React)
    if (getApps().length === 0) {
      this.app = initializeApp(environment.firebase);
      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);
    } else {
      this.app = getApps()[0];
      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get Firestore database instance
   */
  getDatabase(): Firestore {
    return this.db;
  }

  /**
   * Get Auth instance
   */
  getAuth(): Auth {
    return this.auth;
  }

  /**
   * Listen to session changes as Observable
   * Converts Firestore onSnapshot to RxJS Observable
   */
  listenToSession(sessionId: string): Observable<SessionData | null> {
    return new Observable<SessionData | null>(observer => {
      const sessionRef = doc(this.db, 'sessions', sessionId);
      
      const unsubscribe = onSnapshot(
        sessionRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as SessionData;
            observer.next(data);
          } else {
            observer.next(null);
          }
        },
        (error) => {
          observer.error(error);
        }
      );

      // Cleanup on unsubscribe
      return () => unsubscribe();
    }).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Firestore error:', error);
        return of(null);
      })
    );
  }

  /**
   * Validate session belongs to organization (multi-tenancy)
   */
  validateSessionOrganization(sessionData: SessionData, organizationId: string): boolean {
    return sessionData.organizationId === organizationId;
  }

  /**
   * Create typewriter effect Observable
   * Simulates typing character by character
   */
  createTypewriterStream(text: string, speed: number = environment.typewriterSpeed): Observable<string> {
    if (!text) {
      return of('');
    }

    return new Observable<string>(observer => {
      let currentIndex = 0;
      
      const typeNextChar = () => {
        if (currentIndex < text.length) {
          observer.next(text.substring(0, currentIndex + 1));
          currentIndex++;
          setTimeout(typeNextChar, speed);
        } else {
          observer.complete();
        }
      };

      // Small delay for better UX
      setTimeout(() => {
        typeNextChar();
      }, 100);

      // Cleanup
      return () => {
        // Clear any pending timeouts if observable is unsubscribed
      };
    }).pipe(
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get session document reference
   */
  getSessionRef(sessionId: string) {
    return doc(this.db, 'sessions', sessionId);
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: Timestamp): string {
    return timestamp.toDate().toLocaleTimeString();
  }

  /**
   * Get status color class based on session status
   */
  getStatusColorClass(status: string): string {
    switch (status) {
      case 'active':
        return 'kraken-status-active';
      case 'completed':
        return 'kraken-status-completed';
      case 'error':
        return 'kraken-status-error';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  /**
   * Check if user is at bottom of scroll container
   */
  isAtBottom(container: HTMLElement, threshold: number = environment.autoScrollThreshold): boolean {
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < threshold;
  }

  /**
   * Smooth scroll to bottom of container
   */
  scrollToBottom(container: HTMLElement): void {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  }
}