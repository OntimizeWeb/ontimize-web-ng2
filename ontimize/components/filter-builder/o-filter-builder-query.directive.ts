import { Directive, Optional } from '@angular/core';

import { Util } from '../../utils';
import { OFilterBuilderComponent } from './o-filter-builder-components';

@Directive({
  selector: '[oFilterBuilderQuery]',
  inputs: [
    '_filterBuilder: oFilterBuilderQuery'
  ],
  host: {
    '(click)': 'onClick($event)'
  },
  exportAs: 'oFilterBuilderQuery'
})
export class OFilterBuilderQueryDirective {

  protected _filterBuilder: OFilterBuilderComponent;

  constructor(
    @Optional() filterBuilder: OFilterBuilderComponent
  ) {
    if (Util.isDefined(filterBuilder)) {
      this._filterBuilder = filterBuilder;
    }
  }

  onClick(e?: Event): void {
    if (this._filterBuilder) {
      this._filterBuilder.triggerReload();
    }
  }

}
