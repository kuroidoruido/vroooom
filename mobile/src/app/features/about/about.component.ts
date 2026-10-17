import { Component, inject, type OnInit, signal } from "@angular/core";
import { SafeAreaProvider, SafeAreaView, ScrollView, Text, View } from "@ng-native/components";
import { SHARED_VERSION } from "@vroooom/shared";
import Constants from "expo-constants";
import { ApiService, type ServerStatus } from "../../core/services/api.service";

@Component({
  selector: "app-about",
  imports: [SafeAreaProvider, SafeAreaView, ScrollView, Text, View],
  template: `
    <safe-area-provider>
      <safe-area-view class="screen">
        <scroll-view class="container">
          <view class="header">
            <text class="title">vroooom</text>
            <text class="tagline">Zero-knowledge vehicle tracking</text>
          </view>

          <view class="section">
            <text class="section-title">Versions</text>

            <view class="row">
              <text class="label">Mobile App</text>
              <text class="value">{{ mobileVersion }}</text>
            </view>

            <view class="row">
              <text class="label">Shared Library</text>
              <text class="value">{{ sharedVersion }}</text>
            </view>

            <view class="row">
              <text class="label">Server</text>
              @if (serverStatus() === 'loading') {
                <text class="value loading">Loading...</text>
              } @else if (serverStatus() === 'ok') {
                <text class="value ok">{{ serverVersion() }}</text>
              } @else {
                <text class="value error">Offline</text>
              }
            </view>

            @if (serverError()) {
              <view class="error-box">
                <text class="error-text">{{ serverError() }}</text>
                <text class="error-hint">URL: {{ apiUrl }}</text>
              </view>
            }
          </view>

          <view class="section">
            <text class="section-title">Debug</text>
            <text class="debug-text">API URL: {{ apiUrl }}</text>
            <text class="debug-text">Status: {{ serverStatus() }}</text>
          </view>

          <view class="footer">
            <text class="footer-text">Made with ❤️ for privacy</text>
          </view>
        </scroll-view>
      </safe-area-view>
    </safe-area-provider>
  `,
  styles: `
    :host {
      flex: 1;
    }
    .screen {
      flex: 1;
      background-color: #f5f5f7;
    }
    .container {
      flex: 1;
      padding: 24px;
    }
    .header {
      align-items: center;
      margin-bottom: 32px;
    }
    .title {
      font-size: 32px;
      font-weight: 700;
      color: #101014;
    }
    .tagline {
      font-size: 15px;
      color: #5f5f6b;
      margin-top: 4px;
    }
    .section {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #101014;
      margin-bottom: 12px;
    }
    .row {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }
    .label {
      font-size: 15px;
      color: #5f5f6b;
    }
    .value {
      font-size: 15px;
      font-weight: 600;
      color: #101014;
      font-family: monospace;
    }
    .value.loading {
      color: #8b8b96;
      font-weight: 400;
    }
    .value.ok {
      color: #2e7d32;
    }
    .value.error {
      color: #d32f2f;
    }
    .error-box {
      background-color: #ffebee;
      border-radius: 8px;
      padding: 12px;
      margin-top: 12px;
    }
    .error-text {
      font-size: 14px;
      color: #d32f2f;
      font-weight: 600;
    }
    .error-hint {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
    .debug-text {
      font-size: 12px;
      color: #666;
      font-family: monospace;
      margin-top: 4px;
    }
    .footer {
      align-items: center;
      margin-top: 32px;
      margin-bottom: 24px;
    }
    .footer-text {
      font-size: 14px;
      color: #8b8b96;
    }
    @media (prefers-color-scheme: dark) {
      .screen {
        background-color: #101014;
      }
      .title {
        color: #ffffff;
      }
      .tagline {
        color: #8b8b96;
      }
      .section {
        background-color: #1c1c1e;
      }
      .section-title {
        color: #ffffff;
      }
      .label {
        color: #8b8b96;
      }
      .value {
        color: #ffffff;
      }
      .debug-text {
        color: #8b8b96;
      }
    }
  `,
})
export class AboutComponent implements OnInit {
  private api = inject(ApiService);

  mobileVersion = Constants.expoConfig?.extra?.appVersion ?? "0.1.0";
  sharedVersion = SHARED_VERSION;
  apiUrl = Constants.expoConfig?.extra?.apiUrl ?? "unknown";

  serverStatus = signal<ServerStatus>("loading");
  serverVersion = signal("");
  serverError = signal<string | null>(null);

  ngOnInit(): void {
    this.api.getServerVersion().subscribe((result) => {
      this.serverStatus.set(result.status);
      this.serverVersion.set(result.version);
      this.serverError.set(result.error ?? null);
    });
  }
}
