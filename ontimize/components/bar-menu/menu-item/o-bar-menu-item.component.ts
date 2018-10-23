import { Component, Inject, Injector, forwardRef, ElementRef, NgModule, ViewEncapsulation } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Util } from '../../../utils';
import { OSharedModule } from '../../../shared';
import { OBarMenuComponent } from '../o-bar-menu.component';
import { OBaseMenuItemClass } from '../o-base-menu-item.class';

export const DEFAULT_INPUTS_O_BAR_MENU_ITEM = [
  ...OBaseMenuItemClass.DEFAULT_INPUTS_O_BASE_MENU_ITEM,
  // route [string]: name of the state to navigate. Default: no value.
  'route',

  // action [function]: function to execute. Default: no value.
  'action'
];

@Component({
  moduleId: module.id,
  selector: 'o-bar-menu-item',
  templateUrl: './o-bar-menu-item.component.html',
  styleUrls: ['./o-bar-menu-item.component.scss'],
  inputs: DEFAULT_INPUTS_O_BAR_MENU_ITEM,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.o-bar-menu-item]': 'true',
    '[attr.disabled]': 'disabled'
  }
})
export class OBarMenuItemComponent extends OBaseMenuItemClass {

  public static DEFAULT_INPUTS_O_BAR_MENU_ITEM = DEFAULT_INPUTS_O_BAR_MENU_ITEM;
  protected router: Router;
  route: string;
  action: Function;

  constructor(
    @Inject(forwardRef(() => OBarMenuComponent)) protected menu: OBarMenuComponent,
    protected elRef: ElementRef,
    protected injector: Injector
  ) {
    super(menu, elRef, injector);
    this.router = this.injector.get(Router);
  }

  ngOnInit() {
    // if (typeof (this.route) === 'string') {
    //   // TODO, permisos por route?
    // } else {
    //   this.restricted = false;
    // }
    super.ngOnInit();
  }

  collapseMenu(evt: Event) {
    if (this.menu) {
      this.menu.collapseAll();
    }
  }

  onClick() {
    if (this.disabled) {
      return;
    }
    if (Util.isDefined(this.route)) {
      this.router.navigate([this.route]);
    } else if (Util.isDefined(this.action)) {
      this.action();
    }
  }
}

@NgModule({
  declarations: [OBarMenuItemComponent],
  imports: [OSharedModule, CommonModule, RouterModule],
  exports: [OBarMenuItemComponent]
})
export class OBarMenuItemModule {
}
