import { Component, OnInit, Injector, forwardRef, Inject, ComponentFactoryResolver, ComponentFactory, ViewChild, ViewContainerRef, EventEmitter } from '@angular/core';
import { InputConverter } from '../../../decorators';
import {
  OTableCellRendererDateComponent,
  OTableCellRendererCurrencyComponent,
  OTableCellRendererImageComponent,
  OTableCellRendererIntegerComponent,
  OTableCellRendererRealComponent,
  OTableCellRendererBooleanComponent,
  OTableCellRendererPercentageComponent,
  OTableCellRendererActionComponent
} from './cell-renderer/cell-renderer';

import { OTableComponent } from '../o-table.component';
import { Util } from '../../../util/util';

import {
  OTableCellEditorTextComponent
} from './cell-editor/cell-editor';

export const DEFAULT_INPUTS_O_TABLE_COLUMN = [

  // attr [string]: column name.
  'attr',

  // title [string]: column title. Default: no value.
  'title',

  // orderable [no|yes]: column can be sorted. Default: yes.
  'orderable',

  // searchable [no|yes]: searchings are performed into column content. Default: yes.
  'searchable',

  // type [boolean|integer|real|currency|date|image]: column type. Default: no value (string).
  'type',

  // editable [no|yes]: column can be edited directly over the table. Default: no.
  'editable',

  // date-model-type [timestamp|string]: if a date column is editable, its model type must be defined to be able to save its value,
  // e.g. classic ontimize server dates come as timestamps (number), but to be able to save them they have to be send as strings with
  // the format 'YYYY-MM-DD HH:mm:ss' (especified in the date-model-format attribute). Default: timestamp.
  'dateModelType: date-model-type',

  // date-model-format [string]: if date model type is string, its date model format should be defined. Default: ISO date.
  'dateModelFormat: date-model-format',

  'width',

  'class',

  // break-word [no|yes|true|false]: content column can show in multiple lines if it not catch in the cell. Default: no and if content of the cell overflow.
  'breakWord:break-word',

  // async-load [no|yes|true|false]: asynchronous query. Default: no
  'asyncLoad : async-load',

  ...OTableCellRendererBooleanComponent.DEFAULT_INPUTS_O_TABLE_CELL_RENDERER_BOOLEAN,
  ...OTableCellRendererCurrencyComponent.DEFAULT_INPUTS_O_TABLE_CELL_RENDERER_CURRENCY, // includes Integer and Real
  ...OTableCellRendererDateComponent.DEFAULT_INPUTS_O_TABLE_CELL_RENDERER_DATE,
  ...OTableCellRendererImageComponent.DEFAULT_INPUTS_O_TABLE_CELL_RENDERER_IMAGE,
  ...OTableCellRendererActionComponent.DEFAULT_INPUTS_O_TABLE_CELL_RENDERER_ACTION,

  ...OTableCellEditorTextComponent.DEFAULT_INPUTS_O_TABLE_CELL_EDITOR_TEXT
];

export const DEFAULT_OUTPUTS_O_TABLE_COLUMN = [
  ...OTableCellEditorTextComponent.DEFAULT_OUTPUTS_O_TABLE_CELL_EDITOR_TEXT
];

@Component({
  selector: 'o-table-column',
  templateUrl: './o-table-column.component.html',
  styleUrls: ['./o-table-column.component.scss'],
  inputs: DEFAULT_INPUTS_O_TABLE_COLUMN,
  outputs: DEFAULT_OUTPUTS_O_TABLE_COLUMN,
  host: {
    '[class.columnBreakWord]': 'breakWord'
  }
})
export class OTableColumnComponent implements OnInit {

  public static DEFAULT_INPUTS_O_TABLE_COLUMN = DEFAULT_INPUTS_O_TABLE_COLUMN;
  // public static DEFAULT_OUTPUTS_O_TABLE_COLUMN = DEFAULT_OUTPUTS_O_TABLE_COLUMN;

  protected renderersMapping = {
    'action': OTableCellRendererActionComponent,
    'boolean': OTableCellRendererBooleanComponent,
    'currency': OTableCellRendererCurrencyComponent,
    'date': OTableCellRendererDateComponent,
    'image': OTableCellRendererImageComponent,
    'integer': OTableCellRendererIntegerComponent,
    'percentage': OTableCellRendererPercentageComponent,
    'real': OTableCellRendererRealComponent
  };

  protected editorsMapping = {
    'text': OTableCellEditorTextComponent
  };


  public renderer: any;
  public editor: any;

  public type: string;
  public attr: string;
  public title: string;
  @InputConverter()
  public orderable: boolean = true;
  @InputConverter()
  public searchable: boolean = true;
  @InputConverter()
  public editable: boolean = false;
  public width: string = '';

