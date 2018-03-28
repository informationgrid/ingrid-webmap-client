import { Component, Input, EventEmitter, Output, OnInit } from '@angular/core';
import { Category } from '../../../_models/category';
import { LayerItem } from '../../../_models/layer-item';
import { HttpService } from '../../../_services/http.service';
import { NgForm } from '@angular/forms/src/directives/ng_form';
import { MapUtilsService } from '../../../_services/map-utils.service';
import { Layer } from '../../../_models/layer';
import { TreeComponent, TreeModel, TreeNode, IActionMapping, ITreeOptions } from 'angular-tree-component';
import { LayerType } from '../../../_models/layer-type.enum';
import { Wmslayer } from '../../../_models/wmslayer';
import { Wmtslayer } from '../../../_models/wmtslayer';
import { toJS } from 'mobx';
import * as _ from 'lodash';
import { CategoryItem } from '../../../_models/category-item';

@Component({
  selector: 'app-layer',
  templateUrl: './layer.component.html',
  styleUrls: ['./layer.component.scss']
})
export class LayerComponent implements OnInit {

  @Input() categories: Category[] = [];
  @Output() updateAppLayers: EventEmitter<LayerItem[]> = new EventEmitter<LayerItem[]>();

  layers: LayerItem[] = [];
  layersCurrentPage = 1;
  layersTotalPage = 1;
  layersPerPage = 20;
  layersTotalNum = 0;

  searchTypeDefault = 'label';
  searchTypeGroup: any = ['label', 'type'];
  enableSelectLayer = false;
  selectedLayers: any = new Array();
  searchText = '';

  newLayers: LayerItem[] = [];
  isUrlLoadSuccess = false;
  isUrlLoadUnsuccess = false;
  isSaveSuccess = false;
  isSaveUnsuccess = false;
  isWMSService = false;
  hasLoadLayers = false;

  categoryId = '';
  category: CategoryItem[] = [];

  actionMapping: IActionMapping = {
    mouse: {
      click: (tree, node) => this.check(node, !node.data.checked)
    }
  };
  optionsLayersTree: ITreeOptions = {
    displayField: 'label',
    childrenField: 'children',
    actionMapping: this.actionMapping
  };
  optionsCategoryTree: ITreeOptions = {
    displayField: 'label',
    childrenField: 'children'
  };

  constructor(private httpService: HttpService, private mapUtils: MapUtilsService) {}

  ngOnInit() {
    this.loadLayers(this.layersCurrentPage, this.layersPerPage, this.searchText);
  }
  // Paging
  previousPage() {
    this.layersCurrentPage--;
    this.loadLayers(this.layersCurrentPage, this.layersPerPage, this.searchText);
  }

  nextPage() {
    this.layersCurrentPage++;
    this.loadLayers(this.layersCurrentPage, this.layersPerPage, this.searchText);
  }

  firstPage() {
    this.layersCurrentPage = 1;
    this.loadLayers(this.layersCurrentPage, this.layersPerPage, this.searchText);
  }

  lastPage() {
    this.layersCurrentPage = this.layersTotalPage;
    this.loadLayers(this.layersCurrentPage, this.layersPerPage, this.searchText);
  }

  // Search
  searchLayers() {
    this.loadLayers(1, this.layersPerPage, this.searchText);
  }

  loadLayers(layersCurrentPage: number, layersPerPage: number, searchText: string) {
    this.httpService.getLayersPerPage(layersCurrentPage, layersPerPage, searchText).subscribe(
      data => {
        this.layers = data.items;
        this.layersCurrentPage = data.firstPage;
        this.layersTotalPage = data.lastPage;
        this.layersTotalNum = data.totalItemsNum;
        this.hasLoadLayers = true;
      },
      error => {
        console.log('Error load layer per page!');
        this.hasLoadLayers = false;
      }
    );
  }
  updateLayers(event: LayerItem[]) {
    this.loadLayers(this.layersCurrentPage, this.layersPerPage, this.searchText);
  }

  selectLayer(event) {
    if (!this.selectedLayers) {
     this.selectedLayers = new Array();
    }
    if (event.target.checked) {
       this.selectedLayers.push(event.target.value);
     } else {
       const index = this.selectedLayers.indexOf(event.target.value, 0);
       if (index > -1) {
         this.selectedLayers.splice(index, 1);
       }
     }
     event.stopPropagation();
   }

