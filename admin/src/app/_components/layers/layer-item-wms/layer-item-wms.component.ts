import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { LayerItem } from '../../../_models/layer-item';
import { HttpService } from '../../../_services/http.service';
import { ModalComponent } from '../../modals/modal/modal.component';
import { UtilsLayers } from '../../../_shared/utils/utils-layers';
import { ITreeOptions } from 'angular-tree-component';

@Component({
  selector: 'app-layer-item-wms',
  templateUrl: './layer-item-wms.component.html',
  styleUrls: ['./layer-item-wms.component.scss']
})
export class LayerItemWmsComponent {

  @Input() layer: LayerItem;
  @Input() layerId = '';
  @Input() altLayers;
  @Input() modalSaveSuccess: ModalComponent;
  @Input() modalSaveUnsuccess: ModalComponent;
  @ViewChild('f') form: NgForm;
  @Output() updateLayer: EventEmitter<LayerItem> = new EventEmitter<LayerItem>();

  tmpLayer: LayerItem;
  layerCategoryTrees;

  optionsCategoryTree: ITreeOptions = {
    displayField: 'label',
    childrenField: 'children'
  };

  constructor(private httpService: HttpService) { }

  onAddItem(value: any, list: any ) {
    UtilsLayers.onAddItem(value, list);
  }

  onRemoveItem(index, list: any) {
    UtilsLayers.onRemoveItem(index, list);
  }

  onUpItem(value: any, list: any) {
    UtilsLayers.onUpItem(value, list);
  }

  onDownItem(value: any, list: any) {
    UtilsLayers.onDownItem(value, list);
  }

  onUpdateLayer() {
    if (this.form.valid) {
      if (this.form.value) {
        this.layer.id = this.form.value.id;
        UtilsLayers.cleanupLayersProps(this.layer);
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

  loadCategories(elem, layerId) {
    if (layerId && !elem.classList.toString().includes('show')) {
      this.httpService.getCategoriesOfLayer(layerId, true).subscribe(
        data => {
          this.layerCategoryTrees = data;
        },
        error => {
          console.error('Error load categories for id: ' + layerId);
        }
      );
    }
  }
}
