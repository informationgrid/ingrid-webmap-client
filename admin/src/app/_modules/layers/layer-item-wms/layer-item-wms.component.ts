import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { LayerItem } from '../../../_models/layer-item';
import { HttpService } from '../../../_services/http.service';
import { ModalComponent } from '../../modals/modal/modal.component';

@Component({
  selector: 'app-layer-item-wms',
  templateUrl: './layer-item-wms.component.html',
  styleUrls: ['./layer-item-wms.component.scss']
})
export class LayerItemWmsComponent {

  @Input() layer: LayerItem;
  @Input() layerId = '';
  @ViewChild('f') form: NgForm;
  @ViewChild('modalSaveSuccess') modalSaveSuccess: ModalComponent;
  @ViewChild('modalSaveUnsuccess') modalSaveUnsuccess: ModalComponent;
  @Output() updateLayers: EventEmitter<LayerItem[]> = new EventEmitter<LayerItem[]>();

  tmpLayer: LayerItem;

  constructor(private httpService: HttpService) { }

  onUpdateLayer(f: NgForm) {
    if (f.valid) {
      if (f.value) {
        this.layer.id = f.value.id;
        this.httpService.updateLayer(this.layerId, this.layer).subscribe(
          data => {
            this.modalSaveSuccess.show();
          },
          error => {
            console.error('Error onUpdateLayer!');
            this.modalSaveUnsuccess.show();
          }
        );
      }
    }
  }
}
