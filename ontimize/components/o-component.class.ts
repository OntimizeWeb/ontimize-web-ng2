import { Injector } from '@angular/core';
import { InputConverter, BooleanConverter } from '../decorators';
import { OTranslateService, PermissionsService, OPermissions } from '../services';
import { Util } from '../utils';

export interface IComponent {
  getAttribute(): string;
}

export class OBaseComponent implements IComponent {
  /* Inputs */
  protected oattr: string;
  protected olabel: string;
  protected oplaceholder: string;
  protected _oenabled: boolean = true;
  protected _readOnly: boolean;
  @InputConverter()
  protected orequired: boolean = false;

  /* Internal variables */
  protected injector: Injector;
  protected translateService: OTranslateService;

  protected _disabled: boolean;
  protected _isReadOnly: boolean;
  protected _tooltip: string;
  protected _tooltipPosition: string = 'below';
  protected _tooltipShowDelay: number = 500;
  protected permissions: OPermissions;

  constructor(injector: Injector) {
    this.injector = injector;
    if (this.injector) {
      this.translateService = this.injector.get(OTranslateService);
    }
  }

  initialize() {
    this._disabled = !this.oenabled;
    if (!Util.isDefined(this.olabel)) {
      this.olabel = this.oattr;
    }
    if (!Util.isDefined(this.oplaceholder)) {
      this.oplaceholder = this.oattr;
    }
    this.olabel = this.translateService.get(this.olabel);
    this.oplaceholder = this.translateService.get(this.oplaceholder);
  }

  getAttribute(): string {
    if (this.oattr) {
      return this.oattr;
    }
    return undefined;
  }

  get placeHolder(): string {
    return this.oplaceholder;
  }

  set placeHolder(value: string) {
    this.oplaceholder = value;
  }

  get tooltip(): string {
    if (Util.isDefined(this._tooltip) && this.translateService) {
      return this.translateService.get(this._tooltip);
    }
    return this._tooltip;
  }

  set tooltip(value: string) {
    this._tooltip = value;
  }

  get tooltipPosition(): string {
    return this._tooltipPosition;
  }

  set tooltipPosition(value: string) {
    this._tooltipPosition = value;
  }

  get tooltipShowDelay(): number {
    return this._tooltipShowDelay;
  }

  set tooltipShowDelay(value: number) {
    this._tooltipShowDelay = value;
  }

  get isReadOnly(): boolean {
    return this._isReadOnly;
  }

  set isReadOnly(value: boolean) {
    this.setIsReadOnly(value);
  }

  protected setIsReadOnly(value: boolean) {
    // only modifiyng read only state if the component has not its own read-only input
    if (Util.isDefined(this.readOnly)) {
      return;
    }
    if (this._disabled) {
      this._isReadOnly = false;
      return;
    }
    if (!PermissionsService.checkEnabledPermission(this.permissions)) {
      return;
    }
    this._isReadOnly = value;
  }

  get readOnly(): any {
    return this._readOnly;
  }

  set readOnly(value: any) {
    if (!PermissionsService.checkEnabledPermission(this.permissions)) {
      return;
    }
    const parsedValue = BooleanConverter(value);
    this._readOnly = parsedValue;
    this._isReadOnly = parsedValue;
  }

  get isDisabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    if (!PermissionsService.checkEnabledPermission(this.permissions)) {
      return;
    }
    this._disabled = value;
  }

  get isRequired(): boolean {
    return this.orequired;
  }

  set required(value: boolean) {
    var self = this;
    window.setTimeout(() => {
      self.orequired = value;
    }, 0);
  }

  get oenabled(): any {
    return this._oenabled;
  }

  set oenabled(value: any) {
    if (!PermissionsService.checkEnabledPermission(this.permissions)) {
      return;
    }
    const parsedValue = BooleanConverter(value);
    this._oenabled = parsedValue;
    this.disabled = !parsedValue;
  }
}
