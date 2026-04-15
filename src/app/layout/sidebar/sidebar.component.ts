import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  auth = inject(AuthService);
  translate = inject(TranslateService);
  router = inject(Router);

  navItems: NavItem[] = [
    { label: 'nav.home',         icon: 'home',               route: '/dashboard' },
    { label: 'nav.subjects',     icon: 'menu_book',          route: '/subjects' },
    { label: 'nav.ai_tutor',     icon: 'smart_toy',          route: '/ai-tutor' },
    { label: 'nav.exercises',    icon: 'sports_esports',     route: '/exercises' },
    { label: 'nav.pronunciation',icon: 'record_voice_over',  route: '/pronunciation' },
    { label: 'nav.leaderboard',  icon: 'emoji_events',       route: '/leaderboard' },
  ];

  adminItems: NavItem[] = [
    { label: 'nav.admin', icon: 'admin_panel_settings', route: '/admin' },
  ];

  superAdminItems: NavItem[] = [
    { label: 'Organizations', icon: 'domain', route: '/organizations' },
  ];

  get isAdmin(): boolean      { return this.auth.hasRole(['ADMIN', 'TEACHER']); }
  get isSuperAdmin(): boolean { return this.auth.hasRole(['SUPER_ADMIN']); }
  get user() { return this.auth.currentUser; }

  logout() { this.auth.logout(); this.router.navigate(['/login']); }

  setLang(lang: string) { this.translate.use(lang); }
}
