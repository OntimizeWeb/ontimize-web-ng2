import { Component, NgModule, Optional, Inject, ElementRef, Injector, forwardRef, ViewChild, ViewEncapsulation, OnInit, AfterViewInit } from '@angular/core';
import { OFormDataComponent, DEFAULT_INPUTS_O_FORM_DATA_COMPONENT, DEFAULT_OUTPUTS_O_FORM_DATA_COMPONENT, OValueChangeEvent } from '../../o-form-data-component.class';
import { CommonModule } from '@angular/common';
import { ValidatorFn } from '@angular/forms';
import moment from 'moment';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';

import { Util } from '../../../utils';
import { OSharedModule } from '../../../shared';
import { OFormComponent } from '../../form/form-components';
import { IFormValueOptions } from '../../form/OFormValue';
import { InputConverter } from '../../../decorators/input-converter';
import { OValidators } from '../../../validators/o-validators';

const HourFormat = {
  TWELVE: 'hh:mm a',
  TWENTY_FOUR: 'HH:mm a',
};

const TWENTY_FOUR_HOUR_FORMAT = 24;

export const DEFAULT_INPUTS_O_HOUR_INPUT = [
  'format',
  'textInputEnabled: text-input-enabled',
  'min',
  'max',
  ...DEFAULT_INPUTS_O_FORM_DATA_COMPONENT
];

export const DEFAULT_OUTPUTS_O_HOUR_INPUT = [
  ...DEFAULT_OUTPUTS_O_FORM_DATA_COMPONENT
];

@Component({
  moduleId: module.id,
  selector: 'o-hour-input',
  templateUrl: './o-hour-input.component.html',
  styleUrls: ['./o-hour-input.component.scss'],
  encapsulation: ViewEncapsulation.None,
  outputs: DEFAULT_OUTPUTS_O_HOUR_INPUT,
  inputs: DEFAULT_INPUTS_O_HOUR_INPUT,
  host: {
    '[class.o-hour-input]': 'true'
  }
})

export class OHourInputComponent extends OFormDataComponent implements OnInit, AfterViewInit {

  public static DEFAULT_INPUTS_O_HOUR_INPUT = DEFAULT_INPUTS_O_HOUR_INPUT;
  public static DEFAULT_OUTPUTS_O_HOUR_INPUT = DEFAULT_OUTPUTS_O_HOUR_INPUT;

  constructor(
    @Optional() @Inject(forwardRef(() => OFormComponent)) form: OFormComponent,
    elRef: ElementRef,
    injector: Injector
  ) {
    super(form, elRef, injector);
  }

  @ViewChild('picker')
  private picker: any;

  @InputConverter()
  format: number = TWENTY_FOUR_HOUR_FORMAT;
  @InputConverter()
  textInputEnabled: boolean = true;
  min: string;
  max: string;

  formatString = HourFormat.TWENTY_FOUR;

  private openPopup = false;

  ngOnInit() {
    super.ngOnInit();
    this.formatString = (this.format === TWENTY_FOUR_HOUR_FORMAT ? HourFormat.TWENTY_FOUR : HourFormat.TWELVE);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();

    const originalPickerOpen = this.picker.open.bind(this.picker);
    const self = this;
    this.picker.open = function (e) {
      if (!self.isReadOnly && !self.isDisabled && self.openPopup) {
        self.openPopup = false;
        originalPickerOpen();
      }
    };
  }

  setData(arg: any) {
    const value = this.format === TWENTY_FOUR_HOUR_FORMAT ? this.convertToFormatString(arg) : arg;
    super.setData(value);
  }

  open(e?: Event) {
    this.openPopup = true;
    if (this.picker) {
      let momentV = moment(this.getValueAsTimeStamp());
      if (this.picker.timepickerService && momentV.isValid()) {
        momentV = momentV.utcOffset(0);
        let hour = momentV.get('hour');
        const minutes = momentV.get('minutes');
        let timePeriod = 'AM';
        if (hour >= 12) {
          timePeriod = 'PM';
        }
        if (hour > 12 && this.format !== TWENTY_FOUR_HOUR_FORMAT) {
          hour -= 12;
        }
        if (hour === 0) {
          hour = 12;
        }
        this.picker.changeTimeUnit(0);
        this.picker.timepickerService.hour = {
          time: hour,
          angle: hour * 30
        };
        this.picker.timepickerService.minute = {
          time: minutes === 0 ? '00' : minutes,
          angle: minutes === 0 ? 360 : minutes * 6
        };
        this.picker.timepickerService.period = timePeriod;
      }
      this.picker.open();
    }
  }

  getValueAsTimeStamp() {
    const formatMoment = 'MM/DD/YYYY ' + this.formatString;
    const momentV = moment('01/01/1970 ' + this.getValue(), formatMoment);
    return momentV.add(1, 'hour').valueOf();
  }

  getValueAsString() {
    let value = this.getValue();
    value = this.format === TWENTY_FOUR_HOUR_FORMAT ? this.convertToFormatString(value) : value;
    return Util.isDefined(value) ? value.toLowerCase() : null;
  }

  setTimestampValue(value: any, options?: IFormValueOptions) {
    let parsedValue;
    const momentV = Util.isDefined(value) ? moment(value) : value;
    if (momentV && momentV.isValid()) {
      parsedValue = momentV.utcOffset(0).format(this.formatString);
    }
    this.setValue(parsedValue, options);
  }

  resolveValidators(): ValidatorFn[] {
    let validators: ValidatorFn[] = super.resolveValidators();
    if (this.format === TWENTY_FOUR_HOUR_FORMAT) {
      validators.push(OValidators.twentyFourHourFormatValidator);
    } else {
      validators.push(OValidators.twelveHourFormatValidator);
    }
    return validators;
  }

  onClickInput(e: Event): void {
    if (!this.textInputEnabled) {
      this.open(e);
    }
  }

  onFormControlChange(value: any) {
    if (this.oldValue === value) {
      return;
    }
    super.onFormControlChange(value);
  }

  onTimeEvent(event) {
    const value = this.convertToFormatString(event);
    /** emitModelToViewChange: false  because onChange event is trigger in ngModelChange */
    this.setValue(value, {
      changeType: OValueChangeEvent.USER_CHANGE,
      emitEvent: false,
      emitModelToViewChange: false
    });
  }

  protected addPeriodString(value): string {
    let result = value;
    if (value && !(new RegExp(/pm|am$/)).test(value.toLowerCase())) {
      result += (this.format === TWENTY_FOUR_HOUR_FORMAT) ? ' PM' : ' AM';
    }
    return result;
  }

  protected convertToFormatString(value) {
    if (value === '00:00') {
      // workaround
      return value;
    }
    // maybe not necessary in following versions
    let formatStr = this.format === TWENTY_FOUR_HOUR_FORMAT ? 'HH:mm' : 'hh:mm a';
    let valueString = this.addPeriodString(value);
    let result = value ? moment(valueString, 'h:mm A').format(formatStr) : value;
    return result;
  }
}

@NgModule({
  declarations: [OHourInputComponent],
  imports: [OSharedModule, CommonModule, NgxMaterialTimepickerModule],
  exports: [OHourInputComponent]
})
export class OHourInputModule { }
