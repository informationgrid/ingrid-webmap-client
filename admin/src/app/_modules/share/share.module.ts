import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientModule } from '@angular/common/http';
import { TreeModule } from 'angular-tree-component';
import { MapToIterablePipe } from '../../_pipes/map-to-iterable.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ArrayFilterPipe } from '../../_pipes/array-filter.pipe';

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    HttpClientModule,
    TreeModule,
    TranslateModule.forChild({})
  ],
  exports:[
    FormsModule,
    ReactiveFormsModule,
    TreeModule,
    MapToIterablePipe,
    TranslateModule,
    ArrayFilterPipe
  ],
  declarations: [
    MapToIterablePipe,
    ArrayFilterPipe
  ]
})
export class ShareModule { }
