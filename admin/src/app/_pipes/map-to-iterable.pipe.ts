import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mapToIterable'
})
export class MapToIterablePipe implements PipeTransform {

  transform(value: any, args?: any): any {
    var a = [];
    for (var key in value) {
      if (value.hasOwnProperty(key)) {
        a.push({key: key, val: value[key]});
      }
    }
    return a;
  }

}
