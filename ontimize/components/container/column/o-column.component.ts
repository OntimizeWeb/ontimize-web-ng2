import { Component, Inject, Injector, forwardRef, ElementRef, OnInit, Optional, NgModule, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputConverter } from '../../../decorators';
import { OFormComponent } from '../../form/o-form.component';
import { OTranslateService } from '../../../services';
import { OSharedModule } from '../../../shared';

export const DEFAULT_INPUTS_O_COLUMN = [
  'oattr: attr',
  'titleLabel: title-label',
  'layoutAlign: layout-align',
  'layoutFill: layout-fill',
  'elevation'
];

@Component({
  moduleId: module.id,
  selector: 'o-column',
  templateUrl: './o-column.component.html',
  styleUrls: ['./o-column.component.scss'],
  inputs: DEFAULT_INPUTS_O_COLUMN,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.o-column]': 'true'
  }
})
export class OColumnComponent implements OnInit, AfterViewInit {

  public static DEFAULT_INPUTS_O_COLUMN = DEFAULT_INPUTS_O_COLUMN;

  oattr: string;

  protected _titleLabel: string;
  protected _elevation: number = 0;
  protected defaultLayoutAlign: string = 'start start';
  protected _layoutAlign: string;
  protected translateService: OTranslateService;
  @InputConverter()
  layoutFill: boolean = false;

  constructor(
    @Optional() @Inject(forwardRef(() => OFormComponent)) protected form: OFormComponent,
    protected elRef: ElementRef,
    protected injector: Injector) {

    this.translateService = this.injector.get(OTranslateService);
  }

  ngOnInit() {
    if (this.layoutAlign === undefined) {
      this.propagateLayoutAligmentToDOM();
    }
  }

  ngAfterViewInit() {
    this.propagateLayoutFillToDOM();
  }

  propagateLayoutFillToDOM() {
    // let innerCol = this.elRef.nativeElement.querySelectorAll('div#innerCol');
    // if (innerCol.length) {
    //   let element = innerCol[0];
    //   if (this.layoutFill) {
    //     let titleDiv = this.elRef.nativeElement.querySelectorAll('.container-title');
    //     let titleH = 0;
    //     if (titleDiv.length) {
    //       titleH = titleDiv[0].offsetHeight;
    //     }
    //     element.style.height = (this.elRef.nativeElement.clientHeight - titleH) + 'px';
    //   }
    // }
  }

  getAttribute() {
    if (this.oattr) {
      return this.oattr;
    } else if (this.elRef && this.elRef.nativeElement.attributes['attr']) {
      return this.elRef.nativeElement.attributes['attr'].value;
    }
  }

  get elevation() {
    return this._elevation;
  }

  set elevation(elevation: number) {
    this._elevation = elevation;
    this.propagateElevationToDOM();
    this.propagatePaddingToDOM();
  }

  get layoutAlign() {
    return this._layoutAlign;
  }

  set layoutAlign(align: string) {
    if (!align || align.length === 0) {
      align = this.defaultLayoutAlign;
    }
    this._layoutAlign = align;
    this.propagateLayoutAligmentToDOM();
  }

  hasTitle(): boolean {
    return this._titleLabel && this._titleLabel.length > 0;
  }

  get titleLabel(): string {
    if (this.translateService) {
      return this.translateService.get(this._titleLabel);
    }
    return this._titleLabel;
  }

  set titleLabel(value: string) {
    this._titleLabel = value;
    this.propagatePaddingToDOM();
  }

  propagatePaddingToDOM() {
    let innerCol = this.elRef.nativeElement.querySelectorAll('div#innerCol');
    if (innerCol.length) {
      let element = innerCol[0]; // Take only first, nested element does not matter.
      if (this.hasTitle() || (this.elevation > 0 && this.elevation <= 12)) {
        element.classList.add('container-content');
      } else {
        element.classList.remove('container-content');
      }
    }
  }

  propagateLayoutAligmentToDOM() {
    let innerCol = this.elRef.nativeElement.querySelectorAll('div#innerCol');
    if (innerCol.length) {
      let element = innerCol[0];
      // Take only first, nested element does not matter.
      if (this.hasTitle()) {
        element.classList.add('container-content');
      }
    }
  }

  propagateElevationToDOM() {
    this.cleanElevationCSSclasses();
    if (this.elevation > 0 && this.elevation <= 12) {
      let clazz = 'mat-elevation-z' + this.elevation;
      this.elRef.nativeElement.classList.add(clazz);
      this.elRef.nativeElement.classList.add('margin-top-bottom');
    }
  }

  cleanElevationCSSclasses() {
    let arr_ = this.elRef.nativeElement.classList;
    if (arr_ && arr_.length) {
      var self = this;
      [].slice.call(arr_).forEach((item, index) => {
        if (item.startsWith('mat-elevation')) {
          self.elRef.nativeElement.classList.remove(item);
        }
      });
    }
  }
}

@NgModule({
  declarations: [OColumnComponent],
  imports: [OSharedModule, CommonModule],
  exports: [OColumnComponent]
})
export class OColumnModule {
}
