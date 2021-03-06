import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalisationComponent } from './localisation.component';

describe('LocalisationComponent', () => {
  let component: LocalisationComponent;
  let fixture: ComponentFixture<LocalisationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LocalisationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LocalisationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
