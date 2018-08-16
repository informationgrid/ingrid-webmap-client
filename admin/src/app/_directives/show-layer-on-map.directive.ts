import { Directive, Input, HostListener } from '@angular/core';
import { environment } from '../../environments/environment';
import { UtilsLayers } from '../_shared/utils/utils-layers';

@Directive({
  selector: '[appShowLayerOnMap]'
})
export class ShowLayerOnMapDirective {

  @Input() layerBodId: string;
  constructor() { }

  @HostListener('click', ['$event']) onClick($event) {
    if (this.layerBodId) {
      let url = environment.mapURL;
      url = UtilsLayers.appendUrl(url, 'layers=' + this.layerBodId);
      window.open(url);
    }
  }
}
