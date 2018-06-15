import { Injector, ElementRef, OnInit, OnDestroy, QueryList, ViewChildren, AfterViewInit, HostBinding } from '@angular/core';
import { FormControl, FormGroup, Validators, ValidatorFn } from '@angular/forms';
import { MatSuffix } from '@angular/material';

import { InputConverter } from '../decorators';
import { SQLTypes } from '../utils';

import { OBaseComponent, IComponent } from './o-component.class';
import { OFormComponent } from './form/o-form.component';
import { OFormValue, IFormValueOptions } from './form/OFormValue';

export interface IMultipleSelection extends IComponent {
  getSelectedItems(): Array<any>;
  setSelectedItems(values: Array<any>);
}

export interface IFormDataTypeComponent extends IComponent {
  getSQLType(): number;
}

export interface IFormControlComponent extends IComponent {
  getControl(): FormControl;
  getFormControl(): FormControl;
  hasError(error: string): boolean;
}

export interface IFormDataComponent extends IFormControlComponent {
  data(value: any);
  isAutomaticBinding(): boolean;
  isAutomaticRegistering(): boolean;
}

export const DEFAULT_INPUTS_O_FORM_DATA_COMPONENT = [
  'oattr: attr',
  'olabel: label',
  'tooltip',
  'tooltipPosition: tooltip-position',
  'tooltipShowDelay: tooltip-show-delay',
  'data',
  'autoBinding: automatic-binding',
  'autoRegistering: automatic-registering',
  'oenabled: enabled',
  'orequired: required',
  // sqltype[string]: Data type according to Java standard. See SQLType ngClass. Default: 'OTHER'
  'sqlType: sql-type',
  'width',
  'readOnly: read-only',
  'showClear: show-clear'
];

export class OFormDataComponent extends OBaseComponent implements IFormDataComponent, IFormDataTypeComponent,
  OnInit, AfterViewInit, OnDestroy {

  /* Inputs */
  sqlType: string;
  @InputConverter()
  autoBinding: boolean = true;
  @InputConverter()
  autoRegistering: boolean = true;
  width: string;
  @InputConverter()
  showClear: boolean = false;

  @HostBinding('style.width')
  get hostWidth() {
    return this.width;
  }

  /* Internal variables */
  protected value: OFormValue;
  protected defaultValue: any = void 0;
  protected _SQLType: number = SQLTypes.OTHER;
  protected _defaultSQLTypeKey: string = 'OTHER';
  protected _fControl: FormControl;
  protected elRef: ElementRef;
  protected form: OFormComponent;

  @ViewChildren(MatSuffix)
  protected _matSuffixList: QueryList<MatSuffix>;
  matSuffixClass;

  constructor(
    form: OFormComponent,
    elRef: ElementRef,
    injector: Injector
  ) {
    super(injector);
    this.form = form;
    this.elRef = elRef;
  }

  ngOnInit() {
    this.initialize();
  }

  ngAfterViewInit(): void {
    if (this._matSuffixList) {
      this.setSuffixClass(this._matSuffixList.length);
      this._matSuffixList.changes.subscribe(() => {
        this.setSuffixClass(this._matSuffixList.length);
      });
    }
  }

  ngOnDestroy() {
    this.destroy();
  }

  getFormGroup(): FormGroup {
    return this.form ? this.form.formGroup : undefined;
  }

  getFormControl(): FormControl {
    return this._fControl;
  }

  hasError(error: string): boolean {
    return !this.isReadOnly && this._fControl && this._fControl.touched && this._fControl.hasError(error);
  }

  getErrorValue(error: string, prop: string): string {
    return this._fControl && this._fControl.hasError(error) ? this._fControl.getError(error)[prop] || '' : '';
  }

  initialize() {
    super.initialize();
    if (this.form) {
      this.registerFormListeners();
      this.isReadOnly = this.form.isInInitialMode();
    } else {
      this.isReadOnly = this._disabled;
    }
  }

  protected setSuffixClass(count: number) {
    const iconFieldEl = this.elRef.nativeElement.getElementsByClassName('icon-field');
    if (iconFieldEl.length === 1) {
      let classList = iconFieldEl[0].classList;
      classList.forEach(className => {
        if (className.startsWith('icon-field-')) {
          classList.remove(className);
        }
      });
      if (count > 0) {
        let matSuffixClass = `icon-field-${count}-suffix`;
        iconFieldEl[0].classList.add(matSuffixClass);
      }
    }
  }

  destroy() {
    this.unregisterFormListeners();
  }

  registerFormListeners() {
    if (this.form) {
      this.form.registerFormComponent(this);
      this.form.registerFormControlComponent(this);
      this.form.registerSQLTypeFormComponent(this);
    }
  }

  unregisterFormListeners() {
    if (this.form) {
      this.form.unregisterFormComponent(this);
      this.form.unregisterFormControlComponent(this);
      this.form.unregisterSQLTypeFormComponent(this);
    }
  }

  set data(value: any) {
    this.setData(value);
  }

  setData(value: any) {
    this.ensureOFormValue(value);
    if (this._fControl) {
      this._fControl.setValue(value.value, {
        emitModelToViewChange: false,
        emitEvent: false
      });
    }
  }

  isAutomaticBinding(): boolean {
    return this.autoBinding;
  }

  isAutomaticRegistering(): boolean {
    return this.autoRegistering;
  }

  getValue(): any {
    if (this.value instanceof OFormValue) {
      if (this.value.value !== undefined) {
        return this.value.value;
      }
    }
    return this.defaultValue;
  }

  setValue(val: any, options?: IFormValueOptions) {
    this.ensureOFormValue(val);
    if (this._fControl) {
      this._fControl.setValue(val, options);
      this._fControl.markAsDirty();
    }
  }

  /**
   * Clears the component value.
   */
  clearValue(): void {
    this.setValue(void 0);
  }

  get showClearButton(): boolean {
    return this.showClear && !this.isReadOnly && !this.isDisabled && this.getValue();
  }

  ensureOFormValue(value: any) {
    if (value instanceof OFormValue) {
      this.value = new OFormValue(value.value);
    } else if (value !== undefined && !(value instanceof OFormValue)) {
      this.value = new OFormValue(value);
    } else {
      this.value = new OFormValue(this.defaultValue);
    }
  }

  getControl(): FormControl {
    if (!this._fControl) {
      let validators: ValidatorFn[] = this.resolveValidators();
      let cfg = {
        value: this.value ? this.value.value : undefined,
        disabled: this.isDisabled
      };
      this._fControl = new FormControl(cfg, validators);
    }
    return this._fControl;
  }

  resolveValidators(): ValidatorFn[] {
    let validators: ValidatorFn[] = [];

    if (this.orequired) {
      validators.push(Validators.required);
    }
    return validators;
  }

  getSQLType(): number {
    let sqlt = this.sqlType && this.sqlType.length > 0 ? this.sqlType : this._defaultSQLTypeKey;
    this._SQLType = SQLTypes.getSQLTypeValue(sqlt);
    return this._SQLType;
  }

  get isValid() {
    if (this._fControl) {
      return this._fControl.valid;
    }
    return false;
  }

  isEmpty(): boolean {
    if (this.value instanceof OFormValue) {
      if (this.value.value !== undefined) {
        return false;
      }
    }
    return true;
  }

  set disabled(value: boolean) {
    this._disabled = value;
    if (this._fControl && value) {
      this._fControl.disable();
    } else if (this._fControl) {
      this._fControl.enable();
    }
  }

  get elementRef(): ElementRef {
    return this.elRef;
  }

  get hasCustomWidth(): boolean {
    return this.width !== undefined;
  }
}
