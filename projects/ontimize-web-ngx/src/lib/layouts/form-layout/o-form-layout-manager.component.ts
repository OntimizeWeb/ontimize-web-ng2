import {
  AfterViewInit,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  HostListener,
  Injector,
  OnDestroy,
  OnInit,
  Optional,
  SkipSelf,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material';
import { ActivatedRoute, ActivatedRouteSnapshot, Route, Router } from '@angular/router';

import { OServiceComponent } from '../../components/o-service-component.class';
import { InputConverter } from '../../decorators/input-converter';
import { ILocalStorageComponent } from '../../interfaces/local-storage-component.interface';
import { OFormLayoutTabGroup } from '../../interfaces/o-form-layout-tab-group.interface';
import { LocalStorageService } from '../../services/local-storage.service';
import { NavigationService } from '../../services/navigation.service';
import { OFormLayoutManagerService } from '../../services/o-form-layout-manager.service';
import { OTranslateService } from '../../services/translate/o-translate.service';
import { FormLayoutDetailComponentData } from '../../types/form-layout-detail-component-data.type';
import { Util } from '../../util/util';
import { OFormLayoutDialogComponent } from './dialog/o-form-layout-dialog.component';
import { OFormLayoutDialogOptionsComponent } from './dialog/options/o-form-layout-dialog-options.component';
import { CanActivateFormLayoutChildGuard } from './guards/o-form-layout-can-activate-child.guard';
import { OFormLayoutTabGroupOptionsComponent } from './tabgroup/options/o-form-layout-tabgroup-options.component';

export const DEFAULT_INPUTS_O_FORM_LAYOUT_MANAGER = [
  'oattr: attr',
  'mode',
  'labelColumns: label-columns',
  'separator',
  'title',
  'storeState: store-state',
  // attr of the child form from which the data for building the tab title will be obtained
  'titleDataOrigin: title-data-origin',
  'dialogWidth: dialog-width',
  'dialogMinWidth: dialog-min-width',
  'dialogMaxWidth: dialog-max-width',
  'dialogHeight: dialog-height',
  'dialogMinHeight: dialog-min-height',
  'dialogMaxHeight dialog-max-height',
  'dialogClass: dialog-class'
];

export const DEFAULT_OUTPUTS_O_FORM_LAYOUT_MANAGER = [
  'onMainTabSelected',
  'onSelectedTabChange',
  'onCloseTab'
];

@Component({
  selector: 'o-form-layout-manager',
  inputs: DEFAULT_INPUTS_O_FORM_LAYOUT_MANAGER,
  outputs: DEFAULT_OUTPUTS_O_FORM_LAYOUT_MANAGER,
  templateUrl: './o-form-layout-manager.component.html',
  host: {
    '[class.o-form-layout-manager]': 'true'
  }
})
export class OFormLayoutManagerComponent implements AfterViewInit, OnInit, OnDestroy, ILocalStorageComponent {

  public static guardClassName = 'CanActivateFormLayoutChildGuard';

  public static DIALOG_MODE = 'dialog';
  public static TAB_MODE = 'tab';

  public oattr: string;
  public mode: string;
  public labelColumns: string;
  public separator: string = ' ';
  public title: string;
  @InputConverter()
  public storeState: boolean = true;
  public titleDataOrigin: string;
  public dialogWidth: string;
  public dialogMinWidth: string;
  public dialogMaxWidth: string;
  public dialogHeight: string;
  public dialogMinHeight: string;
  public dialogMaxHeight: string;
  public dialogClass: string = '';

  @ViewChild('tabGroup', { static: false })
  public oTabGroup: OFormLayoutTabGroup;
  public dialogRef: MatDialogRef<OFormLayoutDialogComponent>;

  public onMainTabSelected: EventEmitter<any> = new EventEmitter<any>();
  public onSelectedTabChange: EventEmitter<any> = new EventEmitter<any>();
  public onCloseTab: EventEmitter<any> = new EventEmitter<any>();

  protected labelColsArray: string[] = [];

  protected translateService: OTranslateService;
  protected oFormLayoutManagerService: OFormLayoutManagerService;
  protected localStorageService: LocalStorageService;
  protected onRouteChangeStorageSubscription: any;

  @ContentChild(OFormLayoutTabGroupOptionsComponent, { static: false })
  public tabGroupOptions: OFormLayoutTabGroupOptionsComponent;

  @ContentChild(OFormLayoutDialogOptionsComponent, { static: false })
  public dialogOptions: OFormLayoutDialogOptionsComponent;

  protected addingGuard: boolean = false;

  public navigationService: NavigationService;

  public markForUpdate: boolean = false;
  public onTriggerUpdate: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    protected injector: Injector,
    protected router: Router,
    protected actRoute: ActivatedRoute,
    protected dialog: MatDialog,
    protected elRef: ElementRef,
    @SkipSelf() @Optional()
    public parentFormLayoutManager: OFormLayoutManagerComponent
  ) {
    this.oFormLayoutManagerService = this.injector.get(OFormLayoutManagerService);
    this.localStorageService = this.injector.get(LocalStorageService);
    this.translateService = this.injector.get(OTranslateService);
    this.navigationService = this.injector.get(NavigationService);
    if (this.storeState) {
      this.onRouteChangeStorageSubscription = this.localStorageService.onRouteChange.subscribe(res => {
        this.updateStateStorage();
      });
    }
  }

  public ngOnInit(): void {
    const availableModeValues = [OFormLayoutManagerComponent.DIALOG_MODE, OFormLayoutManagerComponent.TAB_MODE];
    this.mode = (this.mode || '').toLowerCase();
    if (availableModeValues.indexOf(this.mode) === -1) {
      this.mode = OFormLayoutManagerComponent.DIALOG_MODE;
    }
    this.labelColsArray = Util.parseArray(this.labelColumns);
    this.addActivateChildGuard();
    if (!Util.isDefined(this.oattr)) {
      this.oattr = this.title + this.mode;
      console.warn('o-form-layout-manager must have an unique attr');
    }
    this.oFormLayoutManagerService.registerFormLayoutManager(this);
  }

  public ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.elRef) {
        this.elRef.nativeElement.removeAttribute('title');
      }
      if (this.storeState && this.isTabMode() && Util.isDefined(this.oTabGroup)) {
        const state = this.localStorageService.getComponentStorage(this);
        this.oTabGroup.initializeComponentState(state);
      }
    });
  }

  public ngOnDestroy(): void {
    if (this.onRouteChangeStorageSubscription) {
      this.onRouteChangeStorageSubscription.unsubscribe();
    }
    this.updateStateStorage();
    this.oFormLayoutManagerService.removeFormLayoutManager(this);
    this.destroyAactivateChildGuard();
  }

  public getAttribute(): string {
    return this.oattr;
  }

  public getComponentKey(): string {
    return 'OFormLayoutManagerComponent_' + this.oattr;
  }

  public getDataToStore(): object {
    // only storing in tab mode
    if (this.isTabMode() && Util.isDefined(this.oTabGroup)) {
      return this.oTabGroup.getDataToStore();
    }
    return {};
  }

  @HostListener('window:beforeunload', [])
  public beforeunloadHandler(): void {
    this.updateStateStorage();
  }

  public getLabelFromUrlParams(urlParams: object): string {
    let label = '';
    const keys = Object.keys(urlParams);
    keys.forEach((param, i) => {
      label += urlParams[param] + ((i < keys.length - 1) ? this.separator : '');
    });
    return label;
  }

  public getFormDataFromLabelColumns(data: any) {
    const formData = {};
    Object.keys(data).forEach(x => {
      if (this.labelColsArray.indexOf(x) > -1) {
        formData[x] = data[x];
      }
    });
    return formData;

  }
  public addActivateChildGuard(): void {
    const routeConfig = this.getParentActRouteRoute();
    if (Util.isDefined(routeConfig)) {
      const canActivateChildArray = (routeConfig.canActivateChild || []);
      let previouslyAdded = false;
      for (let i = 0, len = canActivateChildArray.length; i < len; i++) {
        previouslyAdded = (canActivateChildArray[i].name === OFormLayoutManagerComponent.guardClassName);
        if (previouslyAdded) {
          break;
        }
      }
      if (!previouslyAdded) {
        this.addingGuard = true;
        canActivateChildArray.push(CanActivateFormLayoutChildGuard);
        routeConfig.canActivateChild = canActivateChildArray;
      }
    }
  }

  public destroyAactivateChildGuard(): void {
    if (!this.addingGuard) {
      return;
    }
    const routeConfig = this.getParentActRouteRoute();
    if (Util.isDefined(routeConfig)) {
      for (let i = (routeConfig.canActivateChild || []).length - 1; i >= 0; i--) {
        if (routeConfig.canActivateChild[i].name === OFormLayoutManagerComponent.guardClassName) {
          routeConfig.canActivateChild.splice(i, 1);
          break;
        }
      }
    }
  }

  public isDialogMode(): boolean {
    return this.mode === OFormLayoutManagerComponent.DIALOG_MODE;
  }

  public isTabMode(): boolean {
    return this.mode === OFormLayoutManagerComponent.TAB_MODE;
  }

  public addDetailComponent(childRoute: ActivatedRouteSnapshot, url: string): void {
    const newDetailComp: FormLayoutDetailComponentData = {
      params: childRoute.params,
      queryParams: childRoute.queryParams,
      urlSegments: childRoute.url,
      component: childRoute.routeConfig.component,
      url: url,
      id: Math.random().toString(36),
      label: '',
      modified: false
    };

    if (this.isTabMode() && Util.isDefined(this.oTabGroup)) {
      this.oTabGroup.addTab(newDetailComp);
    } else if (this.isDialogMode()) {
      this.openFormLayoutDialog(newDetailComp);
    }
  }

  public closeDetail(id?: string): void {
    if (this.isTabMode() && Util.isDefined(this.oTabGroup)) {
      this.oTabGroup.closeTab(id);
    } else if (this.isDialogMode() && Util.isDefined(this.dialogRef)) {
      this.dialogRef.close();
      this.reloadMainComponents();
    }
  }

  public openFormLayoutDialog(detailComp: FormLayoutDetailComponentData): void {
    const cssclass = ['o-form-layout-dialog-overlay'];
    if (this.dialogClass) {
      cssclass.push(this.dialogClass);
    }
    const dialogConfig: MatDialogConfig = {
      data: {
        data: detailComp,
        layoutManagerComponent: this,
        title: this.title,
      },
      width: this.dialogOptions ? this.dialogOptions.width : this.dialogWidth,
      minWidth: this.dialogOptions ? this.dialogOptions.minWidth : this.dialogMinWidth,
      maxWidth: this.dialogOptions ? this.dialogOptions.maxWidth : this.dialogMaxWidth,
      height: this.dialogOptions ? this.dialogOptions.height : this.dialogHeight,
      minHeight: this.dialogOptions ? this.dialogOptions.minHeight : this.dialogMinHeight,
      maxHeight: this.dialogOptions ? this.dialogOptions.maxHeight : this.dialogMaxHeight,
      disableClose: this.dialogOptions ? this.dialogOptions.disableClose : true,
      panelClass: this.dialogOptions ? this.dialogOptions.class : cssclass

    };

    if (this.dialogOptions) {
      dialogConfig.closeOnNavigation = this.dialogOptions.closeOnNavigation;
      dialogConfig.backdropClass = this.dialogOptions.backdropClass;
      dialogConfig.position = this.dialogOptions.position;
      dialogConfig.disableClose = this.dialogOptions.disableClose;
    }


    this.dialogRef = this.dialog.open(OFormLayoutDialogComponent, dialogConfig);
    this.dialogRef.afterClosed().subscribe(() => {
      this.updateIfNeeded();
    });
  }

  public getFormCacheData(formId: string): FormLayoutDetailComponentData {
    if (this.isTabMode() && Util.isDefined(this.oTabGroup)) {
      return this.oTabGroup.getFormCacheData(formId);
    } else if (this.isDialogMode() && Util.isDefined(this.dialogRef)) {
      return this.dialogRef.componentInstance.data;
    }
    return undefined;
  }

  public getLastTabId(): string {
    if (this.isTabMode() && Util.isDefined(this.oTabGroup)) {
      return this.oTabGroup.getLastTabId();
    }
    return undefined;
  }

  public setModifiedState(modified: boolean, id: string): void {
    if (this.isTabMode() && Util.isDefined(this.oTabGroup)) {
      this.oTabGroup.setModifiedState(modified, id);
    }
  }

  public getLabelFromData(data: any): string {
    let label = '';
    const isDataDefined = Util.isDefined(data);
    if (isDataDefined && data.hasOwnProperty('new_tab_title')) {
      label = this.translateService.get(data.new_tab_title);
    } else if (isDataDefined && this.labelColsArray.length !== 0) {
      this.labelColsArray.forEach((col, idx) => {
        if (data[col] !== undefined) {
          label += data[col] + ((idx < this.labelColsArray.length - 1) ? this.separator : '');
        }
      });
    }
    return label;
  }

  public updateNavigation(data: any, id: string, insertionMode?: boolean): void {
    if (this.isTabMode() && Util.isDefined(this.oTabGroup)) {
      this.oTabGroup.updateNavigation(data, id, insertionMode);
    } else if (this.isDialogMode() && Util.isDefined(this.dialogRef)) {
      this.dialogRef.componentInstance.updateNavigation(data, id);
    }
  }

  public updateActiveData(data: any) {
    if (this.isTabMode() && Util.isDefined(this.oTabGroup)) {
      this.oTabGroup.updateActiveData(data);
    } else if (this.isDialogMode() && Util.isDefined(this.dialogRef)) {
      this.dialogRef.componentInstance.updateActiveData(data);
    }
  }

  public getRouteOfActiveItem(): any[] {
    let route = [];
    if (this.isTabMode() && Util.isDefined(this.oTabGroup)) {
      route = this.oTabGroup.getRouteOfActiveItem();
    } else if (this.isDialogMode() && Util.isDefined(this.dialogRef)) {
      route = this.dialogRef.componentInstance.getRouteOfActiveItem();
    }
    return route;
  }

  public isMainComponent(comp: OServiceComponent): boolean {
    let result = false;
    if (this.isTabMode() && Util.isDefined(this.oTabGroup)) {
      const firstTab = this.oTabGroup.elementRef.nativeElement.getElementsByTagName('mat-tab-body')[0];
      if (firstTab) {
        result = firstTab.contains(comp.elementRef.nativeElement);
      }
    } else if (this.isDialogMode()) {
      result = !comp.oFormLayoutDialog;
    }
    return result;
  }

  public getRouteForComponent(comp: OServiceComponent): any[] {
    const result = [];
    if (this.parentFormLayoutManager) {
      const parentRoute = this.parentFormLayoutManager.getRouteForComponent(comp);
      if (parentRoute && parentRoute.length > 0) {
        result.push(...parentRoute);
      }
    }
    if (!this.isMainComponent(comp)) {
      const activeRoute = this.getRouteOfActiveItem();
      if (activeRoute && activeRoute.length > 0) {
        result.push(...activeRoute);
      }
    }
    return result;
  }

  public setAsActiveFormLayoutManager(): void {
    this.oFormLayoutManagerService.activeFormLayoutManager = this;
  }

  public reloadMainComponents(): void {
    this.onTriggerUpdate.emit();
  }

  public allowToUpdateNavigation(formAttr: string): boolean {
    return (this.isTabMode() && Util.isDefined(this.oTabGroup) && Util.isDefined(this.titleDataOrigin)) ?
      this.titleDataOrigin === formAttr :
      true;
  }

  protected updateStateStorage(): void {
    if (this.localStorageService && this.isTabMode() && Util.isDefined(this.oTabGroup) && this.storeState) {
      this.localStorageService.updateComponentStorage(this);
    }
  }

  private getParentActRouteRoute(): Route {
    let actRoute = this.actRoute;
    while (actRoute.parent !== undefined && actRoute.parent !== null) {
      if (actRoute.routeConfig.children || actRoute.routeConfig.loadChildren) {
        break;
      }
      actRoute = actRoute.parent;
    }
    return actRoute.routeConfig;
  }

  public updateIfNeeded() {
    if (this.markForUpdate) {
      this.markForUpdate = false;
      this.onTriggerUpdate.emit();
    }
  }

  public getParams(): any {
    let data;
    if (this.isTabMode() && Util.isDefined(this.oTabGroup)) {
      data = this.oTabGroup.getParams();
    } else if (this.isDialogMode() && Util.isDefined(this.dialogRef)) {
      data = this.dialogRef.componentInstance.getParams();
    }
    return data;
  }
}