  deleteSelectedLayers() {
    if (this.selectedLayers.length > 0) {
      this.httpService.deleteLayers(this.selectedLayers).subscribe(
        data => {
          this.updateAppLayers.emit(data);
          this.selectedLayers = new Array();
          this.loadLayers(this.layersCurrentPage, this.layersPerPage, this.searchText);
        },
        error => {
          console.error('Error on remove layer: ' + error);
        }
      );
    }
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
    const root = treeModel.getFirstRoot();
    if (root) {
      const checkedLayers = [];
      this.getCheckedNode(root, checkedLayers);
      if (checkedLayers.length > 0) {
        return true;
      }
    }
    return false;
  }

  // Buttons
  onSelectAllNodes(treeModel: TreeModel) {
    const root = treeModel.getFirstRoot();
    this.check(root, true);
  }
  onDeselectAllNodes(treeModel: TreeModel) {
    const root = treeModel.getFirstRoot();
    this.check(root, false);
  }
  onCategoryChange(event) {
    this.categoryId = event.target.value;
    if (this.categoryId) {
      this.httpService.getCategory(this.categoryId, null).subscribe(
        data => {
          // const item = new CategoryItem(f.value.label, f.value.layerBodId, '', '');
          this.category = data;
        },
        error => {
          console.error('Error get category "' + this.categoryId + '"!');
        }
      );
    } else {
      this.category = [];
    }
  }
  onAddLayers(layersModel: TreeModel, f: NgForm, categoryTree: TreeComponent) {
    const root = layersModel.getFirstRoot();
    const checkedLayers = [];
    const layerItems: LayerItem[] = [];
    this.getCheckedNode(root, checkedLayers);
    checkedLayers.forEach(l => {
      const layerItem = new LayerItem(l.generateId(this.layers), l);
      layerItems.push(layerItem);
    });
    this.saveAddedLayers(layerItems);
    this.saveAddedLayersToCategory(f, layerItems, root, categoryTree);
  }
  onAddCombineLayers(layersModel: TreeModel, f: NgForm, categoryTree: TreeComponent) {
    const root = layersModel.getFirstRoot();
    const checkedLayers = [];
    const layerItems: LayerItem[] = [];
    this.getCheckedNode(root, checkedLayers);
    if (checkedLayers.length > 0) {
      let wmsLayers = '';
      let label = '';
      let legendUrl = '';
      let i = 0;
      checkedLayers.forEach(l => {
        i++;
        if (l.wmsLayers) {
          wmsLayers += l.wmsLayers;
        }
        if (l.legendUrl) {
          legendUrl += l.legendUrl;
        }
        if (l.label) {
          label += l.label;
        }
        if (i !== checkedLayers.length) {
          wmsLayers += ',';
          legendUrl += '|';
          label += '|';
        }
      });
      const layer = _.cloneDeep(checkedLayers[0]);
      layer.wmsLayers = wmsLayers;
      layer.legendUrl = legendUrl;
      layer.label = label;
      const layerItem = new LayerItem(layer.generateId(this.layers), layer);
      layerItems.push(layerItem);
    }
    this.saveAddedLayers(layerItems);
    this.saveAddedLayersToCategory(f, layerItems, root, categoryTree);
  }

  saveAddedLayers(layerItems: LayerItem[]) {
    this.httpService.addLayer(layerItems).subscribe(
      data => {
        this.searchText = '';
        this.loadLayers(1, this.layersPerPage, this.searchText);
      },
      error => {
        console.error('Error add layers!');
      }
    );
  }
  getCheckedNode(node, list) {
    this.getChildCheckedNode(node, list);
  }
  getChildCheckedNode(node, list) {
    if (node.data.checked) {
      list.push(node.data.layer);
    }
    if (node.children) {
      node.children.forEach((child) => this.getChildCheckedNode(child, list));
    }
  }

