import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { Category } from '../_models/category';
import { LayerItem } from '../_models/layer-item';
import 'rxjs/add/operator/map';
import { Wmslayer } from '../_models/wmslayer';
import { Wmtslayer } from '../_models/wmtslayer';
import { CategoryItem } from '../_models/category-item';
import { Setting } from '../_models/setting';
import { environment } from '../../environments/environment';
import { LayerPaging } from '../_models/layer-paging';

const httpJsonOptions = {
  headers: new HttpHeaders({
     'Content-Type': 'application/json'
  })
};

const httpApiHost = environment.httpServiceDomain + '/ingrid-webmap-client/rest/admin';
const httpServiceUrl = environment.httpServiceDomain + '/ingrid-webmap-client/rest/wms/proxy/?';

@Injectable()
export class HttpService {

  constructor(private http: HttpClient) { }

// Layers
  getLayers(): Observable<LayerItem[]> {
    return this.http.get<LayerItem[]>(httpApiHost + '/layers', httpJsonOptions).map(
      res => {
        return res.map(resItem => {
          return new LayerItem(
            resItem.id,
            resItem.item
          );
        });
      }
    );
  }

  getLayersPerPage(currentPage: number, layersPerPage: number, searchText: string): Observable<LayerPaging> {
    let url = httpApiHost + '/layers?';
    if (currentPage) {
      url += 'currentPage=' + currentPage;
    }
    if (layersPerPage) {
      url += '&layersPerPage=' + layersPerPage;
    }
    if (searchText) {
      url += '&searchText=' + searchText;
    }
    return this.http.get<LayerPaging>(url, httpJsonOptions).map(
      res => {
        const items: LayerItem[] = [];
        res.items.forEach(resItem => {
          items.push(new LayerItem(resItem.id, resItem.item));
        });
        return new LayerPaging(res.firstPage, res.lastPage, res.totalItemsNum, items);
      }
    );
  }

  getLayersSearch(searchText: string): Observable<LayerItem[]> {
    let url = httpApiHost + '/layers?';
    if (searchText) {
      url += '&searchText=' + searchText;
    }
    return this.http.get<LayerItem[]>(url, httpJsonOptions).map(
      res => {
        return res.map(resItem => {
          return new LayerItem(
            resItem.id,
            resItem.item
          );
        });
      }
    );
  }

  getLayer(id: string) {
    return this.http.get(httpApiHost + '/layers/' + id, httpJsonOptions);
  }

  updateLayer(layer: LayerItem) {
    const body = JSON.stringify(layer);
    return this.http.put(httpApiHost + '/layers/' + layer.id, body, httpJsonOptions);
  }

  addLayer(layers: LayerItem[]): Observable<LayerItem[]> {
    const body = JSON.stringify(layers);
    return this.http.post<LayerItem[]>(httpApiHost + '/layers', body, httpJsonOptions).map(
      res => {
        return res.map(resItem => {
          return new LayerItem(
            resItem.id,
            resItem.item
          );
        });
      }
    );
  }

  deleteLayer(id: string) {
    return this.http.delete(httpApiHost + '/layers/' + id, httpJsonOptions);
  }

  deleteLayers(layers: string[]): Observable<LayerItem[]> {
    let paramIds = 'ids=';
    layers.forEach(layer => {
      paramIds += layer + ',';
    });
    return this.http.delete<LayerItem[]>(httpApiHost + '/layers?' + paramIds, httpJsonOptions);
  }

// Categories
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(httpApiHost + '/categories', httpJsonOptions).map(
      res => {
        return res.map(resItem => {
          return new Category(
            resItem.id,
            resItem.defaultBackground,
            resItem.selectedLayers,
            resItem.backgroundLayers,
            resItem.activatedLayers
          );
        });
      }
    );
  }

  getCategory(id: string, nodeId: string): Observable<CategoryItem[]> {
    let url = httpApiHost + '/categories';
    if (id) {
      url += '/' + id;
    }
    if (nodeId) {
      url += '/' + nodeId;
    }
    return this.http.get<CategoryItem[]>(url, httpJsonOptions);
  }

  updateCategory(category: Category): Observable<Category[]> {
    const body = JSON.stringify(category);
    return this.http.put<Category[]>(httpApiHost + '/categories/' + category.id, body, httpJsonOptions);
  }

  addCategory(category: Category): Observable<Category[]> {
    const body = JSON.stringify(category);
    return this.http.post<Category[]>(httpApiHost + '/categories', body, httpJsonOptions);
  }

  deleteCategory(id: string): Observable<Category[]> {
    return this.http.delete<Category[]>(httpApiHost + '/categories/' + id, httpJsonOptions);
  }

  deleteCategories(categories: string[]): Observable<Category[]> {
    let paramIds = 'ids=';
    categories.forEach(category => {
      paramIds += category + ',';
    });
    return this.http.delete<Category[]>(httpApiHost + '/categories?' + paramIds, httpJsonOptions);
  }

  updateCategoryTree(id: string, item: any): Observable<CategoryItem[]> {
    const body = JSON.stringify(item);
    return this.http.put<CategoryItem[]>(httpApiHost + '/categorytree/' + id, body, httpJsonOptions);
  }

  getData() {
      return forkJoin(
        this.getLayers(),
        this.getCategories(),
        this.getSetting()
      );
  }

// Service
  getService(url: string) {
    return this.http.get(httpServiceUrl, {
      params: {
        url: url,
        toJson: 'true'
      }
    });
  }

// Settings
  getSetting(): Observable<Map<String, Setting>> {
    return this.http.get<Map<String, Setting>>(httpApiHost + '/setting', httpJsonOptions);
  }

  updateSetting(setting: any): Observable<Map<String, Setting>> {
    const body = JSON.stringify(setting);
    return this.http.put<Map<String, Setting>>(httpApiHost + '/setting', body, httpJsonOptions);
  }

// Help
  getHelp(lang: string) {
    return this.http.get(httpApiHost + '/help/' + lang, {responseType: 'text'});
  }

  updateHelp(lang: string, help: string) {
    return this.http.put(httpApiHost + '/help/' + lang, help, {responseType: 'text'});
  }

// CSS
  getCss() {
    return this.http.get(httpApiHost + '/css', {responseType: 'text'});
  }

  updateCss(css: string) {
    return this.http.put(httpApiHost + '/css', css, {responseType: 'text'});
  }
}
