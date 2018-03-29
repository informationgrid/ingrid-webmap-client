import { Component, Input, ViewChild, SimpleChanges, OnChanges } from '@angular/core';
import { NgForm } from '@angular/forms';
import { TreeComponent, TreeNode } from 'angular-tree-component';
import { LayerItem } from '../../../_models/layer-item';
import { Category } from '../../../_models/category';
import { HttpService } from '../../../_services/http.service';
import { CategoryItem } from '../../../_models/category-item';

@Component({
  selector: 'app-form-category-edit',
  templateUrl: './form-category-edit.component.html',
  styleUrls: ['./form-category-edit.component.scss']
})
export class FormCategoryEditComponent implements OnChanges {

  @Input() tree: TreeComponent;
  @Input() layers: LayerItem[] = [];
  @Input() node: TreeNode;
  @Input() category: Category;

  @ViewChild('f') form: NgForm;

  model: CategoryItem;

  isSaveSuccess = false;
  isSaveUnsuccess = false;

  searchLayerList: LayerItem[];

  constructor(private httpService: HttpService) {
  }

  resetForm() {
    this.form.reset(this.model);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.node) {
       this.model = new CategoryItem(
          this.node.data.id,
          this.node.data.label,
          'prod',
          this.node.data.layerBodId,
          this.node.data.selectedOpen,
          this.node.data.children
       );
    }
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
    this.searchLayerList = null;
  }

  clearLayerList() {
    this.searchLayerList = null;
  }

  onEditCategoryItem (node: TreeNode) {
    if (this.form.valid && node) {
      node.data.id = this.model.id;
      node.data.label = this.model.label;
      node.data.layerBodId = this.model.layerBodId;
      node.data.selectedOpen = this.model.selectedOpen;

      const treeModel = node.treeModel;
      treeModel.update();
      this.httpService.updateCategoryTree(this.category.id, treeModel.nodes).subscribe(
        data => {
          this.isSaveSuccess = true;
          this.isSaveUnsuccess = !this.isSaveSuccess;
          setTimeout(() => {
              this.isSaveSuccess = false;
              this.isSaveUnsuccess = false;
              this.searchLayerList = null;
              this.resetForm();
            }
          , 4000);
        },
        error => {
          this.isSaveUnsuccess = true;
          this.isSaveSuccess = !this.isSaveUnsuccess;
          console.error('Error onEditCategoryItem tree!');
        }
      );
    }
  }
}
