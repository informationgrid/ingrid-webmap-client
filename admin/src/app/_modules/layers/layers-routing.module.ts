import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayerComponent } from './layer/layer.component';

const routes: Routes = [
  {
    path: '',
    component: LayerComponent,
    outlet: 'layerContent'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LayersRoutingModule { }
