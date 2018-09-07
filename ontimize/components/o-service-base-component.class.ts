import { HostListener, Injector, NgZone, SimpleChange } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import { Util, Codes } from '../utils';
import { InputConverter } from '../decorators';
import { OFormComponent } from './form/o-form.component';
import { OQueryDataArgs, ServiceUtils } from './service.utils';
import { DialogService, ILocalStorageComponent, LocalStorageService, OntimizeService } from '../services';

export const DEFAULT_INPUTS_O_SERVICE_BASE_COMPONENT = [
  // attr [string]: list identifier. It is mandatory if data are provided through the data attribute. Default: entity (if set).
  'oattr: attr',

  // service [string]: JEE service path. Default: no value.
  'service',

  'serviceType : service-type',

  // entity [string]: entity of the service. Default: no value.
  'entity',

  // query-on-init [no|yes]: query on init. Default: yes.
  'queryOnInit: query-on-init',

  // query-on-init [no|yes]: query on bind. Default: yes.
  'queryOnBind: query-on-bind',

  'pageable',

  // columns [string]: columns of the entity, separated by ';'. Default: no value.
  'columns',

  // keys [string]: entity keys, separated by ';'. Default: no value.
  'keys',

  // parent-keys [string]: parent keys to filter, separated by ';'. Default: no value.
  'parentKeys: parent-keys',

  //static-data [Array<any>] : way to populate with static data. Default: no value.
  'staticData: static-data',

  // query-method [string]: name of the service method to perform queries. Default: query.
  'queryMethod: query-method',

  // paginated-query-method [string]: name of the service method to perform paginated queries. Default: advancedQuery.
  'paginatedQueryMethod : paginated-query-method',

  // query-rows [number]: number of rows per page. Default: 10.
  'queryRows: query-rows',

  // insert-method [string]: name of the service method to perform inserts. Default: insert.
  'insertMethod: insert-method',

  // update-method [string]: name of the service method to perform updates. Default: update.
  'updateMethod: update-method',

  // delete-method [string]: name of the service method to perform deletions. Default: delete.
  'deleteMethod: delete-method',

  'storeState: store-state',

  // query-with-null-parent-keys [string][yes|no|true|false]: Indicates whether or not to trigger query method when parent-keys filter is null. Default: false
  'queryWithNullParentKeys: query-with-null-parent-keys'
];

export class OServiceBaseComponent implements ILocalStorageComponent {

  public static DEFAULT_INPUTS_O_SERVICE_BASE_COMPONENT = DEFAULT_INPUTS_O_SERVICE_BASE_COMPONENT;

  protected localStorageService: LocalStorageService;
  protected dialogService: DialogService;

  /* inputs variables */
  oattr: string;
  service: string;
  serviceType: string;
  entity: string;
  @InputConverter()
  queryOnInit: boolean = true;
  @InputConverter()
  queryOnBind: boolean = true;
  @InputConverter()
  pageable: boolean = false;
  columns: string;
  keys: string;
  parentKeys: string;
  staticData: Array<any>;
  queryMethod: string = Codes.QUERY_METHOD;
  paginatedQueryMethod: string = Codes.PAGINATED_QUERY_METHOD;
  @InputConverter()
  queryRows: number = Codes.DEFAULT_QUERY_ROWS;
  insertMethod: string = Codes.INSERT_METHOD;
  updateMethod: string = Codes.UPDATE_METHOD;
  deleteMethod: string = Codes.DELETE_METHOD;
  @InputConverter()
  storeState: boolean = true;
  @InputConverter()
  queryWithNullParentKeys: boolean = false;
  /* end of inputs variables */

  /* parsed inputs variables */
  protected colArray: Array<string> = [];
  protected keysArray: Array<string> = [];
  protected _pKeysEquiv = {};
  protected dataArray: Array<any> = [];
  protected oattrFromEntity: boolean = false;
  /* end of parsed inputs variables */

  protected onRouteChangeStorageSubscribe: any;
  protected onFormDataSubscribe: any;

  protected loaderSubscription: Subscription;
  protected querySubscription: Subscription;
  protected dataService: any;
  protected _state: any = {};
  loading: boolean = false;

  protected form: OFormComponent;
  protected alreadyStored: boolean = false;

  constructor(
    protected injector: Injector
  ) {
    this.dialogService = this.injector.get(DialogService);
    this.localStorageService = this.injector.get(LocalStorageService);
    try {
      this.form = this.injector.get(OFormComponent);
    } catch (e) {
      // no parent form
    }
  }

