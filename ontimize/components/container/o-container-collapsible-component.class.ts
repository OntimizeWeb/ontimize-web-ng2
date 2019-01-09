import { ElementRef, forwardRef, Inject, Injector, Optional } from '@angular/core';

import { InputConverter } from '../../decorators/input-converter';
import { OFormComponent } from '../form/form-components';
import { OContainerComponent } from './o-container-component.class';

export const DEFAULT_INPUTS_O_CONTAINER_COLLAPSIBLE = [
  ...OContainerComponent.DEFAULT_INPUTS_O_CONTAINER,
  'expanded',
  'description'
];

export class OContainerCollapsibleComponent extends OContainerComponent {

  public static DEFAULT_INPUTS_O_CONTAINER_COLLAPSIBLE = DEFAULT_INPUTS_O_CONTAINER_COLLAPSIBLE;

  @InputConverter()
  public expanded: boolean = true;
  public description: string;

  constructor(
    @Optional() @Inject(forwardRef(() => OFormComponent)) protected form: OFormComponent,
    protected elRef: ElementRef,
    protected injector: Injector
  ) {
    super(form, elRef, injector);
  }

}
