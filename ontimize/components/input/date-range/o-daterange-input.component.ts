import { CommonModule } from '@angular/common';
import { Component, ElementRef, forwardRef, Inject, Injector, NgModule, OnDestroy, OnInit, Optional, ViewChild } from '@angular/core';
import { FormControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import * as _moment from 'moment';
import { InputConverter } from '../../../decorators/input-converter';
import { MomentService } from '../../../services/moment.service';
import { OTranslateService } from '../../../services/translate/o-translate.service';
import { OSharedModule } from '../../../shared';
import { Util } from '../../../util/util';
import { OFormComponent } from '../../form/o-form.component';
import { IFormValueOptions } from '../../form/OFormValue';
import { OFormDataComponent, OValueChangeEvent } from '../../o-form-data-component.class';
import { DEFAULT_INPUTS_O_DATE_INPUT } from '../date-input/o-date-input.component';
import { DEFAULT_OUTPUTS_O_TEXT_INPUT } from '../text-input/o-text-input.component';
import { ODaterangepickerDirective } from './o-daterange-input.directive';
import { DaterangepickerComponent } from './o-daterange-picker.component';

export const DEFAULT_OUTPUTS_O_DATERANGE_INPUT = [
  ...DEFAULT_OUTPUTS_O_TEXT_INPUT
];

export const DEFAULT_INPUTS_O_DATERANGE_INPUT = [
  'separator',
  'showWeekNumbers:show-week-numbers',
  'showRanges:show-ranges',
  'olocale:locale',
  'startKey',
  'endKey',
  ...DEFAULT_INPUTS_O_DATE_INPUT
];


const moment = _moment;
@Component({
  moduleId: module.id,
  selector: 'o-daterange-input',
  templateUrl: './o-daterange-input.component.html',
  styles: ['./o-daterange-input.component.scss'],
  outputs: DEFAULT_OUTPUTS_O_DATERANGE_INPUT,
  inputs: DEFAULT_INPUTS_O_DATERANGE_INPUT
})
export class ODateRangeInputComponent extends OFormDataComponent implements OnDestroy, OnInit {

  @ViewChild(ODaterangepickerDirective) pickerDirective: ODaterangepickerDirective;
  picker: DaterangepickerComponent;

  @ViewChild('matInputRef')
  private matInputRef: ElementRef;

  @InputConverter()
  public textInputEnabled: boolean = true;

  @InputConverter()
  public showWeekNumbers: boolean = false;

  @InputConverter()
  public oTouchUi: boolean = false;

  @InputConverter()
  public showRanges: boolean = false;

  protected _oMinDate: _moment.Moment;
  get oMinDate() {
    return this._oMinDate;
  }
  set oMinDate(value) {
    this._oMinDate = value;
  }

  protected _oMaxDate: _moment.Moment;
  get oMaxDate() {
    return this._oMaxDate;
  }
  set oMaxDate(value) {
    this._oMaxDate = value;
  }

  protected _startKey: string = 'startDate';
  get startKey() {
    return this._startKey;
  }
  set startKey(value) {
    this._startKey = value;
  }

  protected _endKey: string = 'endDate';;
  get endKey() {
    return this._endKey;
  }
  set endKey(value) {
    this._endKey = value;
  }

  protected _separator = ' - ';
  get separator() {
    return this._separator;
  }

  set separator(value) {
    this._separator = value;
    if (this.getFormControl() && this.getFormControl().value) {
      this.updateElement();
    }
  }

  get showClearButton(): boolean {
    return this.clearButton && !this.isReadOnly && this.enabled && this.matInputRef.nativeElement.value;;
  }

  get localeOptions() {
    return this._localeOptions;
  }

  public oformat: string = 'L';
  protected _localeOptions: any;
  protected olocale: string;

  private momentSrv: MomentService;
  private oTranslate: OTranslateService;


  constructor(
    @Optional() @Inject(forwardRef(() => OFormComponent)) form: OFormComponent,
    elRef: ElementRef,
    injector: Injector
  ) {
    super(form, elRef, injector);
    this.oTranslate = this.injector.get(OTranslateService);
    this.momentSrv = this.injector.get(MomentService);
    this._localeOptions = {
      direction: 'ltr',
      separator: ' - ',
      weekLabel: 'W',
      applyLabel: this.oTranslate.get('DATERANGE.APPLYLABEL'),
      cancelLabel: this.oTranslate.get('CANCEL'),
      customRangeLabel: 'Custom range',
      daysOfWeek: moment.weekdaysMin(),
      monthNames: moment.monthsShort(),
      firstDay: moment.localeData().firstDayOfWeek(),
      format: 'L'
    }

  }

  ngOnInit() {
    super.ngOnInit();

    if (this.oMinDate) {
      const momentD = moment(this.oMinDate, this.oformat);
      if (momentD.isValid()) {
        this._oMinDate = momentD;
      }
    }

    if (this.oMaxDate) {
      const momentD = moment(this.oMaxDate, this.oformat);
      if (momentD.isValid()) {
        this._oMaxDate = momentD;
      }
    }
    if (!this.olocale) {
      this.olocale = this.momentSrv.getLocale();
      moment.locale(this.olocale);

    }
    if (this.oformat) {
      this._localeOptions.format = this.oformat;
    }
  }

  public openPicker() {
    this.pickerDirective.open();
  }

  public onChangeEvent(event: any): void {
    let objectValue;
    if (event instanceof Object) {
      objectValue = event;
    } else {
      let value = event.currentTarget.value;
      if (value !== '') {
        objectValue = this.getDateRangeToString(value);
      }

      if (objectValue[this._startKey].isValid && objectValue[this._endKey].isValid) {
        this.setValue(objectValue, {
          changeType: OValueChangeEvent.USER_CHANGE,
          emitEvent: false,
          emitModelToViewChange: false
        });
      }
    }

  }

  public onClickClearValue(e: Event): void {
    super.onClickClearValue(e);
    this.updateElement();
  }

  datesUpdated(range) {

    this.pickerDirective.close();
    this.setValue(range,
      {
        changeType: OValueChangeEvent.USER_CHANGE,
        emitEvent: false,
        emitModelToViewChange: false
      });
  }

  setValue(newValue: any, options?: IFormValueOptions) {
    super.setValue(newValue, options);
  }

  public setData(newValue: any): void {
    super.setData(newValue);
    this.pickerDirective.datesUpdated.emit(newValue);
    this.updateElement();
  }

  updateElement() {
    let chosenLabel = this.value ? this.value.value[this.pickerDirective.startKey].format(this.oformat) +
      this.separator + this.value.value[this.pickerDirective.endKey].format(this.oformat) : this.value;
    this.pickerDirective._el.nativeElement.value = chosenLabel
  }

  getDateRangeToString(valueToString: string) {
    let value = {};
    let range = valueToString.split(this.separator.trim());
    value[this._startKey] = moment(range[0], this.oformat)
    value[this._endKey] = moment(range[1], this.oformat)
    return value;
  }


  resolveValidators(): ValidatorFn[] {
    const validators: ValidatorFn[] = super.resolveValidators();
    if (Util.isDefined(this._oMinDate)) {
      validators.push(this.minDateValidator.bind(this));
    }
    if (Util.isDefined(this._oMaxDate)) {
      validators.push(this.maxDateValidator.bind(this));
    }

    validators.push(this.parseDateValidator.bind(this));
    return validators;
  }


  protected minDateValidator(control: FormControl): ValidationErrors {
    if ((control.value instanceof Object)
      && control.value[this._startKey].isBefore(this._oMinDate)) {
      return {
        dateRangeMin: {
          dateMin: this._oMinDate.format(this.oformat)
        }
      };
    }
    return {};
  }

  protected maxDateValidator(control: FormControl): ValidationErrors {
    if ((control.value instanceof Object)
      && control.value[this._endKey].isAfter(this._oMaxDate)) {
      return {
        dateRangeMax: {
          dateMax: this._oMaxDate.format(this.oformat)
        }
      };
    }
    return {};
  }
  protected parseDateValidator(control: FormControl): ValidationErrors {
    if ((control.value instanceof Object)
      && !control.value[this._startKey].isValid
      && !control.value[this._endKey].isValid) {
      return {
        dateRangeParse: {
          format: this.oformat + this._localeOptions.separator + this.oformat
        }
      };
    }
    return {};
  }
}

@NgModule({
  declarations: [DaterangepickerComponent, ODateRangeInputComponent, ODaterangepickerDirective],
  imports: [CommonModule, OSharedModule],
  exports: [ODateRangeInputComponent],
  entryComponents: [
    DaterangepickerComponent
  ],
  providers: []
})
export class ODateRangeInputModule { }
