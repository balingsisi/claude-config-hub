# Cypress Component Testing Template

## Tech Stack
- cypress v13.x
- @cypress/react v8.x
- React 18+
- TypeScript 5+

## Project Structure
```
src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       └── Button.cy.tsx
└── cypress/
    ├── support/
    │   └── component.ts
    └── tsconfig.json
```

## Core Patterns

### Component Test
```typescript
// Button.cy.tsx
import { Button } from './Button';

describe('Button', () => {
  it('renders the button with text', () => {
    cy.mount(<Button>Click me</Button>);
    cy.get('button').should('contain.text', 'Click me');
  });

  it('handles click events', () => {
    const onClick = cy.stub().as('onClick');
    cy.mount(<Button onClick={onClick}>Click me</Button>);
    cy.get('button').click();
    cy.get('@onClick').should('have.been.calledOnce');
  });

  it('applies variant styles', () => {
    cy.mount(<Button variant="primary">Primary</Button>);
    cy.get('button').should('have.class', 'btn-primary');
  });
});
```

### Cypress Configuration
```typescript
// cypress/support/component.ts
import { mount } from 'cypress/react18';
import './commands';

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add('mount', mount);
```

## Common Commands

```bash
npm install -D cypress @cypress/react @cypress/webpack-dev-server
npx cypress open-ct
npx cypress run-ct
```

## Related Resources
- [Cypress Documentation](https://docs.cypress.io/)
- [Component Testing](https://docs.cypress.io/guides/component-testing/overview)
