import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SHARED_VERSION } from '@vroooom/shared';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-about',
  imports: [RouterLink],
  template: `
    <div class="about-container">
      <header class="header">
        <h1>vroooom</h1>
        <p class="tagline">Zero-knowledge vehicle tracking</p>
      </header>

      <section class="versions">
        <h2>Versions</h2>
        <dl class="version-list">
          <dt>Web App</dt>
          <dd><code>{{ webVersion }}</code></dd>

          <dt>Shared Library</dt>
          <dd><code>{{ sharedVersion }}</code></dd>

          <dt>Server</dt>
          <dd>
            @if (serverVersion() === 'loading') {
              <span class="loading">Loading...</span>
            } @else if (serverVersion() === 'unknown') {
              <span class="error">Offline / Unreachable</span>
            } @else {
              <code>{{ serverVersion() }}</code>
            }
          </dd>
        </dl>
      </section>

      <section class="links">
        <h2>Links</h2>
        <ul>
          <li><a href="https://github.com/kuroidoruido/vroooom" target="_blank" rel="noopener">Source Code (GitHub)</a></li>
          <li><a href="https://github.com/kuroidoruido/vroooom/blob/main/LICENSE" target="_blank" rel="noopener">License (GPL v3)</a></li>
          <li><a routerLink="/">← Back to App</a></li>
        </ul>
      </section>

      <footer class="footer">
        <p>Made with ❤️ for privacy</p>
      </footer>
    </div>
  `,
  styles: `
    .about-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 24px;
    }

    .header {
      text-align: center;
      margin-bottom: 32px;

      h1 {
        font-size: 32px;
        margin: 0 0 8px;
      }

      .tagline {
        color: var(--color-text-secondary, #666);
        margin: 0;
      }
    }

    .versions {
      background: var(--color-surface, #f5f5f5);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;

      h2 {
        font-size: 18px;
        margin: 0 0 16px;
      }
    }

    .version-list {
      margin: 0;

      dt {
        font-weight: 600;
        margin-top: 12px;

        &:first-child {
          margin-top: 0;
        }
      }

      dd {
        margin: 4px 0 0;

        code {
          background: var(--color-code-bg, #e0e0e0);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
        }

        .loading {
          color: var(--color-text-secondary, #666);
          font-style: italic;
        }

        .error {
          color: var(--color-error, #d32f2f);
        }
      }
    }

    .links {
      margin-bottom: 24px;

      h2 {
        font-size: 18px;
        margin: 0 0 12px;
      }

      ul {
        margin: 0;
        padding-left: 20px;
      }

      a {
        color: var(--color-primary, #1976d2);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .footer {
      text-align: center;
      color: var(--color-text-secondary, #666);
      font-size: 14px;
    }
  `
})
export class AboutComponent implements OnInit {
  private api = inject(ApiService);

  webVersion = environment.appVersion;
  sharedVersion = SHARED_VERSION;
  serverVersion = signal('loading');

  ngOnInit(): void {
    this.api.getServerVersion().subscribe((version) => {
      this.serverVersion.set(version);
    });
  }
}
