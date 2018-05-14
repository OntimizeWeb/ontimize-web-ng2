import { Component, OnInit, Inject, forwardRef, EventEmitter, Injector, ViewEncapsulation, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { MatCheckboxChange, MatMenu } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { Util } from '../../../../../utils';
import { OTableComponent, OColumn, OTableOptions } from '../../../o-table.component';
import { IFilterExpression, FilterExpressionUtils } from '../../../../filter-expression.utils';

export const DEFAULT_INPUTS_O_TABLE_QUICKFILTER = [
];

export const DEFAULT_OUTPUTS_O_TABLE_QUICKFILTER = [
  'onChange'
];

@Component({
  selector: 'o-table-quickfilter',
  templateUrl: './o-table-quickfilter.component.html',
  styleUrls: ['./o-table-quickfilter.component.scss'],
  inputs: DEFAULT_INPUTS_O_TABLE_QUICKFILTER,
  outputs: DEFAULT_OUTPUTS_O_TABLE_QUICKFILTER,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.o-table-quickfilter]': 'true',
  }
})

export class OTableQuickfilterComponent implements OnInit, AfterViewInit, OnDestroy {
  public static DEFAULT_INPUTS_O_TABLE_QUICKFILTER = DEFAULT_INPUTS_O_TABLE_QUICKFILTER;
  public static DEFAULT_OUTPUTS_O_TABLE_QUICKFILTER = DEFAULT_OUTPUTS_O_TABLE_QUICKFILTER;

  @ViewChild('filter') filter: ElementRef;
  @ViewChild('menu') matMenu: MatMenu;
  protected quickFilterObservable: Subscription;

  value: string;
  onChange: EventEmitter<Object> = new EventEmitter<Object>();

  constructor(
    protected injector: Injector,
    @Inject(forwardRef(() => OTableComponent)) protected table: OTableComponent
  ) {
  }

  public ngOnInit() {
    this.table.registerQuickFilter(this);
    // workaround because 'x-position="before"' was not working in the template
    this.matMenu.xPosition = 'before';
  }

  ngAfterViewInit() {
    this.initializeEventFilter();
  }

  get filterExpression(): IFilterExpression {
    let result: IFilterExpression = this.getUserFilter();
    if (!Util.isDefined(result) && Util.isDefined(this.value) && this.value.length > 0) {
      let queryCols = [];
      this.oTableOptions.columns.map((oCol: OColumn) => {
        if (oCol.searching && oCol.visible && !oCol.renderer) {
          queryCols.push(oCol.attr);
        }
      });
      result = FilterExpressionUtils.buildArrayExpressionLike(queryCols, this.value);
    }
    return result;
  }

  getUserFilter() {
    let result: IFilterExpression = undefined;
    if (this.table.quickFilterCallback instanceof Function) {
      let userFilter = this.table.quickFilterCallback(this.value);
      if (Util.isDefined(userFilter) && FilterExpressionUtils.instanceofFilterExpression(userFilter)) {
        result = (userFilter as IFilterExpression);
      } else if (Util.isDefined(userFilter)) {
        result = FilterExpressionUtils.buildExpressionFromObject(userFilter);
      }
    }
    return result;
  }

  initializeEventFilter() {
    if (this.filter && !this.quickFilterObservable) {
      this.quickFilterObservable = Observable.fromEvent(this.filter.nativeElement, 'keyup')
        .debounceTime(150).distinctUntilChanged().subscribe(() => {
          const filterValue = this.filter.nativeElement.value;
          if (!this.table.dataSource || this.value === filterValue) {
            return;
          }
          this.setValue(filterValue);
          this.onChange.emit(this.value);
        });

      // if exists filter value in storage then filter result table
      let filterValue = this.value || this.filter.nativeElement.value;
      this.filter.nativeElement.value = filterValue;
      if (this.table.dataSource && filterValue && filterValue.length) {
        this.table.dataSource.quickFilter = filterValue;
      }
    }
  }

  ngOnDestroy(): void {
    if (this.quickFilterObservable) {
      this.quickFilterObservable.unsubscribe();
    }
  }

  setValue(value: any) {
    this.value = value;
    if (this.table && this.table.dataSource) {
      this.table.dataSource.quickFilter = this.value;
    }
  }

  get oTableOptions(): OTableOptions {
    return this.table.oTableOptions;
  }

  get quickFilterColumns(): Array<OColumn> {
    return this.table.oTableOptions.columns.filter((oCol) => {
      return oCol.searchable && oCol.visible && !Util.isDefined(oCol.renderer);
    });
  }

  onMenuClosed() {
    this.setValue(this.value);
    this.onChange.emit(this.value);
  }

  isChecked(column: OColumn): boolean {
    return column.searching;
  }

  onCheckboxChange(column: OColumn, event: MatCheckboxChange) {
    column.searching = event.checked;
  }

  showCaseSensitiveCheckbox(): boolean {
    return !this.table.pageable;
  }

  areAllColumnsChecked(): boolean {
    let result: boolean = true;
    this.quickFilterColumns.forEach((col: OColumn) => {
      result = result && col.searching;
    });
    return result;
  }

  onSelectAllChange(event: MatCheckboxChange) {
    this.quickFilterColumns.forEach((col: OColumn) => {
      col.searching = event.checked;
    });
  }
}
