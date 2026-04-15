import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApi } from '../../../api/auth.api';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApi);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    schoolSlug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    email:      ['', [Validators.required, Validators.email]],
    password:   ['', Validators.required],
  });

  loading = false;
  error = '';
  showPassword = false;

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { schoolSlug, email, password } = this.form.value;
    this.authApi.login(email!, password!, schoolSlug!).subscribe({
      next: ({ user, token }) => {
        this.authService.setAuth(user, token);
        this.router.navigate([user.role === 'SUPER_ADMIN' ? '/organizations' : '/dashboard']);
      },
      error: (err) => {
        if (err.status === 404) {
          this.error = 'School not found. Check your school code.';
        } else {
          this.error = 'Invalid email or password.';
        }
        this.loading = false;
      },
    });
  }
}
