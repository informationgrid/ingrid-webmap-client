import { Component, Input, EventEmitter, Output } from '@angular/core';
import { NgForm, FormGroup, FormControl, Validators } from '@angular/forms';
import { Category } from '../../model/category';
import { HttpService } from '../../utils/http.service';
import { LayerItem } from '../../model/layer-item';
import { CategoryItem } from '../../model/category-item';
import * as $ from 'jquery';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent{

  @Input() layers: LayerItem[];
  @Input() categories: Category[];
  @Output() updateAppCategories: EventEmitter<Category[]> = new EventEmitter<Category[]>();
  
  categoryAddUnsuccess: boolean = false;
  categoryAddSuccess: boolean = false;
  searchText: string = "";
  
  categoryTree: CategoryItem[] = [];
  isOpen: boolean = false;

  addCategoryForm: FormGroup;
  id: FormControl;
  
  constructor(private httpService: HttpService) { 
    this.id = new FormControl('', [
      Validators.required, 
      Validators.minLength(4), 
      Validators.pattern("^[a-zA-Z0-9_-]*")
    ]);
    this.addCategoryForm = new FormGroup({
      id: this.id
    });
  }  

  updateCategories(event) {
    this.categories = event;
    this.updateAppCategories.emit(event);
  }

  loadCategory(id: string, $event) {
    this.httpService.getCategory(id)
    .subscribe( data => {
        this.categoryTree = data;
    });
  }

  // Add new category
  addCategory() {
    if(this.addCategoryForm.valid){
      if(this.addCategoryForm.value.id){
        const existCategory = this.categories.filter(
          category => category.id.toLowerCase() === this.addCategoryForm.value.id.toLowerCase()
        );
        if(existCategory.length === 0){
          let newCategory = new Category(
            this.addCategoryForm.value.id.trim(),
            '',
            '',
            [],
            [],
            []
          );
          if(newCategory){
            this.httpService.addCategory(newCategory).subscribe(
              data => {
                this.categories = data;
                this.updateAppCategories.emit(data);
              },
              error => {
                console.error("Error add category!")
              },
              () => {
                this.categoryAddUnsuccess = false;
                this.categoryAddSuccess = !this.categoryAddUnsuccess;
                this.addCategoryForm.reset();
              }
            );
          }
        } else {
          this.categoryAddUnsuccess = true;
          this.categoryAddSuccess = !this.categoryAddUnsuccess;
        }
      }
    }
    $('#addModalCategory')
  }
}
