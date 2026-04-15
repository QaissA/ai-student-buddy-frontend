import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { users: number };
}

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  logoUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class OrganizationsApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/organizations`;

  getAll(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.base);
  }

  create(dto: CreateOrganizationDto): Observable<Organization> {
    return this.http.post<Organization>(this.base, dto);
  }

  update(id: string, dto: Partial<CreateOrganizationDto & { isActive: boolean }>): Observable<Organization> {
    return this.http.patch<Organization>(`${this.base}/${id}`, dto);
  }
}
