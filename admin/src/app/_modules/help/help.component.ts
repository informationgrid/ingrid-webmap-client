import { Component, Input, SimpleChanges, OnChanges } from '@angular/core';
import { Setting } from '../../_models/setting';
import { HttpService } from '../../_services/http.service';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnChanges {

  constructor(private httpService: HttpService) { }

  @Input() settings;

  languages: Setting;
  helps: Map<String, String>;
  isSaveSuccess: boolean = false;
  isSaveUnsuccess: boolean = false;

  ngOnChanges(changes: SimpleChanges) {
    if(changes.settings){
      this.settings = changes.settings.currentValue;
      if(this.settings.settingLanguages){
        this.languages = this.settings.settingLanguages;
      }
    }
    if(this.languages){
      if(this.languages.value.length > 0){
        this.languages.value.forEach(lang => {
            this.httpService.getHelp(lang).subscribe(
              data => {
                if(!this.helps){
                  this.helps = new Map<String, String>();
                }
                this.helps.set(lang, data);
              },
              error => {
                console.log("Error load help " + lang);
              }
            )
        });
      }
    }
  }

  onUpdate(lang:string, content:string){
    this.httpService.updateHelp(lang, content).subscribe(
      data => {
        this.helps.set(lang, data);
        this.isSaveSuccess = true;
        this.isSaveUnsuccess = !this.isSaveSuccess;
        setTimeout(() => {
          this.removeAlert();
          }
        , 4000);
      },
      error => {
        console.log("Error save help " + lang);
        this.isSaveUnsuccess = true;
          this.isSaveSuccess = !this.isSaveUnsuccess;
      }
    );
  }

  removeAlert(){
    this.isSaveSuccess = false;
    this.isSaveUnsuccess = false;
  }
}
