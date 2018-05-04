import { Injector, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { Util, Codes } from '../utils';
import { InputConverter } from '../decorators';
import { AuthGuardService } from '../services';
import { OFormLayoutManagerComponent } from '../layouts/form-layout/o-form-layout-manager.component';

import { OFormComponent } from './form/o-form.component';
import { OFormValue } from './form/OFormValue';
import { OListInitializationOptions } from './list/o-list.component';
import { OTableInitializationOptions } from './table/o-table.component';
import { OServiceBaseComponent, DEFAULT_INPUTS_O_SERVICE_BASE_COMPONENT } from './o-service-base-component.class';

export const DEFAULT_INPUTS_O_SERVICE_COMPONENT = [
  ...DEFAULT_INPUTS_O_SERVICE_BASE_COMPONENT,

  '_title: title',

  'cssClass: css-class',

  // visible [no|yes]: visibility. Default: yes.
  'ovisible: visible',

  // enabled [no|yes]: editability. Default: yes.
  'oenabled: enabled',

  //controls [string][yes|no|true|false]:
  'controls',

  // detail-mode [none|click|doubleclick]: way to open the detail form of a row. Default: 'click'.
  'detailMode: detail-mode',

  // detail-form-route [string]: route of detail form. Default: 'detail'.
  'detailFormRoute: detail-form-route',

  // recursive-detail [no|yes]: do not append detail keys when navigate (overwrite current). Default: no.
  'recursiveDetail: recursive-detail',

  // detail-button-in-row [no|yes]: adding a button in row for opening detail form. Default: yes.
  'detailButtonInRow: detail-button-in-row',

  // detail-button-in-row-icon [string]: material icon. Default: mode_edit.
  'detailButtonInRowIcon: detail-button-in-row-icon',

  // edit-form-route [string]: route of edit form. Default: 'edit'.
  'editFormRoute: edit-form-route',

  // recursive-edit [no|yes]: do not append detail keys when navigate (overwrite current). Default: no.
  'recursiveEdit: recursive-edit',

  // edit-button-in-row [no|yes]: adding a button in row for opening edition form. Default: no.
  'editButtonInRow: edit-button-in-row',

  // edit-button-in-row-icon [string]: material icon. Default: search.
  'editButtonInRowIcon: edit-button-in-row-icon',

  // insert-button [no|yes]: show insert button. Default: yes.
  'insertButton: insert-button',

  // row-height [small | medium | large]
  'rowHeight : row-height',

  // insert-form-route [string]: route of insert form. Default:
  'insertFormRoute: insert-form-route',

  // recursive-insert [no|yes]: do not append insert keys when navigate (overwrite current). Default: no.
  'recursiveInsert: recursive-insert'
];

export class OServiceComponent extends OServiceBaseComponent {

  public static DEFAULT_INPUTS_O_SERVICE_COMPONENT = DEFAULT_INPUTS_O_SERVICE_COMPONENT;

  protected authGuardService: AuthGuardService;

  /* inputs variables */
  title: string;
  protected _title: string;
  protected cssclass: string;
  @InputConverter()
  protected ovisible: boolean = true;
  @InputConverter()
  protected oenabled: boolean = true;
  @InputConverter()
  protected controls: boolean = true;
  protected detailMode: string = Codes.DETAIL_MODE_CLICK;
  protected detailFormRoute: string;
  @InputConverter()
  protected recursiveDetail: boolean = false;
  @InputConverter()
  detailButtonInRow: boolean = false;
  detailButtonInRowIcon: string = Codes.DETAIL_ICON;
  protected editFormRoute: string;
  @InputConverter()
  protected recursiveEdit: boolean = false;
  @InputConverter()
  editButtonInRow: boolean = false;
  editButtonInRowIcon: string = Codes.EDIT_ICON;
  @InputConverter()
  insertButton: boolean;
  rowHeight: string = Codes.DEFAULT_ROW_HEIGHT;
  protected insertFormRoute: string;
  @InputConverter()
  protected recursiveInsert: boolean = false;
  /* end of inputs variables */

  protected selectedItems: Array<Object> = [];

  protected router: Router;
  protected actRoute: ActivatedRoute;

  protected onMainTabSelectedSubscription: any;
  protected formLayoutManager: OFormLayoutManagerComponent;

  constructor(
    injector: Injector,
    protected elRef: ElementRef,
    protected form: OFormComponent
  ) {
    super(injector);
    this.router = this.injector.get(Router);
    this.actRoute = this.injector.get(ActivatedRoute);
    this.authGuardService = this.injector.get(AuthGuardService);
    try {
      this.formLayoutManager = this.injector.get(OFormLayoutManagerComponent);
    } catch (e) {
      // no parent form layout manager
    }
  }

  initialize(): void {
    super.initialize();
    if (Util.isDefined(this._title)) {
      this.title = this.translateService.get(this._title);
    }
    this.authGuardService.getPermissions(this.router.url, this.oattr).then(permissions => {
      if (Util.isDefined(permissions)) {
        if (this.ovisible && permissions.visible === false) {
          this.ovisible = false;
        }
        if (this.oenabled && permissions.enabled === false) {
          this.oenabled = false;
        }
      }
    });

    if (this.detailButtonInRow || this.editButtonInRow) {
      this.detailMode = Codes.DETAIL_MODE_NONE;
    }

    this.rowHeight = this.rowHeight ? this.rowHeight.toLowerCase() : this.rowHeight;
    if (!Codes.isValidRowHeight(this.rowHeight)) {
      this.rowHeight = Codes.DEFAULT_ROW_HEIGHT;
    }
  }

  afterViewInit() {
    super.afterViewInit();
    if (this.formLayoutManager && this.formLayoutManager.isTabMode()) {
      this.onMainTabSelectedSubscription = this.formLayoutManager.onMainTabSelected.subscribe(() => {
        this.reloadData();
      });
    }
  }

  destroy() {
    super.destroy();
    if (this.onMainTabSelectedSubscription) {
      this.onMainTabSelectedSubscription.unsubscribe();
    }
  }

  isVisible(): boolean {
    return this.ovisible;
  }

  hasControls(): boolean {
    return this.controls;
  }

  getSelectedItems(): any[] {
    return this.selectedItems;
  }

  clearSelection() {
    this.selectedItems = [];
  }

  onLanguageChangeCallback(res: any) {
    if (typeof (this._title) !== 'undefined') {
      this.title = this.translateService.get(this._title);
    }
  }

  viewDetail(item: any): void {
    let route = this.getRouteOfSelectedRow(item, this.detailFormRoute);
    if (route.length > 0) {
      let qParams = Codes.getIsDetailObject();
      if (this.formLayoutManager) {
        qParams[Codes.IGNORE_CAN_DEACTIVATE] = true;
      }
      let extras = {
        relativeTo: this.recursiveDetail ? this.actRoute.parent : this.actRoute,
      };
      extras[Codes.QUERY_PARAMS] = qParams;
      this.router.navigate(route, extras);
    }
  }

  editDetail(item: any) {
    let route = this.getRouteOfSelectedRow(item, this.editFormRoute);
    if (route.length > 0) {
      route.push('edit');
      let extras = {
        relativeTo: this.recursiveEdit ? this.actRoute.parent : this.actRoute
      };
      extras[Codes.QUERY_PARAMS] = Codes.getIsDetailObject();
      this.router.navigate(route, extras);
    }
  }

  insertDetail() {
    let route = [];
    let insertRoute = this.insertFormRoute !== undefined ? this.insertFormRoute : 'new';
    route.push(insertRoute);
    // adding parent-keys info...
    const encodedParentKeys = this.getEncodedParentKeys();
    if (encodedParentKeys !== undefined) {
      let routeObj = {};
      routeObj[Codes.PARENT_KEYS_KEY] = encodedParentKeys;
      route.push(routeObj);
    }
    let extras = {
      relativeTo: this.recursiveInsert ? this.actRoute.parent : this.actRoute,
    };
    if (this.formLayoutManager) {
      const cDeactivate = {};
      cDeactivate[Codes.IGNORE_CAN_DEACTIVATE] = true;
      extras[Codes.QUERY_PARAMS] = cDeactivate;
    }

    this.router.navigate(route, extras).catch(err => {
      console.error(err.message);
    });
  }

  protected getEncodedParentKeys() {
    const parentKeys = Object.keys(this._pKeysEquiv);
    let encoded = undefined;
    if ((parentKeys.length > 0) && Util.isDefined(this.parentItem)) {
      let pKeys = {};
      parentKeys.forEach(parentKey => {
        if (this.parentItem.hasOwnProperty(parentKey)) {
          let currentData = this.parentItem[parentKey];
          if (currentData instanceof OFormValue) {
            currentData = currentData.value;
          }
          pKeys[this._pKeysEquiv[parentKey]] = currentData;
        }
      });
      if (Object.keys(pKeys).length > 0) {
        encoded = Util.encodeParentKeys(pKeys);
      }
    }
    return encoded;
  }

  getRouteOfSelectedRow(item: any, modeRoute: any) {
    let route = [];

    // if (this.formLayoutManager) {
    //   route = this.formLayoutManager.getRouteOfActiveItem();
    // }

    // TODO: multiple keys
    let filter = undefined;
    if (typeof (item) === 'object') {
      for (let k = 0; k < this.keysArray.length; ++k) {
        let key = this.keysArray[k];
        filter = item[key];
      }
    }
    if (typeof (filter) !== 'undefined') {
      if (modeRoute !== undefined) {
        route.push(modeRoute);
      }
      route.push(filter);
    }
    return route;
  }

  protected deleteLocalItems() {
    let selectedItems = this.getSelectedItems();
    for (let i = 0; i < selectedItems.length; ++i) {
      let selectedItem = selectedItems[i];
      let selectedItemKv = {};
      for (let k = 0; k < this.keysArray.length; ++k) {
        let key = this.keysArray[k];
        selectedItemKv[key] = selectedItem[key];
      }
      for (let j = this.dataArray.length - 1; j >= 0; --j) {
        let item = this.dataArray[j];
        let itemKv = {};
        for (let k = 0; k < this.keysArray.length; ++k) {
          let key = this.keysArray[k];
          itemKv[key] = item[key];
        }
        let found = false;
        for (let k in selectedItemKv) {
          if (selectedItemKv.hasOwnProperty(k)) {
            found = itemKv.hasOwnProperty(k) && (selectedItemKv[k] === itemKv[k]);
          }
        }
        if (found) {
          this.dataArray.splice(j, 1);
          break;
        }
      }
    }
    this.clearSelection();
  }

  reinitialize(options: OListInitializationOptions | OTableInitializationOptions) {
    if (options && Object.keys(options).length) {
      let clonedOpts = Object.assign({}, options);
      if (clonedOpts.hasOwnProperty('entity')) {
        this.entity = clonedOpts.entity;
        if (this.oattrFromEntity) {
          this.oattr = undefined;
        }
        delete clonedOpts.entity;
      }
      for (var prop in clonedOpts) {
        if (clonedOpts.hasOwnProperty(prop)) {
          this[prop] = clonedOpts[prop];
        }
      }
      this.destroy();
      this.initialize();
    }
  }

}
