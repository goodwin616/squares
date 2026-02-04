import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameWizardComponent} from './game-wizard';

describe('GameWizard', () => {
  let component: GameWizardComponent;
  let fixture: ComponentFixture<GameWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameWizardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameWizardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
