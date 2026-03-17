# AJV JSON Schema Validation - Project Context

## Build & Test Commands
- `npm test` - Run all tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run build` - Build the project
- `npm run benchmark` - Run performance benchmarks

## Code Style & Conventions
- TypeScript with strict mode enabled
- Use JSON Schema draft-07/2019-09/2020-12 specifications
- Async/await patterns for asynchronous validation
- Clear error messages with meaningful error objects
- Modular schema organization with $ref references
- Avoid circular references when possible

## Architecture & Structure
```
src/
├── schemas/          # JSON Schema definitions
│   ├── common/       # Reusable schema components
│   ├── entities/     # Entity-specific schemas
│   └── index.ts      # Schema registry
├── validators/       # Compiled AJV validators
├── middleware/       # Validation middleware for frameworks
├── utils/            # Helper functions
└── types/            # TypeScript type definitions
```

## Key Libraries
- `ajv` - Core validation library
- `ajv-formats` - String format validation (email, uri, date, etc.)
- `ajv-errors` - Custom error messages
- `ajv-keywords` - Custom keywords
- `@types/json-schema` - TypeScript types for JSON Schema

## Best Practices
- Pre-compile schemas for production use
- Use `$async` for asynchronous validation
- Implement custom keywords for domain-specific validation
- Cache compiled validators to avoid recompilation
- Use `allErrors: true` during development, `false` in production
- Leverage `$data` for dynamic validation
- Generate TypeScript types from JSON Schema using `json-schema-to-ts`

## Common Patterns

### Schema Organization
```typescript
// schemas/common/address.json
{
  "$id": "common/address",
  "type": "object",
  "properties": {
    "street": { "type": "string" },
    "city": { "type": "string" },
    "zipCode": { "type": "string", "pattern": "^\\d{5}$" }
  },
  "required": ["street", "city", "zipCode"]
}

// schemas/entities/user.json
{
  "$id": "entities/user",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string", "minLength": 1 },
    "email": { "type": "string", "format": "email" },
    "address": { "$ref": "common/address" }
  },
  "required": ["id", "name", "email"]
}
```

### Validator Setup
```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';

const ajv = new Ajv({
  allErrors: true,
  useDefaults: true,
  strict: true,
  $data: true
});

addFormats(ajv);
addErrors(ajv);

// Compile schemas
const validateUser = ajv.compile(userSchema);
```

### Validation Middleware
```typescript
import { Request, Response, NextFunction } from 'express';

export function validateBody(schema: object) {
  const validate = ajv.compile(schema);
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (!validate(req.body)) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validate.errors
      });
    }
    next();
  };
}
```

## Performance Optimization
- Use `ajv.compile()` once at startup, not on every request
- Enable `code: { source: true }` for faster compilation
- Use `passContext: true` to pass context to custom keywords
- Consider `ajv8` for better performance over `ajv6`
- Avoid `allErrors: true` in production (stops at first error)

## Error Handling
- Return structured error objects with `errors` array
- Include `instancePath`, `schemaPath`, `message`, `params`
- Use `ajv-errors` for custom error messages
- Map error paths to user-friendly field names
- Log validation errors for debugging

## Testing Strategy
- Test all schemas with valid and invalid data
- Cover edge cases (null, undefined, empty strings)
- Test custom keywords and formats
- Verify error messages are user-friendly
- Benchmark validation performance for large schemas
