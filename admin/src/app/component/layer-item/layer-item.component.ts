import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpService } from '../../utils/http.service';
import { Observable } from 'rxjs/Observable';
import { LayerItem } from '../../model/layer-item';

@Component({
  selector: 'app-layer-item',
  templateUrl: './layer-item.component.html',
  styleUrls: ['./layer-item.component.scss']
})
export class LayerItemComponent {

  @Input() layer: LayerItem;
  @Input() layers: LayerItem[] = [];
  @Input() enableSelectLayer: boolean = false;
  @Input() selectedLayers: any = new Array();

  @Output() updateLayers: EventEmitter<LayerItem[]> = new EventEmitter<LayerItem[]>();
  
  isEdit: boolean = false;

  constructor(private httpService: HttpService) { }

  isWMSLayer(layer){
    if(layer.type){
      if(layer.type === "wms"){
        return true;
      }
    }
    return false;
  }
  isWMTSLayer(layer){
    if(layer.type){
      if(layer.type === "wmts"){
        return true;
      }
    }
    return false;
  }
  onUpdateLayer(f: NgForm) {
    if(f.valid){
      if(f.value) {
        this.layer.item = f.value;
        this.httpService.updateLayer(this.layer).subscribe(
          data => {
            this.layers = data;
            /* Do not update parent
            this.updateLayers.emit(data);
            */
            },
          error => {
            console.error("Error onUpdateLayer!")
          }
        );
        this.layer.id = f.value.id;
        this.isEdit = !this.isEdit;
      }
    }
  }

  onDeleteLayer(id: string){
    this.httpService.deleteLayer(id).subscribe(
      data => {
        this.updateLayers.emit(data);
        },
      error => {
        console.error("Error onDeleteLayer!")
      }
    );
  }

  selectLayer(event){
   if(!this.selectedLayers){
    this.selectedLayers = new Array()
   }
   if(event.target.checked){
      this.selectedLayers.push(event.target.value);
    } else {
      var index = this.selectedLayers.indexOf(event.target.value, 0);
      if (index > -1) {
        this.selectedLayers.splice(index, 1);
      };
    }
    event.stopPropagation();
  }
}
