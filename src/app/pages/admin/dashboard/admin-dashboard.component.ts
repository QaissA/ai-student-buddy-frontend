import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { AdminApi, AdminStats } from '../../../api/admin.api';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, NgClass],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private adminApi = inject(AdminApi);
  auth = inject(AuthService);

  stats: AdminStats | null = null;

  cards = [
    { label: 'Subjects',  icon: 'folder',      route: '/admin/subjects', color: 'bg-primary/10',    iconColor: 'text-primary' },
    { label: 'Books',     icon: 'auto_stories', route: '/admin/books',    color: 'bg-secondary/10',  iconColor: 'text-secondary' },
    { label: 'Lessons',   icon: 'menu_book',    route: '/admin/lessons',  color: 'bg-ai-purple/10',  iconColor: 'text-ai-purple' },
    { label: 'Quizzes',   icon: 'quiz',         route: '/admin/quizzes',  color: 'bg-achievement/20',iconColor: 'text-anchor' },
    { label: 'Users',     icon: 'group',        route: '/admin/users',    color: 'bg-primary/10',    iconColor: 'text-primary', adminOnly: true },
  ];

  get visibleCards() {
    return this.cards.filter(c => !c.adminOnly || this.auth.hasRole(['ADMIN']));
  }

  ngOnInit() {
    if (this.auth.hasRole(['ADMIN'])) {
      this.adminApi.getStats().subscribe({ next: s => this.stats = s, error: () => {} });
    }
  }
}
