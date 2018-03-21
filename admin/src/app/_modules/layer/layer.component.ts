import { Component, Input, EventEmitter, Output } from '@angular/core';
import { Category } from '../../_models/category';
import { LayerItem } from '../../_models/layer-item';
import { HttpService } from '../../_services/http.service';
import { NgForm } from '@angular/forms/src/directives/ng_form';
import { MapUtilsService } from '../../_services/map-utils.service';
import { Layer } from '../../_models/layer';
import { TreeComponent, TreeModel, TreeNode, IActionMapping, ITreeOptions } from 'angular-tree-component';
import { LayerType } from '../../_models/layer-type.enum';
import { Wmslayer } from '../../_models/wmslayer';
import { Wmtslayer } from '../../_models/wmtslayer';
import { toJS } from "mobx";
import * as _ from 'lodash';
import { CategoryItem } from '../../_models/category-item';

@Component({
  selector: 'app-layer',
  templateUrl: './layer.component.html',
  styleUrls: ['./layer.component.scss']
})
export class LayerComponent {

  @Input() layers: LayerItem[] = [];
  @Input() categories: Category[] = [];
  @Output() updateAppLayers: EventEmitter<LayerItem[]> = new EventEmitter<LayerItem[]>();

  searchTypeDefault: string = 'label';
  searchTypeGroup: any = ['label','type'];
  enableSelectLayer: boolean = false;
  selectedLayers: any = new Array();
  searchText: string = "";
  
