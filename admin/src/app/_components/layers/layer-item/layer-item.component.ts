import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HttpService } from '../../../_services/http.service';
import { LayerItem } from '../../../_models/layer-item';
import { UtilsLayers } from '../../../_shared/utils/utils-layers';
import { ModalComponent } from '../../modals/modal/modal.component';

@Component({
  selector: 'app-layer-item',
  templateUrl: './layer-item.component.html',
  styleUrls: ['./layer-item.component.scss']
})
export class LayerItemComponent {

  @Input() layer: LayerItem;
  @Input() layers: LayerItem[] = [];
  @Input() modalSaveSuccess: ModalComponent;
  @Input() modalSaveUnsuccess: ModalComponent;
  @Output() updateLayers: EventEmitter<LayerItem[]> = new EventEmitter<LayerItem[]>();
  @Output() selectLayer: EventEmitter<any> = new EventEmitter<any>();

  isEdit = false;
  altLayers;

  constructor(private httpService: HttpService) { }

  isWMSLayer(layer) {
    if (layer.type) {
      return UtilsLayers.isWMS(layer.type);
    }
    return false;
  }
  isWMTSLayer(layer) {
    if (layer.type) {
      return UtilsLayers.isWMTS(layer.type);
    }
    return false;
  }

  onDeleteLayer(id: string) {
    this.httpService.deleteLayer(id).subscribe(
      data => {
        this.updateLayers.emit();
        },
      error => {
        console.error('Error onDeleteLayer!');
      }
    );
  }

  updateLayer(layer: LayerItem) {
    this.layer = layer;
    this.layers.forEach(l => {
      if (l.id === layer.id) {
        l = layer;
      }
    });
    this.updateLayers.emit(this.layers);
  }

  checkLayer(event) {
    this.selectLayer.emit(event);
  }

  loadLayersForService(event, layer) {
    if (layer.item.status && !this.altLayers) {
      let serviceUrl = layer.item.wmsUrl || layer.item.serviceUrl;
      serviceUrl = UtilsLayers.addGetCapabilitiesParams(serviceUrl.trim());
      this.httpService.loadServiceLayers(serviceUrl, layer.item.auth)
      .subscribe(
        data => {
          this.altLayers = data;
        },
        error => {
          console.error('Error loadServiceLayers!');
        }
      );
    }
  }
}
