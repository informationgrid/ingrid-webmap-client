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

  constructor(private httpService: HttpService) { }

  ngOnInit() {
  }

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
