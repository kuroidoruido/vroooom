import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ServerInfo {
  status: string;
  version: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /**
   * Get server health and version info
   */
  getServerInfo(): Observable<ServerInfo> {
    return this.http.get<ServerInfo>(`${this.baseUrl}/health`);
  }

  /**
   * Get server version only (fallback to 'unknown' on error)
   */
  getServerVersion(): Observable<string> {
    return this.getServerInfo().pipe(
      map((info) => info.version),
      catchError(() => of('unknown'))
    );
  }
}
