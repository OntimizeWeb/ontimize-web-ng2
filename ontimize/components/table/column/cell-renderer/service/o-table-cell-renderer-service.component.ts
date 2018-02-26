import { Component, Injector, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Util } from '../../../../../utils';
import { OntimizeService, dataServiceFactory, DialogService } from '../../../../../services';
import { OBaseTableCellRenderer } from '../o-base-table-cell-renderer.class';

@Component({
  selector: 'o-table-cell-renderer-service',
  templateUrl: './o-table-cell-renderer-service.component.html',
  inputs: [
    'entity',
    'service',
    'columns',
    'valueColumn: value-column',
    'parentKeys: parent-keys',
    'queryMethod: query-method',
    'serviceType : service-type'
  ],
  providers: [
    { provide: OntimizeService, useFactory: dataServiceFactory, deps: [Injector] }
  ]
})

export class OTableCellRendererServiceComponent extends OBaseTableCellRenderer implements OnInit {

  public static DEFAULT_QUERY_METHOD = 'query';

  @ViewChild('templateref', { read: TemplateRef }) public templateref: TemplateRef<any>;

  /* Inputs */
  protected entity: string;
  protected service: string;
  protected columns: string;
  protected valueColumn: string;
  protected parentKeys: string;
  protected queryMethod: string;
  protected serviceType: string;

  /* Internal variables */
  protected colArray: string[] = [];
  protected dataService: any;
  protected _pKeysEquiv = {};
  protected querySubscription: Subscription;
  protected dialogService: DialogService;

  rowData: any;
  cellValues = [];
  renderValue: any;

  responseMap = {};

  constructor(protected injector: Injector) {
    super(injector);
    this.dialogService = injector.get(DialogService);
    this.initialize();
  }

  ngOnInit() {
    this.colArray = Util.parseArray(this.columns, true);
    let pkArray = Util.parseArray(this.parentKeys);
    this._pKeysEquiv = Util.parseParentKeysEquivalences(pkArray);
    if (!this.queryMethod) {
      this.queryMethod = OTableCellRendererServiceComponent.DEFAULT_QUERY_METHOD;
    }
    this.configureService();
  }

  getDescriptionValue(cellvalue: any, rowValue: any): String {
    // let keyValue = rowValue[this.column];
    if (cellvalue !== undefined && this.cellValues.indexOf(cellvalue) === -1) {
      this.queryData(cellvalue, rowValue);
      this.cellValues.push(cellvalue);
    }
    return '';
  }

  queryData(cellvalue, parentItem: any = undefined) {
    var self = this;

    if (!this.dataService || !(this.queryMethod in this.dataService) || !this.entity) {
      console.warn('Service not properly configured! aborting query');
      return;
    }

    if ((Object.keys(this._pKeysEquiv).length > 0) && parentItem === undefined) {
      // this.setDataArray([]);
    } else {
      // if (this.querySubscription) {
      //   this.querySubscription.unsubscribe();
      // }
      const filter = this.getFilterUsingParentKeys(parentItem, this._pKeysEquiv);
      this.querySubscription = this.dataService[this.queryMethod](filter, this.colArray, this.entity).subscribe(resp => {
        if (resp.code === 0) {
          self.responseMap[cellvalue] = resp.data[0][this.valueColumn];
        } else {
          console.log('error');
        }
      }, err => {
        console.log(err);
        if (err && typeof err !== 'object') {
          this.dialogService.alert('ERROR', err);
        } else {
          this.dialogService.alert('ERROR', 'MESSAGES.ERROR_QUERY');
        }
      });
    }
  }

  getFilterUsingParentKeys(parentItem: any, parentKeysObject: Object) {
    let filter = {};
    const parentKeys = Object.keys(parentKeysObject || {});

    if ((parentKeys.length > 0) && (typeof (parentItem) !== 'undefined')) {
      for (let k = 0; k < parentKeys.length; ++k) {
        let parentKey = parentKeys[k];
        if (parentItem.hasOwnProperty(parentKey)) {
          let currentData = parentItem[parentKey];
          filter[parentKeysObject[parentKey]] = currentData;
        }
      }
    }
    return filter;
  }

  configureService() {
    let loadingService: any = OntimizeService;
    if (this.serviceType) {
      loadingService = this.serviceType;
    }
    try {
      this.dataService = this.injector.get(loadingService);
      if (Util.isDataService(this.dataService)) {
        let serviceCfg = this.dataService.getDefaultServiceConfiguration();
        if (this.entity) {
          serviceCfg['entity'] = this.entity;
        }
        this.dataService.configureService(serviceCfg);
      }
    } catch (e) {
      console.error(e);
    }
  }
}


