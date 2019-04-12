import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { Category } from '../_models/category';
import { LayerItem } from '../_models/layer-item';
import 'rxjs/add/operator/map';
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
const httpServiceUrlAuth = environment.httpServiceDomain + '/ingrid-webmap-client/rest/wms/proxy/auth?';

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

  getLayersPerPage(currentPage: number, layersPerPage: number, searchText: string, hasStatus: boolean,
      searchCategory: string, searchType: string): Observable<LayerPaging> {
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
    if (hasStatus) {
      url += '&hasStatus=' + hasStatus;
    }
    if (searchCategory) {
      url += '&searchCategory=' + searchCategory;
    }
    if (searchType) {
      url += '&searchType=' + searchType;
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

  updateLayer(layerId: string, layer: LayerItem) {
    const body = JSON.stringify(layer);
    return this.http.put<LayerItem>(httpApiHost + '/layers/' + layerId, body, httpJsonOptions);
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

  addLayerAndAuth(layers: LayerItem[], url: string, login: string, password: string, overrideLogin: boolean) {
    return forkJoin(
      this.updateAuth(url, login, password, overrideLogin),
      this.addLayer(layers),
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

  deleteAllLayers(): Observable<LayerItem[]> {
    return this.http.delete<LayerItem[]>(httpApiHost + '/layers/all', httpJsonOptions);
  }

// Auth
  updateAuth(url: string, login: string, password: string, overrideLogin: boolean) {
    const body = {
      url: url,
      login: login,
      password: password,
      overrideLogin: overrideLogin
    };
    return this.http.post(httpApiHost + '/auth', body, httpJsonOptions);
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
    return this.http.get<CategoryItem[]>(url, httpJsonOptions).map(
      res => {
        return res.map(resItem => {
          return this.mapCategoryItem(resItem);
        });
      }
    );
  }

  mapCategoryItem (resItem) {
    const item = new CategoryItem(
      resItem.id,
      resItem.label,
      resItem.staging,
      resItem.selectedOpen
    );
    if (resItem.layerBodId) {
      item.layerBodId = resItem.layerBodId;
    }
    if (resItem.children) {
      item.children = resItem.children.map(resChildrenItem => {
        return this.mapCategoryItem(resChildrenItem);
      });
    }
    return item;
  }

  getCategoriesOfLayer(layerId: string, isExpanded) {
    return this.http.get(httpApiHost + '/categories/layer/' + layerId, {
      params: {
        isExpanded: isExpanded
      }
    });
  }

  updateCategoryAndLabel(category: Category, locale: Map<String, String>) {
    return forkJoin(
      this.updateCategory(category),
      this.updateLocales(locale, 'de')
    );
  }

  updateCategory(category: Category): Observable<Category[]> {
    const body = JSON.stringify(category);
    return this.http.put<Category[]>(httpApiHost + '/categories/' + category.id, body, httpJsonOptions);
  }

  addCategoryAndLabel(category: Category, locale: Map<String, String>, copyId: String) {
    return forkJoin(
      this.addCategory(category, copyId),
      this.updateLocales(locale, 'de')
    );
  }

  addCategory(category: Category, copyId: String): Observable<Category[]> {
    const body = JSON.stringify(category);
    if (copyId) {
      return this.http.post<Category[]>(httpApiHost + '/categories/' + copyId, body, httpJsonOptions);
    }
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

  deleteAllCategories(): Observable<Category[]> {
    return this.http.delete<Category[]>(httpApiHost + '/categories/all', httpJsonOptions);
  }

  updateCategoryTree(id: string, item: any): Observable<CategoryItem[]> {
    const body = JSON.stringify(item);
    return this.http.put<CategoryItem[]>(httpApiHost + '/categorytree/' + id, body, httpJsonOptions);
  }

  updateCategoryTreeAndCategories(id: string, item: any) {
    return forkJoin(
      this.updateCategoryTree(id, item),
      this.getCategories()
    );
  }
  getData() {
      return forkJoin(
        this.getLayers(),
        this.getCategories(),
        this.getSetting()
      );
  }

// Service
  getService(url: string, login: string, password: string, overrideLogin: boolean) {
    if (login && password) {
      const body = {
        url: url,
        toJson: 'true',
        login: login,
        password: password,
        overrideLogin: overrideLogin
      };
      return this.http.post(httpServiceUrlAuth, body, httpJsonOptions);
    } else {
      return this.http.get(httpServiceUrl, {
        params: {
          url: url,
          toJson: 'true'
        }
      });
    }
  }

  loadServiceLayers(serviceUrl: string, login: string) {
    return this.http.get(httpServiceUrl.replace('/?', '/layers?'), {
      params: {
        url: serviceUrl,
        login: login
      }
    });
  }

// Settings
  getSetting(): Observable<Setting> {
    return this.http.get<Setting>(httpApiHost + '/setting', httpJsonOptions);
  }

  updateSetting(setting: any): Observable<Setting> {
    const body = JSON.stringify(setting);
    return this.http.put<Setting>(httpApiHost + '/setting', body, httpJsonOptions);
  }

  resetSetting(): Observable<Setting> {
    return this.http.put<Setting>(httpApiHost + '/setting/reset', '', httpJsonOptions);
  }

// Help
  getHelp(lang: string) {
    return this.http.get(httpApiHost + '/help/' + lang, {responseType: 'text'});
  }

  updateHelp(lang: string, help: any) {
    return this.http.put(httpApiHost + '/help/' + lang, help, {responseType: 'text'});
  }

  resetHelpKey(lang: string, id: any) {
    return this.http.put(httpApiHost + '/help/reset/' + lang + '/' + id, '', {responseType: 'text'});
  }
// CSS
  getCss() {
    return this.http.get(httpApiHost + '/css', {responseType: 'text'});
  }

  updateCss(css: string) {
    return this.http.put(httpApiHost + '/css', css, {responseType: 'text'});
  }

// Locales
  getLocalisation(lang: string) {
    return this.http.get(httpApiHost + '/locales/' + lang, {responseType: 'text'});
  }

  updateLocales(map: Map<String, String>, lang) {
    let body = '{';
    if (map) {
      map.forEach((value: string, key: string) => {
        body += '"' + key + '":' + '"' + value + '",';
      });
    }
    body = body.slice(0, -1);
    body += '}';
    return this.http.put(httpApiHost + '/locales/' + lang, body, httpJsonOptions);
  }
}
