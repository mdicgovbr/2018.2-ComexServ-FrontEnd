import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SearchPageComponent } from './pages/searchpage/searchpage.component';
import { AppComponent } from './app.component';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { ResultPageComponent } from './pages/resultpage/resultpage.component';

export const router: Routes = [
  { path: '', redirectTo:'homepage', pathMatch: 'full' },
  { path: 'homepage', component: HomepageComponent },
  { path: 'search', component: SearchPageComponent },
  { path: 'resultpage', component: ResultPageComponent }
];

export const routes: ModuleWithProviders = RouterModule.forRoot(router);
