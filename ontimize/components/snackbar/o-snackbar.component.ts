import { Component, Injector, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBarRef } from '@angular/material';

import { OSharedModule } from '../../shared';
import { OTranslateModule } from '../../pipes/o-translate.pipe';

export declare type OSnackBarIconPosition = 'left' | 'right';

/**
 * Configuration for showing a SnackBar with the SnackBar service.
 */
export class OSnackBarConfig {
  /** Text shown in the action button. */
  action?: string;
  /** Time the SnackBar is shown. */
  milliseconds?: number;
  /** Material icon shown in the SnackBar. */
  icon?: string;
  /** Position where the icon is shown. Default left. */
  iconPosition?: OSnackBarIconPosition;
}

@Component({
  selector: 'o-snackbar',
  templateUrl: 'o-snackbar.component.html',
  styleUrls: ['o-snackbar.component.scss']
})
export class OSnackBarComponent {

  message: string;
  action: string;
  icon: string;
  iconPosition: OSnackBarIconPosition = 'left';

  protected snackBarRef: MatSnackBarRef<OSnackBarComponent>;

  constructor(
    protected injector: Injector
  ) {
    this.snackBarRef = this.injector.get(MatSnackBarRef);
  }

  open(message: string, config?: OSnackBarConfig): void {
    this.message = message;
    if (config) {
      if (config.action) {
        this.action = config.action;
      }
      if (config.icon) {
        this.icon = config.icon;
      }
      if (config.iconPosition) {
        this.iconPosition = config.iconPosition;
      }
    }
  }

  onAction(e: Event): void {
    this.snackBarRef.closeWithAction();
  }

}

@NgModule({
  declarations: [OSnackBarComponent],
  imports: [CommonModule, OSharedModule, OTranslateModule],
  exports: [OSnackBarComponent, CommonModule]
})
export class OSnackBarModule {
}
