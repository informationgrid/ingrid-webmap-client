import { Component, Input, Output, EventEmitter, ViewChild, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { LayerItem } from '../../../_models/layer-item';
import { HttpService } from '../../../_services/http.service';
import { ModalComponent } from '../../modals/modal/modal.component';
import { UtilsLayers } from '../../../_shared/utils/utils-layers';
import { ITreeOptions } from 'angular-tree-component';

@Component({
  selector: 'app-layer-item-wmts',
  templateUrl: './layer-item-wmts.component.html',
  styleUrls: ['./layer-item-wmts.component.scss']
})
export class LayerItemWmtsComponent implements OnInit {

  @Input() layer: LayerItem;
  @Input() layerId = '';
  @Input() altLayers;
  @Input() modalSaveSuccess: ModalComponent;
  @Input() modalSaveUnsuccess: ModalComponent;
  @ViewChild('f') form: NgForm;
  @Output() updateLayer: EventEmitter<LayerItem> = new EventEmitter<LayerItem>();
  @Output() updateLayersAfterDelete: EventEmitter<LayerItem[]> = new EventEmitter<LayerItem[]>();

  tmpLayer: LayerItem;
  layerCategoryTrees;
  backgroundImage = null;

  optionsCategoryTree: ITreeOptions = {
    displayField: 'label',
    childrenField: 'children'
  };

  constructor(private httpService: HttpService) { }

  ngOnInit() {
    if  (this.layer.item.background) {
      this.readUrl(this.layer.id);
    }
  }

  onAddItem(value: any, list: any ) {
    UtilsLayers.onAddItem(value, list);
  }

  onAddItemNumber(value: any, list: number[] ) {
    UtilsLayers.onAddItemNumber(value, list);
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
        if (this.backgroundImage && this.backgroundImage.indexOf('/ingrid-webmap-client/rest/admin') === -1) {
          this.httpService.updateLayerAndImage(this.layerId, this.layer, this.backgroundImage).subscribe(
            data => {
              this.form.form.markAsPristine();
              this.form.form.markAsUntouched();
              this.form.form.updateValueAndValidity();
              this.modalSaveSuccess.show();
              this.layer = data[0];
              this.updateLayer.emit(data[0]);
            },
            error => {
              console.error('Error onUpdateLayer!');
              this.modalSaveUnsuccess.show();
            }
          );
        } else {
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

  showModal(modal) {
    modal.show();
  }

  onDeleteLayer(id: string, modal) {
    this.httpService.deleteLayer(id).subscribe(
      data => {
        this.updateLayersAfterDelete.emit();
        modal.hide();
        },
      error => {
        console.error('Error onDeleteLayer!');
      }
    );
  }

  editAuth(form, modal) {
    if (form.valid) {
      if (form.value) {
        if (this.layer.item.serviceUrl) {
          const url = this.layer.item.serviceUrl.trim();
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

  readUrl(event: any) {
    if (event.target && event.target.files && event.target.files[0]) {
      const reader = new FileReader();

      reader.onload = (evt: ProgressEvent) => {
        this.backgroundImage = (<FileReader>evt.target).result;
      };

      reader.readAsDataURL(event.target.files[0]);
    } else {
      this.backgroundImage = this.httpService.getLayerBackgroundImage(this.layer);
    }
  }
}
