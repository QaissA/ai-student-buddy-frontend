import { Component, inject, OnInit } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { OrganizationsApi, Organization } from '../../../api/organizations.api';

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [NgClass, DatePipe, ReactiveFormsModule],
  templateUrl: './organizations.component.html',
})
export class OrganizationsComponent implements OnInit {
  private api = inject(OrganizationsApi);
  private fb  = inject(FormBuilder);

  orgs: Organization[] = [];
  loading  = true;
  showForm = false;
  saving   = false;
  editId: string | null = null;
  error = '';

  form = this.fb.group({
    name:    ['', Validators.required],
    slug:    ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    logoUrl: [''],
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getAll().subscribe({
      next:  o => { this.orgs = o; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openCreate() {
    this.editId = null;
    this.form.reset({ name: '', slug: '', logoUrl: '' });
    this.error = '';
    this.showForm = true;
  }

  openEdit(o: Organization) {
    this.editId = o.id;
    this.form.reset({ name: o.name, slug: o.slug, logoUrl: o.logoUrl ?? '' });
    this.error = '';
    this.showForm = true;
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    this.error  = '';
    const { name, slug, logoUrl } = this.form.value;
    const body = { name: name!, slug: slug!, ...(logoUrl ? { logoUrl } : {}) };

    const req = this.editId
      ? this.api.update(this.editId, body)
      : this.api.create(body);

    req.subscribe({
      next: () => { this.saving = false; this.showForm = false; this.load(); },
      error: (e) => { this.saving = false; this.error = e?.error?.message ?? 'Failed to save'; },
    });
  }

  toggleActive(o: Organization) {
    this.api.update(o.id, { isActive: !o.isActive }).subscribe({
      next: updated => {
        const idx = this.orgs.findIndex(x => x.id === updated.id);
        if (idx !== -1) this.orgs[idx] = updated;
      },
    });
  }

  get slugControl() { return this.form.get('slug'); }
  get activeCount() { return this.orgs.filter(o => o.isActive).length; }
  get totalUsers()  { return this.orgs.reduce((sum, o) => sum + (o._count?.users ?? 0), 0); }
}
