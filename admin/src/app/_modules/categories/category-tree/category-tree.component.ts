import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { TreeNode, TreeComponent } from 'angular-tree-component';
import * as _ from 'lodash';
import { Category } from '../../../_models/category';
import { LayerItem } from '../../../_models/layer-item';
import { CategoryItem } from '../../../_models/category-item';
import { HttpService } from '../../../_services/http.service';
import { NgForm } from '@angular/forms';
import { ModalComponent } from '../../modals/modal/modal.component';

@Component({
  selector: 'app-category-tree',
  templateUrl: './category-tree.component.html',
  styleUrls: ['./category-tree.component.scss']
})
export class CategoryTreeComponent implements OnInit {

  @Input() category: Category;
  @Input() layers: LayerItem[] = [];
  @Input() categoryTree: CategoryItem[] = [];
  @ViewChild('modalSaveSuccess') modalSaveSuccess: ModalComponent;
  @ViewChild('modalSaveUnsuccess') modalSaveUnsuccess: ModalComponent;

  focusItem: CategoryItem = new CategoryItem();
  focusNode: TreeNode;
  searchLayerList: LayerItem[];

  categoryId: string;
  categoryLastId: number;
  options = {
    allowDrag: true,
    allowDrop: true,
    displayField: 'label',
    childrenField: 'children'
  };

  constructor(private httpService: HttpService) {}

  ngOnInit() {
    this.categoryId = this.category.id;
  }

  // Node Events
  onNodeActivate ($event) {
    if ($event.node) {
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
        console.error('Error update tree!');
      }
    );
  }

  onNodeFocus($event) {
    if ($event.node) {
      $event.node.expand();
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
    this.focusItem.layerBodId = value;
    this.clearLayerList();
  }

  clearLayerList() {
    this.searchLayerList = null;
  }

  // Remove node
  onRemoveCategoryItem(node: TreeNode) {
    if (node.parent != null) {
      _.remove(node.parent.data.children, node.data);
      node.treeModel.update();
      this.httpService.updateCategoryTree(this.categoryId, node.treeModel.nodes).subscribe(
        data => {
          this.categoryTree = data;
        },
        error => {
          console.error('Error update tree!');
        }
      );
    }
  }

  // Add node
  showAddModal(modal: ModalComponent, node: TreeNode, form: NgForm) {
    this.focusItem =  new CategoryItem();
    this.focusNode = node;
    if (form) {
      form.resetForm({
        label: null,
        layerBodId: null
      });
    }
    modal.show();
  }

  onAddCategoryItem (form: NgForm, tree: TreeComponent, modal: ModalComponent) {
    if (form.valid) {
      if (this.focusItem) {
        const item = new CategoryItem(undefined, this.focusItem.label, 'prod', false);
        if (this.focusItem.layerBodId) {
          item.layerBodId = this.focusItem.layerBodId;
        }
        let treeModel;
        if (!this.focusNode) {
          treeModel = tree.treeModel;
          treeModel.nodes.push(item);
        } else {
          treeModel = this.focusNode.treeModel;
          if (!this.focusNode.data.children) {
            this.focusNode.data.children = [];
          }
          this.focusNode.data.children.push(item);
        }
        treeModel.update();
        this.httpService.updateCategoryTree(this.category.id, treeModel.nodes).subscribe(
          data => {
            modal.hide();
            this.modalSaveSuccess.show();
          },
          error => {
            console.error('Error onAddCategoryItem tree!');
            this.modalSaveUnsuccess.show();
          }
        );
      }
    }
  }

  // Edit node
  showEditModal(modal: ModalComponent, node: TreeNode, form: NgForm) {
    this.focusNode = node;
    if (this.focusNode) {
      this.focusItem = new CategoryItem(
         this.focusNode.data.id,
         this.focusNode.data.label,
         'prod',
         this.focusNode.data.selectedOpen
      );
      if (this.focusNode.data.children) {
       this.focusItem.children = this.focusNode.data.children;
      }
      if (this.focusNode.data.layerBodId) {
       this.focusItem.layerBodId = this.focusNode.data.layerBodId;
      }
      if (form) {
        form.reset({
          id: this.focusItem.id,
          label: this.focusItem.label,
          selectedOpen: this.focusItem.selectedOpen,
          layerBodId: this.focusItem.layerBodId
        });
      }
    }
    modal.show();
  }

  onEditCategoryItem (form: NgForm, tree: TreeComponent, modal: ModalComponent) {
    if (form.valid) {
      this.focusNode.data.id = this.focusItem.id;
      this.focusNode.data.label = this.focusItem.label;
      this.focusNode.data.layerBodId = this.focusItem.layerBodId;
      this.focusNode.data.selectedOpen = this.focusItem.selectedOpen;

      const treeModel = this.focusNode.treeModel;
      treeModel.update();
      this.httpService.updateCategoryTree(this.category.id, treeModel.nodes).subscribe(
        data => {
          modal.hide();
          this.modalSaveSuccess.show();
        },
        error => {
          console.error('Error onEditCategoryItem tree!');
          this.modalSaveUnsuccess.show();
        }
      );
    }
  }
}
