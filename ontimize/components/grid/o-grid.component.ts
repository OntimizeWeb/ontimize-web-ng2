import { AfterViewChecked, AfterViewInit, Component, ContentChildren, ElementRef, EventEmitter, forwardRef, Inject, Injector, NgModule, OnChanges, OnDestroy, OnInit, Optional, QueryList, SimpleChange, ViewChild, ViewChildren } from '@angular/core';
import { MediaChange, ObservableMedia } from '@angular/flex-layout';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { OSharedModule } from '../../shared';
import { OntimizeService } from '../../services';
import { InputConverter } from '../../decorators';
import { OFormComponent } from '../form/form-components';
import { Codes, ObservableWrapper, Util } from '../../utils';
import { OServiceComponent } from '../o-service-component.class';
import { FilterExpressionUtils } from '../filter-expression.utils';
import { OGridItemDirective } from './grid-item/o-grid-item.directive';
import { dataServiceFactory } from '../../services/data-service.provider';
import { ISQLOrder, OQueryDataArgs, ServiceUtils } from '../service.utils';
import { OSearchInputComponent, OSearchInputModule } from '../../components';
import { OGridItemComponent, OGridItemModule } from './grid-item/o-grid-item.component';

export const DEFAULT_INPUTS_O_GRID = [
  ...OServiceComponent.DEFAULT_INPUTS_O_SERVICE_COMPONENT,
  // cols: Amount of columns in the grid list. Default in extra small and small screen is 1, in medium screen is 2, in large screen is 3 and extra large screen is 4.
  'cols',
  // page-size-options: The set of provided page size options to display to the user.
  'pageSizeOptions: page-size-options',
  // show-page-size:Whether to hide the page size selection UI from the user.
  'showPageSize: show-page-size',
  // show-sort:whether or not the sort select is shown in the toolbar
  'showSort: orderable',
  // sortable[string]: columns of the filter, separated by ';'. Default: no value.
  'sortableColumns: sortable-columns',
  // sortColumns[string]: columns of the sortingcolumns, separated by ';'. Default: no value.
  'sortColumn: sort-column',
  // quick-filter [no|yes]: show quick filter. Default: yes.
  'quickFilter: quick-filter',
  // quick-filter-columns [string]: columns of the filter, separated by ';'. Default: no value.
  'quickFilterColumns: quick-filter-columns',
  //  grid-item-height[string]: Set internal representation of row height from the user-provided value.. Default: 1:1.
  'gridItemHeight: grid-item-height',
  // refresh-button [no|yes]: show refresh button. Default: yes.
  'refreshButton: refresh-button',
];

export const DEFAULT_OUTPUTS_O_GRID = [
  'onClick',
  'onDoubleClick',
  'onDataLoaded',
  'onPaginatedDataLoaded'
];

const PAGE_SIZE_OPTIONS = [8, 16, 24, 32, 64];

@Component({
  selector: 'o-grid',
  providers: [
    { provide: OntimizeService, useFactory: dataServiceFactory, deps: [Injector] }
  ],
  inputs: DEFAULT_INPUTS_O_GRID,
  outputs: DEFAULT_OUTPUTS_O_GRID,
  templateUrl: './o-grid.component.html',
  styleUrls: ['./o-grid.component.scss'],
  host: {
    '[class.o-grid]': 'true'
  }
})
export class OGridComponent extends OServiceComponent implements AfterViewChecked, AfterViewInit, OnChanges, OnDestroy, OnInit {

  public static DEFAULT_INPUTS_O_GRID = DEFAULT_INPUTS_O_GRID;
  public static DEFAULT_OUTPUTS_O_GRID = DEFAULT_OUTPUTS_O_GRID;

