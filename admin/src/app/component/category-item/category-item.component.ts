import { Component, Input, EventEmitter, Output, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Category } from '../../model/category';
import { HttpService } from '../../utils/http.service';
import { LayerItem } from '../../model/layer-item';

@Component({
  selector: 'app-category-item',
  templateUrl: './category-item.component.html',
  styleUrls: ['./category-item.component.scss']
})
export class CategoryItemComponent implements OnInit  {

  @Input()
  category: Category;
  @Input()
  categories: Category[];
  @Input()
  layers: LayerItem[];
  
  backgroundLayers: LayerItem[];

  @Output()
  updateCategories: EventEmitter<Category[]> = new EventEmitter<Category[]>();

  constructor(private httpService: HttpService) { 
    
  }

  ngOnInit(){
    if(this.layers){
      this.backgroundLayers = this.layers.filter(
        layer => layer.item.background
      );
    }
  }

  onUpdateCategory(f: NgForm) {
    if(f.valid){
      if(this.category) {
        this.category.id = f.value.id;
        this.category.langs = f.value.langs;
        this.category.defaultBackground = f.value.defaultBackground;
        this.httpService.updateCategory(this.category).subscribe(
          data => {
            this.categories = data;
            //this.updateCategories.emit(this.categories);
            },
          error => {
            console.error("Error update: " + this.category.id);
          }
        );
      }
    } 
  }

  onRemoveCategory(id: string){
    this.httpService.deleteCategory(id).subscribe(
      data => {
        this.updateCategories.emit(data);
        },
      error => {
        console.error("Error remove category: " + id );
      }
    );
  }

  onAddItem(value: any, list: any ){
    if (value && list) {
      if(list.indexOf(value) == -1) {
        list.push(value);
      }
    }
  }
  onRemoveItem(value: any, list: any ){
    if (value && list) {
      var index = list.indexOf(value, 0);
      if (index > -1) {
        list.splice(index, 1);
      };
    }
  }

  onUpItem(value: any, list: any){
    if (value && list) {
      this.onMoveItem(value, list, -1);
    }
  }

  onDownItem(value: any, list: any){
    if (value && list) {
      this.onMoveItem(value, list, 1);
    }
  }

  onMoveItem(value: string, list: any, delta: number){
    let index = list.indexOf(value);
    let newIndex = index + delta;
    if (newIndex < 0  || newIndex == list.length) return;
    let indexes = [index, newIndex].sort();
    list.splice(indexes[0], 2, list[indexes[1]], list[indexes[0]]);
  }

}
