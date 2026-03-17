# SST Serverless Stack Template

## Project Overview

SST (Serverless Stack) is a modern framework for building serverless applications on AWS. It provides a great developer experience with Live Lambda Development, TypeScript-first configuration, and automatic infrastructure management using CDK.

## Tech Stack

- **Core**: SST 2.x / Ion
- **Language**: TypeScript
- **Runtime**: Node.js 20.x
- **Infrastructure**: AWS CDK
- **Database**: DynamoDB / RDS / Aurora
- **Storage**: S3
- **API**: API Gateway / AppSync
- **Auth**: Cognito / JWT
- **Testing**: Vitest, Jest

## Project Structure

```
├── stacks/                       # Infrastructure stacks
│   ├── ApiStack.ts              # API Gateway + Lambda
│   ├── StorageStack.ts          # DynamoDB + S3
│   ├── AuthStack.ts             # Cognito User Pool
│   └── index.ts                 # Stack exports
├── packages/                     # Monorepo packages
│   ├── core/                    # Shared business logic
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── user.ts
│   │   │   │   └── post.ts
│   │   │   ├── utils/
│   │   │   │   ├── response.ts
│   │   │   │   └── validation.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── functions/               # Lambda functions
│   │   ├── src/
│   │   │   ├── lambda/
│   │   │   │   ├── user/
│   │   │   │   │   ├── create.ts
│   │   │   │   │   ├── get.ts
│   │   │   │   │   └── list.ts
│   │   │   │   ├── post/
│   │   │   │   │   ├── create.ts
│   │   │   │   │   └── list.ts
│   │   │   │   └── graphql/
│   │   │   │       └── resolver.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/                # React frontend
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   └── App.tsx
│       ├── package.json
│       └── vite.config.ts
├── sst.config.ts                # SST configuration
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

## Key Patterns

### 1. SST Configuration

```typescript
// sst.config.ts
import { SSTConfig } from 'sst'
import { ApiStack } from './stacks/ApiStack'
import { StorageStack } from './stacks/StorageStack'
import { AuthStack } from './stacks/AuthStack'

export default {
  config(_input) {
    return {
      name: 'my-sst-app',
      region: 'us-east-1',
      profile: 'default',
    }
  },
  stacks(app) {
    app.setDefaultFunctionProps({
      runtime: 'nodejs20.x',
      environment: {
        REGION: app.region,
        TABLE_NAME: 'MyTable',
      },
    })

    app.stack(StorageStack).stack(AuthStack).stack(ApiStack)
  },
} satisfies SSTConfig
```

### 2. API Stack

```typescript
// stacks/ApiStack.ts
import { Api, StackContext, use } from 'sst/constructs'
import { StorageStack } from './StorageStack'
import { AuthStack } from './AuthStack'

export function ApiStack({ stack }: StackContext) {
  const { table } = use(StorageStack)
  const { auth } = use(AuthStack)

  const api = new Api(stack, 'Api', {
    defaults: {
      authorizer: 'iam',
      function: {
        bind: [table],
      },
    },
    routes: {
      'GET    /users': 'packages/functions/src/lambda/user/list.handler',
      'POST   /users': 'packages/functions/src/lambda/user/create.handler',
      'GET    /users/{id}': 'packages/functions/src/lambda/user/get.handler',
      'GET    /posts': 'packages/functions/src/lambda/post/list.handler',
      'POST   /posts': 'packages/functions/src/lambda/post/create.handler',
    },
  })

  api.attachPermissions([table])

  const apiGatewayUrl = api.url

  stack.addOutputs({
    ApiEndpoint: apiGatewayUrl,
  })

  return { api }
}
```

### 3. Storage Stack

```typescript
// stacks/StorageStack.ts
import { Table, Bucket, StackContext } from 'sst/constructs'

export function StorageStack({ stack }: StackContext) {
  const table = new Table(stack, 'Table', {
    fields: {
      pk: 'string',
      sk: 'string',
      gsi1pk: 'string',
      gsi1sk: 'string',
    },
    primaryIndex: { partitionKey: 'pk', sortKey: 'sk' },
    globalIndexes: {
      GSI1: { partitionKey: 'gsi1pk', sortKey: 'gsi1sk' },
    },
  })

  const bucket = new Bucket(stack, 'Bucket', {
    cors: [
      {
        maxAge: 300,
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
        allowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      },
    ],
  })

  return { table, bucket }
}
```

### 4. Auth Stack

```typescript
// stacks/AuthStack.ts
import { Auth, StackContext } from 'sst/constructs'

export function AuthStack({ stack }: StackContext) {
  const auth = new Auth(stack, 'Auth', {
    cognito: {
      userPool: {
        signInAliases: { email: true },
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireDigits: true,
        },
      },
      userPoolClient: {
        authFlows: {
          adminUserPassword: true,
          custom: true,
          userSrp: true,
        },
      },
    },
  })

  stack.addOutputs({
    UserPoolId: auth.cognitoUserPoolId,
    UserPoolClientId: auth.cognitoUserPoolClientId,
  })

  return { auth }
}
```

### 5. Lambda Function

```typescript
// packages/functions/src/lambda/user/create.ts
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { Table } from 'sst/node/table'
import { DynamoDB } from 'aws-sdk'
import { z } from 'zod'
import { createResponse } from '@my-app/core/utils/response'

