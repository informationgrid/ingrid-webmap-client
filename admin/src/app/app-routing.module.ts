import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: 'categories',
    loadChildren: 'app/_modules/categories/categories.module#CategoriesModule'
  },
  {
    path: 'layers',
    loadChildren: 'app/_modules/layers/layers.module#LayersModule'
  },
  {
    path: 'settings',
    loadChildren: 'app/_modules/settings/settings.module#SettingsModule'
  },
  {
    path: 'helps',
    loadChildren: 'app/_modules/helps/helps.module#HelpsModule'
  },
  {
    path: 'styles',
    loadChildren: 'app/_modules/styles/styles.module#StylesModule'
  },
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
