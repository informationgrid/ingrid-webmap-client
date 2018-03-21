import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../_services/http.service';

@Component({
  selector: 'app-css',
  templateUrl: './css.component.html',
  styleUrls: ['./css.component.scss']
})
export class CssComponent implements OnInit {

  css: string = "";
  isSaveSuccess: boolean = false;
  isSaveUnsuccess: boolean = false;

  constructor(private httpService: HttpService) { }

  ngOnInit() {
    this.httpService.getCss().subscribe(
      data => {
        this.css = data;
      },
      error => {
        console.log("Error load css!");
      }
    );
  }

  onUpdate(content: string){
    this.httpService.updateCss(content).subscribe(
      data => {
        this.css = data;
        this.isSaveSuccess = true;
        this.isSaveUnsuccess = !this.isSaveSuccess;
        setTimeout(() => {
          this.removeAlert();
          }
        , 4000);
      },
      error => {
        console.log("Error save css!");
        this.isSaveUnsuccess = true;
        this.isSaveSuccess = !this.isSaveUnsuccess;
      }
    )
  }

  removeAlert(){
    this.isSaveSuccess = false;
    this.isSaveUnsuccess = false;
  }
}
