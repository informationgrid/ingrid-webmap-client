import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HelpsRoutingModule } from './helps-routing.module';
import { HelpComponent } from './help/help.component';
import { ShareModule } from '../share/share.module';

@NgModule({
  imports: [
    CommonModule,
    HelpsRoutingModule,
    ShareModule
  ],
  declarations: [
    HelpComponent
  ]
})
export class HelpsModule { }
