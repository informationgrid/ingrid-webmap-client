import { Component, Input, EventEmitter, Output, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Category } from '../../../_models/category';
import { LayerItem } from '../../../_models/layer-item';
import { HttpService } from '../../../_services/http.service';
import { NgForm } from '@angular/forms/src/directives/ng_form';
import { TreeComponent, TreeModel, TreeNode, IActionMapping, ITreeOptions } from 'angular-tree-component';
import { Layer } from '../../../_models/layer';
import { Wmslayer } from '../../../_models/wmslayer';
import { Wmtslayer } from '../../../_models/wmtslayer';
import * as _ from 'lodash';
import { CategoryItem } from '../../../_models/category-item';
import { ModalComponent } from '../../modals/modal/modal.component';
import { UtilsLayers } from '../../../_shared/utils/utils-layers';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-layer',
  templateUrl: './layer.component.html',
  styleUrls: ['./layer.component.scss']
})
export class LayerComponent implements OnInit {

  @Input() categories: Category[] = [];
  @Input() layers: LayerItem[] = [];
  @Output() updateAppLayers: EventEmitter<LayerItem[]> = new EventEmitter<LayerItem[]>();
  @Output() updateAppCategories: EventEmitter<Category[]> = new EventEmitter<Category[]>();
  @ViewChild('newService') newService: ElementRef;
  @ViewChild('modalAddService') modalAddService: ModalComponent;
  @ViewChild('modalSaveSuccess') modalSaveSuccess: ModalComponent;
  @ViewChild('modalSaveUnsuccess') modalSaveUnsuccess: ModalComponent;

  layersPage: LayerItem[] = [];
  layersCurrentPage = 1;
  layersTotalPage = 1;
  layersPerPage = 20;
  layersTotalNum = 0;

  searchTypeDefault = 'label';
  searchTypeGroup: any = ['label', 'type'];
  enableSelectLayer = false;
  selectedLayers: any = new Array();
  searchText = '';
  searchHasStatus = false;
  searchCategory = '';
  searchType = '';

  isActiveSingleTile = false;
  isActiveGutter = false;
  isActiveTileSize = false;

  layersExtendedSelectedSingleTile = false;
  layersExtendedSelectedGutter = null;
  layersExtendedSelectedTileSize = null;
  layersSelectAll = false;

  newLayers: LayerItem[] = [];
  tmpNewLayers: LayerItem[] = [];
  isUrlLoadSuccess = false;
  isUrlLoadUnsuccess = false;
  isWMSService = false;
  hasLoadLayers = false;

  setGroupLayerAsFolder = false;
  setLayerAsSingleTile = false;
  setLayerGutter = null;
  setLayerTileSize = null;
  hasLogin = false;
  overrideLogin = false;
  serviceLogin = '';
  servicePassword = '';

  categoryId = '';
  category = new Map<String, CategoryItem[]>();
  selectedCategories = new Map<String, Array<TreeNode>>();

