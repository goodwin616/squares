import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GridComponent } from './grid';
import { GameService } from '../../services/game';
import { AuthService } from '../../services/auth';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

describe('GridComponent', () => {
  let component: GridComponent;
  let fixture: ComponentFixture<GridComponent>;

  const mockGameService = {
    getUsers: () => of([]),
  };

  const mockAuthService = {
    user$: of(null),
  };

  const mockDialog = {};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GridComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GridComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
