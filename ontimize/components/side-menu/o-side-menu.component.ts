import { Component, ViewChild, Injector, NgModule, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material';
import { CommonModule } from '@angular/common';

import { AuthGuardService } from '../../services';
import { OSharedModule } from '../../shared';

export const DEFAULT_INPUTS_O_SIDE_MENU = [
  // title [string]: menu title. Default: no value.
  'title'
];

/**
 * @deprecated This component will be removed in following versions
 */
@Component({
  selector: 'o-side-menu',
  templateUrl: './o-side-menu.component.html',
  styleUrls: ['./o-side-menu.component.scss'],
  inputs: DEFAULT_INPUTS_O_SIDE_MENU,
  encapsulation: ViewEncapsulation.None
})
export class OSideMenuComponent {

  public static DEFAULT_INPUTS_O_SIDE_MENU = DEFAULT_INPUTS_O_SIDE_MENU;

  protected authGuardService: AuthGuardService;

  protected _title: string;
  protected _opened: boolean;

  @ViewChild('sidenav')
  protected sidenav: MatSidenav;

  constructor(protected injector: Injector) {
    this.opened = false;
    this.authGuardService = this.injector.get(AuthGuardService);
  }

  public showSidenav() {
    this.opened = true;
    this.sidenav.open();
    this.sidenav.onClose.subscribe(res => {
      this.opened = false;
    });
  }

  getAuthGuardService(): AuthGuardService {
    return this.authGuardService;
  }

  get title(): string {
    return this._title;
  }

  set title(val: string) {
    this._title = val;
  }

  get opened(): boolean {
    return this._opened;
  }

  set opened(val: boolean) {
    this._opened = val;
  }
}

@NgModule({
  declarations: [OSideMenuComponent],
  imports: [OSharedModule, CommonModule],
  exports: [OSideMenuComponent]
})
export class OSideMenuModule {
}
