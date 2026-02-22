import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TESTS } from './tests';

describe('TESTS', () => {
  let component: TESTS;
  let fixture: ComponentFixture<TESTS>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TESTS]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TESTS);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