  /* Inputs */
  public gridItemHeight = '1:1';
  @InputConverter()
  public refreshButton: boolean = true;
  @InputConverter()
  public showPageSize: boolean = false;
  @InputConverter()
  public showSort: boolean = false;
  get quickFilter(): boolean {
    return this._quickFilter;
  }
  set quickFilter(val: boolean) {
    val = Util.parseBoolean(String(val));
    this._quickFilter = val;
    if (val) {
      setTimeout(() => this.registerQuickFilter(this.searchInputComponent), 0);
    }
  }
  protected _quickFilter: boolean = true;
  protected quickFilterColumns: string;
  get sortColumn(): string {
    return this._sortColumn;
  }
  set sortColumn(val: string) {
    this._sortColumn = val;
    this.parseSortColumns();
  }
  protected _sortColumn: string;
  protected sortColArray: Array<ISQLOrder> = [];
  get sortableColumns(): string[] {
    return this._sortableColumns;
  }
  set sortableColumns(val) {
    if (!Util.isArray(val)) {
      val = Util.parseArray(String(val));
    }
    this._sortableColumns = val;
  }
  protected _sortableColumns;
  get cols(): number {
    return this._cols || this._colsDefault;
  }
  set cols(value: number) {
    this._cols = value;
  }
  protected _cols;
  protected _colsDefault = 1;
  get pageSizeOptions(): Array<number> {
    return this._pageSizeOptions;
  }
  set pageSizeOptions(value: Array<number>) {
    this._pageSizeOptions = value;
  }
  protected _pageSizeOptions = PAGE_SIZE_OPTIONS;
  /* End Inputs */

  public onClick: EventEmitter<any> = new EventEmitter();
  public onDoubleClick: EventEmitter<any> = new EventEmitter();
  public onDataLoaded: EventEmitter<any> = new EventEmitter();
  public onPaginatedDataLoaded: EventEmitter<any> = new EventEmitter();

  protected quickFilterColArray: string[];
  protected dataResponseArray: Array<any> = [];
  protected storePaginationState: boolean = false;

  @ContentChildren(OGridItemComponent) inputGridItems: QueryList<OGridItemComponent>;

  @ViewChild(OSearchInputComponent)
  protected searchInputComponent: OSearchInputComponent;
  quickFilterComponent: OSearchInputComponent;
  @ViewChildren(OGridItemDirective)
  gridItemDirectives: QueryList<OGridItemDirective>;

  set gridItems(value: OGridItemComponent[]) {
    this._gridItems = value;
  }
  get gridItems(): OGridItemComponent[] {
    return this._gridItems;
  }
  protected _gridItems: OGridItemComponent[];

  protected subscription: Subscription = new Subscription();
  protected media: ObservableMedia;

  constructor(
    injector: Injector,
    elRef: ElementRef,
    @Optional() @Inject(forwardRef(() => OFormComponent)) form: OFormComponent
  ) {
    super(injector, elRef, form);
    this.media = this.injector.get(ObservableMedia);

    this.queryRows = 32;
  }

  ngOnInit(): void {
    this.initialize();
  }

  initialize() {
    super.initialize();

    this.parseSortColumns();

    if (this.staticData && this.staticData.length) {
      this.dataResponseArray = this.staticData;
    }
    if (this.quickFilterColumns) {
      this.quickFilterColArray = Util.parseArray(this.quickFilterColumns, true);
    } else {
      this.quickFilterColArray = this.colArray;
    }
    let initialQueryLength = undefined;
    if (this.state.hasOwnProperty('queryRecordOffset')) {
      initialQueryLength = this.state.queryRecordOffset;
    }
    this.state.queryRecordOffset = 0;
    if (!this.state.hasOwnProperty('totalQueryRecordsNumber')) {
      this.state.totalQueryRecordsNumber = 0;
    }
    if (this.queryOnInit) {
      let queryArgs: OQueryDataArgs = {
        offset: 0,
        length: initialQueryLength || this.queryRows
      };
      this.queryData(void 0, queryArgs);
    }
  }

  ngAfterContentInit(): void {
    this.gridItems = this.inputGridItems.toArray();
    this.subscription.add(this.inputGridItems.changes.subscribe((queryChanges) => {
      this.gridItems = queryChanges._results;
    }));
  }

  ngAfterViewInit() {
    super.afterViewInit();
    if (Util.isDefined(this.searchInputComponent)) {
      this.registerQuickFilter(this.searchInputComponent);
    }
    this.setGridItemDirectivesData();
  }

  ngAfterViewChecked(): void {
    this.subscription.add(this.media.subscribe((change: MediaChange) => {
      switch (change.mqAlias) {
        case 'xs':
        case 'sm':
          this._colsDefault = 1;
          break;
        case 'md':
          this._colsDefault = 2;
          break;
        case 'lg':
        case 'xl':
          this._colsDefault = 4;
      }
    }));
  }

  public ngOnChanges(changes: { [propName: string]: SimpleChange }) {
    if (typeof (changes['staticData']) !== 'undefined') {
      this.dataResponseArray = changes['staticData'].currentValue;
      let filter = (this.state && this.state.filterValue) ? this.state.filterValue : undefined;
      this.filterData(filter);
    }
  }

