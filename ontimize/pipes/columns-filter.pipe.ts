import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'columnsfilter'
})

export class ColumnsFilterPipe implements PipeTransform {

  filterValue: string;
  filterColumns: Array<string>;

  public transform(value: Array<any>, args: any): any {
    if (!args || args.length <= 1) {
      return value;
    }

    this.filterValue = args['filtervalue'] ? args['filtervalue'] : '';
    this.filterColumns = args['filtercolumns'];

    if (!this.filterColumns || !this.filterValue || this.filterValue.length === 0) {
      return value;
    }

    if (value === undefined || value === null) {
      return value;
    }

    let that = this;
    return value.filter((item) => {
      for (let i = 0; i < that.filterColumns.length; i++) {
        let colName = that.filterColumns[i];
        if (this._isBlank(colName)) {
          continue;
        }
        let origValue = item[colName];
        if (origValue) {
          origValue = origValue.toString();
          if (this._isBlank(origValue)) {
            continue;
          }

          if (origValue.toUpperCase().indexOf(that.filterValue.toUpperCase()) > -1) {
            return item;
          }
        }
      }
    });
  }

  _isBlank(value: string): boolean {
    if (value === undefined || value === null
      || value.length === 0) {
      return true;
    }
    return false;
  }

}
