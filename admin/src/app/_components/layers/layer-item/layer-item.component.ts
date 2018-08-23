import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HttpService } from '../../../_services/http.service';
import { LayerItem } from '../../../_models/layer-item';
import { UtilsLayers } from '../../../_shared/utils/utils-layers';

@Component({
  selector: 'app-layer-item',
  templateUrl: './layer-item.component.html',
  styleUrls: ['./layer-item.component.scss']
})
export class LayerItemComponent {

  @Input() layer: LayerItem;
  @Input() layers: LayerItem[] = [];
  @Output() updateLayers: EventEmitter<LayerItem[]> = new EventEmitter<LayerItem[]>();
  @Output() selectLayer: EventEmitter<any> = new EventEmitter<any>();

  isEdit = false;

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
}