import { Component, signal } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  imports: [RouterOutlet],
  selector: "app-root",
  template: "<router-outlet />",
  styles: [],
})
export class App {
  protected readonly title = signal("web");
}