const dynamoDb = new DynamoDB.DocumentClient()

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
})

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  try {
    const body = JSON.parse(event.body || '{}')
    const { email, name } = CreateUserSchema.parse(body)

    const userId = `USER#${Date.now()}`
    const timestamp = new Date().toISOString()

    const params = {
      TableName: Table.Table.tableName,
      Item: {
        pk: userId,
        sk: 'PROFILE',
        gsi1pk: 'USER',
        gsi1sk: email,
        email,
        name,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    }

    await dynamoDb.put(params).promise()

    return createResponse(201, {
      id: userId,
      email,
      name,
      createdAt: timestamp,
    })
  } catch (error) {
    console.error('Error creating user:', error)

    if (error instanceof z.ZodError) {
      return createResponse(400, { error: 'Validation failed', details: error.errors })
    }

    return createResponse(500, { error: 'Internal server error' })
  }
}
```

### 6. Response Utility

```typescript
// packages/core/src/utils/response.ts
import { APIGatewayProxyResultV2 } from 'aws-lambda'

export function createResponse(
  statusCode: number,
  body: any
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  }
}
```

### 7. DynamoDB Entity Pattern

```typescript
// packages/core/src/db/user.ts
import { DynamoDB } from 'aws-sdk'

const dynamoDb = new DynamoDB.DocumentClient()

export interface User {
  pk: string
  sk: string
  gsi1pk: string
  gsi1sk: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

export class UserRepository {
  constructor(private tableName: string) {}

  async create(user: User): Promise<User> {
    await dynamoDb
      .put({
        TableName: this.tableName,
        Item: user,
        ConditionExpression: 'attribute_not_exists(pk)',
      })
      .promise()

    return user
  }

  async getById(userId: string): Promise<User | null> {
    const result = await dynamoDb
      .get({
        TableName: this.tableName,
        Key: { pk: userId, sk: 'PROFILE' },
      })
      .promise()

    return result.Item as User | null
  }

  async listByEmail(email: string): Promise<User[]> {
    const result = await dynamoDb
      .query({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'gsi1pk = :gsi1pk AND gsi1sk = :email',
        ExpressionAttributeValues: {
          ':gsi1pk': 'USER',
          ':email': email,
        },
      })
      .promise()

    return result.Items as User[]
  }
}
```

### 8. GraphQL Resolver

```typescript
// packages/functions/src/lambda/graphql/resolver.ts
import { AppSyncResolverEvent } from 'aws-lambda'
import { Table } from 'sst/node/table'
import { UserRepository } from '@my-app/core/db/user'

const userRepo = new UserRepository(Table.Table.tableName)

export async function handler(event: AppSyncResolverEvent<any>) {
  switch (event.info.fieldName) {
    case 'getUser':
      return await userRepo.getById(event.arguments.id)

    case 'listUsers':
      // Implementation
      return []

    case 'createUser':
      return await userRepo.create({
        pk: `USER#${Date.now()}`,
        sk: 'PROFILE',
        gsi1pk: 'USER',
        gsi1sk: event.arguments.input.email,
        email: event.arguments.input.email,
        name: event.arguments.input.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

    default:
      throw new Error(`Unknown field: ${event.info.fieldName}`)
  }
}
```

## Best Practices

1. **Monorepo Structure**: Use pnpm workspaces for shared code
2. **Single Table Design**: Use DynamoDB single-table pattern
3. **Environment Variables**: Bind resources using `bind: [table]`
4. **Type Safety**: Use TypeScript and Zod for validation
5. **Error Handling**: Centralized error handling in utilities
6. **Testing**: Unit test with Vitest, integration with real AWS resources
7. **Security**: Use IAM authorizer by default
8. **Logging**: Use structured logging with AWS Lambda Powertools

## Common Commands

```bash
# Development
pnpm dev                    # Start Live Lambda Development
pnpm deploy                 # Deploy to AWS
pnpm deploy --stage prod    # Deploy to production
pnpm remove                 # Remove stack

# Testing
pnpm test                   # Run tests
pnpm test:watch             # Watch mode

# Database
pnpm db:migrate             # Run migrations (if using RDS)
pnpm db:seed                # Seed database

# Build
pnpm build                  # Build all packages
pnpm build:frontend         # Build frontend

# CDK
pnpm cdk diff               # View infrastructure changes
pnpm cdk synth              # Generate CloudFormation template
```

## Local Development

```bash
# Start SST in development mode
pnpm dev

# This will:
# - Deploy a debug stack to AWS
# - Start a local Lambda runner
# - Proxy API Gateway to local functions
# - Enable hot reload for Lambda functions
```

## Deployment

### Production Deployment

```bash
# Deploy to production stage
pnpm deploy --stage prod

# Or use CI/CD
pnpm deploy --stage prod --require-approval never
```

### CI/CD with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to production
        run: pnpm deploy --stage prod --require-approval never
```

## Environment Variables

```typescript
// .env
SST_STAGE=dev
AWS_REGION=us-east-1

// Access in code
import { Config } from 'sst/node/config'

const dbUrl = Config.DATABASE_URL
```

## Monitoring

```typescript
// Use AWS Lambda Powertools for logging
import { Logger } from '@aws-lambda-powertools/logger'

const logger = new Logger()

export async function handler(event: any) {
  logger.info('Processing event', { event })
  // ...
}
```

## Resources

- [SST Documentation](https://sst.dev/)
- [SST Examples](https://github.com/serverless-stack/serverless-stack/tree/master/examples)
- [SST Discord](https://discord.gg/sst)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
