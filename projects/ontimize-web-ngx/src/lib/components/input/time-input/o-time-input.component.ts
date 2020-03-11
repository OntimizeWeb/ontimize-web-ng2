import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  Inject,
  Injector,
  OnDestroy,
  OnInit,
  Optional,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import moment from 'moment';
import { merge, Subscription } from 'rxjs';

import { InputConverter } from '../../../decorators/input-converter';
import { DateFilterFunction } from '../../../types/date-filter-function.type';
import { FormValueOptions } from '../../../types/form-value-options.type';
import { Util } from '../../../util/util';
import { OFormComponent } from '../../form/o-form.component';
import { OFormValue } from '../../form/OFormValue';
import {
  DEFAULT_INPUTS_O_FORM_DATA_COMPONENT,
  DEFAULT_OUTPUTS_O_FORM_DATA_COMPONENT,
  OFormDataComponent,
} from '../../o-form-data-component.class';
import { OValueChangeEvent } from '../../o-value-change-event.class';
import { ODateInputComponent } from '../date-input/o-date-input.component';
import { OHourInputComponent } from '../hour-input/o-hour-input.component';
import { OFormControl } from '../o-form-control.class';

export const DEFAULT_INPUTS_O_TIME_INPUT = [
  ...DEFAULT_INPUTS_O_FORM_DATA_COMPONENT,
  'oDateFormat: date-format',
  'oDateLocale: date-locale',
  'oDateStartView: date-start-view',
  'oDateMinDate: date-min',
  'oDateMaxDate: date-max',
  'oDateTouchUi: date-touch-ui',
  'oDateStartAt: date-start-at',
  'oDateFilterDate: date-filter-date',
  'oDateTextInputEnabled: date-text-input-enabled',
  'oHourFormat: hour-format',
  'oHourMin: hour-min',
  'oHourMax: hour-max',
  'oHourTextInputEnabled: hour-text-input-enabled',
  'oHourPlaceholder: hour-placeholder',
  'oDatePlaceholder: date-placeholder'
];

export const DEFAULT_OUTPUTS_O_TIME_INPUT = [
  ...DEFAULT_OUTPUTS_O_FORM_DATA_COMPONENT
];

@Component({
  selector: 'o-time-input',
  templateUrl: './o-time-input.component.html',
  styleUrls: ['./o-time-input.component.scss'],
  inputs: DEFAULT_INPUTS_O_TIME_INPUT,
  outputs: DEFAULT_OUTPUTS_O_TIME_INPUT,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.o-time-input]': 'true'
  }
})
export class OTimeInputComponent extends OFormDataComponent implements OnInit, AfterViewInit, OnDestroy {

  public oDateFormat: string = 'L';
  public oDateLocale: any;
  public oDateStartView: 'month' | 'year' = 'month';
  public oDateMinDate: any;
  public oDateMaxDate: any;
  @InputConverter()
  public oDateTouchUi: boolean;
  public oDateStartAt: any;
  public oDateFilterDate: DateFilterFunction;
  @InputConverter()
  public oDateTextInputEnabled: boolean = true;
  public oHourFormat: number = 24;
  public oHourMin: string;
  public oHourMax: string;
  @InputConverter()
  public oHourTextInputEnabled: boolean = true;
  public oHourPlaceholder = '';
  public oDatePlaceholder = '';

  protected blockGroupValueChanges: boolean;
  protected formGroup: FormGroup = new FormGroup({});

  @ViewChild('dateInput', { static: false })
  protected dateInput: ODateInputComponent;

  @ViewChild('hourInput', { static: false })
  protected hourInput: OHourInputComponent;

  protected subscription: Subscription = new Subscription();

  constructor(
    @Optional() @Inject(forwardRef(() => OFormComponent)) form: OFormComponent,
    elRef: ElementRef,
    injector: Injector,
    protected cd: ChangeDetectorRef) {
    super(form, elRef, injector);
    this._defaultSQLTypeKey = 'DATE';
  }

  public ngAfterViewInit(): void {
    this.modifyFormControls();
    super.ngAfterViewInit();
    this.registerFormControls();
    this.setInnerComponentsData();
    this.subscription.add(merge(this.dateInput.onValueChange, this.hourInput.onValueChange).subscribe((event: OValueChangeEvent) => {
      if (event.isUserChange()) {
        this.updateComponentValue();
        const newValue = this._fControl.value;
        this.emitOnValueChange(OValueChangeEvent.USER_CHANGE, newValue, this.oldValue);
        this.oldValue = newValue;
      }
    }));
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public createFormControl(cfg, validators): OFormControl {
    this._fControl = super.createFormControl(cfg, validators);
    this._fControl.fControlChildren = [this.dateInput, this.hourInput];
    return this._fControl;
  }

  public onFormControlChange(value: any): void {
    super.onFormControlChange(value);
    this.setInnerComponentsData();
  }

  public setValue(newValue: any, options?: FormValueOptions): void {
    const changed = this.oldValue !== newValue;
    super.setValue(newValue, options);
    if (changed) {
      this.setInnerComponentsData();
    }
  }

  public onClickClearValue(): void {
    this.blockGroupValueChanges = true;
    if (this.dateInput) {
      this.dateInput.clearValue();
    }
    if (this.hourInput) {
      this.hourInput.clearValue();
    }
    this.clearValue();
    this.blockGroupValueChanges = false;
  }

  protected setInnerComponentsData(): void {
    let dateValue: any;
    let hourValue: any;
    if (Util.isDefined(this.value) && Util.isDefined(this.value.value)) {
      const momentD = moment(this.value.value);
      if (momentD.isValid()) {
        dateValue = momentD.clone().startOf('day').valueOf();
        hourValue = momentD.clone().valueOf() - dateValue;
      }
    }
    if (this.dateInput) {
      this.dateInput.setValue(dateValue);
    }
    if (this.hourInput) {
      this.hourInput.setTimestampValue(hourValue);
    }
    this.cd.detectChanges();
  }

  protected updateComponentValue(): void {
    if (!this.value) {
      this.value = new OFormValue();
    }
    let timeValue: number;
    const values = this.formGroup.getRawValue();
    const mDate = (values.dateInput ? moment(values.dateInput) : moment()).startOf('day');
    const mHour = this.hourInput.valueType === 'timestamp' ? moment(values.hourInput) : moment(values.hourInput, this.hourInput.formatString);
    timeValue = mDate.clone()
      .set('hour', mHour.get('hour'))
      .set('minute', mHour.get('minutes'))
      .valueOf();
    if (this._fControl) {
      this._fControl.setValue(timeValue);
      this._fControl.markAsDirty();
    }
    this.ensureOFormValue(timeValue);
  }

  protected modifyFormControls(): void {
    if (this.dateInput) {
      const self = this;
      this.dateInput.getFormGroup = () => {
        return self.formGroup;
      };
    }

    if (this.hourInput) {
      const self = this;
      this.hourInput.getFormGroup = () => {
        return self.formGroup;
      };
    }

    if (this.form) {
      this.form.formGroup.removeControl('dateInput');
      this.form.formGroup.removeControl('hourInput');
    }
  }

  protected registerFormControls(): void {
    if (this.dateInput && this.dateInput.getFormControl()) {
      this.formGroup.registerControl('dateInput', this.dateInput.getFormControl());
    }
    if (this.hourInput) {
      if (this.hourInput.getFormControl()) {
        this.formGroup.registerControl('hourInput', this.hourInput.getFormControl());
      }
    }
  }

}
