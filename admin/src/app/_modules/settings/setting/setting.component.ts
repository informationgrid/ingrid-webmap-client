import { Component, Input, Output, OnInit, EventEmitter, ViewChild } from '@angular/core';
import { HttpService } from '../../../_services/http.service';
import { NgForm } from '@angular/forms';
import { Setting } from '../../../_models/setting';
import { Category } from '../../../_models/category';
import { ModalComponent } from '../../modals/modal/modal.component';

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

  onAddItem(value: any, list: any) {
    if (value && list) {
      if (list.indexOf(value) === -1) {
        list.push(value);
      }
    }
    value = '';
  }
  onRemoveItem(index: any, list: any ) {
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

  onTextAreaBlur(key: string, value: string) {
    if (key && value) {
      this.settings[key] = JSON.parse(value);
    }
  }

  onUpdate(f: NgForm) {
    if (f.valid) {
      if (f.value) {
        this.httpService.updateSetting(this.settings).subscribe(
          data => {
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