  actionMapping: IActionMapping = {
    mouse: {
      click: (tree, node) => {
        if (node.data.layer.extent) {
          this.check(node, !node.data.checked);
        }
      }
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

  constructor(private httpService: HttpService, private translate: TranslateService) {}

  ngOnInit() {
    this.loadLayers(this.layersCurrentPage, this.layersPerPage, this.searchText);
  }
  // Paging
  previousPage() {
    this.resetAllChecked();
    this.layersCurrentPage--;
    this.loadLayers(this.layersCurrentPage, this.layersPerPage, this.searchText);
  }

  nextPage() {
    this.resetAllChecked();
    this.layersCurrentPage++;
    this.loadLayers(this.layersCurrentPage, this.layersPerPage, this.searchText);
  }

  firstPage() {
    this.resetAllChecked();
    this.layersCurrentPage = 1;
    this.loadLayers(this.layersCurrentPage, this.layersPerPage, this.searchText);
  }

  lastPage() {
    this.resetAllChecked();
    this.layersCurrentPage = this.layersTotalPage;
    this.loadLayers(this.layersCurrentPage, this.layersPerPage, this.searchText);
  }

  // Search
  searchLayers() {
    this.resetAllChecked();
    this.loadLayers(1, this.layersPerPage, this.searchText);
  }

  showModalAdd() {
    this.modalAddService.show();
    this.newService.nativeElement.value = '';
    this.newLayers = [];
    this.selectedCategories = new Map<String, Array<TreeNode>>();
    this.categoryId = '';
    this.serviceLogin = '';
    this.servicePassword = '';
  }

  loadLayers(layersCurrentPage: number, layersPerPage: number, searchText: string) {
    this.httpService.getLayersPerPage(layersCurrentPage, layersPerPage, searchText, this.searchHasStatus,
        this.searchCategory, this.searchType).subscribe(
      data => {
        this.layersPage = data.items;
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
  updateLayers(layers: LayerItem[]) {
    if (layers) {
      this.layersPage = layers;
    } else {
      this.loadLayers(this.layersCurrentPage, this.layersPerPage, this.searchText);
    }
    this.updateAppLayers.emit(this.layersPage);
  }

  updateSelectedLayers(modal: ModalComponent) {
    this.selectedLayers.forEach(selectedLayer => {
      this.layersPage.forEach(layerItem => {
        const layerId = layerItem.id;
        let layer = layerItem.item;
        if (selectedLayer === layerId) {
          if (this.isActiveSingleTile) {
            layer.singleTile = this.layersExtendedSelectedSingleTile;
          }
          if (this.isActiveGutter) {
            layer.gutter = this.layersExtendedSelectedGutter;
          }
          if (this.isActiveTileSize) {
            layer.tileSize = this.layersExtendedSelectedTileSize;
          }
          return;
        }
      });
    });
    this.httpService.updateLayers(this.layersPage).subscribe(
      data => {
        this.modalSaveSuccess.show();
      },
      error => {
        console.error('Error onUpdateLayers!');
        this.modalSaveUnsuccess.show();
      },
      () => {
        modal.hide();
      }
    );
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
    this.isAllChecked();
    event.stopPropagation();
  }

  resetAllChecked() {
    this.selectedLayers = [];
    this.layersSelectAll = false;
  }

  isAllChecked() {
    if (this.layersPage.length === this.selectedLayers.length) {
      this.layersSelectAll = true;
    } else {
      this.layersSelectAll = false;
    }
  }

  changeAllLayersSection(select: boolean) {
    if (!select) {
      this.selectedLayers = [];
      this.layersPage.forEach(layer => {
        this.selectedLayers.push(layer.id);
      });
    } else {
      this.selectedLayers = [];
    }
  }

  deleteSelectedLayers(modal: ModalComponent) {
    this.httpService.deleteLayers(this.selectedLayers).subscribe(
      data => {
        this.updateAppLayers.emit(data);
        this.selectedLayers = new Array();
        this.loadLayers(this.layersCurrentPage, this.layersPerPage, this.searchText);
      },
      error => {
        console.error('Error on remove layer: ' + error);
      },
      () => {
        modal.hide();
      }
    );
  }

  deleteAllLayers(modal: ModalComponent) {
    this.httpService.deleteAllLayers().subscribe(
      data => {
        this.updateAppLayers.emit(data);
        this.selectedLayers = new Array();
        this.loadLayers(this.layersCurrentPage, this.layersPerPage, this.searchText);
      },
      error => {
        console.error('Error on remove layer: ' + error);
      },
      () => {
        modal.hide();
      }
    );
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
      const checkedLayers = [];
      roots.forEach(root => {
        this.getCheckedNode(root, checkedLayers, true);
      });
      if (checkedLayers.length > 0) {
        return true;
      }
    }
    return false;
  }

  // Buttons
  onSelectAllNodes(treeModel: TreeModel) {
    const roots = treeModel.getVisibleRoots();
    if (roots) {
      roots.forEach(root => {
        this.check(root, true);
      });
    }
  }
  onDeselectAllNodes(treeModel: TreeModel) {
    const roots = treeModel.getVisibleRoots();
    if (roots) {
      roots.forEach(root => {
        this.check(root, false);
      });
    }
  }
  onCategoryChange(id) {
    this.categoryId = id;
    if (this.categoryId) {
      this.httpService.getCategory(this.categoryId, null).subscribe(
        data => {
          const items: CategoryItem[] = [];
          const item = new CategoryItem();
          item.id = 1;
          item.label = this.translate.instant(this.categoryId);
          item.children = data;
          items.push(item);
          this.category.set(id, items);
        },
        error => {
          console.error('Error get category "' + this.categoryId + '"!');
        }
      );
    }
  }
  onSetCategory(id: String, model: TreeModel) {
    let arr = this.selectedCategories.get(id);
    if (!arr) {
      arr = new Array<TreeNode>();
    }
    const node = model.getActiveNode();
    if (arr.indexOf(node) === -1) {
      arr.push(node);
    }
    this.selectedCategories.set(id, arr);
  }
  onRemoveCategory(id: String, node: TreeNode) {
    const arr = this.selectedCategories.get(id);
    const index = arr.indexOf(node, 0);
    if (index > -1) {
      arr.splice(index, 1);
    }
    if (arr.length === 0) {
      this.selectedCategories.delete(id);
    }
  }
  onGetNodeName(node) {
    let title = '';
    if (node) {
      if (node.parent) {
        title += this.getNodeParentTitle(node.parent);
      }
      title += node.data.label;
    }
    return title;
  }

  getNodeParentTitle(node: TreeNode) {
    let title = '';
    if (node) {
      if (node.data.label) {
        title += node.data.label + ' -> ';
      }
      if (node.parent) {
        title += this.getNodeParentTitle(node.parent);
      }
    }
    return title;
  }

  onAddLayers(layersModel: TreeModel) {
    const roots = layersModel.getVisibleRoots();
    const checkedLayers = [];
    const layerItems: LayerItem[] = [];
    const isCombine = false;
    roots.forEach(root => {
      this.getCheckedNode(root, checkedLayers, isCombine);
    });
    checkedLayers.forEach(l => {
      const layer = this.updateOptionsOnLayer(l);
      const layerItem = new LayerItem(l.generateId(this.layers), layer);
      layerItems.push(layerItem);
    });
    this.saveAddedLayers(layerItems, roots, isCombine);
  }

  onAddCombineLayers(layersModel: TreeModel) {
    const roots = layersModel.getVisibleRoots();
    const checkedLayers = [];
    const layerItems: LayerItem[] = [];
    const isCombine = true;
    roots.forEach(root => {
       this.getCheckedNode(root, checkedLayers, isCombine);
    });
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
          if (l.wmsLayers) {
            wmsLayers += ',';
          }
          if (l.legendUrl) {
            legendUrl += '|';
          }
          if (l.label) {
            label += '|';
          }
        }
      });
      let layer = _.cloneDeep(checkedLayers[0]);
      layer.wmsLayers = wmsLayers;
      layer.legendUrl = legendUrl;
      layer.label = label;
      layer = this.updateOptionsOnLayer(layer);
      const layerItem = new LayerItem(layer.generateId(this.layers), layer);
      layerItems.push(layerItem);
    }
    this.saveAddedLayers(layerItems, roots, isCombine);
  }

