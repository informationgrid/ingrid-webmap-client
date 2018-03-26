import { Component, Input, SimpleChanges, OnChanges, OnInit } from '@angular/core';
import { Setting } from '../../../_models/setting';
import { HttpService } from '../../../_services/http.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {

  constructor(private httpService: HttpService, private route: ActivatedRoute) { }

  settings: any;
  languages: Setting;
  helps: Map<String, String>;
  isSaveSuccess: boolean = false;
  isSaveUnsuccess: boolean = false;

  ngOnInit(){
    this.httpService.getSetting().subscribe(
      data => {
        this.settings = data;
        this.languages = data["settingLanguages"];
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
    },
    error => {

      }
    );
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