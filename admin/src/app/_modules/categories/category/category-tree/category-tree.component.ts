import { Component, Input, ViewChild, Output, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms/src/directives/ng_form';
import { TreeComponent, TreeModel, TreeNode } from 'angular-tree-component';
import * as _ from 'lodash';
import * as $ from 'jquery';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Category } from '../../../../_models/category';
import { LayerItem } from '../../../../_models/layer-item';
import { CategoryItem } from '../../../../_models/category-item';
import { HttpService } from '../../../../_services/http.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-category-tree',
  templateUrl: './category-tree.component.html',
  styleUrls: ['./category-tree.component.scss']
})
export class CategoryTreeComponent implements OnInit{

  @Input() category: Category;
  @Input() layers: LayerItem[] = [];
  @Input() categoryTree: CategoryItem[] = [];

  categoryId: string;
  categoryLastId: number;
  options = {
    allowDrag: true,
    allowDrop: true,
    displayField: 'label',
    childrenField: 'children'
  };

  constructor(private httpService: HttpService, private route: ActivatedRoute) { 
    
  }

  ngOnInit(){
    this.categoryId = this.category.id;
    this.loadCategory(this.categoryId);
  }

  loadCategory(id: string) {
    this.httpService.getCategory(id)
    .subscribe( data => {
        this.categoryTree = data;
    });
  }

  // Node Events
  onNodeActivate ($event) {
    if($event.node){
      $event.node.expand();
    }
  }
  onNodeDeactivate ($event) {
  }
  onNodeMove($event) {
    this.httpService.updateCategoryTree(this.categoryId, $event.treeModel.nodes).subscribe(
      data => {
        this.categoryTree = <CategoryItem[]>data;
      },
      error => {
        console.error("Error update tree!")
      }
    );
  }
  onNodeFocus($event) {
    if($event.node){
      $event.node.expand();
    }
  }

  resetFormControl(control: FormControl){
    control.setErrors(null);
    control.markAsPristine();
    control.markAsUntouched(); 
  }

  // On submit form del
  onRemoveCategoryItem(node: TreeNode) {
      if (node.parent != null) {
        _.remove(node.parent.data.children, node.data);
        node.treeModel.update();
        this.httpService.updateCategoryTree(this.categoryId, node.treeModel.nodes).subscribe(
          data => {
            this.categoryTree = data;
          },
          error => {
            console.error("Error update tree!")
          }
        );
      }
  }
}