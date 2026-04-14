import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApi } from '../../../api/auth.api';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApi);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = false;
  error = '';
  showPassword = false;

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { firstName, lastName, email, password } = this.form.value;
    this.authApi.register(firstName!, lastName!, email!, password!).subscribe({
      next: ({ user, token }) => {
        this.authService.setAuth(user, token);
        this.router.navigate(['/subjects']);
      },
      error: () => {
        this.error = 'Registration failed. Please try again.';
        this.loading = false;
      },
    });
  }
}
