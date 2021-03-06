import { Directive, Input, HostListener } from '@angular/core';
import { TreeNode } from 'angular-tree-component';
import { environment } from '../../environments/environment';
import { UtilsLayers } from '../_shared/utils/utils-layers';

@Directive({
  selector: '[appShowCategoryOnMap]'
})
export class ShowCategoryOnMapDirective {

  @Input() node: TreeNode;
  constructor() { }

  @HostListener('click', ['$event']) onClick($event) {
    if (this.node) {
      const categoryParams = this.getCatalogNodes(this.node, false);
      const layersParams = this.getLayersNodes(this.node);

      let url = environment.mapURL;
      if (categoryParams) {
        url = UtilsLayers.appendUrl(url, 'catalogNodes=' + categoryParams);
      }
      if (layersParams) {
        url = UtilsLayers.appendUrl(url, 'layers=' + layersParams);
      }
      window.open(url);
    }
  }

  getCatalogNodes(node: TreeNode, isParent: boolean) {
    let value = '';
    if (node) {
      if (node.data) {
        if (node.data.id) {
          if (isParent) {
            if (node.data.label) {
              value = node.data.id + ',';
            }
          } else {
            value = node.data.id;
          }
        }
      }
      if (node.parent) {
        value = this.getCatalogNodes(node.parent, true) + value;
      }
    }
    return value;
  }

  getLayersNodes(node: TreeNode) {
    let value = '';
    if (node) {
      if (node.data) {
        if (node.data.layerBodId) {
          value = node.data.layerBodId;
        }
      }
    }
    return value;
  }
}
