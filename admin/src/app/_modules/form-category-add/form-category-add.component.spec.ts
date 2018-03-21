import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCategoryAddComponent } from './form-category-add.component';

describe('FormCategoryAddComponent', () => {
  let component: FormCategoryAddComponent;
  let fixture: ComponentFixture<FormCategoryAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FormCategoryAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormCategoryAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
