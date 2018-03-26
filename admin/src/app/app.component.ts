import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HttpService } from './_services/http.service';
import { LayerItem } from './_models/layer-item';
import { Category } from './_models/category';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'app';
  constructor(private translate: TranslateService, private httpService: HttpService) {
  }

  layers: LayerItem[] = [];
  categories: Category[] = [];
  settings: any = {};
  version: string = environment.version;

  hasLoadLayers: boolean = true;
  hasLoadCategory: boolean = true;
  hasLoadSetting: boolean = true;
  
  ngOnInit() {
  }

  updateAppLayers(event: LayerItem[]){
    this.layers = event;
  }
  updateAppCategories(event){
    this.categories = event;
  }
  updateAppSettings(event){
    this.settings = event;
  }
}
