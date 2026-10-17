import { Component } from "@angular/core";
import { AboutComponent } from "./features/about/about.component";

@Component({
  selector: "app-root",
  imports: [AboutComponent],
  template: `<app-about />`,
})
export class App {}
