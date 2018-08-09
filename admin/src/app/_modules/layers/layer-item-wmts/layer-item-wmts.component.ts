import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { LayerItem } from '../../../_models/layer-item';
import { HttpService } from '../../../_services/http.service';
import { ModalComponent } from '../../modals/modal/modal.component';

@Component({
  selector: 'app-layer-item-wmts',
  templateUrl: './layer-item-wmts.component.html',
  styleUrls: ['./layer-item-wmts.component.scss']
})
export class LayerItemWmtsComponent {

  @Input() layer: LayerItem;
  @Input() layerId = '';
  @ViewChild('f') form: NgForm;
  @ViewChild('modalSaveSuccess') modalSaveSuccess: ModalComponent;
  @ViewChild('modalSaveUnsuccess') modalSaveUnsuccess: ModalComponent;
  @Output() updateLayer: EventEmitter<LayerItem> = new EventEmitter<LayerItem>();

  tmpLayer: LayerItem;

  constructor(private httpService: HttpService) { }

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

  showModal(modal) {
    modal.show();
  }

  editAuth(form, modal) {
    if (form.valid) {
      if (form.value) {
        if (this.layer.item.wmsUrl) {
          const url = this.layer.item.wmsUrl.trim();
          const login = form.value.auth.trim();
          const password = form.value.password.trim();
          this.httpService.updateAuth(url, login, password, true).subscribe(
            data => {
              form.form.markAsPristine();
              form.form.markAsUntouched();
              form.form.updateValueAndValidity();
              form.value.password = '';
              form.resetForm(form.value);
              modal.hide();
              this.modalSaveSuccess.show();
            },
            error => {
              console.error('Error editAuth!');
              this.modalSaveUnsuccess.show();
            }
          );
        } else {
          this.modalSaveUnsuccess.show();
        }
      }
    }
  }
}
