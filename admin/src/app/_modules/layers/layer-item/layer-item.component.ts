import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
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
  onUpdateLayer(f: NgForm) {
    if (f.valid) {
      if (f.value) {
        this.layer.item = f.value;
        this.httpService.updateLayer(this.layer).subscribe(
          data => {
          },
          error => {
            console.error('Error onUpdateLayer!');
          }
        );
        this.layer.id = f.value.id;
        this.isEdit = !this.isEdit;
      }
    }
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
}
