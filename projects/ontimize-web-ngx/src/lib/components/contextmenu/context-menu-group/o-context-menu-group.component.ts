import { Component, ContentChildren, forwardRef, OnInit, QueryList, AfterContentInit } from '@angular/core';

import { OComponentMenuItems } from '../o-content-menu.class';
import { DEFAULT_INPUTS_O_CONTEXT_MENU_ITEM, OContextMenuItemComponent } from '../context-menu-item/o-context-menu-item.component';

export const DEFAULT_CONTEXT_MENU_GROUP_INPUTS = [
  ...DEFAULT_INPUTS_O_CONTEXT_MENU_ITEM,
  'children'
];

@Component({
  moduleId: module.id,
  selector: 'o-context-menu-group',
  template: ' ',
  inputs: DEFAULT_CONTEXT_MENU_GROUP_INPUTS,
  providers: [{ provide: OComponentMenuItems, useExisting: forwardRef(() => OContextMenuGroupComponent) }]
})
export class OContextMenuGroupComponent extends OContextMenuItemComponent implements OnInit, AfterContentInit {

  public type = OComponentMenuItems.TYPE_GROUP_MENU;
  public children = [];

  @ContentChildren(OComponentMenuItems) public oContextMenuItems: QueryList<OComponentMenuItems>;

  public ngAfterContentInit(): void {
    this.children = this.oContextMenuItems.toArray().slice(1, this.oContextMenuItems.toArray().length);
  }

}
