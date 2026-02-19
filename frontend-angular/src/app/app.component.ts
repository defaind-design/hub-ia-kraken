import { Component } from '@angular/core';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-root',
  template: `
    <main class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div class="container mx-auto px-4">
        <header class="mb-8 text-center">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Hub-IA-Kraken (Angular)
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Modular Cognitive Operating System - Blackboard Pattern
          </p>
          <div class="mt-2 text-sm text-gray-500">
            <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded">
              Angular 17+ • Bootstrap 5 • Firebase
            </span>
          </div>
        </header>

        <div class="space-y-8">
          <app-on-tick-form 
            [sessionId]="sessionId"
            [organizationId]="organizationId"
            [userId]="userId">
          </app-on-tick-form>
          
          <app-session-viewer 
            [sessionId]="sessionId"
            [organizationId]="organizationId">
          </app-session-viewer>
        </div>

        <footer class="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 text-sm">
          <p>Kraken Cognitive OS • Built with Angular • Version 1.0.0</p>
          <p class="mt-1">Session: {{ sessionId }} • Organization: {{ organizationId }}</p>
        </footer>
      </div>
    </main>
  `,
  styles: []
})
export class AppComponent {
  // Em produção, estes valores viriam da autenticação
  sessionId = environment.defaultSessionId;
  organizationId = environment.defaultOrganizationId;
  userId = environment.defaultUserId;
}