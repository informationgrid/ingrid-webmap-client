import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { LayerItem } from '../../../_models/layer-item';
import { HttpService } from '../../../_services/http.service';

@Component({
  selector: 'app-layer-item-wms',
  templateUrl: './layer-item-wms.component.html',
  styleUrls: ['./layer-item-wms.component.scss']
})
export class LayerItemWmsComponent implements OnInit {

  @Input('layer') layer: LayerItem;
  @Input('layerId') layerId = '';
  @ViewChild('f') form: NgForm;
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
        this.layer.id = f.value.id;
        this.isEdit = !this.isEdit;
      }
    }
  }
}
