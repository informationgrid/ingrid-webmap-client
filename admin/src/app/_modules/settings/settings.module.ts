import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SettingsRoutingModule } from './settings-routing.module';
import { SettingComponent } from './setting/setting.component';
import { AppModule } from '../../app.module';
import { FormsModule } from '@angular/forms';
import { ShareModule } from '../share/share.module';

@NgModule({
  imports: [
    CommonModule,
    SettingsRoutingModule,
    ShareModule
  ],
  declarations: [
    SettingComponent
  ]
})
export class SettingsModule { }
