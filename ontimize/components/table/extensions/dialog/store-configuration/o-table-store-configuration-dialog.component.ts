import { Component, ViewChild, } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MatListOption, MatSelectionList } from '@angular/material';

// import { ITableFiltersStatus } from '../../o-table-storage.class';

@Component({
  selector: 'o-table-store-configuration-dialog',
  templateUrl: './o-table-store-configuration-dialog.component.html',
  styleUrls: ['./o-table-store-configuration-dialog.component.scss']
})
export class OTableStoreConfigurationDialogComponent {

  @ViewChild('propertiesList')
  propertiesList: MatSelectionList;

  properties: Array<any> = [{
    property: 'sort',
    name: 'TABLE.DIALOG.PROPERTIES.SORT',
  }, {
    property: 'columns-display',
    name: 'TABLE.DIALOG.PROPERTIES.COLUMNS_DISPLAY'
  }, {
    property: 'quick-filter',
    name: 'TABLE.DIALOG.PROPERTIES.QUICK_FILTER'
  }, {
    property: 'columns-filter',
    name: 'TABLE.DIALOG.PROPERTIES.COLUMNS_FILTER'
  }, {
    property: 'page',
    name: 'TABLE.DIALOG.PROPERTIES.PAGE'
  }];

  formGroup: FormGroup = new FormGroup({
    name: new FormControl('', [
      Validators.required
    ]),
    description: new FormControl('')
  });

  constructor(
    public dialogRef: MatDialogRef<OTableStoreConfigurationDialogComponent>
  ) { }

  getConfigurationAttributes(): any {
    return this.formGroup.value;
  }

  getSelectedTableProperties(): any[] {
    let selected: MatListOption[] = this.propertiesList.selectedOptions.selected;
    return selected.length ? selected.map(item => item.value) : [];
  }
}
