import { Directive, Input, HostListener } from '@angular/core';

@Directive({
  selector: '[appShowURL]'
})
export class ShowURLDirective {

  @Input() url: string;
  constructor() { }

  @HostListener('click', ['$event']) onClick($event) {
    if (this.url) {
      let tmpUrl = this.url;
      if (!tmpUrl.startsWith('http')) {
        tmpUrl = 'http://' + tmpUrl;
      }
      window.open(tmpUrl);
    }
  }
}
