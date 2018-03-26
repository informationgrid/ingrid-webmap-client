import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { forkJoin } from "rxjs/observable/forkJoin";
import { Category } from '../_models/category';
import { LayerItem } from '../_models/layer-item';
import 'rxjs/add/operator/map';
import { Wmslayer } from '../_models/wmslayer';
import { Wmtslayer } from '../_models/wmtslayer';
import { CategoryItem } from '../_models/category-item';
import { Setting } from '../_models/setting';
import { environment } from '../../environments/environment';

const httpJsonOptions = {
  headers: new HttpHeaders({
     'Content-Type': 'application/json'
  })
};

const httpApiHost = environment.httpServiceDomain + "/ingrid-webmap-client/rest/admin";
const httpServiceUrl = environment.httpServiceDomain + "/ingrid-webmap-client/rest/wms/proxy/?"

@Injectable()
export class HttpService {

  constructor(private http: HttpClient) { }

  getLayers(): Observable<LayerItem[]>{
    return this.http.get<LayerItem[]>(httpApiHost + "/layers", httpJsonOptions).map(
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

  getLayer(id: string){
    return this.http.get(httpApiHost + "/layers/" + id, httpJsonOptions);
  }
  
  updateLayer(layer: LayerItem): Observable<LayerItem[]>{
    let body = JSON.stringify(layer);
    return this.http.put<LayerItem[]>(httpApiHost + "/layers/" + layer.id, body, httpJsonOptions).map(
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

  addLayer(layers: LayerItem[]): Observable<LayerItem[]>{
    let body = JSON.stringify(layers);
    return this.http.post<LayerItem[]>(httpApiHost + "/layers", body, httpJsonOptions).map(
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

  deleteLayer(id: string): Observable<LayerItem[]>{
    return this.http.delete<LayerItem[]>(httpApiHost + "/layers/" + id, httpJsonOptions).map(
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

  deleteLayers(layers: string[]): Observable<LayerItem[]>{
    var paramIds = 'ids=';
    layers.forEach(layer => {
      paramIds += layer + ',';
    });
    return this.http.delete<LayerItem[]>(httpApiHost + "/layers?" + paramIds, httpJsonOptions).map(
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

  getCategories(): Observable<Category[]>{
    return this.http.get<Category[]>(httpApiHost + "/categories", httpJsonOptions).map(
      res => {
        return res.map(resItem => {
          return new Category(
            resItem.id,
            resItem.langs,
            resItem.defaultBackground,
            resItem.selectedLayers,
            resItem.backgroundLayers,
            resItem.activatedLayers
          );
        });
      }
    );
  }
 
  getCategory(id: string): Observable<CategoryItem[]>{
    return this.http.get<CategoryItem[]>(httpApiHost + "/categories/" + id, httpJsonOptions);
  }

  updateCategory(category: Category): Observable<Category[]>{
    let body = JSON.stringify(category);
    return this.http.put<Category[]>(httpApiHost + "/categories/" + category.id, body, httpJsonOptions); 
  }

  addCategory(category: Category): Observable<Category[]>{
    let body = JSON.stringify(category);
    return this.http.post<Category[]>(httpApiHost + "/categories", body, httpJsonOptions); 
  }

  deleteCategory(id: string): Observable<Category[]>{
    return this.http.delete<Category[]>(httpApiHost + "/categories/" + id, httpJsonOptions); 
  }

  updateCategoryTree(id: string, item: any): Observable<CategoryItem[]>{
    let body = JSON.stringify(item);
    return this.http.put<CategoryItem[]>(httpApiHost + "/categorytree/" + id, body, httpJsonOptions); 
  }
  
  getData(){
      return forkJoin(
        this.getLayers(),
        this.getCategories()
      )
  }

  getService(url: string) {
    return this.http.get(httpServiceUrl, {
      params: {
        url: url,
        toJson: 'true'
      }
    });
  }

  getSetting(): Observable<Map<String, Setting>>{
    return this.http.get<Map<String, Setting>>(httpApiHost + "/setting", httpJsonOptions);
  }

  updateSetting(setting: any): Observable<Map<String, Setting>>{
    let body = JSON.stringify(setting);
    return this.http.put<Map<String, Setting>>(httpApiHost + "/setting", body, httpJsonOptions); 
  }

  getHelp(lang: string){
    return this.http.get(httpApiHost + "/help/" + lang, {responseType: 'text'});
  }

  updateHelp(lang: string, help: string){
    return this.http.put(httpApiHost + "/help/" + lang, help, {responseType: 'text'}); 
  }

  getCss() {
    return this.http.get(httpApiHost + "/css", {responseType: 'text'});
  }

  updateCss(css: string){
    return this.http.put(httpApiHost + "/css", css, {responseType: 'text'}); 
  }
}
