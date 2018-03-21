import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { TranslationComponent } from './_modules/translation/translation.component';
import { SettingComponent } from './_modules/setting/setting.component';
import { CategoryComponent } from './_modules/category/category.component';
import { LayerComponent } from './_modules/layer/layer.component';
import { MapToIterablePipe } from './_pipes/map-to-iterable.pipe';
import { ArrayFilterPipe } from './_pipes/array-filter.pipe';
import { CategoryItemComponent } from './_modules/category-item/category-item.component';
import { LayerItemComponent } from './_modules/layer-item/layer-item.component';
import { CategoryTreeComponent } from './_modules/category-tree/category-tree.component';
import { TreeModule } from 'angular-tree-component';
import { MapUtilsService } from './_services/map-utils.service';
import { HttpService } from './_services/http.service';
import { HelpComponent } from './_modules/help/help.component';
import { CssComponent } from './_modules/css/css.component';
import { FormCategoryAddComponent } from './_modules/form-category-add/form-category-add.component';
import { FormCategoryEditComponent } from './_modules/form-category-edit/form-category-edit.component';
import { NgProgressModule } from '@ngx-progressbar/core';
import { environment } from '../environments/environment';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, environment.translatePath + "/assets/i18n/");
}

@NgModule({
  declarations: [
    AppComponent,
    TranslationComponent,
    SettingComponent,
    CategoryComponent,
    LayerComponent,
    MapToIterablePipe,
    ArrayFilterPipe,
    CategoryItemComponent,
    LayerItemComponent,
    CategoryTreeComponent,
    HelpComponent,
    CssComponent,
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
    NgProgressModule.forRoot({ color: 'red' }),
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
