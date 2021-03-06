import { Component, Injector, Input, ViewChild } from '@angular/core';
import { MatMenu } from '@angular/material/menu';

import { OComponentMenuItems } from '../../o-content-menu.class';

export const DEFAULT_CONTEXT_MENU_CONTENT_ITEM_INPUTS = [
  'items',
  'class'
];

@Component({
  selector: 'o-wrapper-content-menu',
  templateUrl: 'o-wrapper-content-menu.component.html',
  styleUrls: ['./o-wrapper-content-menu.component.scss'],
  inputs: DEFAULT_CONTEXT_MENU_CONTENT_ITEM_INPUTS
})
export class OWrapperContentMenuComponent {

  public class: string;

  @Input()
  public items: any[];

  @ViewChild('childMenu', { static: true })
  public childMenu: MatMenu;

  @ViewChild(OWrapperContentMenuComponent, { static: true })
  public menu: OWrapperContentMenuComponent;

  constructor(
    protected injector: Injector
  ) { }

  public onClick(item, event?): void {
    item.triggerExecute(item.data, event);
  }

  public isGroup(item): boolean {
    let isGroup = false;
    if (item && item.children && item.children.length > 0) {
      isGroup = true;
    }
    return isGroup;
  }

  public isSepararor(item): boolean {
    let isSepararor = false;
    if (item && item.type && item.type === OComponentMenuItems.TYPE_SEPARATOR_MENU) {
      isSepararor = true;
    }
    return isSepararor;
  }

  public isItem(item): boolean {
    let isItem = false;
    if (item && item.type && item.type === OComponentMenuItems.TYPE_ITEM_MENU) {
      isItem = true;
    }
    return isItem;
  }

}
