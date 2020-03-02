import { Component, ElementRef, EventEmitter, Renderer2, TemplateRef, ViewChild } from '@angular/core';

import { InputConverter } from '../../../decorators/input-converter';
import { ObservableWrapper } from '../../../util/async';

export const DEFAULT_INPUTS_O_GRID_ITEM = [
  'colspan',
  'rowspan'
];

@Component({
  selector: 'o-grid-item',
  templateUrl: './o-grid-item.component.html',
  inputs: DEFAULT_INPUTS_O_GRID_ITEM,
  host: {
    '[class.o-grid-item]': 'true',
    '(click)': 'onItemClicked($event)',
    '(dblclick)': 'onItemDoubleClicked($event)'
  },

})
export class OGridItemComponent {

  modelData: object;
  mdClick: EventEmitter<any> = new EventEmitter();
  mdDoubleClick: EventEmitter<any> = new EventEmitter();

  @ViewChild(TemplateRef, { static: false }) public template: TemplateRef<any>;
  @InputConverter()
  colspan: number = 1;
  @InputConverter()
  rowspan: number = 1;
  render: any;

  constructor(
    public _el: ElementRef,
    private renderer: Renderer2) {

  }
  // @Inject(forwardRef(() => OGridComponent)) public _grid: OGridComponent) { }


  // @HostListener('mouseenter')
  // onMouseEnter() {
  //   if (this._grid.detailMode !== Codes.DETAIL_MODE_NONE) {
  //     this.renderer.setElementStyle(this._el.nativeElement, 'cursor', 'pointer');
  //   }
  // }

  onItemClicked(e?: Event) {
    ObservableWrapper.callEmit(this.mdClick, this);
  }

  onItemDoubleClicked(e?: Event) {
    ObservableWrapper.callEmit(this.mdDoubleClick, this);
  }

  public onClick(onNext: (item: OGridItemComponent) => void): object {
    return ObservableWrapper.subscribe(this.mdClick, onNext);
  }

  public onDoubleClick(onNext: (item: OGridItemComponent) => void): object {
    return ObservableWrapper.subscribe(this.mdDoubleClick, onNext);
  }

  setItemData(data) {
    if (!this.modelData) {
      this.modelData = data;
    }
  }

  getItemData() {
    return this.modelData;
  }

}
