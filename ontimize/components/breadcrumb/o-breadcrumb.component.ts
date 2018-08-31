import { AfterViewInit, Component, Injector, NgModule, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRouteSnapshot, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { OSharedModule } from '../../shared';
import { NavigationService, OFormComponent, ONavigationItem, Util } from '../../../index';

export const DEFAULT_INPUTS_O_BREADCRUMB = [
  // form [OFormComponent]: Ontimize Web Form reference.
  '_formRef: form',

  // label-columns [string]: Form values shown on each element. Separated by ';'. Default: no value.
  'labelColumns: label-columns',

  // separator [string]: Form values shown on each element. Separated by ';'. Default: no value.
  'separator'
];

@Component({
  selector: 'o-breadcrumb',
  templateUrl: 'o-breadcrumb.component.html',
  styleUrls: ['o-breadcrumb.component.scss'],
  inputs: DEFAULT_INPUTS_O_BREADCRUMB,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.o-breadcrumb]': 'true'
  }
})
export class OBreadcrumbComponent implements AfterViewInit, OnDestroy, OnInit {

  public labelColumns: string;
  public separator: string = ' ';
  public breadcrumbs: Array<ONavigationItem>;

  protected router: Router;
  protected _formRef: OFormComponent;
  protected labelColsArray: Array<string> = [];
  protected navigationService: NavigationService;
  protected onDataLoadedSubscription: Subscription;
  protected navigationServiceSubscription: Subscription;

  constructor(
    protected injector: Injector
  ) {
    this.router = this.injector.get(Router);
    this.navigationService = this.injector.get(NavigationService);
  }

  ngOnInit() {
    let self = this;

    this.labelColsArray = Util.parseArray(this.labelColumns);

    if (this.navigationService && this.navigationService.navigationEvents$) {
      this.navigationServiceSubscription = this.navigationService.navigationEvents$
        .subscribe(e => self.breadcrumbs = e);
    }
  }

  ngAfterViewInit() {
    if (this._formRef && this.labelColsArray.length) {
      let self = this;
      this.onDataLoadedSubscription = this._formRef.onDataLoaded.subscribe(
        (value: any) => {
          if (self.breadcrumbs.length) {
            let displayText = self.labelColsArray.map(element => value[element]).join(self.separator);
            self.breadcrumbs[self.breadcrumbs.length - 1].displayText = displayText;
            self.navigationService.setNavigationItems(self.breadcrumbs);
          }
        }
      );
    }
  }

  protected isTerminal(route: ActivatedRouteSnapshot) {
    return route.firstChild === null || route.firstChild.routeConfig === null;
  }

  ngOnDestroy() {
    if (this.onDataLoadedSubscription) {
      this.onDataLoadedSubscription.unsubscribe();
    }
    if (this.navigationServiceSubscription) {
      this.navigationServiceSubscription.unsubscribe();
    }
  }

}

@NgModule({
  imports: [CommonModule, OSharedModule, RouterModule],
  exports: [OBreadcrumbComponent],
  declarations: [OBreadcrumbComponent]
})
export class OBreadcrumbModule { }
