import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpService } from '../../../_services/http.service';
import { ModalComponent } from '../../modals/modal/modal.component';

@Component({
  selector: 'app-css',
  templateUrl: './css.component.html',
  styleUrls: ['./css.component.scss']
})
export class CssComponent implements OnInit {

  css = '';
  @ViewChild('modalSaveSuccess') modalSaveSuccess: ModalComponent;
  @ViewChild('modalSaveUnsuccess') modalSaveUnsuccess: ModalComponent;

  constructor(private httpService: HttpService) { }

  ngOnInit() {
    this.onLoad();
  }

  onLoad() {
    this.httpService.getCss().subscribe(
      data => {
        this.css = data;
      },
      error => {
        console.log('Error load css!');
      }
    );
  }

  onUpdate(content: string) {
    this.httpService.updateCss(content).subscribe(
      data => {
        this.modalSaveSuccess.show();
      },
      error => {
        console.log('Error save css!');
        this.modalSaveUnsuccess.show();
      }
    );
  }
}
