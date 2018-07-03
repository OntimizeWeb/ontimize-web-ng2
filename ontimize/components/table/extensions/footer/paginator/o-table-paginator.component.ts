import { Inject, Injector, Injectable, forwardRef } from '@angular/core';
import { MatPaginatorIntl, MatPaginator } from '@angular/material';
import { OTranslateService } from '../../../../../services';
import { OTableComponent } from '../../../o-table.component';

export class OTablePaginator {

  protected _pageLenght: number = 0;
  protected _pageIndex: number = 0;
  protected _pageSize: number = 10;
  protected _pageSizeOptions: Array<any>;
  protected matpaginator: MatPaginator;

  constructor(
    protected injector: Injector,
    @Inject(forwardRef(() => OTableComponent)) protected table: OTableComponent
  ) {
    this._pageIndex = 0;
    this._pageSizeOptions = [10, 25, 50, 100];
    this.matpaginator = this.table.matpaginator;

    this.pageSize = this.table.queryRows;
    this.pageIndex = this.table.currentPage;
  }

  get pageLenght(): number {
    return this.pageLenght;
  }

  set pageLenght(value: number) {
    this._pageLenght = value;
  }

  get pageIndex(): number {
    return this._pageIndex;
  }

  set pageIndex(value: number) {
    this._pageIndex = value;
    if (this.matpaginator && !this.table.pageable) {
      this.matpaginator.pageIndex = this._pageIndex;
    }
  }

  get pageSize(): number {
    return this._pageSize;
  }

  set pageSize(value: number) {
    if (value < 0) {
      this._pageSize = this._pageSizeOptions[0];
    } else {
      this._pageSize = value;
    }

    let result: any[] = this.pageSizeOptions.filter(option => option === this._pageSize);
    if (result.length === 0) {
      this._pageSizeOptions.push(value);
    }
  }

  get pageSizeOptions(): Array<any> {
    return this._pageSizeOptions;
  }

  set pageSizeOptions(value: Array<any>) {
    this._pageSizeOptions = value;
  }

  public initialize() {
    this._pageIndex = 0;
  }

  public isShowingAllRows(selectedLength): boolean {
    return this._pageSizeOptions.indexOf(selectedLength) === (this._pageSizeOptions.length - 1);
  }
}

@Injectable()
export class OTableMatPaginatorIntl extends MatPaginatorIntl {

  itemsPerPageLabel;
  nextPageLabel;
  previousPageLabel;
  translateService: OTranslateService;
  protected onLanguageChangeSubscribe: any;

  constructor(protected injector: Injector) {
    super();
    this.translateService = this.injector.get(OTranslateService);
    this.itemsPerPageLabel = this.translateService.get('TABLE.PAGINATE.ITEMSPERPAGELABEL');
    this.nextPageLabel = this.translateService.get('TABLE.PAGINATE.NEXT');
    this.previousPageLabel = this.translateService.get('TABLE.PAGINATE.PREVIOUS');
    this.getRangeLabel = this.getORangeLabel;

    this.onLanguageChangeSubscribe = this.translateService.onLanguageChanged.subscribe(res => {
      this.itemsPerPageLabel = this.translateService.get('TABLE.PAGINATE.ITEMSPERPAGELABEL');
      this.nextPageLabel = this.translateService.get('TABLE.PAGINATE.NEXT');
      this.previousPageLabel = this.translateService.get('TABLE.PAGINATE.PREVIOUS');
      this.getRangeLabel = this.getORangeLabel;
    });
  }

  getORangeLabel(page: number, pageSize: number, length: number): string {
    if (!isNaN(pageSize) && (length === 0 || pageSize === 0)) {
      return `0  ${this.translateService.get('TABLE.PAGINATE.RANGE_LABEL')} ${length}`;
    }
    length = Math.max(length, 0);
    let startIndex = page * pageSize;
    // If the start index exceeds the list length, do not try and fix the end index to the end.
    let endIndex = startIndex < length ?
      Math.min(startIndex + pageSize, length) :
      startIndex + pageSize;

    //option show all
    if (isNaN(pageSize)) {
      startIndex = 0;
      endIndex = length;
    }

    return `${startIndex + 1} - ${endIndex}  ${this.translateService.get('TABLE.PAGINATE.RANGE_LABEL')} ${length}`;
  }

}
