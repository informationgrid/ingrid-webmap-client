import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CategoriesRoutingModule } from './categories-routing.module';
import { CategoryComponent } from './category/category.component';
import { CategoryItemComponent } from './category-item/category-item.component';
import { FormCategoryAddComponent } from './form-category-add/form-category-add.component';
import { FormCategoryEditComponent } from './form-category-edit/form-category-edit.component';
import { ArrayFilterPipe } from '../../_pipes/array-filter.pipe';
import { MapToIterablePipe } from '../../_pipes/map-to-iterable.pipe';
import { ShareModule } from '../share/share.module';
import { CategoryListComponent } from './category-list/category-list.component';
import { CategoryTreeComponent } from './category/category-tree/category-tree.component';

@NgModule({
  imports: [
    CommonModule,
    CategoriesRoutingModule,
    ShareModule
  ],
  declarations: [
    CategoryComponent,
    CategoryItemComponent,
    FormCategoryAddComponent,
    FormCategoryEditComponent,
    CategoryListComponent,
    CategoryTreeComponent
  ]
})
export class CategoriesModule { }
