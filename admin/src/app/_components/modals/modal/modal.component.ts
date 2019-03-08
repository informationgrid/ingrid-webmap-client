import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent {

  @Input() close = true;
  @Input() animateClose = false;
  @Input() cssClass = '';
  @Input() hasFooter = true;
  @Input() animateCloseTime = 2000;

  public visible = false;
  public visibleAnimate = false;

  public show(): void {
    this.visible = true;
    setTimeout(() => this.visibleAnimate = true, 100);
    if (this.animateClose) {
      setTimeout(() => this.hide() , this.animateCloseTime);
    }
  }

  public checkShow() {
    return this.visible;
  }

  public hide(): void {
    this.visibleAnimate = false;
    setTimeout(() => this.visible = false, 300);
  }

  public onContainerClicked(event: MouseEvent): void {
    if ((<HTMLElement>event.target).classList.contains('modal')) {
      this.hide();
    }
  }
}
