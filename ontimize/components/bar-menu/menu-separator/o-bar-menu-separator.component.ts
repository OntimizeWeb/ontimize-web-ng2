import { Component, ViewEncapsulation, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'o-bar-menu-separator',
  templateUrl: './o-bar-menu-separator.component.html',
  styleUrls: ['./o-bar-menu-separator.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class OBarMenuSeparatorComponent {
}

@NgModule({
  declarations: [OBarMenuSeparatorComponent],
  imports: [CommonModule],
  exports: [OBarMenuSeparatorComponent]
})
export class OBarMenuSeparatorModule {
}
