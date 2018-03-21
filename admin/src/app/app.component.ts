import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HttpService } from './utils/http.service';
import { LayerItem } from './model/layer-item';
import { Category } from './model/category';

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

  ngOnInit() {
    this.httpService.getLayers().subscribe(
      data => {
        this.updateAppLayers(data);
      }
    );
    this.httpService.getCategories().subscribe(
      data => {
        this.updateAppCategories(data);
      }
    );
    this.httpService.getSetting().subscribe(
      data => {
        this.updateAppSettings(data);
      }
    );
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
