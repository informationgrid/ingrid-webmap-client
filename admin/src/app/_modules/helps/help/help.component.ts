import { Component, Input, SimpleChanges, OnChanges, ViewChild } from '@angular/core';
import { Setting } from '../../../_models/setting';
import { HttpService } from '../../../_services/http.service';
import { ActivatedRoute } from '@angular/router';
import { ModalComponent } from '../../modals/modal/modal.component';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnChanges {

  constructor(private httpService: HttpService, private route: ActivatedRoute) { }

  @Input() settings: Setting = new Setting();
  languages: string[] = [];
  helps: Map<String, String>;
  @ViewChild('modalSaveSuccess') modalSaveSuccess: ModalComponent;
  @ViewChild('modalSaveUnsuccess') modalSaveUnsuccess: ModalComponent;

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
            this.httpService.getHelp(lang).subscribe(
              data => {
                if (!this.helps) {
                  this.helps = new Map<String, String>();
                }
                this.helps.set(lang, JSON.parse(data));
              },
              error => {
                console.log('Error load help ' + lang);
              }
            );
        });
      }
    }
  }

  onUpdate(lang: string) {
    this.httpService.updateHelp(lang, this.helps.get(lang)).subscribe(
      data => {
        this.modalSaveSuccess.show();
      },
      error => {
        console.log('Error save help ' + lang);
        this.modalSaveUnsuccess.show();
      }
    );
  }
}
