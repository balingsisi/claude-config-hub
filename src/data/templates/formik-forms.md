# Formik Form Management Template

## Tech Stack
- formik v2.x
- yup v1.x (validation)
- React 18+
- TypeScript 5+

## Project Structure
```
src/
├── components/
│   ├── forms/
│   │   ├── ContactForm.tsx
│   │   ├── LoginForm.tsx
│   │   └── RegistrationForm.tsx
│   └── fields/
│       ├── InputField.tsx
│       ├── SelectField.tsx
│       └── CheckboxField.tsx
├── schemas/
│   └── validationSchemas.ts
└── App.tsx
```

## Core Patterns

### Basic Form
```typescript
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const loginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(8, 'Too short').required('Required'),
});

export const LoginForm: React.FC = () => {
  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={loginSchema}
      onSubmit={(values) => {
        console.log(values);
      }}
    >
      {({ isSubmitting }) => (
        <Form>
          <Field type="email" name="email" />
          <ErrorMessage name="email" component="div" />

          <Field type="password" name="password" />
          <ErrorMessage name="password" component="div" />

          <button type="submit" disabled={isSubmitting}>
            Submit
          </button>
        </Form>
      )}
    </Formik>
  );
};
```

### Custom Input Field
```typescript
interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, ...props }) => {
  const [field, meta] = useField(props);

  return (
    <div>
      <label htmlFor={props.name}>{label}</label>
      <input {...field} {...props} />
      {meta.touched && meta.error && (
        <div className="error">{meta.error}</div>
      )}
    </div>
  );
};
```

## Common Commands

```bash
npm install formik yup
npm run dev
```

## Related Resources
- [Formik Documentation](https://formik.org/)
- [Yup Validation](https://github.com/jquense/yup)
