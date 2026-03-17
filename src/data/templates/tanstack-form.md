# TanStack Form - Headless Form Management

## Overview

TanStack Form (formerly React Form) is a comprehensive, headless form management library for React that provides powerful form state management, validation, and submission handling with excellent TypeScript support.

## Key Features

- **Headless**: No UI components, complete control over rendering
- **Type-Safe**: Full TypeScript support with inference
- **Validation**: Built-in validation with multiple strategies
- **Field Arrays**: Dynamic form fields
- **Async Validation**: Asynchronous field validation
- **Form State**: Comprehensive form and field state tracking
- **Framework Agnostic Core**: Works with React, Vue, Solid, and more

## Project Structure

```
tanstack-form-project/
├── src/
│   ├── components/
│   │   ├── forms/
│   │   │   ├── TextField.tsx
│   │   │   ├── SelectField.tsx
│   │   │   ├── CheckboxField.tsx
│   │   │   └── FormError.tsx
│   │   ├── UserForm.tsx
│   │   └── RegistrationForm.tsx
│   ├── hooks/
│   │   └── useFieldProps.ts
│   ├── utils/
│   │   └── validation.ts
│   └── App.tsx
├── package.json
└── tsconfig.json
```

## Installation

```bash
# React
npm install @tanstack/react-form

# For validation (optional)
npm install zod
npm install @tanstack/zod-form-adapter

# Or with Yup
npm install yup
npm install @tanstack/yup-form-adapter
```

## Basic Usage

### Simple Form

```typescript
// src/components/RegistrationForm.tsx
import { useForm } from '@tanstack/react-form'
import { zodResolver } from '@tanstack/zod-form-adapter'
import { z } from 'zod'

const registrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export function RegistrationForm() {
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    resolver: zodResolver(registrationSchema),
    onSubmit: async (values) => {
      // Handle form submission
      console.log('Form submitted:', values)
      await fetch('/api/register', {
        method: 'POST',
        body: JSON.stringify(values),
      })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <form.Field name="email">
        {(field) => (
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.length > 0 && (
              <span className="error">{field.state.meta.errors[0]}</span>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.length > 0 && (
              <span className="error">{field.state.meta.errors[0]}</span>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="confirmPassword">
        {(field) => (
          <div>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.length > 0 && (
              <span className="error">{field.state.meta.errors[0]}</span>
            )}
          </div>
        )}
      </form.Field>

      <button type="submit" disabled={form.state.isSubmitting}>
        {form.state.isSubmitting ? 'Submitting...' : 'Register'}
      </button>
    </form>
  )
}
```

## Reusable Field Components

### TextField Component

```typescript
// src/components/forms/TextField.tsx
import { useField } from '@tanstack/react-form'
import { FormEvent } from 'react'

interface TextFieldProps {
  form: any
  name: string
  label: string
  type?: string
  placeholder?: string
  required?: boolean
}

export function TextField({
  form,
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
}: TextFieldProps) {
  const field = useField(form, name)

  return (
    <div className="form-field">
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={field.state.value}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={(e: FormEvent<HTMLInputElement>) =>
          field.handleChange(e.currentTarget.value)
        }
        className={field.state.meta.errors.length > 0 ? 'error' : ''}
      />
      {field.state.meta.errors.length > 0 && (
        <div className="field-error">{field.state.meta.errors[0]}</div>
      )}
    </div>
  )
}
```

### SelectField Component

```typescript
// src/components/forms/SelectField.tsx
import { useField } from '@tanstack/react-form'
import { FormEvent } from 'react'

interface Option {
  value: string
  label: string
}

interface SelectFieldProps {
  form: any
  name: string
  label: string
  options: Option[]
  placeholder?: string
  required?: boolean
}

export function SelectField({
  form,
  name,
  label,
  options,
  placeholder,
  required = false,
}: SelectFieldProps) {
  const field = useField(form, name)

  return (
    <div className="form-field">
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e: FormEvent<HTMLSelectElement>) =>
          field.handleChange(e.currentTarget.value)
        }
        className={field.state.meta.errors.length > 0 ? 'error' : ''}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {field.state.meta.errors.length > 0 && (
        <div className="field-error">{field.state.meta.errors[0]}</div>
      )}
    </div>
  )
}
```

