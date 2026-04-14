import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';

const STORAGE_KEY = 'auth-storage';

interface AuthState {
  user: User | null;
  token: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private state$ = new BehaviorSubject<AuthState>(this.loadFromStorage());

  get currentUser$(): Observable<User | null> {
    return new Observable(obs => {
      this.state$.subscribe(s => obs.next(s.user));
    });
  }

  get currentUser(): User | null {
    return this.state$.value.user;
  }

  get token(): string | null {
    return this.state$.value.token;
  }

  isAuthenticated(): boolean {
    return !!this.state$.value.token;
  }

  hasRole(roles: string[]): boolean {
    const user = this.state$.value.user;
    return !!user && roles.includes(user.role);
  }

  setAuth(user: User, token: string): void {
    const next: AuthState = { user, token };
    this.state$.next(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  logout(): void {
    this.state$.next({ user: null, token: null });
    localStorage.removeItem(STORAGE_KEY);
  }

  private loadFromStorage(): AuthState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as AuthState;
    } catch {}
    return { user: null, token: null };
  }
}
