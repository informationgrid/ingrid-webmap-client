import { Component, Input, EventEmitter, Output, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Category } from '../../../_models/category';
import { HttpService } from '../../../_services/http.service';
import { LayerItem } from '../../../_models/layer-item';
import { CategoryItem } from '../../../_models/category-item';
import { NgForm } from '@angular/forms';
import { ModalComponent } from '../../modals/modal/modal.component';
import { TranslateService } from '@ngx-translate/core';
import { UtilsLayers } from '../../../_shared/utils/utils-layers';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnChanges {

  @Input() layers: LayerItem[];
  @Input() categories: Category[];
  @ViewChild('formAdd') formAdd: NgForm;
  @ViewChild('formEdit') formEdit: NgForm;
  @ViewChild('formCopy') formCopy: NgForm;
  @ViewChild('modalSaveSuccess') modalSaveSuccess: ModalComponent;
  @ViewChild('modalSaveUnsuccess') modalSaveUnsuccess: ModalComponent;

  @Output() updateAppCategories: EventEmitter<Category[]> = new EventEmitter<Category[]>();

  model: Category = new Category();

  enableSelectCategories = false;
  selectedCategories: any = new Array();
  searchText = '';

  categoryTree: CategoryItem[] = [];
  categoriesLength = 0;
  isOpen = false;

  backgroundLayers: LayerItem[];

  constructor(private httpService: HttpService, private translate: TranslateService) {
  }

  ngOnChanges(changes: SimpleChanges) {
    this.categoriesLength = this.categories.length;
  }

  showModalAdd (modal: ModalComponent) {
    this.model = new Category();
    this.formAdd.reset();
    modal.show();
  }

  showModalEdit (modal: ModalComponent, category: Category) {
    this.model = category;
    this.backgroundLayers = this.layers.filter(
      layer => layer.item.background
    );
    this.formEdit.reset({
      id: this.model.id,
      defaultBackground: this.model.defaultBackground,
      backgroundLayers: this.model.backgroundLayers,
      selectedLayers: this.model.selectedLayers,
      activatedLayers: this.model.activatedLayers,
      editCatLabel: this.translate.instant(this.model.id),
      editCatTooltip: this.translate.instant('topic_' + this.model.id + '_tooltip')
    });
    modal.show();
  }

  showModalCopy (modal: ModalComponent, category: Category) {
    this.model = category;
    this.backgroundLayers = this.layers.filter(
      layer => layer.item.background
    );
    this.formCopy.reset({
      id: this.model.id,
      defaultBackground: this.model.defaultBackground,
      backgroundLayers: this.model.backgroundLayers,
      selectedLayers: this.model.selectedLayers,
      activatedLayers: this.model.activatedLayers,
      copyCatLabel: this.translate.instant(this.model.id),
      copyCatTooltip: this.translate.instant('topic_' + this.model.id + '_tooltip')
    });
    modal.show();
  }

  showModalDelete (modal: ModalComponent, category: Category) {
    this.model = category;
    this.selectedCategories = [category.id];
    modal.show();
  }

  loadCategory(id: string, event) {
    if (event.currentTarget.classList.contains('collapsed')) {
      this.httpService.getCategory(id, null)
      .subscribe( data => {
          this.categoryTree = data;
      });
    }
  }

  updateCategories(event) {
    this.categories = event;
    this.updateAppCategories.emit(event);
  }

  selectCategories(event) {
    if (!this.selectedCategories) {
     this.selectedCategories = new Array();
    }
    if (event.target.checked) {
       this.selectedCategories.push(event.target.value);
     } else {
       const index = this.selectedCategories.indexOf(event.target.value, 0);
       if (index > -1) {
         this.selectedCategories.splice(index, 1);
       }
     }
     event.stopPropagation();
   }

   deleteSelectedCategories (modal: ModalComponent) {
    this.httpService.deleteCategories(this.selectedCategories).subscribe(
      data => {
        this.updateAppCategories.emit(data);
        this.selectedCategories = new Array();
      },
      error => {
        console.error('Error on remove categories: ' + error);
      },
      () => {
        modal.hide();
        this.translate.reloadLang(this.translate.getDefaultLang());
      }
    );
  }

  deleteAllCategories (modal: ModalComponent) {
    this.httpService.deleteAllCategories().subscribe(
      data => {
        this.updateAppCategories.emit(data);
        this.selectedCategories = new Array();
      },
      error => {
        console.error('Error on remove categories: ' + error);
      },
      () => {
        modal.hide();
        this.translate.reloadLang(this.translate.getDefaultLang());
      }
    );
  }

  checkCategoryExist(value) {
    const existCategory = this.categories.filter(
      category => category.id.toLowerCase() === value.toLowerCase()
    );
    if (existCategory.length === 0) {
      return false;
    }
    return true;
  }

  // Add new category
  addCategory(modal: ModalComponent) {
    if (this.formAdd.valid) {
      const value = this.formAdd.value.addCatId;
      if (value) {
        if (!this.checkCategoryExist(value)) {
          if (this.model) {
            this.model.id = value;
            const map = new Map<String, String>();
            map.set(value,  this.formAdd.value.addCatLabel);
            map.set('' + value + '_service_link_href', '');
            map.set('' + value + '_service_link_label', '');
            map.set('topic_' + value + '_tooltip', this.formAdd.value.addCatTooltip ? this.formAdd.value.addCatTooltip : value);
            this.httpService.addCategoryAndLabel(this.model, map, null).subscribe(
              data => {
                this.categories = data[0];
                this.updateAppCategories.emit(data[0]);
                this.modalSaveSuccess.show();
                modal.hide();
              },
              error => {
                console.error('Error add category!');
                this.modalSaveUnsuccess.show();
              },
              () => {
                this.translate.reloadLang(this.translate.getDefaultLang());
              }
            );
          }
        }
      }
    }
  }

  // Edit category
  onUpdateCategory(modal: ModalComponent) {
    if (this.formEdit.valid) {
      if (this.model) {
        this.model.defaultBackground = this.formEdit.value.defaultBackground;
        const map = new Map<String, String>();
        if (this.formEdit.value.editCatLabel) {
          map.set(this.model.id,  this.formEdit.value.editCatLabel);
        }
        if (this.formEdit.value.editCatTooltip) {
          map.set('topic_' + this.model.id + '_tooltip', this.formEdit.value.editCatTooltip);
        }
        this.httpService.updateCategoryAndLabel(this.model, map).subscribe(
          data => {
            this.categories = data[0];
            this.modalSaveSuccess.show();
            modal.hide();
          },
          error => {
            console.error('Error update: ' + this.model.id);
            this.modalSaveUnsuccess.show();
          },
          () => {
            this.translate.reloadLang(this.translate.getDefaultLang());
          }
        );
      }
    }
  }

  // Copy category
  onCopyCategory(modal: ModalComponent) {
    if (this.formCopy.valid) {
      if (this.model) {
        this.model.defaultBackground = this.formCopy.value.defaultBackground;
        const map = new Map<String, String>();
        if (this.formCopy.value.copyCatLabel) {
          map.set(this.formCopy.value.copyId, this.formCopy.value.copyCatLabel);
        }
        if (this.formCopy.value.copyCatTooltip) {
          map.set('topic_' + this.formCopy.value.copyId + '_tooltip', this.formCopy.value.copyCatTooltip);
        }
        if (this.formCopy.value.copyId) {
          this.model.id = this.formCopy.value.copyId;
        }
        this.httpService.addCategoryAndLabel(this.model, map, this.formCopy.value.id).subscribe(
          data => {
            this.categories = data[0];
            this.modalSaveSuccess.show();
            modal.hide();
          },
          error => {
            console.error('Error update: ' + this.model.id);
            this.modalSaveUnsuccess.show();
          },
          () => {
            this.translate.reloadLang(this.translate.getDefaultLang());
          }
        );
      }
    }
  }

  onAddItem(value: any, list: any ) {
    UtilsLayers.onAddItem(value, list);
  }

  onRemoveItem(index, list: any) {
    UtilsLayers.onRemoveItem(index, list);
  }

  onUpItem(value: any, list: any) {
    UtilsLayers.onUpItem(value, list);
  }

  onDownItem(value: any, list: any) {
    UtilsLayers.onDownItem(value, list);
  }

  getLabel(id: string) {
    let label = id;
    if (this.layers) {
      this.layers.forEach(layer => {
        if (layer.id === id) {
          label = layer.item.label;
          return;
        }
      });
    }
    return label;
  }
}
