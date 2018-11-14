import { Component, Input, SimpleChanges, OnChanges } from '@angular/core';
import { Setting } from '../../../_models/setting';
import { HttpService } from '../../../_services/http.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-localisation',
  templateUrl: './localisation.component.html',
  styleUrls: ['./localisation.component.scss']
})
export class LocalisationComponent implements OnChanges {

  @Input() settings: Setting = new Setting();
  languages: string[] = [];
  localisations: Map<String, any>;

  constructor(private httpService: HttpService, private route: ActivatedRoute) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.settings) {
      this.settings = changes.settings.currentValue;
      if (this.settings.settingLanguages) {
        this.languages = this.settings.settingLanguages;
      }
    }
    if (this.languages) {
      if (this.languages.length > 0) {
        this.languages.forEach(lang => {
            this.httpService.getLocalisation(lang).subscribe(
              data => {
                if (!this.localisations) {
                  this.localisations = new Map<String, any>();
                }
                this.localisations.set(lang, JSON.parse(data));
              },
              error => {
                console.log('Error load localisation ' + lang);
              }
            );
        });
      }
    }
  }

  updateLocate(lang, key, input) {
    const locale = new Map<String, any>();
    locale.set(key, input.value);
    this.httpService.updateLocales(locale, lang).subscribe(
      data => {

      },
      error => {
        console.log('Error update locale ' + lang + ' for key ' + key);
      }
    );

  }
}
