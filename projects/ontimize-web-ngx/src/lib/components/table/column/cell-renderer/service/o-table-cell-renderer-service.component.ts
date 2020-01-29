import { ChangeDetectionStrategy, Component, Injector, OnInit, TemplateRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DialogService } from '../../../../../services/dialog.service';
import { OntimizeService } from '../../../../../services/ontimize.service';
import { dataServiceFactory } from '../../../../../services/data-service.provider';
import { Codes } from '../../../../../util/codes';
import { Util } from '../../../../../util/util';
import { SQLTypes } from '../../../../../util/sqltypes';
import { IExpression, FilterExpressionUtils } from '../../../../../util/filter-expression.utils';

import { ServiceUtils } from '../../../../../util/service.utils';
import { OColumn } from '../../../o-table.component';
import { OBaseTableCellRenderer, DEFAULT_INPUTS_O_BASE_TABLE_CELL_RENDERER } from '../o-base-table-cell-renderer.class';

export const DEFAULT_INPUTS_O_TABLE_CELL_RENDERER_SERVICE = [
  ...DEFAULT_INPUTS_O_BASE_TABLE_CELL_RENDERER,
  'entity',
  'service',
  'columns',
  'valueColumn: value-column',
  'parentKeys: parent-keys',
  'queryMethod: query-method',
  'serviceType : service-type'
];

@Component({
  moduleId: module.id,
  selector: 'o-table-cell-renderer-service',
  templateUrl: './o-table-cell-renderer-service.component.html',
  inputs: DEFAULT_INPUTS_O_TABLE_CELL_RENDERER_SERVICE,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    // Service renderer must have its own service instance in order to avoid overriding table service configuration
    OntimizeService
  ]
})
export class OTableCellRendererServiceComponent extends OBaseTableCellRenderer implements OnInit, AfterViewInit, OnDestroy {

  public static DEFAULT_INPUTS_O_TABLE_CELL_RENDERER_SERVICE = DEFAULT_INPUTS_O_TABLE_CELL_RENDERER_SERVICE;

  @ViewChild('templateref', { read: TemplateRef, static: false }) public templateref: TemplateRef<any>;

  public rowData: any;
  public cellValues = [];
  public renderValue: any;
  public responseMap = {};

  /* Inputs */
  protected entity: string;
  protected service: string;
  protected columns: string;
  protected valueColumn: string;
  protected parentKeys: string;
  protected queryMethod: string = Codes.QUERY_METHOD;
  protected serviceType: string;

  /* Internal variables */
  protected colArray: string[] = [];
  protected dataService: any;
  protected _pKeysEquiv = {};
  protected querySubscription: Subscription;
  protected dialogService: DialogService;

  protected editorSuscription: Subscription;

  constructor(protected injector: Injector) {
    super(injector);
    this.tableColumn.type = 'service';
    this.dialogService = injector.get(DialogService);
  }

  public ngOnInit(): void {
    if (this.table) {
      const oCol: OColumn = this.table.getOColumn(this.column);
      oCol.definition.contentAlign = oCol.definition.contentAlign ? oCol.definition.contentAlign : 'center';
    }

    this.colArray = Util.parseArray(this.columns, true);
    const pkArray = Util.parseArray(this.parentKeys);
    this._pKeysEquiv = Util.parseParentKeysEquivalences(pkArray);
    this.configureService();
  }

  public ngAfterViewInit(): void {
    const oCol: OColumn = this.table.getOColumn(this.column);
    if (Util.isDefined(oCol.editor)) {
      const self = this;
      this.editorSuscription = oCol.editor.onPostUpdateRecord.subscribe((data: any) => {
        self.queryData(data[self.tableColumn.attr], data);
      });
    }
  }

  public ngOnDestroy(): void {
    if (this.editorSuscription) {
      this.editorSuscription.unsubscribe();
    }
  }

  public getDescriptionValue(cellvalue: any, rowValue: any): string {
    if (cellvalue !== undefined && this.cellValues.indexOf(cellvalue) === -1) {
      this.queryData(cellvalue, rowValue);
      this.cellValues.push(cellvalue);
    }
    return '';
  }

  public queryData(cellvalue, parentItem?: any): void {
    const self = this;
    if (!this.dataService || !(this.queryMethod in this.dataService) || !this.entity) {
      console.warn('Service not properly configured! aborting query');
      return;
    }
    const filter = ServiceUtils.getFilterUsingParentKeys(parentItem, this._pKeysEquiv);
    const tableColAlias = Object.keys(this._pKeysEquiv).find(key => this._pKeysEquiv[key] === this.column);
    if (Util.isDefined(tableColAlias)) {
      if (!filter[tableColAlias]) {
        filter[tableColAlias] = cellvalue;
      }
    } else {
      filter[this.column] = cellvalue;
    }
    this.querySubscription = this.dataService[this.queryMethod](filter, this.colArray, this.entity).subscribe(resp => {
      if (resp.code === Codes.ONTIMIZE_SUCCESSFUL_CODE) {
        self.responseMap[cellvalue] = resp.data[0][self.valueColumn];
      }
    }, err => {
      console.error(err);
      if (err && typeof err !== 'object') {
        this.dialogService.alert('ERROR', err);
      } else {
        this.dialogService.alert('ERROR', 'MESSAGES.ERROR_QUERY');
      }
    });
  }

  public configureService(): void {
    let loadingService: any = OntimizeService;
    if (this.serviceType) {
      loadingService = this.serviceType;
    }
    try {
      this.dataService = this.injector.get(loadingService);
      if (Util.isDataService(this.dataService)) {
        const serviceCfg = this.dataService.getDefaultServiceConfiguration(this.service);
        if (this.entity) {
          serviceCfg['entity'] = this.entity;
        }
        this.dataService.configureService(serviceCfg);
      }
    } catch (e) {
      console.error(e);
    }
  }

  public getCellData(cellvalue: any, rowvalue?: any): string {
    return this.responseMap[cellvalue];
  }

  public getFilterExpression(quickFilter: string): IExpression {
    const oCol: OColumn = this.table.getOColumn(this.column);
    let result: IExpression;
    const cacheValue = Object.keys(this.responseMap).find(key => Util.normalizeString(this.responseMap[key]).indexOf(Util.normalizeString(quickFilter)) !== -1);
    if (cacheValue) {
      result = FilterExpressionUtils.buildExpressionEquals(this.column, SQLTypes.parseUsingSQLType(cacheValue, SQLTypes.getSQLTypeKey(oCol.sqlType)));
    }
    return result;
  }
}
