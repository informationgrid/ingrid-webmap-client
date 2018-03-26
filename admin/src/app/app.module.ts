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

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, environment.translatePath + "/assets/i18n/");
}

@NgModule({
  declarations: [
    AppComponent,
    TranslationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
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