### Using Field Components

```typescript
// src/components/UserForm.tsx
import { useForm } from '@tanstack/react-form'
import { TextField } from './forms/TextField'
import { SelectField } from './forms/SelectField'

export function UserForm() {
  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      country: '',
      bio: '',
    },
    onSubmit: async (values) => {
      console.log('Submitting:', values)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <TextField
        form={form}
        name="firstName"
        label="First Name"
        required
      />

      <TextField
        form={form}
        name="lastName"
        label="Last Name"
        required
      />

      <TextField
        form={form}
        name="email"
        label="Email"
        type="email"
        required
      />

      <SelectField
        form={form}
        name="country"
        label="Country"
        placeholder="Select a country"
        options={[
          { value: 'us', label: 'United States' },
          { value: 'uk', label: 'United Kingdom' },
          { value: 'ca', label: 'Canada' },
          { value: 'au', label: 'Australia' },
        ]}
        required
      />

      <TextField
        form={form}
        name="bio"
        label="Bio"
        placeholder="Tell us about yourself"
      />

      <button type="submit">Submit</button>
    </form>
  )
}
```

## Advanced Features

### Field Arrays (Dynamic Fields)

```typescript
// src/components/DynamicFieldsForm.tsx
import { useForm } from '@tanstack/react-form'

export function DynamicFieldsForm() {
  const form = useForm({
    defaultValues: {
      contacts: [{ name: '', email: '', phone: '' }],
    },
    onSubmit: async (values) => {
      console.log('Submitting:', values)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <form.FieldArray name="contacts">
        {(fieldArray) => (
          <div>
            {fieldArray.state.value.map((_, i) => (
              <div key={i} className="contact-group">
                <form.Field name={`contacts[${i}].name`}>
                  {(field) => (
                    <input
                      placeholder="Name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  )}
                </form.Field>

                <form.Field name={`contacts[${i}].email`}>
                  {(field) => (
                    <input
                      placeholder="Email"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  )}
                </form.Field>

                <button
                  type="button"
                  onClick={() => fieldArray.remove(i)}
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                fieldArray.push({ name: '', email: '', phone: '' })
              }
            >
              Add Contact
            </button>
          </div>
        )}
      </form.FieldArray>

      <button type="submit">Submit</button>
    </form>
  )
}
```

### Async Validation

```typescript
// src/components/AsyncValidationForm.tsx
import { useForm } from '@tanstack/react-form'

export function AsyncValidationForm() {
  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
    },
    onSubmit: async (values) => {
      console.log('Submitting:', values)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <form.Field
        name="username"
        validators={{
          onChangeAsync: async ({ value }) => {
            // Simulate async check
            await new Promise((resolve) => setTimeout(resolve, 500))
            
            // Check if username is taken
            const response = await fetch(`/api/check-username/${value}`)
            const { available } = await response.json()
            
            if (!available) {
              return 'Username is already taken'
            }
            
            return undefined
          },
        }}
      >
        {(field) => (
          <div>
            <input
              placeholder="Username"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.isValidating && <span>Checking...</span>}
            {field.state.meta.errors.length > 0 && (
              <span className="error">{field.state.meta.errors[0]}</span>
            )}
          </div>
        )}
      </form.Field>

      <button type="submit">Submit</button>
    </form>
  )
}
```

### Custom Validation

```typescript
// src/utils/validation.ts
import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

export const userSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  confirmPassword: z.string(),
  age: z.number().min(18, 'Must be at least 18 years old'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
```

### Form State and Submission

