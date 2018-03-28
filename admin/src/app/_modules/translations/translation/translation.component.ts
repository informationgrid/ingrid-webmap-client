import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-translation',
  templateUrl: './translation.component.html',
  styleUrls: ['./translation.component.scss']
})
export class TranslationComponent {

  constructor(private translate: TranslateService) {
    translate.setDefaultLang('de');
    translate.use('de');
    translate.addLangs(['en']);
  }

  switchLanguage(language: string) {
    this.translate.use(language);
  }

  setActive(language: string) {
    if (this.translate.currentLang === language) {
      return 'active';
    } else {
      return '';
    }
  }
}