  saveAddedLayers(layerItems: LayerItem[], nodes: Array<TreeNode>, isCombine: boolean) {
    const categoryLayers = [];
    const saveLayers = [];
    this.getCategoryNodes(nodes, layerItems, saveLayers, categoryLayers, isCombine);

    if (this.hasLogin && this.serviceLogin && this.servicePassword) {
      this.httpService.addLayerAndAuth(saveLayers, this.newService.nativeElement.value, this.serviceLogin,
         this.servicePassword, this.overrideLogin).subscribe(
        data => {
          this.searchText = '';
          this.setGroupLayerAsFolder = false;
          this.setLayerAsSingleTile = false;
          this.setLayerGutter = null;
          this.setLayerTileSize = null;
          this.updateAppLayers.emit(data[1]);
          this.loadLayers(1, this.layersPerPage, this.searchText);
          this.modalSaveSuccess.show();
          this.modalAddService.hide();
          if (this.category.size > 0 && categoryLayers.length > 0) {
            this.saveAddedLayersToCategory(saveLayers, nodes, categoryLayers);
          }
        },
        error => {
          console.error('Error add layers!');
          this.modalSaveUnsuccess.show();
        }
      );
    } else {
      this.httpService.addLayer(saveLayers).subscribe(
        data => {
          this.searchText = '';
          this.setGroupLayerAsFolder = false;
          this.updateAppLayers.emit(data);
          this.loadLayers(1, this.layersPerPage, this.searchText);
          this.modalSaveSuccess.show();
          this.modalAddService.hide();
          if (this.category.size > 0 && categoryLayers.length > 0) {
            this.saveAddedLayersToCategory(saveLayers, nodes, categoryLayers);
          }
        },
        error => {
          console.error('Error add layers!');
          this.modalSaveUnsuccess.show();
        }
      );
    }
  }
  getCheckedNode(node, list, isCombine) {
    this.getChildCheckedNode(node, list, isCombine);
  }
  getChildCheckedNode(node, list, isCombine) {
    if (node.data.checked) {
      if (this.setGroupLayerAsFolder && isCombine) {
        if (!node.data.children || node.data.children.length === 0) {
          list.push(node.data.layer);
        }
      } else {
        list.push(node.data.layer);
      }
    }
    if (node.children) {
      node.children.forEach((child) => this.getChildCheckedNode(child, list, isCombine));
    }
  }