```typescript
export function AdvancedForm() {
  const form = useForm({
    defaultValues: {
      // ... fields
    },
    onSubmit: async (values, form) => {
      try {
        // Submit data
        const response = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })

        if (!response.ok) {
          throw new Error('Submission failed')
        }

        // Reset form on success
        form.reset()
        
        // Show success message
        alert('Form submitted successfully!')
      } catch (error) {
        // Handle error
        console.error('Submission error:', error)
        alert('Failed to submit form')
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      {/* Form fields */}

      <button
        type="submit"
        disabled={
          form.state.isSubmitting ||
          !form.state.isValid ||
          !form.state.isDirty
        }
      >
        {form.state.isSubmitting ? 'Submitting...' : 'Submit'}
      </button>

      <button
        type="button"
        onClick={() => form.reset()}
        disabled={!form.state.isDirty}
      >
        Reset
      </button>
    </form>
  )
}
```

## Form State Properties

```typescript
// Available form state properties
form.state = {
  values: { /* current form values */ },
  errors: { /* form-level errors */ },
  isSubmitting: false, // Form is being submitted
  isSubmitted: false, // Form has been submitted
  isValid: true, // Form has no errors
  isDirty: false, // Form values have changed
  isTouched: false, // Any field has been touched
  submitCount: 0, // Number of submissions
}

// Field state properties
field.state = {
  value: '', // Current field value
  error: undefined, // Field error
  isTouched: false, // Field has been touched
  isDirty: false, // Field value has changed
  isValid: true, // Field has no errors
  isValidating: false, // Field is being validated
}
```

## Integration with UI Libraries

### Material-UI

```typescript
import { TextField as MuiTextField } from '@mui/material'
import { useField } from '@tanstack/react-form'

function MuiTextField({ form, name, label, ...props }) {
  const field = useField(form, name)

  return (
    <MuiTextField
      {...props}
      label={label}
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
      error={field.state.meta.errors.length > 0}
      helperText={field.state.meta.errors[0] || ''}
    />
  )
}
```

### Chakra UI

```typescript
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
} from '@chakra-ui/react'
import { useField } from '@tanstack/react-form'

function ChakraInput({ form, name, label, ...props }) {
  const field = useField(form, name)

  return (
    <FormControl
      isInvalid={field.state.meta.errors.length > 0}
    >
      <FormLabel>{label}</FormLabel>
      <Input
        {...props}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />
      <FormErrorMessage>
        {field.state.meta.errors[0]}
      </FormErrorMessage>
    </FormControl>
  )
}
```

## Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RegistrationForm } from './RegistrationForm'

describe('RegistrationForm', () => {
  it('should submit form with valid data', async () => {
    const onSubmit = jest.fn()
    render(<RegistrationForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })

    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    })

    fireEvent.click(screen.getByText(/register/i))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      })
    })
  })

  it('should show validation errors', async () => {
    render(<RegistrationForm />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' },
    })

    fireEvent.blur(screen.getByLabelText(/email/i))

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
  })
})
```

## Best Practices

1. **Reusable Components**: Create reusable field components
2. **Schema Validation**: Use Zod/Yup for complex validation
3. **Type Safety**: Leverage TypeScript for form types
4. **Error Handling**: Provide clear error messages
5. **Loading States**: Show loading indicators during submission
6. **Accessibility**: Ensure proper labels and ARIA attributes
7. **Performance**: Memoize expensive validators

## Resources

- [Official Documentation](https://tanstack.com/form)
- [GitHub Repository](https://github.com/TanStack/form)
- [Examples](https://github.com/TanStack/form/tree/main/examples)
- [Validation Adapters](https://tanstack.com/form/docs/overview#validation)

## Summary

TanStack Form provides a powerful, headless form management solution with excellent TypeScript support. Its flexibility allows you to build forms with any UI library while maintaining full control over form state, validation, and submission handling.
