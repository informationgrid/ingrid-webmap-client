import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LayerItemWmsComponent } from './layer-item-wms.component';

describe('LayerItemWmsComponent', () => {
  let component: LayerItemWmsComponent;
  let fixture: ComponentFixture<LayerItemWmsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LayerItemWmsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LayerItemWmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
