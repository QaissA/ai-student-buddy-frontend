import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse } from '../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  login(email: string, password: string, schoolSlug: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, { email, password, schoolSlug });
  }

  register(firstName: string, lastName: string, email: string, password: string, schoolSlug: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/register`, { firstName, lastName, email, password, schoolSlug });
  }

  registerTeacher(body: { firstName: string; lastName: string; email: string; password: string }): Observable<{ user: any }> {
    return this.http.post<{ user: any }>(`${this.base}/auth/register-teacher`, body);
  }
}
