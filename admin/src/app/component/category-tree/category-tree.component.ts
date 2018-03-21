import { Component, Input, ViewChild, Output } from '@angular/core';
import { NgForm } from '@angular/forms/src/directives/ng_form';
import { CategoryItem } from '../../model/category-item';
import { TreeComponent, TreeModel, TreeNode } from 'angular-tree-component';
import { HttpService } from '../../utils/http.service';
import { Category } from '../../model/category';
import { LayerItem } from '../../model/layer-item';
import * as _ from 'lodash';
import * as $ from 'jquery';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-category-tree',
  templateUrl: './category-tree.component.html',
  styleUrls: ['./category-tree.component.scss']
})
export class CategoryTreeComponent {

  @Input() category: Category;
  @Input() layers: LayerItem[] = [];
  @Input() categoryTree: CategoryItem[] = [];
  
  categoryLastId: number;
  options = {
    allowDrag: true,
    allowDrop: true,
    displayField: 'label',
    childrenField: 'children'
  };

  constructor(private httpService: HttpService) { 
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
    this.httpService.updateCategoryTree(this.category.id, $event.treeModel.nodes).subscribe(
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
        this.httpService.updateCategoryTree(this.category.id, node.treeModel.nodes).subscribe(
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
