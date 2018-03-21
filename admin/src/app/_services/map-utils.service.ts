import { Injectable } from '@angular/core';

@Injectable()
export class MapUtilsService {

  constructor() { }

  addGetCapabilitiesParams(url: string){
    if(url){
      if(url.toLowerCase().indexOf("wmts") == -1) {
        if (!/service=/i.test(url)) {
          url = this.appendUrl(url, /wmts/i.test(url) ?
            'SERVICE=WMTS' :
            'SERVICE=WMS');
        }
        if (!/request=/i.test(url)) {
          url = this.appendUrl(url, 'REQUEST=GetCapabilities');
        }
        if (!/version=/i.test(url)) {
          url = this.appendUrl(url, /wmts/i.test(url) ?
            'VERSION=1.0.0' :
            'VERSION=1.3.0');
        }
      }
    }
    return url;
  }
  
  appendUrl(url: string, paramString) {
    if (paramString) {
      var parts = (url + ' ').split(/[?&]/);
      url += (parts.pop() === ' ' ? paramString :
        (parts.length > 0 ? '&' + paramString : '?' + paramString));
    }
    return url;
  };
}
