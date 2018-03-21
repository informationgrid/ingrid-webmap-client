import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCategoryEditComponent } from './form-category-edit.component';

describe('FormCategoryEditComponent', () => {
  let component: FormCategoryEditComponent;
  let fixture: ComponentFixture<FormCategoryEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FormCategoryEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormCategoryEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