  updateOptionsOnLayer (layer: Layer) {
    if (this.setLayerAsSingleTile) {
      layer.singleTile = this.setLayerAsSingleTile;
    }
    if (this.setLayerGutter) {
      layer.gutter = this.setLayerGutter;
    }
    if (this.setLayerTileSize) {
      layer.tileSize = this.setLayerTileSize;
    }
    return layer;
  }

  saveAddedLayersToCategory(layers: LayerItem[], nodes: Array<TreeNode>, categoryLayers) {
    if (this.category) {
      if (this.categories) {
        for (const c in this.categories) {
          if (c) {
            const tmpC = this.categories[c];
            const tmpCategory = this.category.get(tmpC.id);
            const tmpSelectedCategory = this.selectedCategories.get(tmpC.id);
            if (tmpCategory && tmpSelectedCategory) {
              tmpCategory.forEach(tmpCatItem => {
                this.addLayersToCategoryItem(tmpCatItem, tmpSelectedCategory, categoryLayers);
              });
              const id = 2;
              this.setCategoriesItemId(tmpCategory, id);
              this.httpService.updateCategoryTreeAndCategories(tmpC.id, tmpCategory[0].children).subscribe(
                data => {
                  this.updateAppCategories.emit(data[1]);
                },
                error => {
                  console.error('Error saveAddedLayersToCategory tree!');
                  this.modalSaveUnsuccess.show();
                }
              );
            }
          }
        }
      }
    }
  }

  setCategoriesItemId(tmpCategory: CategoryItem[], id: number) {
    tmpCategory.forEach(tmpCategoryItem => {
      id = tmpCategoryItem.getNextCategoryNodeId(tmpCategory, id);
      tmpCategoryItem.id = id;
      id ++;
      if (tmpCategoryItem.children ) {
        this.setCategoriesItemId(tmpCategoryItem.children, id);
      }
    });
  }

  addLayersToCategoryItem(tmpCatItem, tmpSelectedCategory, categoryLayers) {
    tmpSelectedCategory.forEach(tmpSelectedCatItem => {
      const tmpSelectedCatItemId = tmpSelectedCatItem.id;
      if (tmpCatItem.id === tmpSelectedCatItemId) {
        categoryLayers.forEach( tmpCatLayer => {
          if (!tmpCatItem.children) {
            tmpCatItem.children = [];
          }
          tmpCatItem.children.push(tmpCatLayer);
          const index = tmpSelectedCategory.indexOf(tmpSelectedCatItem, 0);
          if (index > -1) {
            tmpSelectedCategory.splice(index, 1);
          }
        });
      }
      if (tmpCatItem.children) {
        tmpCatItem.children.forEach(tmpCatChildItem => {
          this.addLayersToCategoryItem(tmpCatChildItem, tmpSelectedCategory, categoryLayers);
        });
      }
    });
  }

