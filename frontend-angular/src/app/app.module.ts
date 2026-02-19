import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { SessionViewerComponent } from './components/session-viewer/session-viewer.component';
import { OnTickFormComponent } from './components/on-tick-form/on-tick-form.component';

@NgModule({
  declarations: [
    AppComponent,
    SessionViewerComponent,
    OnTickFormComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }