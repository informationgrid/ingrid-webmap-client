import { Directive, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NG_VALIDATORS, Validator, ValidatorFn, FormControl } from '@angular/forms';
import { LayerItem } from '../_models/layer-item';

@Directive({
  selector: '[appExistOnLayerList][ngModel]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: LayerListValidatorDirective,
      multi: true
    }
  ]
})
export class LayerListValidatorDirective implements Validator, OnChanges {

  @Input() checkList: LayerItem[] = [];
  private _validator: ValidatorFn;
  private _onChange: () => void;

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('checkList' in changes) {
      this._createValidator();
      if (this._onChange) {
        this._onChange();
      }
    }
  }

  private _createValidator(): void {
    this._validator = this.existOnLayerListValidator();
  }

  validate(control: FormControl) {
    return this.checkList == null ? null : this._validator(control);
  }

  existOnLayerListValidator(): ValidatorFn {
    return (control: FormControl) => {
      const value = control.value;
      if (value) {
        let isValid = false;
        this.checkList.forEach(layer => {
          if (value === layer.id) {
            isValid = true;
            return;
          }
        });
        if (isValid) {
          return null;
        } else {
          return {
            notExist: true
          };
        }
      }
      return null;
    };
  }
}
