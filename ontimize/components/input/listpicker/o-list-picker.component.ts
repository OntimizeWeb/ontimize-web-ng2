import { AfterViewInit, Component, ElementRef, EventEmitter, forwardRef, Inject, Injector, OnDestroy, OnInit, OnChanges, Optional, NgModule, SimpleChange, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogConfig, MatDialogRef, MatInput } from '@angular/material';

import { OSharedModule } from '../../../shared';
import { OntimizeService } from '../../../services';
import { InputConverter } from '../../../decorators';
import { OFormComponent } from '../../form/o-form.component';
import { ODialogModule } from '../../dialog/o-dialog.component';
import { OFormValue } from '../../form/OFormValue';
import { OFormServiceComponent } from '../o-form-service-component.class';
import { dataServiceFactory } from '../../../services/data-service.provider';
import { OListPickerDialogComponent } from './o-list-picker-dialog.component';
import { OSearchInputModule } from '../../input/search-input/o-search-input.component';
import { OValueChangeEvent } from '../../o-form-data-component.class';

export const DEFAULT_INPUTS_O_LIST_PICKER = [
  ...OFormServiceComponent.DEFAULT_INPUTS_O_FORM_SERVICE_COMPONENT,
  'filter',
  'dialogWidth : dialog-width',
  'dialogHeight : dialog-height',
  'queryRows: query-rows',
  'textInputEnabled: text-input-enabled'
];

export const DEFAULT_OUTPUTS_O_LIST_PICKER = [
  ...OFormServiceComponent.DEFAULT_OUTPUTS_O_FORM_SERVICE_COMPONENT,
  'onFocus',
  'onBlur'
];

@Component({
  moduleId: module.id,
  selector: 'o-list-picker',
  templateUrl: './o-list-picker.component.html',
  styleUrls: ['./o-list-picker.component.scss'],
  providers: [
    { provide: OntimizeService, useFactory: dataServiceFactory, deps: [Injector] },
    { provide: OFormServiceComponent, useExisting: forwardRef(() => OListPickerComponent) }
  ],
  inputs: DEFAULT_INPUTS_O_LIST_PICKER,
  outputs: DEFAULT_OUTPUTS_O_LIST_PICKER
})
export class OListPickerComponent extends OFormServiceComponent implements AfterViewInit, OnChanges, OnDestroy, OnInit {

  public static DEFAULT_INPUTS_O_LIST_PICKER = DEFAULT_INPUTS_O_LIST_PICKER;
  public static DEFAULT_OUTPUTS_O_LIST_PICKER = DEFAULT_OUTPUTS_O_LIST_PICKER;

  /* Inputs */
  @InputConverter()
  protected filter: boolean = true;
  protected dialogWidth: string;
  protected dialogHeight: string = '55%';
  @InputConverter()
  protected queryRows: number;
  @InputConverter()
  textInputEnabled: boolean = true;
  /* End inputs */

  protected matDialog: MatDialog;
  protected dialogRef: MatDialogRef<OListPickerDialogComponent>;

  @ViewChild('inputModel') protected inputModel: MatInput;
  @ViewChild('visibleInput') protected visibleInput: ElementRef;
  protected visibleInputValue: any;

  onChange: EventEmitter<Object> = new EventEmitter<Object>();
  onFocus: EventEmitter<Object> = new EventEmitter<Object>();
  onBlur: EventEmitter<Object> = new EventEmitter<Object>();

  protected blurTimer;
  protected blurDelay = 200;
  protected blurPrevent = false;

  constructor(
    @Optional() @Inject(forwardRef(() => OFormComponent)) form: OFormComponent,
    elRef: ElementRef,
    injector: Injector) {
    super(form, elRef, injector);
    this.matDialog = this.injector.get(MatDialog);
  }

  ngOnInit(): any {
    this.initialize();
  }

  ngOnChanges(changes: { [propName: string]: SimpleChange }) {
    super.ngOnChanges(changes);
    if (typeof (changes['staticData']) !== 'undefined') {
      this.cacheQueried = true;
      this.setDataArray(changes['staticData'].currentValue);
    }
  }

  ensureOFormValue(value: any) {
    super.ensureOFormValue(value);
    this.syncDataIndex();
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    if (this.queryOnInit) {
      this.queryData();
    } else if (this.queryOnBind) {
      // TODO do it better. When changing tabs it is necessary to invoke new query
      this.syncDataIndex();
    }
  }

