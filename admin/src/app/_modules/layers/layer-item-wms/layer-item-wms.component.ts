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
  @Output() updateLayer: EventEmitter<LayerItem> = new EventEmitter<LayerItem>();

  tmpLayer: LayerItem;

  constructor(private httpService: HttpService) { }

  onUpdateLayer() {
    if (this.form.valid) {
      if (this.form.value) {
        this.layer.id = this.form.value.id;
        this.httpService.updateLayer(this.layerId, this.layer).subscribe(
          data => {
            this.form.form.markAsPristine();
            this.form.form.markAsUntouched();
            this.form.form.updateValueAndValidity();
            this.modalSaveSuccess.show();
            this.layer = data;
            this.updateLayer.emit(data);
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
