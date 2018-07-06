import { Directive, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NG_VALIDATORS, Validator, ValidatorFn, FormControl } from '@angular/forms';
import { Category } from '../_models/category';

@Directive({
  selector: '[appCategoryListValidator][ngModel]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: CategoryListValidatorDirective,
      multi: true
    }
  ]
})
export class CategoryListValidatorDirective implements Validator, OnChanges {

  @Input() checkList: Category[] = [];
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
    this._validator = this.existOnCategoryListValidator();
  }

  validate(control: FormControl) {
    return this.checkList == null ? null : this._validator(control);
  }

  existOnCategoryListValidator(): ValidatorFn {
    return (control: FormControl) => {
      const value = control.value;
      if (value) {
        let isValid = false;
        this.checkList.forEach(category => {
          if ((value + '').toLowerCase() === category.id.toLowerCase()) {
            isValid = true;
          }
        });
        if (!isValid) {
          return  null;
        } else {
          return {
            exist: true
          };
        }
      }
      return null;
    };
  }
}
