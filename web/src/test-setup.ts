// Import the Angular JIT compiler for tests.
// Angular packages are partially compiled and need the JIT compiler
// when running in a test environment without the Angular linker.
import "@angular/compiler";

import { TestBed } from "@angular/core/testing";
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from "@angular/platform-browser-dynamic/testing";

// Initialize the Angular test environment
TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
