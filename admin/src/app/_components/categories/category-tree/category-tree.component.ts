import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { TreeNode, TreeComponent, TreeModel, IActionMapping, ITreeOptions } from 'angular-tree-component';
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
  @Input() modalSaveSuccess: ModalComponent;
  @Input() modalSaveUnsuccess: ModalComponent;
  @ViewChild('formNodeAdd') formNodeAdd: NgForm;
  @ViewChild('formNodeEdit') formNodeEdit: NgForm;

  focusItem: CategoryItem = new CategoryItem();
  focusNode: TreeNode;
  searchLayerList: LayerItem[];

  categoryId: string;
  categoryLastId: number;

  actionMapping: IActionMapping = {
    mouse: {
      click: (tree, node) => this.check(node, !node.data.checked)
    }
  };

  options: ITreeOptions = {
    allowDrag: true,
    allowDrop: true,
    displayField: 'label',
    childrenField: 'children'
  };

  constructor(private httpService: HttpService) {}

  ngOnInit() {
    this.categoryId = this.category.id;
  }

  // Tree functions
  onUpdateTree( $event ) {
    if ($event.treeModel) {
      $event.treeModel.expandAll();
    }
  }
  check(node, checked) {
    this.updateChildNodeCheckbox(node, checked);
  }
  updateChildNodeCheckbox(node, checked) {
    node.data.checked = checked;
    if (node.children) {
      node.children.forEach((child) => this.updateChildNodeCheckbox(child, checked));
    }
  }

  hasSelectedItem(treeModel: TreeModel) {
    const roots = treeModel.getVisibleRoots();
    if (roots) {
      const treeNode: TreeNode[] = [];
      roots.forEach(root => {
        this.getCheckedNode(root, treeNode);
      });
      if (treeNode.length > 0) {
        return true;
      }
    }
    return false;
  }

  getCheckedNode(node: TreeNode, list: TreeNode[]) {
    this.getChildCheckedNode(node, list);
  }
  getChildCheckedNode(node: TreeNode, list: TreeNode[]) {
    if (node.data.checked) {
      list.push(node);
    }
    if (node.children) {
      node.children.forEach((child) => this.getChildCheckedNode(child, list));
    }
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

  onSelectLayer(event, layer ) {
    this.focusItem.layerBodId = layer.id;
    this.focusItem.label = layer.item.label;
    this.clearLayerList();
  }

  clearLayerList() {
    this.searchLayerList = null;
  }

  // Remove node
  onRemoveCategoryItem(node: TreeNode, modal) {
    if (node.parent != null) {
      _.remove(node.parent.data.children, node.data);
      if (node.parent.data.children && node.parent.data.children.length === 0) {
        node.parent.setIsExpanded(false);
      }
      node.treeModel.update();
      this.httpService.updateCategoryTree(this.categoryId, node.treeModel.nodes).subscribe(
        data => {
          this.categoryTree = data;
          modal.hide();
        },
        error => {
          console.error('Error update tree!');
        }
      );
    }
  }

  onRemoveSelectItem(treeModel: TreeModel, modal, doRemoveLayer: boolean) {
    if (treeModel != null) {
      const roots: TreeNode[] = treeModel.getVisibleRoots();
      if (roots) {
        const treeNodes: TreeNode[] = [];
        roots.forEach(root => {
          this.getCheckedNode(root, treeNodes);
        });
        if (treeNodes.length > 0) {
          treeNodes.forEach( treeNode => {
            if (doRemoveLayer) {
              treeNode.data.layerBodId = null;
            } else {
              _.remove(treeNode.parent.data.children, treeNode.data);
            }
          });
        }
      }
      treeModel.update();
      this.httpService.updateCategoryTree(this.categoryId, treeModel.nodes).subscribe(
        data => {
          this.categoryTree = data;
          modal.hide();
        },
        error => {
          console.error('Error update tree!');
        }
      );
    }
  }

  // Add node
  showAddModal(modal: ModalComponent, node: TreeNode) {
    this.focusItem =  new CategoryItem();
    this.focusNode = node;
    this.formNodeAdd.reset();
    modal.show();
  }

  // Delete node
  showDeleteModal(modal: ModalComponent, node: TreeNode) {
     modal.show();
  }

  onAddCategoryItem (tree: TreeComponent, modal: ModalComponent) {
    if (this.formNodeAdd.valid) {
      if (this.focusItem) {
        const item = new CategoryItem(null, this.focusItem.label, 'prod', false);
        item.id = item.getNextCategoryNodeId(tree.treeModel.nodes, 2);
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
  showEditModal(modal: ModalComponent, node: TreeNode) {
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
      if (this.formNodeEdit) {
        this.formNodeEdit.reset({
          id: this.focusItem.id,
          label: this.focusItem.label,
          selectedOpen: this.focusItem.selectedOpen,
          layerBodId: this.focusItem.layerBodId
        });
      }
    }
    modal.show();
  }

  onEditCategoryItem (tree: TreeComponent, modal: ModalComponent) {
    if (this.formNodeEdit.valid) {
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
