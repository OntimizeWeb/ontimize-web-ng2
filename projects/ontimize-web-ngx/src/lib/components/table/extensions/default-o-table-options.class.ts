import { OTableOptions } from '../../../interfaces/o-table-options.interface';
import { OColumn } from '../column/o-column.class';
import { OTableComponent } from '../o-table.component';

export class DefaultOTableOptions implements OTableOptions {

  columns: Array<OColumn> = [];
  filter: boolean = true;
  filterCaseSensitive: boolean = false;

  protected _visibleColumns: Array<any> = [];
  protected _selectColumn: OColumn;

  get visibleColumns(): Array<any> {
    return this._visibleColumns;
  }

  set visibleColumns(arg: Array<any>) {
    this._visibleColumns = arg;
    this.columns.forEach((oCol: OColumn) => {
      oCol.visible = this._visibleColumns.indexOf(oCol.attr) !== -1;
    });
  }

  get columnsInsertables(): Array<string> {
    return this._visibleColumns.map((col: string) => {
      return col + OTableComponent.SUFFIX_COLUMN_INSERTABLE;
    });
  }

  get selectColumn(): OColumn {
    return this._selectColumn;
  }

  set selectColumn(val: OColumn) {
    this._selectColumn = val;
    this.selectColumn.name = OTableComponent.NAME_COLUMN_SELECT;
    this.selectColumn.title = '';
    this.selectColumn.visible = false;
  }
}
