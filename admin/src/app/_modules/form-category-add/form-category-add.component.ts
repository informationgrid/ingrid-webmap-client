import { Component, OnChanges, Input, SimpleChanges } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators, AbstractControl } from '@angular/forms';
import { TreeComponent, TreeNode } from 'angular-tree-component';
import { LayerItem } from '../../_models/layer-item';
import { CategoryItem } from '../../_models/category-item';
import { HttpService } from '../../_services/http.service';
import { Category } from '../../_models/category';

@Component({
  selector: 'app-form-category-add',
  templateUrl: './form-category-add.component.html',
  styleUrls: ['./form-category-add.component.scss']
})
export class FormCategoryAddComponent {
  
  @Input() tree: TreeComponent;
  @Input() layers: LayerItem[] = [];
  @Input() node: TreeNode;
  @Input() category: Category;
  
  addCatItemForm: FormGroup;
  addItemLabel: FormControl;
  addItemLayerBodId: FormControl;
  isSaveSuccess: boolean = false;
  isSaveUnsuccess: boolean = false;

  constructor(private httpService: HttpService) {
    this.prepareForm();
  }

  prepareForm() {
    this.addItemLabel = new FormControl('', [
      Validators.required
    ]);
    this.addItemLayerBodId = new FormControl();

    this.addCatItemForm = new FormGroup({
      addItemLabel: this.addItemLabel,
      addItemLayerBodId: this.addItemLayerBodId
    });
  }
  
  resetForm(){
    var formGroup = this.addCatItemForm;
    let control: AbstractControl = null;
    formGroup.markAsUntouched();
    Object.keys(formGroup.controls).forEach((name) => {
      control = formGroup.controls[name];
      control.setErrors(null);
    });
    formGroup.setValue({
      addItemLabel: "",
      addItemLayerBodId: ""
    })
  }

  ngOnChanges(changes: SimpleChanges) {
  }

   // On submit form add
   onAddCategoryItem (node: TreeNode) {
    if(this.addCatItemForm.valid) {
      if(this.addCatItemForm.value) {
        const item = new CategoryItem(this.addCatItemForm.value.addItemLabel, this.addCatItemForm.value.addItemLayerBodId, '', undefined);
        var treeModel;
        if(!node) {
          treeModel = this.tree.treeModel;
          treeModel.nodes.unshift(item);
        } else {
          treeModel = node.treeModel;
          node.data.children.unshift(item);
        }
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
            console.error("Error onAddCategoryItem tree!")
          }
        );
      }
      this.addCatItemForm.reset();
    }
  }
}
