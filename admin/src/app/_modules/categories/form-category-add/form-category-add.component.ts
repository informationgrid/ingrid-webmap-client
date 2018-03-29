import { Component, Input, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { TreeComponent, TreeNode } from 'angular-tree-component';
import { LayerItem } from '../../../_models/layer-item';
import { CategoryItem } from '../../../_models/category-item';
import { HttpService } from '../../../_services/http.service';
import { Category } from '../../../_models/category';

@Component({
  selector: 'app-form-category-add',
  templateUrl: './form-category-add.component.html',
  styleUrls: ['./form-category-add.component.scss']
})
export class FormCategoryAddComponent {

  @Input() tree: TreeComponent;
  @Input() layers: LayerItem[] = [];
  @Input() node: TreeNode;
  @Input() category: Category;

  @ViewChild('f') form: NgForm;

  model: CategoryItem = new CategoryItem();
  searchLayerList: LayerItem[];

  isSaveSuccess = false;
  isSaveUnsuccess = false;

  constructor(private httpService: HttpService) {
  }

  resetForm() {
    this.form.reset();
  }

  onLayerListSearch(event, searchText: string) {
    this.httpService.getLayersSearch(searchText).subscribe(
      data => {
        this.searchLayerList = data;
      },
      error => {
        console.log('Error search layers!');
      }
    );
  }

  onLayerClick(event, searchText: string) {
    this.onLayerListSearch(event, searchText);
  }

  onSelectLayer(event, value: string, ) {
    this.model.layerBodId = value;
    this.clearLayerList();
  }

  clearLayerList() {
    this.searchLayerList = null;
  }

   // On submit form add
   onAddCategoryItem (node: TreeNode) {
    if (this.form.valid) {
      if (this.model) {
        const item = new CategoryItem(undefined, this.model.label, '', '', this.model.layerBodId, false, [] );
        let treeModel;
        if (!node) {
          treeModel = this.tree.treeModel;
          treeModel.nodes.unshift(item);
        } else {
          treeModel = node.treeModel;
          node.data.children.unshift(item);
        }
        treeModel.update();
        this.httpService.updateCategoryTree(this.category.id, treeModel.nodes).subscribe(
          data => {
            this.isSaveSuccess = true;
            this.isSaveUnsuccess = !this.isSaveSuccess;
            setTimeout(() => {
                this.isSaveSuccess = false;
                this.isSaveUnsuccess = false;
                this.resetForm();
              }
            , 4000);
          },
          error => {
            this.isSaveUnsuccess = true;
            this.isSaveSuccess = !this.isSaveUnsuccess;
            console.error('Error onAddCategoryItem tree!');
          }
        );
      }
    }
  }
}
