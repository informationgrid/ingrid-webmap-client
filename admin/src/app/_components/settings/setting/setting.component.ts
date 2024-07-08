import { Component, Input, Output, OnInit, EventEmitter, ViewChild } from '@angular/core';
import { HttpService } from '../../../_services/http.service';
import { NgForm } from '@angular/forms';
import { Setting } from '../../../_models/setting';
import { Category } from '../../../_models/category';
import { ModalComponent } from '../../modals/modal/modal.component';
import { UtilsLayers } from '../../../_shared/utils/utils-layers';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss']
})
export class SettingComponent implements OnInit {

  @Input() settings: Setting = new Setting();
  @Input() categories: Category[];
  @Output() updateAppSettings: EventEmitter<Setting> = new EventEmitter();
  @ViewChild('f') form: NgForm;
  @ViewChild('modalSaveSuccess') modalSaveSuccess: ModalComponent;
  @ViewChild('modalSaveUnsuccess') modalSaveUnsuccess: ModalComponent;

  mapScaleValue: number;
  mapScaleLabelValue: string;

  constructor(private httpService: HttpService) { }

  ngOnInit() {
  }

  onAddItem(value: any, list: any ) {
    UtilsLayers.onAddItem(value, list);
  }

  onAddTwoItems(value1: any, list1: any, value2: any, list2: any) {
    UtilsLayers.onAddItem(value1, list1);
    UtilsLayers.onAddItem(value2, list2);
  }

  onRemoveItem(index, list: any) {
    UtilsLayers.onRemoveItem(index, list);
  }

  onRemoveTwoItems(index, list1: any, list2: any) {
    UtilsLayers.onRemoveItem(index, list1);
    UtilsLayers.onRemoveItem(index, list2);
  }

  onUpItem(value: any, list: any) {
    UtilsLayers.onUpItem(value, list);
  }

  onUpTwoItems(value1: any, list1: any, value2: any, list2: any) {
    UtilsLayers.onUpItem(value1, list1);
    UtilsLayers.onUpItem(value2, list2);
  }

  onDownItem(value: any, list: any) {
    UtilsLayers.onDownItem(value, list);
  }

  onDownTwoItems(value1: any, list1: any, value2: any, list2: any) {
    UtilsLayers.onDownItem(value1, list1);
    UtilsLayers.onDownItem(value2, list2);
  }

  onTextAreaBlur(key: string, value: string) {
    if (key && value) {
      this.settings[key] = JSON.parse(value);
    }
  }

  onUpdate() {
    if (this.form.valid) {
      if (this.form.value) {
        this.httpService.updateSetting(this.settings).subscribe(
          data => {
            this.form.form.markAsPristine();
            this.form.form.markAsUntouched();
            this.form.form.updateValueAndValidity();
            this.updateAppSettings.emit(data);
            this.modalSaveSuccess.show();
          },
          error => {
            console.log('Error save settings!');
            this.modalSaveUnsuccess.show();
          }
        );
      }
    }
  }

  onReset() {
    this.httpService.resetSetting().subscribe(
      data => {
        this.form.form.markAsPristine();
        this.form.form.markAsUntouched();
        this.form.form.updateValueAndValidity();
        this.updateAppSettings.emit(data);
        this.modalSaveSuccess.show();
      },
      error => {
        console.log('Error save settings!');
        this.modalSaveUnsuccess.show();
      }
    );
  }
}
