import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CssComponent } from './css/css.component';

const routes: Routes = [
  {
    path: '',
    component: CssComponent,
    outlet: 'cssContent'
  },
  {
    path: ':id',
    component: CssComponent,
    outlet: 'cssContent'
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StylesRoutingModule { }
