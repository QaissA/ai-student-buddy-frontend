import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserRole } from '../core/models/user.model';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  _count?: { enrollments: number; quizAttempts: number };
}

export interface AdminStats {
  users: { total: number; students: number; teachers: number; admins: number };
  content: { subjects: number; books: number; lessons: number };
  activity: { quizAttempts: number; exerciseAttempts: number };
}

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin`;

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.base}/stats`);
  }

  getUsers(role?: string): Observable<AdminUser[]> {
    const params: Record<string, string> = role ? { role } : {};
    return this.http.get<AdminUser[]>(`${this.base}/users`, { params });
  }

  updateRole(userId: string, role: UserRole): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.base}/users/${userId}/role`, { role });
  }

  deleteUser(userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/users/${userId}`);
  }
}
