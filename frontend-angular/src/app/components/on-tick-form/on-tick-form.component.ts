import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-on-tick-form',
  templateUrl: './on-tick-form.component.html',
  styleUrls: ['./on-tick-form.component.scss']
})
export class OnTickFormComponent {
  @Input() sessionId: string = '';
  @Input() organizationId: string = '';
  @Input() userId: string = '';
  
  @Output() sessionCreated = new EventEmitter<string>();
  @Output() errorOccurred = new EventEmitter<string>();

  form: FormGroup;
  isSubmitting = false;
  responseMessage = '';
  responseType: 'success' | 'error' | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      prompt: ['', [Validators.required, Validators.minLength(3)]],
      sessionId: [this.sessionId || 'test-session-' + Date.now(), Validators.required],
      organizationId: [this.organizationId || 'org-pablo-astrologia', Validators.required],
      userId: [this.userId || 'pablo-admin', Validators.required]
    });
  }

  ngOnChanges() {
    // Update form values when inputs change
    if (this.sessionId) {
      this.form.patchValue({ sessionId: this.sessionId });
    }
    if (this.organizationId) {
      this.form.patchValue({ organizationId: this.organizationId });
    }
    if (this.userId) {
      this.form.patchValue({ userId: this.userId });
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      return;
    }

    this.isSubmitting = true;
    this.responseMessage = '';
    this.responseType = null;

    const formData = this.form.value;
    
    // Cloud Function URL - should be in environment
    const cloudFunctionUrl = 'https://us-central1-hub-kraken-ia.cloudfunctions.net/onTick';

    this.http.post(cloudFunctionUrl, formData).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        this.responseType = 'success';
        this.responseMessage = `✅ Session "${formData.sessionId}" created successfully!`;
        
        // Emit the session ID for parent component
        this.sessionCreated.emit(formData.sessionId);
        
        // Reset form but keep IDs
        this.form.patchValue({
          prompt: '',
          sessionId: formData.sessionId,
          organizationId: formData.organizationId,
          userId: formData.userId
        });
      },
      error: (error) => {
        this.isSubmitting = false;
        this.responseType = 'error';
        
        if (error.status === 0) {
          this.responseMessage = '❌ Network error: Could not reach the server. Check your connection.';
        } else if (error.status === 404) {
          this.responseMessage = '❌ Cloud Function not found. Make sure it\'s deployed.';
        } else if (error.status === 500) {
          this.responseMessage = '❌ Server error: Something went wrong on the server.';
        } else {
          this.responseMessage = `❌ Error: ${error.message || 'Unknown error occurred'}`;
        }
        
        this.errorOccurred.emit(this.responseMessage);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get prompt() {
    return this.form.get('prompt');
  }

  get sessionIdControl() {
    return this.form.get('sessionId');
  }

  get organizationIdControl() {
    return this.form.get('organizationId');
  }

  get userIdControl() {
    return this.form.get('userId');
  }
}