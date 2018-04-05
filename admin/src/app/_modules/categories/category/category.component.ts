import { Component, Input, EventEmitter, Output, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Category } from '../../../_models/category';
import { HttpService } from '../../../_services/http.service';
import { LayerItem } from '../../../_models/layer-item';
import { CategoryItem } from '../../../_models/category-item';
import * as $ from 'jquery';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnChanges {

  @Input() layers: LayerItem[];
  @Input() categories: Category[];

  @Output() updateAppCategories: EventEmitter<Category[]> = new EventEmitter<Category[]>();

  model: Category = new Category();
  @ViewChild('f') form: NgForm;

  categoryAddUnsuccess = false;
  categoryAddSuccess = false;
  enableSelectCategories = false;
  selectedCategories: any = new Array();
  searchText = '';

  categoryTree: CategoryItem[] = [];
  categoriesLength = 0;
  isOpen = false;

  constructor(private httpService: HttpService) {
  }

  ngOnChanges(changes: SimpleChanges) {
    this.categoriesLength = this.categories.length;
  }

  loadCategory(id: string) {
    this.httpService.getCategory(id, null)
    .subscribe( data => {
        this.categoryTree = data;
    });
  }

  updateCategories(event) {
    this.categories = event;
    this.updateAppCategories.emit(event);
  }

  selectCategories(event) {
    if (!this.selectedCategories) {
     this.selectedCategories = new Array();
    }
    if (event.target.checked) {
       this.selectedCategories.push(event.target.value);
     } else {
       const index = this.selectedCategories.indexOf(event.target.value, 0);
       if (index > -1) {
         this.selectedCategories.splice(index, 1);
       }
     }
     event.stopPropagation();
   }

   deleteSelectedCategories () {
    if (this.selectedCategories.length > 0) {
      this.httpService.deleteCategories(this.selectedCategories).subscribe(
        data => {
          this.updateAppCategories.emit(data);
          this.selectedCategories = new Array();
        },
        error => {
          console.error('Error on remove categories: ' + error);
        }
      );
    }
  }

  // Add new category
  addCategory() {
    if (this.form.valid) {
      const value = this.model.id;
      if (value) {
        const existCategory = this.categories.filter(
          category => category.id.toLowerCase() === value.toLowerCase()
        );
        if (existCategory.length === 0) {
          if (this.model) {
            this.httpService.addCategory(this.model).subscribe(
              data => {
                this.categories = data;
                this.updateAppCategories.emit(data);
              },
              error => {
                console.error('Error add category!');
              },
              () => {
                this.categoryAddUnsuccess = false;
                this.categoryAddSuccess = !this.categoryAddUnsuccess;
                this.form.reset();
              }
            );
          }
        } else {
          this.categoryAddUnsuccess = true;
          this.categoryAddSuccess = !this.categoryAddUnsuccess;
        }
      }
    }
  }
}
