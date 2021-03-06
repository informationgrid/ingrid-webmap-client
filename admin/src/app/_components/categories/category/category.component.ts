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

  categoryImagePreview;

  constructor(private httpService: HttpService, private translate: TranslateService) {
  }

  ngOnChanges(changes: SimpleChanges) {
    this.categoriesLength = this.categories.length;
  }

  showModalAdd (modal: ModalComponent) {
    this.model = new Category();
    this.categoryImagePreview = null;
    this.formAdd.reset();
    modal.show();
  }

  showModalEdit (modal: ModalComponent, category: Category) {
    this.model = category;
    this.categoryImagePreview = null;
    this.backgroundLayers = this.layers.filter(
      layer => layer.item.background
    );
    this.readUrl(this.model.id);
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
      copyCatLabel: '',
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
      this.reloadCategory(id);
    }
  }

  reloadCategory(id: string) {
    this.httpService.getCategory(id, null)
      .subscribe( data => {
          this.categoryTree = data;
      });
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
      this.model.id = this.formAdd.value.addCatId.toLowerCase();
      if (this.model.id) {
        if (!this.checkCategoryExist(this.model.id)) {
          if (this.model) {
            const map = new Map<String, String>();
            map.set(this.model.id,  this.formAdd.value.addCatLabel);
            map.set('' + this.model.id + '_service_link_href', '');
            map.set('' + this.model.id + '_service_link_label', '');
            map.set('topic_' + this.model.id + '_tooltip', this.formAdd.value.addCatTooltip ?
              this.formAdd.value.addCatTooltip : this.model.id);
            if (this.categoryImagePreview && this.categoryImagePreview.indexOf('/rest/admin') === -1) {
              this.httpService.addCategoryLabelAndImage(this.model, map, null, this.categoryImagePreview).subscribe(
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
            } else {
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
        if (this.categoryImagePreview && this.categoryImagePreview.indexOf('/rest/admin') === -1) {
          this.httpService.updateCategoryLabelAndImage(this.model, map, null, this.categoryImagePreview).subscribe(
            data => {
              this.categories = data[0];
              this.modalSaveSuccess.show();
              modal.hide();
            },
            error => {
              console.error('Error update (' + this.model.id + '): ' + error);
              this.modalSaveUnsuccess.show();
            },
            () => {
              this.translate.reloadLang(this.translate.getDefaultLang());
            }
          );
        } else {
          this.httpService.updateCategoryAndLabel(this.model, map).subscribe(
            data => {
              this.categories = data[0];
              this.modalSaveSuccess.show();
              modal.hide();
            },
            error => {
              console.error('Error update (' + this.model.id + '): ' + error);
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

  // Copy category
  onCopyCategory(modal: ModalComponent) {
    if (this.formCopy.valid) {
      if (this.model) {
        this.model.id = this.formCopy.value.copyId.toLowerCase();
        this.model.defaultBackground = this.formCopy.value.defaultBackground;
        const map = new Map<String, String>();
        map.set(this.model.id, this.formCopy.value.copyCatLabel);
        map.set('' + this.model.id + '_service_link_href', '');
        map.set('' + this.model.id + '_service_link_label', '');
        map.set('topic_' + this.model.id + '_tooltip', this.formCopy.value.copyCatTooltip);
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

  readUrl(event: any) {
    this.categoryImagePreview = null;
    if (event.target && event.target.files && event.target.files[0]) {
      const reader = new FileReader();

      reader.onload = (evt: ProgressEvent) => {
        this.categoryImagePreview = (<FileReader>evt.target).result;
      };

      reader.readAsDataURL(event.target.files[0]);
    } else {
      this.categoryImagePreview = this.httpService.getCategoryImage(this.model);
    }
  }
}
