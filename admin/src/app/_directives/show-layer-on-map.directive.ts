import { Directive, Input, HostListener } from '@angular/core';
import { MapUtilsService } from '../_services/map-utils.service';
import { environment } from '../../environments/environment';

@Directive({
  selector: '[appShowLayerOnMap]'
})
export class ShowLayerOnMapDirective {

  @Input() layerBodId: string;
  mapUtils: MapUtilsService = new MapUtilsService();
  constructor() { }

  @HostListener('click', ['$event']) onClick($event) {
    if (this.layerBodId) {
      let url = environment.mapURL;
      url = this.mapUtils.appendUrl(url, 'layers=' + this.layerBodId);
      window.open(url);
    }
  }
}
