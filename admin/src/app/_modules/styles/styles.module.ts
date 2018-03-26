import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StylesRoutingModule } from './styles-routing.module';
import { CssComponent } from './css/css.component';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpLoaderFactory } from '../../app.module';
import { HttpClient } from '@angular/common/http';
import { ArrayFilterPipe } from '../../_pipes/array-filter.pipe';
import { MapToIterablePipe } from '../../_pipes/map-to-iterable.pipe';
import { ShareModule } from '../share/share.module';

@NgModule({
  imports: [
    CommonModule,
    StylesRoutingModule,
    ShareModule
  ],
  declarations: [
    CssComponent
  ]
})
export class StylesModule { }