  getCategoryNodes(nodes: Array<TreeNode>, layers: LayerItem[], saveLayers: LayerItem[], children: any[], isCombine: boolean) {
    if (layers.length  > 0) {
      if (nodes) {
        nodes.forEach(node => {
          this.getCategoryNode(node, layers, saveLayers, children, isCombine);
        });
      }
    }
  }

  getCategoryNode(node: TreeNode, layers: LayerItem[], saveLayers: LayerItem[], children: any[], isCombine: boolean) {
    if (layers.length  > 0) {
      let item: CategoryItem;
      if (node.data.checked) {
        const layer = layers[0];
        item = new CategoryItem(null, layer.item.label, 'prod', false);
        if (layer.id && layer.item) {
          if  (layer.item.wmsLayers || layer.item.serverLayerName) {
            if ( this.setGroupLayerAsFolder && !isCombine) {
              if (!node.data.children || node.data.children.length === 0) {
                item.layerBodId = layer.id;
                saveLayers.push(layer);
              }
            } else {
              item.layerBodId = layer.id;
              saveLayers.push(layer);
            }
          }
        }
        children.push(item);
        layers.splice(0, 1);
      }
      if (node.children && node.children.length > 0) {
        if (item) {
          item.children = [];
          children = item.children;
        }
        node.children.forEach((child) => {
          this.getCategoryNode(child, layers, saveLayers, children, isCombine);
        });
      }
    }
  }

