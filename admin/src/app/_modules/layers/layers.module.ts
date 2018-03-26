import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayersRoutingModule } from './layers-routing.module';
import { LayerComponent } from './layer/layer.component';
import { LayerItemComponent } from './layer-item/layer-item.component';
import { ShareModule } from '../share/share.module';

@NgModule({
  imports: [
    CommonModule,
    LayersRoutingModule,
    ShareModule
  ],
  declarations: [
    LayerComponent,
    LayerItemComponent
  ]
})
export class LayersModule { }
