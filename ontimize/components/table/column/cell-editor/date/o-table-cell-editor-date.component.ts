import { Component, Injector, ViewChild, TemplateRef, OnInit, Inject, ElementRef, ViewEncapsulation } from '@angular/core';
import { MatDateFormats, DateAdapter, MatDatepicker, MAT_DATE_FORMATS, MatDatepickerInputEvent, MAT_DATE_LOCALE } from '@angular/material';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import moment from 'moment';

import { InputConverter } from '../../../../../decorators';
import { MomentService } from '../../../../../services';
import { O_DATE_INPUT_DEFAULT_FORMATS, DateFilterFunction } from '../../../../input/date-input/o-date-input.component';

import { OBaseTableCellEditor } from '../o-base-table-cell-editor.class';

export const DEFAULT_INPUTS_O_TABLE_CELL_EDITOR_DATE = [
  ...OBaseTableCellEditor.DEFAULT_INPUTS_O_TABLE_CELL_EDITOR,
  'format',
  'locale',
  'oStartView: start-view',
  'min',
  'max',
  'oTouchUi: touch-ui',
  'startAt: start-at',
  'filterDate: filter-date'
];

export const DEFAULT_OUTPUTS_O_TABLE_CELL_EDITOR_DATE = [
  ...OBaseTableCellEditor.DEFAULT_OUTPUTS_O_TABLE_CELL_EDITOR
];

@Component({
  selector: 'o-table-cell-editor-date',
  templateUrl: './o-table-cell-editor-date.component.html',
  styleUrls: ['./o-table-cell-editor-date.component.scss'],
  inputs: DEFAULT_INPUTS_O_TABLE_CELL_EDITOR_DATE,
  outputs: DEFAULT_OUTPUTS_O_TABLE_CELL_EDITOR_DATE,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: O_DATE_INPUT_DEFAULT_FORMATS }
  ]
})

export class OTableCellEditorDateComponent extends OBaseTableCellEditor implements OnInit {

  public static DEFAULT_INPUTS_O_TABLE_CELL_EDITOR_DATE = DEFAULT_INPUTS_O_TABLE_CELL_EDITOR_DATE;
  public static DEFAULT_OUTPUTS_O_TABLE_CELL_EDITOR_DATE = DEFAULT_OUTPUTS_O_TABLE_CELL_EDITOR_DATE;

  @ViewChild('templateref', { read: TemplateRef }) public templateref: TemplateRef<any>;
  @ViewChild('input') inputRef: ElementRef;

  format: string = 'L';
  protected locale: string;
  oStartView: 'month' | 'year' = 'month';
  protected min: string;
  protected max: string;
  @InputConverter()
  oTouchUi: boolean = false;
  protected startAt: string;
  filterDate: DateFilterFunction;

  oStartAt: Date;
  oMinDate: Date;
  oMaxDate: Date;

  private momentSrv: MomentService;
  minDateString: string;
  maxDateString: string;

  protected datepicker: MatDatepicker<Date>;
  constructor(
    protected injector: Injector,
    @Inject(MAT_DATE_FORMATS) protected matDateFormats: MatDateFormats,
    protected momentDateAdapter: DateAdapter<MomentDateAdapter>
  ) {
    super(injector);
    this.initialize();
    this.momentSrv = this.injector.get(MomentService);
  }

  ngOnInit(): void {
    super.ngOnInit();
    if (!this.locale) {
      this.locale = this.momentSrv.getLocale();
    }
    if (this.format) {
      this.matDateFormats.display.dateInput = this.format;
      this.matDateFormats.parse.dateInput = this.format;
    }

    this.momentDateAdapter.setLocale(this.locale);
    if (this.startAt) {
      this.oStartAt = new Date(this.startAt);
    }

    if (this.min) {
      let date = new Date(this.min);
      let momentD = moment(date);
      if (momentD.isValid()) {
        this.oMinDate = date;
        this.minDateString = momentD.format(this.format);
      }
    }

    if (this.max) {
      let date = new Date(this.max);
      let momentD = moment(date);
      if (momentD.isValid()) {
        this.oMaxDate = date;
        this.maxDateString = momentD.format(this.format);
      }
    }
  }

  protected handleKeyup(event: KeyboardEvent) {
    const oColumn = this.table.getOColumn(this.tableColumn.attr);
    if (!oColumn) {
      return;
    }
    if (!oColumn.editing && this.datepicker && this.datepicker.opened) {
      this.datepicker.close();
    } else {
      super.handleKeyup(event);
    }
  }

  startEdtion(data: any) {
    super.startEdtion(data);
    if (!this.startAt) {
      this.oStartAt = this.getCellData();
    }
  }

  getCellData(): any {
    let value = super.getCellData();
    if (typeof value !== 'undefined') {
      if (typeof value === 'number') {
        let dateObj = new Date(value);
        return dateObj;
      }
    }
    return value;
  }

  commitEdition() {
    if (!this.datepicker.opened) {
      super.commitEdition();
    }
  }

  onDateChange(event: MatDatepickerInputEvent<any>) {
    super.commitEdition();
  }

  openDatepicker(d: MatDatepicker<Date>) {
    this.datepicker = d;
    d.open();
  }
}