  saveAddedLayersToCategory(f: NgForm, layers: LayerItem[], rootLayersModel: TreeNode, categoryTree: TreeComponent) {
    if (f.valid && categoryTree) {
      if (f.value.categoryId) {
        const categoryTreeModel = categoryTree.treeModel;
        if (categoryTreeModel) {
          const categoryTreeModelFocusNode = categoryTreeModel.focusedNode;
          if (categoryTreeModelFocusNode) {
            const categoryLayers = [];
            this.getCategoryNode(rootLayersModel, layers, 0, categoryLayers);
            categoryLayers.forEach(categoryLayer => {
              categoryTreeModelFocusNode.data.children.unshift(categoryLayer);
            });
            categoryTreeModel.update();
            this.httpService.updateCategoryTree(this.categoryId, categoryTreeModel.nodes).subscribe(
              data => {
                this.isSaveSuccess = true;
                this.isSaveUnsuccess = !this.isSaveSuccess;
                setTimeout(() => {
                    this.isSaveSuccess = false;
                    this.isSaveUnsuccess = false;
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
  }
  getCategoryNode(node: TreeNode, layers: LayerItem[], i, children) {
    if (layers.length  > 0) {
      let item: CategoryItem;
      if (node.data.checked) {
        item = new CategoryItem(layers[i].item.label, layers[i].id, '', undefined);
        children.push(item);
        i++;
      }
      if (i !== layers.length) {
        if (node.children) {
          if (item) {
            children = item.children;
          }
          node.children.forEach((child) => this.getCategoryNode(child, layers, i, children));
        }
      }
    }
  }

  // Service functions
  loadService( serviceUrl: string ) {
    if (serviceUrl) {
      serviceUrl = this.mapUtils.addGetCapabilitiesParams(serviceUrl.trim());
      this.httpService.getService(serviceUrl)
      .subscribe(
        data => {
          if (data) {
            this.newLayers = [];
            if (data['WMS_Capabilities'] || data['WMT_MS_Capabilities']) {
              // WMS
              this.isWMSService = true;
              const service = data['WMS_Capabilities'] || data['WMT_MS_Capabilities'];
              const version = service['version'];
              const cap = service['Capability'];
              const dcpType = cap['Request']['GetMap']['DCPType'];
              const layer = cap['Layer'];
              let wmsUrl;
              // GetMap-Url
              if (dcpType instanceof Array) {
                wmsUrl = dcpType[0]['HTTP']['Get']['OnlineResource'];
              } else {
                wmsUrl = dcpType['HTTP']['Get']['OnlineResource']['xlink:href'];
              }
              if (layer) {
                this.createWMSLayers(layer, this.newLayers, wmsUrl, version, null, null, null);
              }
            } else if (data['Capabilities']) {
              // WMTS
              this.isWMSService = false;
              const service = data['Capabilities'];
              const serviceMetadataUrl = service['ServiceMetadataURL']['xlink:href'];
              const version = service['version'];
              const layer = service['Contents']['Layer'];
              const tileMatrixSet = service['Contents']['TileMatrixSet'];
              this.createWMTSLayer(layer, this.newLayers, serviceMetadataUrl, version, tileMatrixSet);
            }
          }
          this.isUrlLoadSuccess = true;
          this.isUrlLoadUnsuccess =  !this.isUrlLoadSuccess;
        },
        error => {
          console.error('Error load ' + serviceUrl);
          this.isUrlLoadUnsuccess = true;
          this.isUrlLoadSuccess =  !this.isUrlLoadUnsuccess;
        }
      );
    }
  }

  createWMSLayers(layer, layers, wmsUrl, version, bbox, minScale, maxScale) {
    const newLayer = new Wmslayer();
    // Version
    newLayer.version = version;
    // Label
    newLayer.label = layer['Title'];
    // GetMap-URL
    newLayer.wmsUrl = wmsUrl;
    // Name
    if (layer['Name']) {
      newLayer.wmsLayers = layer['Name'];
    }
    // Extent
    newLayer.extent = bbox;
    // WMS 1.1.1
    if (layer['LatLonBoundingBox']) {
      const latLonBox = layer['LatLonBoundingBox'];
      newLayer.extent = [+latLonBox['minx'], +latLonBox['miny'], +latLonBox['maxx'], +latLonBox['maxy']];
    }
    // WMS 1.3.0
    if (layer['EX_GeographicBoundingBox']) {
      const latLonBox = layer['EX_GeographicBoundingBox'];
      newLayer.extent = [+latLonBox['westBoundLongitude'], +latLonBox['southBoundLatitude'],
        +latLonBox['eastBoundLongitude'], +latLonBox['northBoundLatitude']];
    }
    // Scale
    if (minScale) {
      newLayer.minScale = +minScale;
    }
    if (maxScale) {
      newLayer.maxScale = +maxScale;
    }
    // WMS 1.1.1
    if (layer['ScaleHint']) {
      const scaleHint = layer['ScaleHint'];
      if (scaleHint['min']) {
        newLayer.minScale = +scaleHint['min'];
      }
      if (scaleHint['max']) {
        newLayer.maxScale = +scaleHint['max'];
      }
    }
    // WMS 1.3.0
    if (layer['MinScaleDenominator']) {
      newLayer.minScale = +layer['MinScaleDenominator'];
    }
    if (layer['MaxScaleDenominator']) {
      newLayer.maxScale = +layer['MaxScaleDenominator'];
    }
    // Legend-URL
    newLayer.hasLegend = true;
    if (layer['Style']) {
      const style = layer['Style'];
      if (style['LegendURL']) {
        newLayer.legendUrl = style['LegendURL']['OnlineResource']['xlink:href'];
      }
    }
    // queryable
    if (layer['queryable'] && layer['queryable'] === '1') {
      newLayer.tooltip = true;
    } else {
      newLayer.tooltip = false;
    }


    const children = layer['Layer'];
    const newLayerChildren = [];
    if (children) {
      if (children instanceof Array) {
        children.forEach(child => {
          this.createWMSLayers(child, newLayerChildren, wmsUrl, version, newLayer.extent, newLayer.minScale, newLayer.maxScale);
        });
      } else {
        this.createWMSLayers(children, newLayerChildren, wmsUrl, version, newLayer.extent, newLayer.minScale, newLayer.maxScale);
      }
    }
    layers.push({
      label: newLayer.label,
      layer: newLayer,
      children: newLayerChildren
    });
  }

  createWMTSLayer (layer, layers, serviceMetadataUrl, version, tileMatrixSet) {
    tileMatrixSet.forEach(tileMatrix => {
      const newLayer = new Wmtslayer();
      // Label
      newLayer.label = layer['ows:Title'];
      // Version
      newLayer.version = version;
      // ServiceLayerName
      newLayer.serverLayerName = layer['ows:Identifier'];
      // ServiceMetadataUrl
      newLayer.serviceUrl = serviceMetadataUrl;
      // Format
      if (layer['ResourceURL']) {
        newLayer.format = layer['ResourceURL']['Format'];
        newLayer.template = layer['ResourceURL']['template'];
      }
      // Style
      newLayer.style = layer['Style']['ows:Identifier'];
      // Extent
      if (layer['ows:WGS84BoundingBox']) {
        const latLonBox = layer['ows:WGS84BoundingBox'];
        const lowerCorner = latLonBox['ows:LowerCorner'].split(' ');
        const upperCorner = latLonBox['ows:UpperCorner'].split(' ');
        newLayer.extent = [+lowerCorner[0], +lowerCorner[1], +upperCorner[0], +upperCorner[1]];
      }
      // MatrixSet
      newLayer.matrixSet = tileMatrix['ows:Identifier'];
      tileMatrix['TileMatrix'].forEach(tm => {
        // Origin
        const topLeftCorner = tm['TopLeftCorner'].split(' ');
        newLayer.origin = [+topLeftCorner[0], +topLeftCorner[1]];
        // scales
        const scaleDenominator = tm['ScaleDenominator'];
        newLayer.scales.push(+scaleDenominator);
        // matrixIds
        const identifier = tm['ows:Identifier'];
        newLayer.matrixIds.push(identifier);

        const tileHeight = tm['TileHeight'];
        const tileWidth = tm['TileWidth'];
        newLayer.tileSize = [+tileHeight, +tileWidth];
      });
      layers.push({
        label: newLayer.label,
        layer: newLayer
      });
    });
  }
}
