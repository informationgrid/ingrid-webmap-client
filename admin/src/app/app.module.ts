import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { TranslationComponent } from './component/translation/translation.component';
import { SettingComponent } from './component/setting/setting.component';
import { CategoryComponent } from './component/category/category.component';
import { LayerComponent } from './component/layer/layer.component';
import { MapToIterablePipe } from './pipe/map-to-iterable.pipe';
import { ArrayFilterPipe } from './pipe/array-filter.pipe';
import { CategoryItemComponent } from './component/category-item/category-item.component';
import { LayerItemComponent } from './component/layer-item/layer-item.component';
import { CategoryTreeComponent } from './component/category-tree/category-tree.component';
import { TreeModule } from 'angular-tree-component';
import { MapUtilsService } from './utils/map-utils.service';
import { HttpService } from './utils/http.service';
import { HelpComponent } from './component/help/help.component';
import { CssComponent } from './component/css/css.component';
import { FormCategoryAddComponent } from './component/form-category-add/form-category-add.component';
import { FormCategoryEditComponent } from './component/form-category-edit/form-category-edit.component';
import { NgProgressModule } from '@ngx-progressbar/core';


export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
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
