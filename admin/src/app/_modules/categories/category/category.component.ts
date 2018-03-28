import { Component, Input, EventEmitter, Output, OnInit } from '@angular/core';
import { NgForm, FormGroup, FormControl, Validators } from '@angular/forms';
import { Category } from '../../../_models/category';
import { HttpService } from '../../../_services/http.service';
import { LayerItem } from '../../../_models/layer-item';
import { CategoryItem } from '../../../_models/category-item';
import * as $ from 'jquery';
import { Router } from '@angular/router';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit {

  @Input() layers: LayerItem[];
  @Input() categories: Category[];
  @Output() updateAppCategories: EventEmitter<Category[]> = new EventEmitter<Category[]>();

  categoryAddUnsuccess = false;
  categoryAddSuccess = false;
  searchText = '';

  categoryTree: CategoryItem[] = [];
  isOpen = false;

  addCategoryForm: FormGroup;
  id: FormControl;

  constructor(private httpService: HttpService) {
    this.id = new FormControl('', [
      Validators.required,
      Validators.minLength(4),
      Validators.pattern('^[a-zA-Z0-9_-]*')
    ]);
    this.addCategoryForm = new FormGroup({
      id: this.id
    });
  }

  ngOnInit() {
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

  // Add new category
  addCategory() {
    if (this.addCategoryForm.valid) {
      if (this.addCategoryForm.value.id) {
        const existCategory = this.categories.filter(
          category => category.id.toLowerCase() === this.addCategoryForm.value.id.toLowerCase()
        );
        if (existCategory.length === 0) {
          const newCategory = new Category(
            this.addCategoryForm.value.id.trim(),
            '',
            '',
            [],
            [],
            []
          );
          if (newCategory) {
            this.httpService.addCategory(newCategory).subscribe(
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
  }
}
