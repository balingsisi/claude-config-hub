# Angular Material - Project Context

## Build & Test Commands
- `ng serve` - Start development server
- `ng build` - Build for production
- `ng test` - Run unit tests with Karma
- `ng e2e` - Run end-to-end tests
- `ng lint` - Lint the codebase
- `ng generate component name` - Generate new component

## Code Style & Conventions
- TypeScript with strict mode
- Use Angular 17+ features (signals, standalone components)
- Material Design 3 theming and components
- Reactive Forms for complex form handling
- RxJS for reactive programming
- Follow Angular style guide
- Use OnPush change detection strategy

## Architecture & Structure
```
src/
├── app/
│   ├── core/              # Core module (singleton services)
│   │   ├── services/      # HTTP, auth, logging
│   │   ├── guards/        # Route guards
│   │   └── interceptors/  # HTTP interceptors
│   ├── features/          # Feature modules
│   │   ├── dashboard/
│   │   ├── users/
│   │   └── products/
│   ├── shared/            # Shared module
│   │   ├── components/    # Reusable components
│   │   ├── directives/    # Custom directives
│   │   └── pipes/         # Custom pipes
│   ├── material/          # Material module
│   │   └── material.module.ts
│   └── layout/            # Layout components
├── assets/                # Static assets
├── environments/          # Environment configs
└── styles/                # Global styles
    ├── _variables.scss
    ├── _theming.scss
    └── styles.scss
```

## Key Libraries
- `@angular/core` - Core Angular framework
- `@angular/material` - Material Design components
- `@angular/cdk` - Component Dev Kit
- `@angular/forms` - Reactive and template-driven forms
- `@angular/router` - Routing and navigation
- `rxjs` - Reactive Extensions for JavaScript
- `@ng-bootstrap/ng-bootstrap` - Bootstrap integration (optional)

## Best Practices
- Use standalone components (Angular 15+)
- Import Material modules in dedicated MaterialModule
- Implement lazy loading for feature modules
- Use Angular signals for state management
- Follow Material Design guidelines
- Customize themes with SCSS
- Use AOT compilation for production
- Implement proper error handling
- Use trackBy in *ngFor for performance
- Leverage Angular CDK for custom components

## Common Patterns

### Material Module Setup
```typescript
// material/material.module.ts
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

@NgModule({
  exports: [
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatInputModule,
    MatSidenavModule,
    MatToolbarModule
  ]
})
export class MaterialModule {}
```

### Custom Theme
```scss
// styles/_theming.scss
@use '@angular/material' as mat;

$my-primary: mat.define-palette(mat.$indigo-palette);
$my-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);
$my-warn: mat.define-palette(mat.$red-palette);

$my-theme: mat.define-light-theme((
  color: (
    primary: $my-primary,
    accent: $my-accent,
    warn: $my-warn
  ),
  typography: mat.define-typography-config(),
  density: 0
));

@include mat.all-component-themes($my-theme);
```

### Reactive Forms with Material
```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-form',
  template: `
    <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
      <mat-form-field appearance="outline">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" type="email">
        <mat-error *ngIf="userForm.get('email')?.hasError('required')">
          Email is required
        </mat-error>
        <mat-error *ngIf="userForm.get('email')?.hasError('email')">
          Invalid email format
        </mat-error>
      </mat-form-field>

      <button mat-raised-button color="primary" type="submit" 
              [disabled]="userForm.invalid">
        Submit
      </button>
    </form>
  `
})
export class UserFormComponent {
  userForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.snackBar.open('Form submitted!', 'Close', { duration: 3000 });
    }
  }
}
```

### Dialog Component
```typescript
// dialog component
@Component({
  template: `
    <h2 mat-dialog-title>Confirm Action</h2>
    <mat-dialog-content>
      Are you sure you want to proceed?
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="true">
        Confirm
      </button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {}

// usage
openDialog() {
  const dialogRef = this.dialog.open(ConfirmDialogComponent);
  
  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // User confirmed
    }
  });
}
```

### Table with Pagination
```typescript
@Component({
  template: `
    <table mat-table [dataSource]="dataSource">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let user">{{ user.name }}</td>
      </ng-container>

      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>Email</th>
        <td mat-cell *matCellDef="let user">{{ user.email }}</td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
    </table>

    <mat-paginator [pageSizeOptions]="[5, 10, 25, 100]"
                   showFirstLastButtons>
    </mat-paginator>
  `
})
export class UserTableComponent implements OnInit {
  displayedColumns = ['name', 'email'];
  dataSource = new MatTableDataSource<User>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() {
    this.loadUsers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }
}
```

## Accessibility
- All Material components are WCAG compliant
- Use aria-labels for icon-only buttons
- Ensure proper focus management
- Test with screen readers
- Use high contrast mode support
- Implement keyboard navigation

## Performance Optimization
- Use OnPush change detection
- Lazy load feature modules
- Preload strategies for routes
- Virtual scrolling for large lists
- TrackBy in ngFor loops
- Production builds with AOT
- Service workers for PWA

## Testing Strategy
- Unit tests with Jasmine/Karma
- Component testing with TestBed
- Material Harness for component testing
- E2E tests with Playwright/Cypress
- Test accessibility with axe-core
- Mock Material modules in tests
