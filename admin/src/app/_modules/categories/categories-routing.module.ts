import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CategoryComponent } from './category/category.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: CategoryComponent,
        outlet: 'categoryContent'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CategoriesRoutingModule { }
