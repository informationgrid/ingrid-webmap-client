import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { LayerItem } from '../../../_models/layer-item';
import { HttpService } from '../../../_services/http.service';

@Component({
  selector: 'app-layer-item-wmts',
  templateUrl: './layer-item-wmts.component.html',
  styleUrls: ['./layer-item-wmts.component.scss']
})
export class LayerItemWmtsComponent implements OnInit {

  @Input('layer') layer: LayerItem;
  @Input('layerId') layerId = '';
  @Output() updateLayers: EventEmitter<LayerItem[]> = new EventEmitter<LayerItem[]>();
  isEdit = false;

  tmpLayer: LayerItem;

  constructor(private httpService: HttpService) { }

  ngOnInit() {
  }

  onEdit() {
    this.isEdit = !this.isEdit;
  }

  onCancel() {
    this.isEdit = !this.isEdit;
  }

  onAddItem(value: any, list: any ) {
    if (value && list) {
      if (list.indexOf(value) === -1) {
        list.push(value);
      }
    }
    value = '';
  }

  onRemoveItem(index, list: any) {
    if (index && list) {
      if (index > -1) {
        list.splice(index, 1);
      }
    }
  }

  onUpItem(value: any, list: any) {
    if (value && list) {
      this.onMoveItem(value, list, -1);
    }
  }

  onDownItem(value: any, list: any) {
    if (value && list) {
      this.onMoveItem(value, list, 1);
    }
  }

  onMoveItem(value: string, list: any, delta: number) {
    const index = list.indexOf(value);
    const newIndex = index + delta;
    if (newIndex < 0  || newIndex === list.length) {
      return;
    }
    const indexes = [index, newIndex].sort();
    list.splice(indexes[0], 2, list[indexes[1]], list[indexes[0]]);
  }

  onUpdateLayer(f: NgForm) {
    if (f.valid) {
      if (f.value) {
        this.layer.id = f.value.id;
        this.httpService.updateLayer(this.layerId, this.layer).subscribe(
          data => {
          },
          error => {
            console.error('Error onUpdateLayer!');
          }
        );
        this.isEdit = !this.isEdit;
      }
    }
  }
}