  protected setGridItemDirectivesData() {
    var self = this;
    this.gridItemDirectives.changes.subscribe(() => {
      this.gridItemDirectives.toArray().forEach((element: OGridItemDirective, index) => {
        element.setItemData(self.dataResponseArray[index]);
        element.setGridComponent(self);
        self.registerGridItem(element);
      });
    });
  }

  reloadData() {
    if (!this.pageable) {
      this.filterData();
    } else {
      let queryArgs: OQueryDataArgs = {};
      this.state.queryRecordOffset = 0;
      queryArgs = {
        length: Math.max(this.queryRows, this.dataResponseArray.length),
        replace: true
      };
      this.queryData(void 0, queryArgs);
    }
  }

  registerQuickFilter(input: OSearchInputComponent) {
    this.quickFilterComponent = input;
    if (Util.isDefined(this.quickFilterComponent)) {
      if (this.state.hasOwnProperty('filterValue')) {
        this.quickFilterComponent.setValue(this.state.filterValue);
      }
      const self = this;
      this.quickFilterComponent.onSearch.subscribe(val => self.filterData(val));
    }
  }

  /**
   * Filters data locally
   * @param value the filtering value
   */
  filterData(value?: string): void {
    value = Util.isDefined(value) ? value : Util.isDefined(this.quickFilterComponent) ? this.quickFilterComponent.getValue() : void 0;
    if (this.state) {
      this.state.filterValue = value;
    }
    if (this.pageable) {
      let queryArgs: OQueryDataArgs = {
        offset: 0,
        length: this.queryRows,
        replace: true
      };
      this.queryData(void 0, queryArgs);
    } else if (this.dataResponseArray && this.dataResponseArray.length > 0) {
      let filteredData = this.dataResponseArray.slice(0);
      if (value && value.length > 0) {
        var self = this;
        filteredData = filteredData.filter(item => {
          return self.quickFilterColArray.some(col => {
            return new RegExp('^' + Util.normalizeString(this.configureFilterValue(value)).split('*').join('.*') + '$').test(Util.normalizeString(item[col]));
          });
        });
      }
      if (this.sortColArray && this.sortColArray.length) {
        // Simple sorting
        this.sortColArray.forEach((sort: ISQLOrder) => {
          let factor = (sort.ascendent ? 1 : -1);
          filteredData = filteredData.sort((a, b) => (Util.normalizeString(a[sort.columnName]) > Util.normalizeString(b[sort.columnName])) ? (1 * factor) : (Util.normalizeString(b[sort.columnName]) > Util.normalizeString(a[sort.columnName])) ? (-1 * factor) : 0);
        });
      }
      this.setDataArray(filteredData.splice(0, this.queryRows));
    } else {
      this.setDataArray(this.dataResponseArray);
    }
  }



  // renderData() {
  //   let data = this.dataArray;
  //   if (this.quickFilterComponent) {
  //     data = this.filterData(this.quickFilterComponent.getValue());
  //   }
  //   data = this.sortedData(data);
  //   data = Object.assign([], data);
  //   data = this.paginatedData(data);
  //   this.setDataArray(data);
  // }

  protected setData(data: any, sqlTypes?: any, replace?: boolean) {
    if (Util.isArray(data)) {
      let respDataArray = data;
      if (this.pageable && !replace) {
        respDataArray = (this.dataResponseArray || []).concat(data);
      }
      this.dataResponseArray = respDataArray;
      if (!this.pageable) {
        this.filterData(this.state.filterValue);
      } else {
        this.setDataArray(this.dataResponseArray);
      }
    } else {
      this.setDataArray([]);
    }
    if (this.loaderSubscription) {
      this.loaderSubscription.unsubscribe();
    }
    if (this.pageable) {
      ObservableWrapper.callEmit(this.onPaginatedDataLoaded, data);
    }
    ObservableWrapper.callEmit(this.onDataLoaded, this.dataResponseArray);
  }

  // /** Returns a sorted copy of the database data. */
  // protected sortedData(data: any[]): any[] {
  //   if (!this.sortColumn) {
  //     return data;
  //   }
  //   return data.sort(this.sortFunction.bind(this));
  // }

  // /** Returns a sorted copy of the database data. */
  // protected paginatedData(data: any[]): any[] {
  //   return data.splice(0, this.queryRows);
  // }