  // Service functions
  loadService( serviceUrl: string ) {
    if (serviceUrl) {
      serviceUrl = UtilsLayers.addGetCapabilitiesParams(serviceUrl.trim());
      let login = null;
      let password = null;
      if (this.hasLogin) {
        login = this.serviceLogin.trim();
        password = this.servicePassword.trim();
      }
      this.httpService.getService(serviceUrl, login, password, this.overrideLogin)
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
              const format = cap['Request']['GetMap']['Format'];
              let wmsUrl;
              // GetMap-Url
              if (dcpType instanceof Array) {
                wmsUrl = dcpType[0]['HTTP']['Get']['OnlineResource'];
              } else {
                wmsUrl = dcpType['HTTP']['Get']['OnlineResource']['xlink:href'];
              }
              // Attribution
              let attribution = '';
              let attributionUrl = '';
              if (service['Service']) {
                if (service['Service']['ContactInformation']) {
                  if (service['Service']['ContactInformation']['ContactPersonPrimary']) {
                    if (service['Service']['ContactInformation']['ContactPersonPrimary']['ContactOrganization']) {
                      attribution = service['Service']['ContactInformation']['ContactPersonPrimary']['ContactOrganization'];
                    }
                  }
                }
                if (service['Service']['OnlineResource']) {
                  if (service['Service']['OnlineResource']['xlink:href']) {
                    attributionUrl = service['Service']['OnlineResource']['xlink:href'];
                  }
                }
              }
              if (layer) {
                this.createWMSLayers(layer, this.newLayers, wmsUrl, version, format, null, null, null,
                  attribution, attributionUrl);
              }
            } else if (data['Capabilities']) {
              // WMTS
              this.isWMSService = false;
              const service = data['Capabilities'];
              let serviceMetadataUrl = serviceUrl;
              if (service['ServiceMetadataURL']) {
                serviceMetadataUrl = service['ServiceMetadataURL']['xlink:href'];
              }
              const version = service['version'];
              const layer = service['Contents']['Layer'];
              let wmtsLayers: any = [];
              if (layer instanceof Array) {
                wmtsLayers = layer;
              } else {
                wmtsLayers.push(layer);
              }
              const operations = service['ows:OperationsMetadata'];
              const encoding = 'REST';
              const tileMatrixSet: any = service['Contents']['TileMatrixSet'];
              let tileMatrixSets: any[] = [];
              if (tileMatrixSet instanceof Array) {
                tileMatrixSets = tileMatrixSet;
              } else {
                tileMatrixSets.push(tileMatrixSet);
              }
              // Attribution
              let attribution = '';
              let attributionUrl = '';
              if (service['ows:ServiceProvider']) {
                if (service['ows:ServiceProvider']['ows:ProviderName']) {
                  attribution = service['ows:ServiceProvider']['ows:ProviderName'];
                }
                if (service['ows:ServiceProvider']['ows:ProviderSite']) {
                  if (service['ows:ServiceProvider']['ows:ProviderSite']['xlink:href']) {
                    attributionUrl = service['ows:ServiceProvider']['ows:ProviderSite']['xlink:href'];
                  }
                }
              }
              this.createWMTSLayer(wmtsLayers, this.newLayers, serviceMetadataUrl, version, tileMatrixSets, encoding,
                attribution, attributionUrl);
            }
          }
          this.isUrlLoadSuccess = true;
          this.isUrlLoadUnsuccess =  !this.isUrlLoadSuccess;
          setTimeout(() => {
              this.isUrlLoadSuccess = false;
              this.isUrlLoadUnsuccess =  false;
            }
          , 1000);
        },
        error => {
          console.error('Error load ' + serviceUrl);
          this.isUrlLoadUnsuccess = true;
          this.isUrlLoadSuccess =  !this.isUrlLoadUnsuccess;
          this.newLayers = [];
        }
      );
    }
  }

  createWMSLayers(layer, layers, wmsUrl, version, formats, bbox, minScale, maxScale, attribution: string, attributionUrl: string) {
    const newLayer = new Wmslayer();

    if (this.hasLogin) {
      if (this.serviceLogin) {
        newLayer.auth = this.serviceLogin;
      }
    }
    // Version
    newLayer.version = version;
    // Label
    newLayer.label = layer['Title'];
    // GetMap-URL
    newLayer.wmsUrl = wmsUrl;
    // Attribution
    newLayer.attribution = attribution;
    // AttributionUrl
    newLayer.attributionUrl = attributionUrl;
    // AttributionUpdate
    newLayer.attributionUpdate = true;
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
    if (layer['Dimension']) {
      const dimensions = layer['Dimension'];
      let dimensionTime;
      if (dimensions instanceof Array) {
        dimensions.forEach(dimension => {
          if (dimension['name']) {
            if (dimension['name'] === 'time') {
              dimensionTime = dimension;
            }
          }
        });
      } else {
        dimensionTime = dimensions;
      }
      if (dimensionTime) {
        if (dimensionTime['name']) {
          // timeEnabled
          if (dimensionTime['name'] === 'time') {
            newLayer.timeEnabled = true;
          }
          // timeBehaviour WMS 1.3.0
          if (dimensionTime['default']) {
            if (dimensionTime['default'] === 'current') {
              newLayer.timeBehaviour = 'last';
            } else {
              newLayer.timeBehaviour = dimensionTime['default'];
            }
          } else {
            newLayer.timeBehaviour = 'all';
          }
          // timestamps WMS 1.3.0
          if (dimensionTime['content']) {
            this.getYearsPeriodDates(newLayer, dimensionTime['content']);
          }
        }
      }
      if (layer['Extent']) {
        // timeBehaviour WMS 1.1.1
        if (layer['Extent']['default']) {
          if (layer['Extent']['default'] === 'current') {
            newLayer.timeBehaviour = 'last';
          } else {
            newLayer.timeBehaviour = layer['Extent']['default'];
          }
        } else {
          newLayer.timeBehaviour = 'all';
        }
        // timestamps WMS 1.1.1
        if (layer['Extent']['content']) {
          this.getYearsPeriodDates(newLayer, layer['Extent']['content']);
        }
      }
    }
    // format
    if (formats) {
      if (formats.indexOf('image/png') > -1) {
        newLayer.format = 'png';
      } else if (formats.indexOf('image/png') > -1) {
        newLayer.format = 'jpeg';
      } else if (formats.indexOf('image/gif') > -1) {
        newLayer.format = 'gif';
      } else {
        newLayer.format = formats[0].replace('image/', '');
      }
    }
    if (!newLayer.format) {
      newLayer.format = 'png';
    }

    const children = layer['Layer'];
    const newLayerChildren = [];
    if (children) {
      if (children instanceof Array) {
        children.forEach(child => {
          this.createWMSLayers(child, newLayerChildren, wmsUrl, version, formats, newLayer.extent, newLayer.minScale, newLayer.maxScale,
            newLayer.attribution, newLayer.attributionUrl);
        });
      } else {
        this.createWMSLayers(children, newLayerChildren, wmsUrl, version, formats, newLayer.extent, newLayer.minScale, newLayer.maxScale,
          newLayer.attribution, newLayer.attributionUrl);
      }
    }
    layers.push({
      label: newLayer.label,
      layer: newLayer,
      children: newLayerChildren
    });
  }

  createWMTSLayer (wmtslayers: any[], layers: any[], serviceMetadataUrl: string, version: string, tileMatrixSet: any[], encoding: string,
      attribution: string, attributionUrl: string) {
    wmtslayers.forEach(layer => {
      let newLayer;
      let tileMatrixSetLinks: any = [];
      const layerHasLogin = this.hasLogin;
      const layerServiceLogin = this.serviceLogin;
      if (layer['TileMatrixSetLink'] instanceof Array) {
        tileMatrixSetLinks = layer['TileMatrixSetLink'];
      } else {
        tileMatrixSetLinks.push(layer['TileMatrixSetLink']);
      }
      tileMatrixSetLinks.forEach(tileMatrixSetLink => {
        const tileMatrixId = tileMatrixSetLink['TileMatrixSet'];
        if (tileMatrixId) {
          tileMatrixSet.forEach(tileMatrix => {
            if (tileMatrixId === tileMatrix['ows:Identifier']) {
              newLayer = new Wmtslayer();
              if (layerHasLogin) {
                if (layerServiceLogin) {
                  newLayer.auth = layerServiceLogin;
                }
              }
              // Label
              newLayer.label = layer['ows:Title']['content'] || layer['ows:Title'];
              // Version
              newLayer.version = version;
              // Encoding
              newLayer.requestEncoding = encoding;
              // ServiceLayerName
              newLayer.serverLayerName = layer['ows:Identifier'];
              // ServiceMetadataUrl
              newLayer.serviceUrl = serviceMetadataUrl;
              // Attribution
              newLayer.attribution = attribution;
              // AttributionUrl
              newLayer.attributionUrl = attributionUrl;
              // AttributionUpdate
              newLayer.attributionUpdate = true;
              // Format
              const resourceUrl = layer['ResourceURL'];
              if (resourceUrl) {
                if (resourceUrl instanceof Array) {
                  resourceUrl.forEach(resUrl => {
                    const resourceType = resUrl['resourceType'];
                    if (resourceType === 'tile') {
                      newLayer.format = resUrl['format'];
                      if (newLayer.format) {
                        if (newLayer.format.indexOf('image/png') > -1) {
                          newLayer.format = 'png';
                        } else if (newLayer.format.indexOf('image/jpeg') > -1) {
                          newLayer.format = 'jpeg';
                        } else if (newLayer.format.indexOf('image/gif') > -1) {
                          newLayer.format = 'gif';
                        }
                      }
                      newLayer.template = resUrl['template'];
                    } else if (resourceType === 'FeatureInfo') {
                      // FeatureInfoTpl
                      newLayer.featureInfoTpl = resUrl['template'];
                      // Tooltip
                      newLayer.tooltip = true;
                    }
                  });
                } else {
                  const resourceType = resourceUrl['resourceType'];
                  if (resourceType === 'tile') {
                    newLayer.format = resourceUrl['format'];
                    if (newLayer.format) {
                      if (newLayer.format.indexOf('image/png') > -1) {
                        newLayer.format = 'png';
                      } else if (newLayer.format.indexOf('image/jpeg') > -1) {
                        newLayer.format = 'jpeg';
                      } else if (newLayer.format.indexOf('image/gif') > -1) {
                        newLayer.format = 'gif';
                      }
                    }
                    newLayer.template = resourceUrl['template'];
                  } else if (resourceType === 'FeatureInfo') {
                    // FeatureInfoTpl
                    newLayer.featureInfoTpl = resourceType['template'];
                    // Tooltip
                    newLayer.tooltip = true;
                  }
                }
              }
              // Style
              const styles = layer['Style'];
              if (styles instanceof Array) {
                styles.forEach(style => {
                  if (style['isDefault'] && style['isDefault'] === 'true') {
                    newLayer.style = style['ows:Identifier'];
                  }
                });
                if (!newLayer.style) {
                  newLayer.style = styles[0]['ows:Identifier'];
                }
              } else if (layer['Style']['ows:Identifier']) {
                newLayer.style = layer['Style']['ows:Identifier'];
              } else {
                newLayer.style = 'default';
              }
              // Extent
              if (layer['ows:WGS84BoundingBox']) {
                const latLonBox = layer['ows:WGS84BoundingBox'];
                const lowerCorner = latLonBox['ows:LowerCorner'].split(' ');
                const upperCorner = latLonBox['ows:UpperCorner'].split(' ');
                newLayer.extent = [+lowerCorner[0], +lowerCorner[1], +upperCorner[0], +upperCorner[1]];
              }
              // timeEnabled
              if (layer['Dimension']) {
                const dimensions = layer['Dimension'];
                let dimensionTime;
                if (dimensions instanceof Array) {
                  dimensions.forEach(dimension => {
                    if (dimension['ows:Identifier']) {
                      if (dimension['ows:Identifier'] === 'time') {
                        dimensionTime = dimension;
                      }
                    }
                  });
                } else {
                  dimensionTime = dimensions;
                }
                if (dimensionTime) {
                  if (dimensionTime['ows:Identifier']) {
                    // timeEnabled
                    if (dimensionTime['ows:Identifier'] === 'time') {
                      newLayer.timeEnabled = true;
                      // timeBehaviour
                      if (dimensionTime['Default']) {
                        newLayer.timeBehaviour = dimensionTime['Default'];
                      } else {
                        newLayer.timeBehaviour = 'last';
                      }
                      // timestamps
                      if (dimensionTime['Value'] instanceof Array) {
                        const dimValueList = dimensionTime['Value'];
                        dimValueList.forEach(dimValues => {
                          this.getYearsPeriodDates(newLayer, dimValues);
                        });
                      } else {
                        this.getYearsPeriodDates(newLayer, dimensionTime['Value']);
                      }
                      if (dimensionTime['Current'] === 'true') {
                        newLayer.timestamps.splice(0, 0, 'current');
                      }
                    } else {
                      newLayer.timestamps.splice(0, 0, 'current');
                    }
                  }
                }
              }
              // MatrixSet
              newLayer.matrixSet = tileMatrix['ows:Identifier'];
              tileMatrix['TileMatrix'].forEach(tm => {
                // Origin
                const topLeftCorner = tm['TopLeftCorner'].split(' ');
                newLayer.origin = [+topLeftCorner[0], +topLeftCorner[1]];
                // scales
                const scaleDenominator = tm['ScaleDenominator'];
                if (!newLayer.scales) {
                  newLayer.scales = [];
                }
                newLayer.scales.push(+scaleDenominator);
                // matrixIds
                const identifier = tm['ows:Identifier'];
                if (!newLayer.matrixIds) {
                  newLayer.matrixIds = [];
                }
                newLayer.matrixIds.push(identifier);
              });
              layers.push({
                label: newLayer.label,
                layer: newLayer
              });
            }
          });
        }
      });
    });
  }

  getYearsPeriodDates(newLayer, dimension) {
    if (dimension.indexOf('/') > -1) {
      const ts = dimension.split('/');
      if (ts.length === 3) {
        const timestampStart = ts[0];
        const timestampEnd = ts[1];
        const timestampPeriod = ts[2];
        const startDate = new Date(timestampStart);
        const endDate = new Date(timestampEnd);
        while (startDate <= endDate) {
          if (timestampStart.length <= 4) {
            newLayer.timestamps.splice(0, 0, startDate.getFullYear().toString());
          } else {
            const date = startDate.toISOString();
            if (newLayer.type === 'wms') {
              newLayer.timestamps.splice(0, 0, date);
            } else {
              const dateSplit = date.split('T');
              newLayer.timestamps.splice(0, 0, dateSplit[0]);
            }
          }
          startDate.setFullYear(startDate.getFullYear() + 1);
        }
      }
    } else if (dimension.indexOf(',') > -1) {
      const ts = dimension.split(',');
      ts.forEach(t => {
        newLayer.timestamps.splice(0, 0, t);
      });
    } else {
      newLayer.timestamps.push(dimension);
    }
  }
}
