import { Directive, Input, HostListener } from '@angular/core';
import { Layer } from '../_models/layer';
import { UtilsLayers } from '../_shared/utils/utils-layers';

@Directive({
  selector: '[appShowCapabilities]'
})
export class ShowCapabilitiesDirective {

  @Input() layer: Layer;
  constructor() { }

  @HostListener('click', ['$event']) onClick($event) {
    if (this.layer) {
      let url;
      if (UtilsLayers.isWMS(this.layer.type)) {
        url = this.layer.wmsUrl;
        if (!url.startsWith('http')) {
          url = 'http://' + url;
        }
        if (this.layer.version) {
          url = UtilsLayers.appendUrl(url, 'VERSION=' + this.layer.version);
        }
        url = UtilsLayers.addGetCapabilitiesParams(url);
      } else if (UtilsLayers.isWMTS(this.layer.type)) {
        url = this.layer.serviceUrl;
        if (!url.startsWith('http')) {
          url = 'http://' + url;
        }
        if (this.layer.requestEncoding !== 'REST') {
          if (this.layer.version) {
            url = UtilsLayers.appendUrl(url, 'VERSION=' + this.layer.version);
            url = UtilsLayers.addGetCapabilitiesParams(url);
          }
        }
      }
      window.open(url);
    }
  }
}
