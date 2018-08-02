import { Directive, Input, HostListener } from '@angular/core';
import { Layer } from '../_models/layer';
import { MapUtilsService } from '../_services/map-utils.service';

@Directive({
  selector: '[appShowCapabilities]'
})
export class ShowCapabilitiesDirective {

  @Input() layer: Layer;
  mapUtils: MapUtilsService = new MapUtilsService();
  constructor() { }

  @HostListener('click', ['$event']) onClick($event) {
    if (this.layer) {
      let url;
      if (this.mapUtils.isWMS(this.layer.type)) {
        url = this.layer.wmsUrl;
        if (!url.startsWith('http')) {
          url = 'http://' + url;
        }
        if (this.layer.version) {
          url = this.mapUtils.appendUrl(url, 'VERSION=' + this.layer.version);
        }
        url = this.mapUtils.addGetCapabilitiesParams(url);
      } else if (this.mapUtils.isWMTS(this.layer.type)) {
        url = this.layer.serviceUrl;
        if (!url.startsWith('http')) {
          url = 'http://' + url;
        }
        if (this.layer.requestEncoding !== 'REST') {
          if (this.layer.version) {
            url = this.mapUtils.appendUrl(url, 'VERSION=' + this.layer.version);
            url = this.mapUtils.addGetCapabilitiesParams(url);
          }
        }
      }
      window.open(url);
    }
  }
}