  initialize(): void {
    if (!Util.isDefined(this.oattr) && Util.isDefined(this.entity)) {
      this.oattr = this.entity.replace('.', '_');
      this.oattrFromEntity = true;
    }
    this.keysArray = Util.parseArray(this.keys);
    this.colArray = Util.parseArray(this.columns, true);
    let pkArray = Util.parseArray(this.parentKeys);
    this._pKeysEquiv = Util.parseParentKeysEquivalences(pkArray, Codes.COLUMNS_ALIAS_SEPARATOR);

    if (this.storeState) {
      this.onRouteChangeStorageSubscribe = this.localStorageService.onRouteChange.subscribe(res => {
        this.updateStateStorage();
      });

      // Get previous status
      this.state = this.localStorageService.getComponentStorage(this);

      if (Util.isDefined(this.state['query-rows'])) {
        this.queryRows = this.state['query-rows'];
      }
    }

    if (this.staticData) {
      this.queryOnBind = false;
      this.queryOnInit = false;
      this.setDataArray(this.staticData);
    } else {
      this.configureService();
    }

    if (this.form && Util.isDefined(this.dataService)) {
      this.setFormComponent(this.form);
    }
  }

  afterViewInit() {
    //
  }

  destroy() {
    if (this.onFormDataSubscribe) {
      this.onFormDataSubscribe.unsubscribe();
    }
    if (this.querySubscription) {
      this.querySubscription.unsubscribe();
    }
    if (this.loaderSubscription) {
      this.loaderSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: { [propName: string]: SimpleChange }) {
    if (Util.isDefined(changes['staticData'])) {
      this.setDataArray(changes['staticData'].currentValue);
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeunloadHandler(event) {
    this.updateStateStorage();
  }

  protected updateStateStorage() {
    if (this.localStorageService && this.storeState && !this.alreadyStored) {
      this.alreadyStored = true;
      this.localStorageService.updateComponentStorage(this);
    }
  }

  getAttribute(): string {
    return this.oattr;
  }

  getComponentKey(): string {
    return this.getAttribute();
  }

  getDataToStore(): Object {
    return this.state;
  }

  getKeys() {
    return this.keysArray;
  }

  configureService() {
    let loadingService: any = OntimizeService;
    if (this.serviceType) {
      loadingService = this.serviceType;
    }
    try {
      this.dataService = this.injector.get(loadingService);
      if (Util.isDataService(this.dataService)) {
        let serviceCfg = this.dataService.getDefaultServiceConfiguration(this.service);
        if (this.entity) {
          serviceCfg['entity'] = this.entity;
        }
        this.dataService.configureService(serviceCfg);
      }
    } catch (e) {
      console.error(e);
    }
  }

  getDataArray() {
    return this.dataArray;
  }

  setDataArray(data: any): void {
    if (Util.isArray(data)) {
      this.dataArray = data;
    } else if (Util.isObject(data)) {
      this.dataArray = [data];
    } else {
      console.warn('Component has received not supported service data. Supported data are Array or Object');
      this.dataArray = [];
    }
  }

  setFormComponent(form: OFormComponent) {
    if (!Util.isDefined(this.form)) {
      this.form = form;
    }

    var self = this;
    if (self.queryOnBind) {
      this.onFormDataSubscribe = this.form.onDataLoaded.subscribe(data => {
        self.queryData();
      });
    }
    let dataValues = this.form.getDataValues();
    if (Util.isDefined(dataValues) && Object.keys(dataValues).length > 0) {
      self.queryData();
    }
  }

  queryData(filter: any = undefined, ovrrArgs?: OQueryDataArgs) {
    let queryMethodName = this.pageable ? this.paginatedQueryMethod : this.queryMethod;
    if (!this.dataService || !(queryMethodName in this.dataService) || !this.entity) {
      return;
    }
    let filterParentKeys = ServiceUtils.getParentKeysFromForm(this._pKeysEquiv, this.form);
    if (!this.filterContainsAllParentKeys(filterParentKeys) && !this.queryWithNullParentKeys) {
      this.setData([], []);
    } else {
      filter = Object.assign(filter || {}, filterParentKeys);
      let queryArguments = this.getQueryArguments(filter, ovrrArgs);
      if (this.querySubscription) {
        this.querySubscription.unsubscribe();
      }
      if (this.loaderSubscription) {
        this.loaderSubscription.unsubscribe();
      }
      this.loaderSubscription = this.load();
      const self = this;
      this.querySubscription = this.dataService[queryMethodName].apply(this.dataService, queryArguments).subscribe(res => {
        let data = undefined;
        let sqlTypes = undefined;
        if (Util.isArray(res)) {
          data = res;
          sqlTypes = {};
        } else if ((res.code === Codes.ONTIMIZE_SUCCESSFUL_CODE)) {
          const arrData = (res.data !== undefined) ? res.data : [];
          data = Util.isArray(arrData) ? arrData : [];
          sqlTypes = res.sqlTypes;
          if (this.pageable) {
            this.updatePaginationInfo(res);
          }
        }
        self.setData(data, sqlTypes, (ovrrArgs && ovrrArgs.replace));
        self.loaderSubscription.unsubscribe();
      }, err => {
        self.setData([], []);
        self.loaderSubscription.unsubscribe();
        if (err && typeof err !== 'object') {
          self.dialogService.alert('ERROR', err);
        } else {
          self.dialogService.alert('ERROR', 'MESSAGES.ERROR_QUERY');
        }
      });
    }
  }

  protected filterContainsAllParentKeys(parentKeysFilter): boolean {
    let pkKeys = Object.keys(this._pKeysEquiv);
    if ((pkKeys.length > 0) && Util.isDefined(parentKeysFilter)) {
      let parentKeysFilterKeys = Object.keys(parentKeysFilter);
      return pkKeys.every(a => parentKeysFilterKeys.indexOf(a) !== -1);
    }
    return true;
  }

  reloadData() {
    console.log('reloadData');
  }

  /**
   * Reloads the component data and restarts the pagination.
   */
  reloadPaginatedDataFromStart(): void {
    this.reloadData();
  }

  load(): any {
    var self = this;
    var zone = this.injector.get(NgZone);
    var loadObservable = new Observable(observer => {
      var timer = window.setTimeout(() => {
        observer.next(true);
      }, 250);

      return () => {
        window.clearTimeout(timer);
        zone.run(() => {
          self.loading = false;
        });
      };

    });
    var subscription = loadObservable.subscribe(val => {
      zone.run(() => {
        self.loading = val as boolean;
      });
    });
    return subscription;
  }

  /**
   * Extracting the given record keys
   * @param item record object
   * @returns object containing item object properties contained in keysArray
   */
  extractKeysFromRecord(item: any): Object {
    let result = {};
    if (Util.isObject(item)) {
      this.keysArray.forEach(key => {
        if (Util.isDefined(item[key])) {
          result[key] = item[key];
        }
      });
    }
    return result;
  }

  getAttributesValuesToQuery(): Array<string> {
    let result = this.colArray;
    this.keysArray.forEach(key => {
      if (result.indexOf(key) === -1) {
        result.push(key);
      }
    });
    return result;
  }

  getQueryArguments(filter: Object, ovrrArgs?: OQueryDataArgs): Array<any> {
    const compFilter = this.getComponentFilter(filter);
    const queryCols = this.getAttributesValuesToQuery();
    let queryArguments = [compFilter, queryCols, this.entity, Util.isDefined(ovrrArgs) ? ovrrArgs.sqltypes : undefined];
    if (this.pageable) {
      let queryOffset = (ovrrArgs && ovrrArgs.hasOwnProperty('offset')) ? ovrrArgs.offset : this.state.queryRecordOffset;
      let queryRowsN = (ovrrArgs && ovrrArgs.hasOwnProperty('length')) ? ovrrArgs.length : this.queryRows;
      queryArguments = queryArguments.concat([queryOffset, queryRowsN, undefined]);
    }
    return queryArguments;
  }

  updatePaginationInfo(queryRes: any) {
    let resultEndIndex = queryRes.startRecordIndex + (queryRes.data ? queryRes.data.length : 0);
    if (queryRes.startRecordIndex !== undefined) {
      this.state.queryRecordOffset = resultEndIndex;
    }
    if (queryRes.totalQueryRecordsNumber !== undefined) {
      this.state.totalQueryRecordsNumber = queryRes.totalQueryRecordsNumber;
    }
  }

  getTotalRecordsNumber(): number {
    return (this.state && this.state.totalQueryRecordsNumber !== undefined) ? this.state.totalQueryRecordsNumber : undefined;
  }

  getComponentFilter(existingFilter: any = {}): any {
    return existingFilter;
  }

  getSqlTypes() {
    return {};
  }

  protected setData(data: any, sqlTypes?: any, replace?: boolean) {
    //
  }

  get state(): any {
    return this._state;
  }

  set state(arg: any) {
    this._state = arg;
  }

  getParentKeysValues() {
    return ServiceUtils.getParentKeysFromForm(this._pKeysEquiv, this.form);
  }
}
