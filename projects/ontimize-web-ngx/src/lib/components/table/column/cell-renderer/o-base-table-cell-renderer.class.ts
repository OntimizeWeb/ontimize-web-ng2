import { AfterContentInit, Injector, PipeTransform, TemplateRef } from '@angular/core';

import { OTableColumn } from '../../../../interfaces/o-table-column.interface';
import { Util } from '../../../../util/util';
import { OTableComponent } from '../../o-table.component';

// import { OTableColumnComponent } from '../o-table-column.component';

export class OBaseTableCellRenderer implements AfterContentInit {

  public static INPUTS_ARRAY = [
    'filterSource: filter-source',
    'filterFunction: filter-function'
  ];

  public templateref: TemplateRef<any>;
  public tableColumn: OTableColumn;
  public _filterSource: 'render' | 'data' | 'both' = 'render';
  public filterFunction: (cellValue: any, rowValue: any, quickFilter?: string) => boolean;

  protected type: string;
  protected pipeArguments: any;
  protected componentPipe: PipeTransform;

  constructor(protected injector: Injector) {
    // this.tableColumn = this.injector.get(OTableColumnComponent);
  }

  public ngAfterContentInit(): void {
    if (typeof this.filterFunction !== 'function') {
      this.filterFunction = undefined;
    }
    this.registerRenderer();
  }

  get table(): OTableComponent {
    return this.tableColumn.table;
  }

  get column(): string {
    return this.tableColumn.attr;
  }

  public registerRenderer(): void {
    this.tableColumn.registerRenderer(this);
    if (!Util.isDefined(this.type) && Util.isDefined(this.tableColumn.type)) {
      this.type = this.tableColumn.type;
    }
  }

  /**
   * Returns the displayed table cell value
   * @param cellvalue the internal table cell value
   * @param rowvalue the table row value
   */
  public getCellData(cellvalue: any, rowvalue?: any): string {
    let parsedValue: string;
    if (this.componentPipe && this.pipeArguments !== undefined && cellvalue !== undefined) {
      parsedValue = this.componentPipe.transform(cellvalue, this.pipeArguments);
    } else {
      parsedValue = cellvalue;
    }
    return parsedValue;
  }

  public getTooltip(cellValue: any, rowValue: any): string {
    return this.getCellData(cellValue, rowValue);
  }

  set filterSource(val: string) {
    const lowerVal = (val || '').toLowerCase();
    this._filterSource = (lowerVal === 'render' || lowerVal === 'data' || lowerVal === 'both') ? lowerVal : 'render';
  }

  get filterSource(): string {
    return this._filterSource;
  }

  getFilter(cellValue: any, rowValue?: any): any[] {
    let result;
    switch (this.filterSource) {
      case 'render':
        result = [this.getCellData(cellValue, rowValue)];
        break;
      case 'data':
        result = [cellValue];
        break;
      case 'both':
        result = [cellValue, this.getCellData(cellValue, rowValue)];
        break;
    }
    return result;
  }

}
