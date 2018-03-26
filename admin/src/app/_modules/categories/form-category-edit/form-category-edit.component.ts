import { Component, OnChanges, SimpleChanges, Input } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';
import { TreeComponent, TreeNode } from 'angular-tree-component';
import { LayerItem } from '../../../_models/layer-item';
import { Category } from '../../../_models/category';
import { HttpService } from '../../../_services/http.service';

@Component({
  selector: 'app-form-category-edit',
  templateUrl: './form-category-edit.component.html',
  styleUrls: ['./form-category-edit.component.scss']
})
export class FormCategoryEditComponent {

  @Input() tree: TreeComponent;
  @Input() layers: LayerItem[] = [];
  @Input() node: TreeNode;
  @Input() category: Category;

  editCatItemForm: FormGroup;
  editItemId: FormControl;
  editItemLabel: FormControl;
  editItemSelectedOpen: FormControl;
  editItemLayerBodId: FormControl;
  isSaveSuccess: boolean = false;
  isSaveUnsuccess: boolean = false;
  
  constructor(private httpService: HttpService) {
    this.prepareForm();
  }

  prepareForm() {
    this.editItemId = new FormControl('', [
      Validators.required
    ]);
    this.editItemLabel = new FormControl('', [
      Validators.required
    ]);
    this.editItemSelectedOpen = new FormControl();
    this.editItemLayerBodId = new FormControl();      
    this.editCatItemForm = new FormGroup({
      editItemId: this.editItemId,
      editItemLabel: this.editItemLabel,
      editItemSelectedOpen: this.editItemSelectedOpen,
      editItemLayerBodId: this.editItemLayerBodId
    });
  }

  resetForm(){
    var formGroup = this.editCatItemForm;
    let control: AbstractControl = null;
    formGroup.markAsUntouched();
    Object.keys(formGroup.controls).forEach((name) => {
      control = formGroup.controls[name];
      control.setErrors(null);
    });
    if(this.node){
      formGroup.setValue({
        editItemId: this.node.data.id,
        editItemLabel: this.node.data.label,
        editItemSelectedOpen: this.node.data.selectedOpen ? this.node.data.selectedOpen: false,
        editItemLayerBodId: this.node.data.layerBodId ? this.node.data.layerBodId : ""
      });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if(this.node){
      this.editCatItemForm.setValue({
        editItemId: this.node.data.id,
        editItemLabel: this.node.data.label,
        editItemSelectedOpen: this.node.data.selectedOpen ? this.node.data.selectedOpen: false,
        editItemLayerBodId: this.node.data.layerBodId ? this.node.data.layerBodId : ""
      });
    }
  }

  onEditCategoryItem (node: TreeNode) {
    if(this.editCatItemForm.valid && node) {
      if (this.editCatItemForm.value) {
        if(this.editCatItemForm.value.editItemId){
          node.data.id = this.editCatItemForm.value.editItemId;
        }
        if(this.editCatItemForm.value.editItemLabel){
          node.data.label = this.editCatItemForm.value.editItemLabel;
        }
        if(this.editCatItemForm.value.editItemLayerBodId){
          node.data.layerBodId = this.editCatItemForm.value.editItemLayerBodId;
        }
        if(this.editCatItemForm.value.editItemSelectedOpen){
          node.data.selectedOpen = this.editCatItemForm.value.editItemSelectedOpen;
        }
        var treeModel = node.treeModel;
        treeModel.update();
        this.httpService.updateCategoryTree(this.category.id, treeModel.nodes).subscribe(
          data => {
            this.isSaveSuccess = true;
            this.isSaveUnsuccess = !this.isSaveSuccess;
            setTimeout(() => {
                this.isSaveSuccess = false;
                this.isSaveUnsuccess = false;
                this.resetForm();
              }
            , 4000);
          },
          error => {
            this.isSaveUnsuccess = true;
            this.isSaveSuccess = !this.isSaveUnsuccess;
            console.error("Error onEditCategoryItem tree!")
          }
        );
      }
    }
  }
}
