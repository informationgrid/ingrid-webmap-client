import { TestBed, inject } from '@angular/core/testing';

import { MapUtilsService } from './map-utils.service';

describe('MapUtilsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MapUtilsService]
    });
  });

  it('should be created', inject([MapUtilsService], (service: MapUtilsService) => {
    expect(service).toBeTruthy();
  }));
});