  getDescriptionValue() {
    let descTxt = '';
    if (this.descriptionColArray && this._currentIndex !== undefined) {
      var self = this;
      this.descriptionColArray.forEach((descCol, index) => {
        let txt = self.dataArray[self._currentIndex][descCol];
        if (txt) {
          descTxt += txt;
        }
        if (index < self.descriptionColArray.length - 1) {
          descTxt += self.separator;
        }
      });
    }
    return descTxt;
  }

  innerOnChange(event: any) {
    if (!this.value) {
      this.value = new OFormValue();
    }
    this.ensureOFormValue(event);
    this.onChange.emit(event);
  }

  onClickClear(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    if (!this.isReadOnly && !this.isDisabled) {
      clearTimeout(this.blurTimer);
      this.blurPrevent = true;
      this.setValue(undefined);
    }
  }

  onClickInput(e: Event): void {
    if (!this.textInputEnabled) {
      this.onClickListpicker(e);
    }
  }

  onClickListpicker(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    if (!this.isReadOnly && !this.isDisabled) {
      clearTimeout(this.blurTimer);
      this.openDialog();
    }
  }

  protected openDialog() {
    let cfg: MatDialogConfig = {
      role: 'dialog',
      disableClose: false,
      panelClass: 'cdk-overlay-list-picker',
      data: {
        data: this.getDialogDataArray(this.dataArray),
        filter: this.filter,
        searchVal: this.visibleInputValue,
        visibleColumns: this.visibleColArray,
        queryRows: this.queryRows
      }
    };
    if (this.dialogWidth !== undefined) {
      cfg.width = this.dialogWidth;
    }
    if (this.dialogHeight !== undefined) {
      cfg.height = this.dialogHeight;
    }
    this.dialogRef = this.matDialog.open(OListPickerDialogComponent, cfg);

    this.dialogRef.afterClosed().subscribe(result => {
      this.onDialogClose(result);
    });
  }

  protected getDialogDataArray(dataArray: Array<any>): Array<any> {
    let result: Array<any> = [];
    const self = this;
    dataArray.forEach((item, itemIndex) => {
      let element = '';
      self.visibleColArray.forEach((visibleCol, index) => {
        element += item[visibleCol];
        if ((index + 1) < self.visibleColArray.length) {
          element += self.separator;
        }
      });
      let newItem = Object.assign({}, item);
      newItem['_parsedVisibleColumnText'] = element;
      newItem['_parsedIndex'] = itemIndex;
      result.push(newItem);
    });
    return result;
  }

  onDialogClose(evt: any) {
    this.dialogRef = null;
    this.visibleInputValue = undefined;
    if (evt instanceof Object && typeof evt[this.valueColumn] !== 'undefined') {
      var self = this;
      window.setTimeout(() => {
        self.setValue(evt[self.valueColumn], { changeType: OValueChangeEvent.USER_CHANGE });
      if (self._fControl) {
        self._fControl.markAsTouched();
      }
    }, 0);
  }
}

innerOnFocus(evt: any) {
  if (!this.isReadOnly && !this.isDisabled) {
    this.onFocus.emit(evt);
  }
}

innerOnBlur(evt: any) {
  if (!this.isReadOnly && !this.isDisabled) {
    const self = this;
    this.blurTimer = setTimeout(() => {
      if (!self.blurPrevent) {
        self._fControl.markAsTouched();
        self.onBlur.emit(evt);
        if (self.visibleInputValue !== undefined && self.visibleInputValue.length > 0) {
          self.openDialog();
        } else if (self.visibleInputValue !== undefined) {
          self.setValue(undefined);
          self.visibleInputValue = undefined;
        } else {
          self._fControl.markAsTouched();
          self.onBlur.emit(evt);
        }
      }
      self.blurPrevent = false;
    }, this.blurDelay);
  }
}

onVisibleInputChange(event: any) {
  this.visibleInputValue = event.target.value;
}

onKeydownEnter(val: any) {
  clearTimeout(this.blurTimer);
  this.blurPrevent = true;
  this.visibleInputValue = val;
  this.openDialog();
}
}

@NgModule({
  declarations: [OListPickerDialogComponent, OListPickerComponent],
  imports: [OSharedModule, CommonModule, ODialogModule, OSearchInputModule],
  exports: [OListPickerComponent],
  entryComponents: [OListPickerDialogComponent]
})
export class OListPickerModule {
}
