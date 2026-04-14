import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App implements OnInit {
  private translate = inject(TranslateService);

  ngOnInit() {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }
}
