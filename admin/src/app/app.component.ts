import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HttpService } from './_services/http.service';
import { LayerItem } from './_models/layer-item';
import { Category } from './_models/category';
import { environment } from '../environments/environment';
import { Setting } from './_models/setting';

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
  settings: Setting = new Setting();
  version: string = environment.version;

  ngOnInit() {
    this.httpService.getData().subscribe(
      data => {
        this.layers = data[0];
        this.categories = data[1];
        this.settings = data[2];
      }
    );
  }

  updateAppLayers(event: LayerItem[]) {
    this.layers = event;
  }
  updateAppCategories(event) {
    this.categories = event;
  }
  updateAppSettings(event) {
    this.settings = event;
  }
}