  // protected sortFunction(a: any, b: any) {
  //   let propertyA: number | string = '';
  //   let propertyB: number | string = '';
  //   [propertyA, propertyB] = [a[this.sortColumn], b[this.sortColumn]];

  //   let valueA = typeof propertyA === 'undefined' ? '' : propertyA === '' ? propertyA : isNaN(+propertyA) ? propertyA.toString().trim().toLowerCase() : +propertyA;
  //   let valueB = typeof propertyB === 'undefined' ? '' : propertyB === '' ? propertyB : isNaN(+propertyB) ? propertyB.toString().trim().toLowerCase() : +propertyB;
  //   return (valueA <= valueB ? -1 : 1);
  // }

  configureFilterValue(value: string) {
    let returnVal = value;
    if (value && value.length > 0) {
      if (!value.startsWith('*')) {
        returnVal = '*' + returnVal;
      }
      if (!value.endsWith('*')) {
        returnVal = returnVal + '*';
      }
    }
    return returnVal;
  }

  registerGridItem(item: OGridItemDirective) {
    if (item) {
      var self = this;
      if (self.detailMode === Codes.DETAIL_MODE_CLICK) {
        item.onClick(gridItem => self.onItemDetailClick(gridItem));
      }
      if (Codes.isDoubleClickMode(self.detailMode)) {
        item.onDoubleClick(gridItem => self.onItemDetailDblClick(gridItem));
      }
    }
  }

  public onItemDetailClick(item: OGridItemDirective) {
    if (this.oenabled && this.detailMode === Codes.DETAIL_MODE_CLICK) {
      this.saveDataNavigationInLocalStorage();
      this.viewDetail(item.getItemData());
      ObservableWrapper.callEmit(this.onClick, item);
    }
  }

  public onItemDetailDblClick(item: OGridItemDirective) {
    if (this.oenabled && Codes.isDoubleClickMode(this.detailMode)) {
      this.saveDataNavigationInLocalStorage();
      this.viewDetail(item.getItemData());
      ObservableWrapper.callEmit(this.onDoubleClick, item);
    }
  }

  ngOnDestroy() {
    this.destroy();
  }

  destroy() {
    super.destroy();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadMore() {
    if (this.pageable) {
      let queryArgs: OQueryDataArgs = {
        offset: this.state.queryRecordOffset,
        length: this.queryRows
      };
      this.queryData(void 0, queryArgs);
    } else {
      this.dataArray = this.dataArray.concat(this.dataResponseArray.slice(this.dataArray.length, (this.dataArray.length + this.queryRows)));
    }
  }

  get totalRecords(): number {
    if (this.pageable) {
      return this.getTotalRecordsNumber();
    }
    return this.dataResponseArray.length;
  }

  getComponentFilter(existingFilter: any = {}): any {
    let filter = existingFilter;
    // Apply quick filter
    if (this.pageable && Util.isDefined(this.quickFilterComponent)) {
      const searchValue = this.quickFilterComponent.getValue();
      if (Util.isDefined(searchValue)) {
        filter[FilterExpressionUtils.BASIC_EXPRESSION_KEY] = FilterExpressionUtils.buildArrayExpressionLike(this.quickFilterColArray, searchValue);
      }
    }
    return super.getComponentFilter(filter);
  }

  getQueryArguments(filter: Object, ovrrArgs?: OQueryDataArgs): Array<any> {
    let queryArguments = super.getQueryArguments(filter, ovrrArgs);
    queryArguments[6] = this.sortColArray;
    return queryArguments;
  }

  parseSortColumns() {
    let sortColumnsParam = this.state['sort-columns'] || this.sortColumn;
    this.sortColArray = ServiceUtils.parseSortColumns(sortColumnsParam);
    for (let i = this.sortColArray.length - 1; i >= 0; i--) {
      const colName = this.sortColArray[i].columnName;
      if (this.colArray.indexOf(colName) === -1) {
        this.sortColArray.splice(i, 1);
      }
    }
  }

}

@NgModule({
  declarations: [OGridComponent, OGridItemDirective],
  imports: [CommonModule, OGridItemModule, OSearchInputModule, OSharedModule, RouterModule],
  exports: [OGridComponent, OGridItemComponent, OGridItemDirective],
  entryComponents: [OGridItemComponent]
})
export class OGridModule { }
