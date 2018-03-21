import { Pipe, PipeTransform } from '@angular/core';
import { LayerItem } from '../_models/layer-item';

@Pipe({
  name: 'arrayFilter'
})
export class ArrayFilterPipe implements PipeTransform {

  transform(items: any[], searchText: string, key: string): any[] {
    if(!items) return [];
    if(!searchText) return items;
    searchText = searchText.toLowerCase();
    return items.filter( it => {
        if(it instanceof LayerItem){
          if(it.item[key]) return it.item[key].toLowerCase().includes(searchText);  
        }
        if(it[key]) return it[key].toLowerCase().includes(searchText);
        if(it.val) return it.val[key].toLowerCase().includes(searchText);
        return [];
      });
    }
}
