import { render, screen } from "@ng-native/testing";
import { expect, test } from "vitest";
import { App } from "./app.ts";

test("renders app name and tagline", async () => {
  await render(App);

  expect(screen.getByText("vroooom")).toBeTruthy();
  expect(screen.getByText("Zero-knowledge vehicle tracking")).toBeTruthy();
});

test("displays mobile app version", async () => {
  await render(App);

  expect(screen.getByText("Mobile App")).toBeTruthy();
  // Both Mobile App and Shared Library show "0.1.0"
  expect(screen.getAllByText("0.1.0").length).toBeGreaterThanOrEqual(1);
});

test("displays shared library version", async () => {
  await render(App);

  expect(screen.getByText("Shared Library")).toBeTruthy();
});

test("displays API URL in debug section", async () => {
  await render(App);

  expect(screen.getByText("API URL: http://localhost:8080")).toBeTruthy();
});

test("displays footer text", async () => {
  await render(App);

  expect(screen.getByText("Made with ❤️ for privacy")).toBeTruthy();
});
