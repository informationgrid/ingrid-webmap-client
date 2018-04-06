import { Component, Input, Output, OnInit, EventEmitter, ViewChild } from '@angular/core';
import { HttpService } from '../../../_services/http.service';
import { NgForm } from '@angular/forms';
import {  } from 'events';
import { Setting } from '../../../_models/setting';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss']
})
export class SettingComponent implements OnInit {

  @Input() settings: Setting = new Setting();
  @Output() updateAppSettings: EventEmitter<Setting> = new EventEmitter();
  @ViewChild('f') form: NgForm;

  isSaveSuccess = false;
  isSaveUnsuccess = false;

  constructor(private httpService: HttpService) { }

  ngOnInit() {
  }

  onAddItem(value: any, list: any , withDuplicate) {
    if (value && list) {
      if (withDuplicate) {
        list.push(value);
      } else {
        if (list.indexOf(value) === -1) {
          list.push(value);
        }
      }
    }
    value = null;
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
            this.updateAppSettings.emit(this.settings);
            this.isSaveSuccess = true;
            this.isSaveUnsuccess = !this.isSaveSuccess;
            setTimeout(() => {
              this.removeAlert();
              }
            , 4000);
          },
          error => {
            console.log('Error save settings!');
            this.isSaveUnsuccess = true;
            this.isSaveSuccess = !this.isSaveUnsuccess;
          }
        );
      }
    }
  }

  removeAlert() {
    this.isSaveSuccess = false;
    this.isSaveUnsuccess = false;
  }
}
