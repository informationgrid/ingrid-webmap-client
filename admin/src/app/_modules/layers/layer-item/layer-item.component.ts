import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HttpService } from '../../../_services/http.service';
import { LayerItem } from '../../../_models/layer-item';

@Component({
  selector: 'app-layer-item',
  templateUrl: './layer-item.component.html',
  styleUrls: ['./layer-item.component.scss']
})
export class LayerItemComponent {

  @Input() layer: LayerItem;
  @Input() layers: LayerItem[] = [];
  @Input() enableSelectLayer = false;
  @Input() selectedLayers: any = new Array();

  @Output() updateLayers: EventEmitter<LayerItem[]> = new EventEmitter<LayerItem[]>();

  isEdit = false;

  constructor(private httpService: HttpService) { }

  isWMSLayer(layer) {
    if (layer.type) {
      if (layer.type === 'wms') {
        return true;
      }
    }
    return false;
  }
  isWMTSLayer(layer) {
    if (layer.type) {
      if (layer.type === 'wmts') {
        return true;
      }
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

  updateLayer(layers: LayerItem[]) {
    this.updateLayers.emit(layers);
  }
}
