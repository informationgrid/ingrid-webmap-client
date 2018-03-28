import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { TranslationComponent } from './_modules/translations/translation/translation.component';
import { CategoryComponent } from './_modules/categories/category/category.component';
import { LayerComponent } from './_modules/layers/layer/layer.component';
import { MapToIterablePipe } from './_pipes/map-to-iterable.pipe';
import { ArrayFilterPipe } from './_pipes/array-filter.pipe';
import { MapUtilsService } from './_services/map-utils.service';
import { HttpService } from './_services/http.service';
import { environment } from '../environments/environment';
import { LayerItemComponent } from './_modules/layers/layer-item/layer-item.component';
import { CategoryItemComponent } from './_modules/categories/category-item/category-item.component';
import { CategoryTreeComponent } from './_modules/categories/category-tree/category-tree.component';
import { SettingComponent } from './_modules/settings/setting/setting.component';
import { HelpComponent } from './_modules/helps/help/help.component';
import { CssComponent } from './_modules/styles/css/css.component';
import { FormCategoryAddComponent } from './_modules/categories/form-category-add/form-category-add.component';
import { FormCategoryEditComponent } from './_modules/categories/form-category-edit/form-category-edit.component';
import { TreeModule } from 'angular-tree-component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, environment.translatePath + "/assets/i18n/");
}

@NgModule({
  declarations: [
    AppComponent,
    TranslationComponent,
    LayerComponent,
    LayerItemComponent,
    CategoryComponent,
    CategoryItemComponent,
    CategoryTreeComponent,
    SettingComponent,
    HelpComponent,
    CssComponent,
    MapToIterablePipe,
    ArrayFilterPipe,
    FormCategoryAddComponent,
    FormCategoryEditComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    TreeModule,
    TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
      }
    })
  ],
  providers: [MapUtilsService, HttpService],
  bootstrap: [AppComponent]
})
export class AppModule { }
