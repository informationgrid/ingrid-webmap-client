import { Component, Input, Output, OnInit } from '@angular/core';
import { HttpService } from '../../../_services/http.service';
import { NgForm } from '@angular/forms';
import { EventEmitter } from 'events';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss']
})
export class SettingComponent implements OnInit {

  @Input() settings: any;
  @Output() updateAppSettings: EventEmitter = new EventEmitter();

  isSaveSuccess = false;
  isSaveUnsuccess = false;

  constructor(private httpService: HttpService) { }

  ngOnInit() {
  }

  isString(val) {
    return typeof val === 'string';
  }

  isBoolean(val) {
    return typeof val === 'boolean';
  }

  isNumber(val) {
    return typeof val === 'number';
  }

  isObject(val) {
    return (typeof val  === 'object');
  }

  isArray(val) {
    return this.isObject(val) && (val instanceof Array);
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
  onRemoveItem(value: any, list: any ) {
    if (value && list) {
      const index = list.indexOf(value, 0);
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

  onTextAreaBlur(setting, val) {
    if (setting && val) {
      setting.val.value = JSON.parse(val);
    }
  }

  onUpdate(f: NgForm) {
    if (f.valid) {
      if (f.value) {
        Object.keys(this.settings).forEach(key => {
          if (f.value) {
            if (f.value[key]) {
              const val = f.value[key];
              if (typeof val === 'string') {
                this.settings[key].value = val.trim();
              } else {
                this.settings[key].value = val;
              }
            }
          }
        });
        this.httpService.updateSetting(this.settings).subscribe(
          data => {
            this.settings = data;
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
