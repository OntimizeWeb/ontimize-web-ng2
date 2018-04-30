import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  Injector,
  forwardRef,
  ElementRef,
  NgModule,
  ViewEncapsulation
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs/Subscription';

import { OFormComponent } from './o-form.component';
import { InputConverter } from '../../decorators';
import { Util } from '../../util/util';
import { DialogService, NavigationService } from '../../services';
import { OSharedModule } from '../../shared';
import { OFormNavigationComponent } from './navigation/o-form-navigation.component';

export const DEFAULT_INPUTS_O_FORM_TOOLBAR = [
  'labelHeader: label-header',
  'labelHeaderAlign: label-header-align',
  'headeractions: header-actions',
  'showHeaderActionsText: show-header-actions-text',
  //show-header-navigation [string][yes|no|true|false]: Include navigations buttons in form-toolbar. Default: true;
  'showHeaderNavigation:show-header-navigation'
];

@Component({
  selector: 'o-form-toolbar',
  templateUrl: './o-form-toolbar.component.html',
  styleUrls: ['./o-form-toolbar.component.scss'],
  inputs: DEFAULT_INPUTS_O_FORM_TOOLBAR,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.o-form-toolbar]': 'true'
  }
})

export class OFormToolbarComponent implements OnInit, OnDestroy {

  public static DEFAULT_INPUTS_O_FORM_TOOLBAR = DEFAULT_INPUTS_O_FORM_TOOLBAR;

  /* Bindings */
  labelHeader: string = '';
  headeractions: string = '';
  labelHeaderAlign: string = 'center';

  @InputConverter()
  showHeaderActionsText: boolean = true;

  formActions: string[];
  isDetail: boolean = true;

  public editMode: boolean = false;
  public insertMode: boolean = false;
  public initialMode: boolean = true;

  refreshBtnEnabled: boolean = false;
  insertBtnEnabled: boolean = false;
  editBtnEnabled: boolean = false;
  deleteBtnEnabled: boolean = false;
  saveBtnEnabled: boolean = false;

  protected _existsChangesToSave: boolean = false;

  protected _dialogService: DialogService;
  protected _navigationService: NavigationService;

  protected formCacheSubscription: Subscription;

  @InputConverter()
  showHeaderNavigation: boolean = true;

  constructor( @Inject(forwardRef(() => OFormComponent)) private _form: OFormComponent,
    public element: ElementRef,
    protected injector: Injector) {
    _form.registerToolbar(this);
    this._dialogService = this.injector.get(DialogService);
    this._navigationService = this.injector.get(NavigationService);


  }

  ngOnInit() {
    this.formActions = Util.parseArray(this.headeractions);
    if (this.formActions && this.formActions.length > 0) {
      this.refreshBtnEnabled = this.formActions.indexOf('R') !== -1;
      this.insertBtnEnabled = this.formActions.indexOf('I') !== -1;
      this.editBtnEnabled = this.formActions.indexOf('U') !== -1;
      this.deleteBtnEnabled = !this.insertMode && this.formActions.indexOf('D') !== -1;
    }
    if (this._navigationService) {
      var self = this;
      this._navigationService.onTitleChange(title => {
        self.labelHeader = title;
      });
    }
  }

  ngOnDestroy() {
    if (this.formCacheSubscription) {
      this.formCacheSubscription.unsubscribe();
    }
  }

  protected manageEditableDetail() {
    let isEditableDetail = this._form.isEditableDetail();
    this.saveBtnEnabled = isEditableDetail;

    this.refreshBtnEnabled = this.refreshBtnEnabled && isEditableDetail;
    this.insertBtnEnabled = this.insertBtnEnabled && isEditableDetail;
    this.editBtnEnabled = this.editBtnEnabled && !isEditableDetail;

    let self = this;
    this.formCacheSubscription = this._form.formGroup.valueChanges.subscribe((value: any) => {
      if (self._form.isEditableDetail()) {
        self.existsChangesToSave = self._form.isInitialStateChanged();
      }
    });
  }

  setInitialMode() {
    this.manageEditableDetail();
    this.initialMode = true;
    this.insertMode = false;
    this.editMode = false;
  }

  setInsertMode() {
    this.initialMode = false;
    this.insertMode = true;
    this.editMode = false;
  }

  setEditMode() {
    this.initialMode = false;
    this.insertMode = false;
    this.editMode = true;
  }

  onCloseDetail() {
    this._form.executeToolbarAction(OFormComponent.CLOSE_DETAIL_ACTION, {
      changeToolbarMode: true
    });
  }

  onBack() {
    this._form.executeToolbarAction(OFormComponent.BACK_ACTION);
  }

  onReload() {
    let self = this;
    this._form.showConfirmDiscardChanges().then(val => {
      if (val) {
        self._form.executeToolbarAction(OFormComponent.RELOAD_ACTION);
      }
    });
  }

  onInsert() {
    this._form.executeToolbarAction(OFormComponent.GO_INSERT_ACTION, {
      changeToolbarMode: true
    });
  }

  onEdit() {
    this._form.executeToolbarAction(OFormComponent.GO_EDIT_ACTION, {
      changeToolbarMode: true
    });
  }

  onDelete(evt: any) {
    this.showConfirmDelete(evt);
  }

  onSave(evt: any) {
    this.handleAcceptEditOperation();
  }

  get existsChangesToSave(): boolean {
    return this._existsChangesToSave;
  }

  set existsChangesToSave(val: boolean) {
    this._existsChangesToSave = val;
  }

  cancelOperation() {
    if (this.isDetail) {
      this.onCloseDetail();
    } else if (!this.isDetail && this.insertMode) {
      this.onCloseDetail();
    } else {
      this.onReload();
      this.setInitialMode();
    }
  }

  acceptOperation() {
    if (this.editMode) {
      this.handleAcceptEditOperation();
    } else if (this.insertMode) {
      this.handleAcceptInsertOperation();
    }
  }

  handleAcceptInsertOperation() {
    this._form.executeToolbarAction(OFormComponent.INSERT_ACTION);
  }

  handleAcceptEditOperation() {
    this._form.executeToolbarAction(OFormComponent.EDIT_ACTION);
  }

  showConfirmDelete(evt: any) {
    this._dialogService.confirm('CONFIRM', 'MESSAGES.CONFIRM_DELETE').then(res => {
      if (res === true) {
        this._form.executeToolbarAction(OFormComponent.DELETE_ACTION).subscribe(resp => {
          //TODO mostrar un toast indicando que la operación fue correcta...
          this.onCloseDetail();
        }, err => {
          console.log('OFormToolbar.delete error');
        });
      }
    }
    );
  }

  get showNavigation(): boolean {
    return this.showHeaderNavigation && !(this._form.getFormManager() && this._form.getFormManager().isTabMode());
  }

  getLabelHeaderAlign(): string {
    return this.labelHeaderAlign;
  }

  get showUndoButton(): boolean {
    return this._form.undoButton && (!this.initialMode || this._form.isEditableDetail());
  }

  get isChangesStackEmpty(): boolean {
    return this._form.isCacheStackEmpty;
  }

  onUndoLastChange() {
    this._form.executeToolbarAction(OFormComponent.UNDO_LAST_CHANGE_ACTION);
  }
}

@NgModule({
  declarations: [OFormToolbarComponent, OFormNavigationComponent],
  imports: [OSharedModule, CommonModule],
  exports: [OFormToolbarComponent, OFormNavigationComponent]
})
export class OFormToolbarModule {
}