  newLayers: LayerItem[] = [];
  isUrlLoadSuccess: boolean = false;
  isUrlLoadUnsuccess: boolean = false;
  isSaveSuccess: boolean = false;
  isSaveUnsuccess: boolean = false;
  isWMSService: boolean = false;
  categoryId: string = "";
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
  }
  optionsCategoryTree: ITreeOptions = {
    displayField: 'label',
    childrenField: 'children'
  }

  constructor(private httpService: HttpService, private mapUtils: MapUtilsService) {
  }
  
  updateLayers(event: LayerItem[]){
    this.layers = event;
    this.updateAppLayers.emit(event);
  }

  deleteSelectedLayers(){
    if(this.selectedLayers.length > 0){
      this.httpService.deleteLayers(this.selectedLayers).subscribe(
        data => {
          this.layers = data;
          this.updateAppLayers.emit(data);
          this.selectedLayers = new Array();
          },
        error => {
          console.error("Error on remove layer: " + error);
        }
      );
    }
  }

  // Tree functions
  onUpdateTree( $event ){
    if($event.treeModel){
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
  hasSelectedItem(treeModel: TreeModel){
    let root = treeModel.getFirstRoot();
    if(root){
      const checkedLayers = [];
      this.getCheckedNode(root, checkedLayers);
      if(checkedLayers.length > 0){
        return true;
      }
    }
    return false;
  }

  // Buttons
  onSelectAllNodes(treeModel: TreeModel){
    let root = treeModel.getFirstRoot();
    this.check(root, true);
  }
  onDeselectAllNodes(treeModel: TreeModel){
    let root = treeModel.getFirstRoot();
    this.check(root, false);
  }
  onCategoryChange($event){
    if($event.target.value){
      this.httpService.getCategory($event.target.value).subscribe(
        data => {
          //const item = new CategoryItem(f.value.label, f.value.layerBodId, '', '');
          this.category = data;
        },
        error => {
          console.error("Error get category '" + $event.target.value + "'!");
        }
      );
    } else{
      this.category = [];
    }
  }
  onAddLayers(layersModel: TreeModel, f: NgForm, categoryTree: TreeComponent){
    var root = layersModel.getFirstRoot();
    var checkedLayers = [];
    var layerItems: LayerItem[] = [];
    this.getCheckedNode(root, checkedLayers);
    checkedLayers.forEach(l => {
      var layerItem = new LayerItem(l.generateId(this.layers), l);
      layerItems.push(layerItem);
    });
    this.saveAddedLayers(layerItems);
    this.saveAddedLayersToCategory(f, layerItems, root, categoryTree);
  }
  onAddCombineLayers(layersModel: TreeModel, f: NgForm, categoryTree: TreeComponent){
    var root = layersModel.getFirstRoot();
    var checkedLayers = [];
    var layerItems: LayerItem[] = [];
    this.getCheckedNode(root, checkedLayers);
    if(checkedLayers.length > 0){
      var wmsLayers = '';
      var label = '';
      var legendUrl = '';
      var i = 0;
      checkedLayers.forEach(l => {
        i++;
        if(l.wmsLayers){
          wmsLayers += l.wmsLayers;
        }
        if(l.legendUrl){
          legendUrl += l.legendUrl;
        }
        if(l.label){
          label += l.label;
        }
        if(i != checkedLayers.length){
          wmsLayers += ",";
          legendUrl += "|";
          label += "|";
        }
      });
      var layer = _.cloneDeep(checkedLayers[0]);
      layer.wmsLayers = wmsLayers;
      layer.legendUrl = legendUrl;
      layer.label = label;
      const layerItem = new LayerItem(layer.generateId(this.layers), layer);
      layerItems.push(layerItem);
    }
    this.saveAddedLayers(layerItems);
    this.saveAddedLayersToCategory(f, layerItems, root, categoryTree);
  }

  saveAddedLayers(layerItems: LayerItem[]){
    this.httpService.addLayer(layerItems).subscribe( 
      data => {
        this.updateAppLayers.emit(data);
      },
      error => {
        console.error("Error add layers!");
      }
    );
  }
  getCheckedNode(node, list) {
    this.getChildCheckedNode(node, list);
  }
  getChildCheckedNode(node, list) {
    if(node.data.checked){
      list.push(node.data.layer);
    }
    if (node.children) {
      node.children.forEach((child) => this.getChildCheckedNode(child, list));
    }
  }

  saveAddedLayersToCategory(f: NgForm, layers: LayerItem[], rootLayersModel: TreeNode, categoryTree: TreeComponent){
    if(f.valid && categoryTree){
      if(f.value.categoryId){
        var categoryTreeModel = categoryTree.treeModel;
        if(categoryTreeModel){
          var categoryTreeModelFocusNode = categoryTreeModel.focusedNode;
          if(categoryTreeModelFocusNode){
            var catItem: CategoryItem;
            var i: number = 0;
            var categoryLayers = [];
            this.getCategoryNode(rootLayersModel, layers, i, categoryLayers);
            categoryLayers.forEach(categoryLayer => {
              categoryTreeModelFocusNode.data.children.unshift(categoryLayer);  
            });
            categoryTreeModel.update();
            this.httpService.updateCategoryTree(f.value.categoryId, categoryTreeModel.nodes).subscribe(
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
                console.error("Error onAddCategoryItem tree!")
              }
            );
          }
        }
      }
    }
  }
  getCategoryNode(node: TreeNode, layers: LayerItem[], i, children) {
    if(layers.length  > 0){
      var item: CategoryItem;
      if(node.data.checked){
        item = new CategoryItem(layers[i].item.label, layers[i].id, '', undefined);
        children.push(item);
        i++;
      }
      if(i != layers.length) {
        if (node.children) {
          if(item) {
            children = item.children;
          }
          node.children.forEach((child) => this.getCategoryNode(child, layers, i, children));
        }
      }
    }
  }
  
  // Service functions
  loadService( serviceUrl: string ){
    if(serviceUrl){
      serviceUrl = this.mapUtils.addGetCapabilitiesParams(serviceUrl.trim());
      this.httpService.getService(serviceUrl)
      .subscribe( 
        data => {
          if (data){
            this.newLayers = [];
            if(data['WMS_Capabilities'] || data['WMT_MS_Capabilities']){
              // WMS
              this.isWMSService = true;
              let service = data['WMS_Capabilities'] || data['WMT_MS_Capabilities'];
              let version = service['version'];
              let cap = service['Capability'];
              let dcpType = cap['Request']['GetMap']['DCPType'];
              let wmsUrl;
              let layer = cap['Layer'];
              // GetMap-Url
              if (dcpType instanceof Array) {
                wmsUrl = dcpType[0]['HTTP']['Get']['OnlineResource'];
              } else {
                wmsUrl = dcpType['HTTP']['Get']['OnlineResource']['xlink:href'];
              }
              if(layer){
                this.createWMSLayers(layer, this.newLayers, wmsUrl, version, null, null, null);
              }
            } else if (data['Capabilities']){
              // WMTS
              this.isWMSService = false;
              let service = data['Capabilities'];
              let serviceMetadataUrl = service['ServiceMetadataURL']['xlink:href'];
              let version = service['version'];
              let layer = service['Contents']['Layer'];
              let tileMatrixSet = service['Contents']['TileMatrixSet'];
              this.createWMTSLayer(layer, this.newLayers, serviceMetadataUrl, version, tileMatrixSet);
            }
          }
          this.isUrlLoadSuccess = true;
          this.isUrlLoadUnsuccess =  !this.isUrlLoadSuccess;
        },
        error => {
          console.error("Error load " + serviceUrl);
          this.isUrlLoadUnsuccess = true;
          this.isUrlLoadSuccess =  !this.isUrlLoadUnsuccess;
        }
      );
    }
  }

  createWMSLayers(layer, layers, wmsUrl, version, bbox, minScale, maxScale){
    let newLayer = new Wmslayer();
    // Version
    newLayer.version = version;
    // Label
    newLayer.label = layer['Title'];
    // GetMap-URL
    newLayer.wmsUrl = wmsUrl;
    // Name
    if(layer['Name']){
      newLayer.wmsLayers = layer['Name'];
    }
    // Extent
    newLayer.extent = bbox;
    // WMS 1.1.1
    if(layer['LatLonBoundingBox']){
      let latLonBox = layer['LatLonBoundingBox'];
      newLayer.extent = [+latLonBox['minx'], +latLonBox['miny'], +latLonBox['maxx'], +latLonBox['maxy']];
    }
    // WMS 1.3.0
    if(layer['EX_GeographicBoundingBox']){
      let latLonBox = layer['EX_GeographicBoundingBox'];
      newLayer.extent = [+latLonBox['westBoundLongitude'], +latLonBox['southBoundLatitude'], +latLonBox['eastBoundLongitude'], +latLonBox['northBoundLatitude']];
    }
    // Scale
    if(minScale){
      newLayer.minScale = +minScale;
    }
    if(maxScale){
      newLayer.maxScale = +maxScale;
    }
    // WMS 1.1.1
    if(layer['ScaleHint']){
      let scaleHint = layer['ScaleHint'];
      if(scaleHint['min']){
        newLayer.minScale = +scaleHint['min'];
      }
      if(scaleHint['max']){
        newLayer.maxScale = +scaleHint['max'];
      }
    }
    // WMS 1.3.0
    if(layer['MinScaleDenominator']){
      newLayer.minScale = +layer['MinScaleDenominator'];
    }
    if(layer['MaxScaleDenominator']){
      newLayer.maxScale = +layer['MaxScaleDenominator'];
    }
    // Legend-URL
    newLayer.hasLegend = true;
    if(layer['Style']){
      let style = layer['Style'];
      if(style['LegendURL']){
        newLayer.legendUrl = style['LegendURL']['OnlineResource']['xlink:href'];
      }
    }
    // queryable
    if(layer['queryable'] && layer['queryable'] === "1"){
      newLayer.tooltip = true;
    } else {
      newLayer.tooltip = false;
    }


    let children = layer['Layer']; 
    let newLayerChildren = [];
    if(children) {
      if(children instanceof Array){
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

  createWMTSLayer (layer, layers, serviceMetadataUrl, version, tileMatrixSet){
    tileMatrixSet.forEach(tileMatrix => {
      let newLayer = new Wmtslayer();
      // Label
      newLayer.label = layer['ows:Title'];
      // Version
      newLayer.version = version;
      // ServiceLayerName
      newLayer.serverLayerName = layer['ows:Identifier']
      // ServiceMetadataUrl
      newLayer.serviceUrl = serviceMetadataUrl;
      // Format
      if(layer['ResourceURL']){
        newLayer.format = layer['ResourceURL']['Format'];
        newLayer.template = layer['ResourceURL']['template'];
      }
      // Style
      newLayer.style = layer['Style']['ows:Identifier'];
      // Extent
      if(layer['ows:WGS84BoundingBox']){
        let latLonBox = layer['ows:WGS84BoundingBox'];
        let lowerCorner = latLonBox['ows:LowerCorner'].split(" ");
        let upperCorner = latLonBox['ows:UpperCorner'].split(" ");
        newLayer.extent = [+lowerCorner[0], +lowerCorner[1], +upperCorner[0], +upperCorner[1]]
      }
      // MatrixSet
      newLayer.matrixSet = tileMatrix['ows:Identifier'];
      tileMatrix['TileMatrix'].forEach(tm => {
        // Origin
        let topLeftCorner = tm['TopLeftCorner'].split(" ");
        newLayer.origin = [+topLeftCorner[0], +topLeftCorner[1]];
        // scales
        let scaleDenominator = tm['ScaleDenominator'];
        newLayer.scales.push(+scaleDenominator);
        // matrixIds
        let identifier = tm['ows:Identifier'];
        newLayer.matrixIds.push(identifier);
        
        let tileHeight = tm['TileHeight'];
        let tileWidth = tm['TileWidth'];
        newLayer.tileSize = [+tileHeight, +tileWidth];
      });
      layers.push({
        label: newLayer.label,
        layer: newLayer
      });
    });
  }
}