  /*input renderer date */
  protected format: string;
  /*input renderer integer */
  protected grouping: any = true;
  protected thousandSeparator: string = ',';
  /*input renderer real */
  protected decimalSeparator: string = '.';
  protected decimalDigits: number = 2;
  /*input renderer currency */
  protected currencySymbol: string;
  protected currencySymbolPosition: string;

  /*input renderer boolean */
  protected trueValueType: string;
  protected trueValue: string;
  protected falseValueType: string;
  protected falseValue: string;
  protected dataType: string = 'boolean';

  /*input image */
  protected imageType: string;
  protected avatar: string;
  protected emptyImage: string;

  /*input renderer action */
  protected icon: string;
  protected action: string;

  /*input editor text */
  @InputConverter()
  protected orequired: boolean = false;

  /* output cell editor */
  editionStarted: EventEmitter<Object> = new EventEmitter<Object>();
  editionCancelled: EventEmitter<Object> = new EventEmitter<Object>();
  editionCommitted: EventEmitter<Object> = new EventEmitter<Object>();

  @InputConverter()
  protected breakWord: boolean = false;
  @InputConverter()
  protected asyncLoad: boolean = false;

  @ViewChild('container', { read: ViewContainerRef })
  container: ViewContainerRef;

  constructor(
    @Inject(forwardRef(() => OTableComponent)) public table: OTableComponent,
    protected resolver: ComponentFactoryResolver,
    protected injector: Injector) {
    this.table = table;
  }

  public ngOnInit() {
    this.grouping = Util.parseBoolean(this.grouping, true);
    this.createRenderer();
    this.createEditor();
    this.table.registerColumn(this);
  }

  protected createRenderer() {
    if (typeof (this.renderer) === 'undefined' && this.type !== undefined) {
      const componentRef = this.renderersMapping[this.type];
      if (componentRef !== undefined) {
        let factory: ComponentFactory<any> = this.resolver.resolveComponentFactory(componentRef);
        if (factory) {
          let ref = this.container.createComponent(factory);
          this.renderer = ref.instance;
          switch (this.type) {
            case 'currency':
              this.renderer.currencySymbol = this.currencySymbol;
              this.renderer.currencySymbolPosition = this.currencySymbolPosition;
              this.renderer.decimalSeparator = this.decimalSeparator;
              this.renderer.decimalDigits = this.decimalDigits;
              this.renderer.grouping = this.grouping;
              this.renderer.thousandSeparator = this.thousandSeparator;
              break;
            case 'date':
              this.renderer.format = this.format;
              break;
            case 'integer':
              this.renderer.grouping = this.grouping;
              this.renderer.thousandSeparator = this.thousandSeparator;
              break;
            case 'boolean':
              this.renderer.trueValueType = this.trueValueType;
              this.renderer.trueValue = this.trueValue;
              this.renderer.falseValueType = this.falseValueType;
              this.renderer.falseValue = this.falseValue;
              this.renderer.dataType = this.dataType;
              break;
            case 'real':
            case 'percentage':
              this.renderer.decimalSeparator = this.decimalSeparator;
              this.renderer.decimalDigits = this.decimalDigits;
              this.renderer.grouping = this.grouping;
              this.renderer.thousandSeparator = this.thousandSeparator;
              break;
            case 'image':
              this.renderer.imageType = this.imageType;
              this.renderer.avatar = this.avatar;
              this.renderer.emptyImage = this.emptyImage;
              break;
            case 'action':
              this.renderer.icon = this.icon;
              this.renderer.action = this.action;
              break;
          }
        }
      }
    }
  }

  protected createEditor() {
    if (typeof (this.editor) === 'undefined' && this.editable) {
      const componentRef = this.editorsMapping[this.type] || this.editorsMapping['text'];
      if (componentRef !== undefined) {
        let factory: ComponentFactory<any> = this.resolver.resolveComponentFactory(componentRef);
        if (factory) {
          let ref = this.container.createComponent(factory);
          this.editor = ref.instance;
          switch (this.type) {
            case 'currency':
              break;
            case 'date':
              break;
            case 'integer':
              break;
            case 'boolean':
              break;
            case 'real':
            case 'percentage':
              break;
            case 'image':
              break;
            default:
              this.editor.orequired = this.orequired;
              break;
          }
          this.editor.editionStarted = this.editionStarted;
          this.editor.editionCancelled = this.editionCancelled;
          this.editor.editionCommitted = this.editionCommitted;
        }
      }
    }
  }

  public registerRenderer(renderer: any) {
    this.renderer = renderer;
  }

  public registerEditor(editor: any) {
    this.editor = editor;
  }
}
