import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LayerItemWmtsComponent } from './layer-item-wmts.component';

describe('LayerItemWmtsComponent', () => {
  let component: LayerItemWmtsComponent;
  let fixture: ComponentFixture<LayerItemWmtsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LayerItemWmtsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LayerItemWmtsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
