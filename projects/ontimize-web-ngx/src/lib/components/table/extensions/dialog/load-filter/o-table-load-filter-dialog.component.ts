import { Component, EventEmitter, Inject, Injector, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatListOption, MatSelectionList } from '@angular/material';
import { SelectionModel } from '@angular/cdk/collections';

import { ITableFiltersStatus } from '../../o-table-storage.class';
import { DialogService } from '../../../../../services/dialog.service';

@Component({
  moduleId: module.id,
  selector: 'o-table-load-filter-dialog',
  templateUrl: './o-table-load-filter-dialog.component.html',
  styleUrls: ['./o-table-load-filter-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OTableLoadFilterDialogComponent implements OnInit {

  @ViewChild(MatSelectionList, {static: false}) filterList: MatSelectionList;

  filters: Array<ITableFiltersStatus> = [];

  onDelete: EventEmitter<string> = new EventEmitter();

  protected dialogService: DialogService;
  protected cd: ChangeDetectorRef;

  constructor(
    public dialogRef: MatDialogRef<OTableLoadFilterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: Array<ITableFiltersStatus>,
    protected injector: Injector
  ) {
    this.loadFilters(data);
    this.dialogService = this.injector.get(DialogService);
    try {
      this.cd = this.injector.get(ChangeDetectorRef);
    } catch (e) {
      // no parent form
    }
  }

  ngOnInit(): void {
    this.filterList.selectedOptions = new SelectionModel<MatListOption>(false);
  }

  loadFilters(filters: Array<ITableFiltersStatus>): void {
    this.filters = filters;
  }

  getSelectedFilterName(): string {
    const selected: MatListOption[] = this.filterList.selectedOptions.selected;
    return selected.length ? selected[0].value : void 0;
  }

  removeFilter(filterName: string): void {
    this.dialogService.confirm('CONFIRM', 'TABLE.DIALOG.CONFIRM_REMOVE_FILTER').then(result => {
      if (result) {
        this.onDelete.emit(filterName);
        this.cd.detectChanges();
      }
    });
  }

}
