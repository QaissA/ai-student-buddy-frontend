import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AdminApi, AdminUser } from '../../../api/admin.api';
import { AuthApi } from '../../../api/auth.api';
import { UserRole } from '../../../core/models/user.model';

const ROLES: UserRole[] = ['STUDENT', 'TEACHER', 'ADMIN'];
const ROLE_META: Record<UserRole, { label: string; cls: string }> = {
  STUDENT:     { label: 'Student',     cls: 'bg-anchor/10 text-anchor/60' },
  TEACHER:     { label: 'Teacher',     cls: 'bg-secondary/15 text-secondary' },
  ADMIN:       { label: 'Admin',       cls: 'bg-primary/15 text-primary' },
  SUPER_ADMIN: { label: 'Super Admin', cls: 'bg-purple-100 text-purple-600' },
};

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [RouterLink, NgClass, DatePipe, ReactiveFormsModule],
  templateUrl: './manage-users.component.html',
})
export class ManageUsersComponent implements OnInit {
  private adminApi = inject(AdminApi);
  private authApi  = inject(AuthApi);
  private fb       = inject(FormBuilder);

  users:    AdminUser[] = [];
  filtered: AdminUser[] = [];
  loading   = true;
  filterRole: UserRole | 'ALL' = 'ALL';

  showCreateForm = false;
  saving         = false;
  error          = '';

  readonly roles     = ROLES;
  readonly roleMeta  = ROLE_META;
  readonly roleFilters: Array<UserRole | 'ALL'> = ['ALL', ...ROLES];

  createForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.adminApi.getUsers().subscribe({
      next: u => { this.users = u; this.applyFilter(); this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  applyFilter() {
    this.filtered = this.filterRole === 'ALL'
      ? this.users
      : this.users.filter(u => u.role === this.filterRole);
  }

  setFilter(r: UserRole | 'ALL') { this.filterRole = r; this.applyFilter(); }

  countByRole(r: UserRole): number { return this.users.filter(u => u.role === r).length; }

  changeRole(user: AdminUser, role: UserRole) {
    if (user.role === role) return;
    this.adminApi.updateRole(user.id, role).subscribe({
      next: updated => {
        const idx = this.users.findIndex(u => u.id === updated.id);
        if (idx !== -1) this.users[idx] = { ...this.users[idx], role: updated.role };
        this.applyFilter();
      },
      error: () => {},
    });
  }

  deleteUser(user: AdminUser) {
    if (!confirm(`Delete ${user.firstName} ${user.lastName}? All their data will be lost.`)) return;
    this.adminApi.deleteUser(user.id).subscribe({
      next: () => { this.users = this.users.filter(u => u.id !== user.id); this.applyFilter(); },
      error: () => {},
    });
  }

  createTeacher() {
    if (this.createForm.invalid) return;
    this.saving = true;
    this.error  = '';
    const v = this.createForm.value;
    this.authApi.registerTeacher(v as any).subscribe({
      next: () => { this.saving = false; this.showCreateForm = false; this.load(); },
      error: e => { this.saving = false; this.error = e?.error?.message ?? 'Failed to create teacher'; },
    });
  }
}
