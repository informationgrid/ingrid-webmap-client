import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LayerItemComponent } from './layer-item.component';

describe('LayerItemComponent', () => {
  let component: LayerItemComponent;
  let fixture: ComponentFixture<LayerItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LayerItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LayerItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
