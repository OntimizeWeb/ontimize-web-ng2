import { Component, ElementRef, forwardRef, Inject, Injector, OnInit, Optional, ViewEncapsulation } from '@angular/core';
import { ValidatorFn } from '@angular/forms';

import { OValidators } from '../../../validators/o-validators';
import { OFormComponent } from '../../form/o-form.component';
import {
  DEFAULT_INPUTS_O_TEXT_INPUT,
  DEFAULT_OUTPUTS_O_TEXT_INPUT,
  OTextInputComponent,
} from '../text-input/o-text-input.component';

export const DEFAULT_INPUTS_O_NIF_INPUT = [
  ...DEFAULT_INPUTS_O_TEXT_INPUT
];

export const DEFAULT_OUTPUTS_O_NIF_INPUT = [
  ...DEFAULT_OUTPUTS_O_TEXT_INPUT
];

@Component({
  moduleId: module.id,
  selector: 'o-nif-input',
  templateUrl: './o-nif-input.component.html',
  styleUrls: ['./o-nif-input.component.scss'],
  inputs: DEFAULT_INPUTS_O_NIF_INPUT,
  outputs: DEFAULT_OUTPUTS_O_NIF_INPUT,
  encapsulation: ViewEncapsulation.None
})
export class ONIFInputComponent extends OTextInputComponent implements OnInit {

  public static DEFAULT_INPUTS_O_NIF_INPUT = DEFAULT_INPUTS_O_NIF_INPUT;
  public static DEFAULT_OUTPUTS_O_NIF_INPUT = DEFAULT_OUTPUTS_O_NIF_INPUT;

  constructor(
    @Optional() @Inject(forwardRef(() => OFormComponent)) form: OFormComponent,
    elRef: ElementRef,
    injector: Injector) {
    super(form, elRef, injector);
  }

  resolveValidators(): ValidatorFn[] {
    const validators: ValidatorFn[] = super.resolveValidators();
    // Inject NIF validator
    validators.push(OValidators.nifValidator);
    return validators;
  }

}
