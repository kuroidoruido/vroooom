import { Injectable } from '@angular/core';
import { Observable, map, catchError, of, from, switchMap, tap } from 'rxjs';
import Constants from 'expo-constants';

export interface ServerInfo {
  status: string;
  version: string;
}

export type ServerStatus = 'loading' | 'ok' | 'offline' | 'error';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:8080/api';
    console.log('[ApiService] Base URL:', this.baseUrl);
  }

  /**
   * Get server health and version info
   */
  getServerInfo(): Observable<ServerInfo> {
    const url = `${this.baseUrl}/health`;
    console.log('[ApiService] Fetching:', url);

    return from(fetch(url)).pipe(
      tap((res) => console.log('[ApiService] Response status:', res.status)),
      switchMap((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return from(res.json() as Promise<ServerInfo>);
      }),
      tap((info) => console.log('[ApiService] Server info:', info)),
      catchError((err) => {
        console.error('[ApiService] Error:', err.message, err);
        throw err;
      })
    );
  }

  /**
   * Get server version with detailed status
   */
  getServerVersion(): Observable<{ status: ServerStatus; version: string; error?: string }> {
    return this.getServerInfo().pipe(
      map((info) => ({ status: 'ok' as const, version: info.version })),
      catchError((err) =>
        of({
          status: 'error' as const,
          version: 'error',
          error: err.message || 'Unknown error',
        })
      )
    );
  }
}
