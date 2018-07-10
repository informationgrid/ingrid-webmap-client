import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'limitToPipe'
})
export class TruncatePipe implements PipeTransform {

  transform(value: any, limit: number): any {
    const trail = '...';

    return value.length > limit ? value.substring(0, limit) + trail : value;
  }

}
