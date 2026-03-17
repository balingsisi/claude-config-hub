# Serverless AWS 模板

## 技术栈

- **框架**: AWS Serverless Application Model (SAM) / Serverless Framework
- **运行时**: Node.js 20.x / Python 3.11 / Go 1.21
- **API**: API Gateway + Lambda
- **数据库**: DynamoDB / Aurora Serverless
- **存储**: S3
- **队列**: SQS / SNS
- **缓存**: ElastiCache (Redis)
- **监控**: CloudWatch / X-Ray
- **IaC**: AWS SAM / CloudFormation / Terraform

## 项目结构

```
serverless-aws/
├── src/                       # Lambda 函数源码
│   ├── functions/            # Lambda 函数
│   │   ├── api/             # API handlers
│   │   │   ├── users/
│   │   │   │   ├── get.ts
│   │   │   │   ├── create.ts
│   │   │   │   └── update.ts
│   │   │   └── products/
│   │   ├── triggers/        # 事件触发器
│   │   │   ├── s3-processor.ts
│   │   │   ├── sqs-worker.ts
│   │   │   └── scheduled.ts
│   │   └── authorizers/     # 授权器
│   │       └── jwt-auth.ts
│   ├── layers/              # Lambda Layers
│   │   ├── common/          # 共享代码
│   │   │   ├── utils/
│   │   │   ├── middleware/
│   │   │   └── types/
│   │   └── nodejs/          # Node.js 依赖
│   └── lib/                 # 共享库
│       ├── db.ts           # 数据库客户端
│       ├── auth.ts         # 认证逻辑
│       ├── logger.ts       # 日志工具
│       └── response.ts     # 响应格式化
├── infrastructure/          # 基础设施代码
│   ├── sam.yaml            # SAM 模板
│   ├── parameters/         # 环境参数
│   │   ├── dev.yaml
│   │   ├── staging.yaml
│   │   └── prod.yaml
│   └── cdk/                # CDK 代码（可选）
│       ├── stack.ts
│       └── constructs/
├── events/                  # 测试事件
│   ├── api/
│   └── scheduled/
├── tests/                   # 测试
│   ├── unit/
│   └── integration/
├── scripts/                 # 部署脚本
│   ├── deploy.sh
│   └── rollback.sh
├── template.yaml           # SAM 主模板
├── samconfig.toml          # SAM 配置
├── serverless.ts           # Serverless Framework 配置（可选）
├── tsconfig.json
├── package.json
└── README.md
```

## 代码模式

### Lambda 函数处理器

```typescript
// src/functions/api/users/get.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer';
import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpEventNormalizer from '@middy/http-event-normalizer';
import { errorHandler } from '@/lib/middleware/errorHandler';
import { validateRequest } from '@/lib/middleware/validator';

const logger = new Logger({ serviceName: 'getUserFunction' });
const tracer = new Tracer({ serviceName: 'getUserFunction' });

const ddbClient = tracer.captureAWSv3Client(
  DynamoDBDocumentClient.from(new DynamoDBClient({}))
);

const USERS_TABLE = process.env.USERS_TABLE!;

interface GetUserEvent extends APIGatewayProxyEvent {
  pathParameters: {
    userId: string;
  };
}

const getUserHandler = async (
  event: GetUserEvent
): Promise<APIGatewayProxyResult> => {
  const { userId } = event.pathParameters;

  logger.appendKeys({ userId });

  const command = new GetCommand({
    TableName: USERS_TABLE,
    Key: { pk: `USER#${userId}`, sk: 'PROFILE' },
  });

  const result = await ddbClient.send(command);

  if (!result.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'User not found' }),
    };
  }

  logger.info('User retrieved successfully');

  return {
    statusCode: 200,
    body: JSON.stringify({ user: result.Item }),
  };
};

// 使用 middy 中间件
export const handler = middy(getUserHandler)
  .use(httpEventNormalizer())
  .use(
    validateRequest({
      pathParameters: {
        type: 'object',
        properties: {
          userId: { type: 'string', format: 'uuid' },
        },
        required: ['userId'],
      },
    })
  )
  .use(cors())
  .use(errorHandler())
  .handler(captureLambdaHandler);
```

### DynamoDB 单表设计

```typescript
// src/lib/db.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'Database' });

export class Database {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor(tableName: string) {
    const ddbClient = new DynamoDBClient({});
    this.client = DynamoDBDocumentClient.from(ddbClient, {
      marshallOptions: {
        convertEmptyValues: true,
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
      },
    });
    this.tableName = tableName;
  }

  // 用户操作
  async createUser(userId: string, userData: any) {
    const params = {
      TableName: this.tableName,
      Item: {
        pk: `USER#${userId}`,
        sk: 'PROFILE',
        gsi1pk: `EMAIL#${userData.email}`,
        gsi1sk: 'PROFILE',
        entityType: 'USER',
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ConditionExpression: 'attribute_not_exists(pk)',
    };

    await this.client.send(new PutCommand(params));
  }

  async getUser(userId: string) {
    const params = {
      TableName: this.tableName,
      Key: {
        pk: `USER#${userId}`,
        sk: 'PROFILE',
      },
    };

    const result = await this.client.send(new GetCommand(params));
    return result.Item;
  }

  async getUserByEmail(email: string) {
    const params = {
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'gsi1pk = :email AND gsi1sk = :sk',
      ExpressionAttributeValues: {
        ':email': `EMAIL#${email}`,
        ':sk': 'PROFILE',
      },
    };

    const result = await this.client.send(new QueryCommand(params));
    return result.Items?.[0];
  }

  // 订单操作（一对多关系）
  async createOrder(userId: string, orderId: string, orderData: any) {
    const now = new Date().toISOString();

    // 使用事务确保原子性
    const params = {
      TransactItems: [
        {
          Put: {
            TableName: this.tableName,
            Item: {
              pk: `USER#${userId}`,
              sk: `ORDER#${orderId}`,
              gsi1pk: `ORDER#${orderId}`,
              gsi1sk: 'METADATA',
              gsi2pk: `STATUS#${orderData.status}`,
              gsi2sk: `DATE#${now}`,
              entityType: 'ORDER',
              orderId,
              userId,
              ...orderData,
              createdAt: now,
            },
          },
        },
        {
          Update: {
            TableName: this.tableName,
            Key: {
              pk: `USER#${userId}`,
              sk: 'PROFILE',
            },
            UpdateExpression: 'ADD orderCount :inc',
            ExpressionAttributeValues: {
              ':inc': 1,
            },
          },
        },
      ],
    };

    await this.client.send(new TransactWriteCommand(params));
  }

  async getUserOrders(userId: string, limit = 10, lastKey?: any) {
    const params = {
      TableName: this.tableName,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'ORDER#',
      },
      Limit: limit,
      ExclusiveStartKey: lastKey,
      ScanIndexForward: false, // 降序排列
    };

    const result = await this.client.send(new QueryCommand(params));
    return {
      orders: result.Items,
      lastKey: result.LastEvaluatedKey,
    };
  }

  // 分页查询
  async queryWithPagination(
    partitionKey: string,
    options: {
      limit?: number;
      lastKey?: any;
      ascending?: boolean;
    } = {}
  ) {
    const { limit = 20, lastKey, ascending = true } = options;

    const params = {
      TableName: this.tableName,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': partitionKey,
      },
      Limit: limit,
      ExclusiveStartKey: lastKey,
      ScanIndexForward: ascending,
    };

    return this.client.send(new QueryCommand(params));
  }
}

// 单例模式
let dbInstance: Database | null = null;

export const getDatabase = (tableName?: string): Database => {
  if (!dbInstance) {
    dbInstance = new Database(tableName || process.env.TABLE_NAME!);
  }
  return dbInstance;
};
```

### 事件驱动架构

```typescript
// src/functions/triggers/sqs-worker.ts
import { SQSEvent, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const logger = new Logger();
const tracer = new Tracer();
const eventBridge = tracer.captureAWSv3Client(new EventBridgeClient({}));

interface OrderMessage {
  orderId: string;
  userId: string;
  items: any[];
  total: number;
}

export const handler = async (event: SQSEvent, context: Context) => {
  logger.addContext(context);

  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      const message: OrderMessage = JSON.parse(record.body);
      logger.appendKeys({ orderId: message.orderId });

      // 处理订单
      await processOrder(message);

      // 发送事件到 EventBridge
      await eventBridge.send(
        new PutEventsCommand({
          Entries: [
            {
              Source: 'com.myapp.orders',
              DetailType: 'OrderProcessed',
              Detail: JSON.stringify({
                orderId: message.orderId,
                processedAt: new Date().toISOString(),
              }),
              EventBusName: process.env.EVENT_BUS_ARN,
            },
          ],
        })
      );

      logger.info('Order processed successfully');
    } catch (error) {
      logger.error('Failed to process message', { error, record });
      
      // 添加到失败列表，SQS 会重试
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};

async function processOrder(order: OrderMessage) {
  // 业务逻辑
  // 1. 验证库存
  // 2. 处理支付
  // 3. 创建配送订单
}
```

### SAM 模板配置

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Serverless Application

Globals:
  Function:
    Runtime: nodejs20.x
    Timeout: 30
    MemorySize: 256
    Environment:
      Variables:
        TABLE_NAME: !Ref MainTable
        EVENT_BUS_ARN: !Ref EventBus
    Layers:
      - !Ref CommonLayer
    Tracing: Active
    Tags:
      Project: MyApp
      Environment: !Ref Environment

Resources:
  # API Gateway
  ApiGateway:
    Type: AWS::Serverless::Api
    Properties:
      StageName: !Ref Stage
      Cors:
        AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
        AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'"
        AllowOrigin: "'*'"
      Auth:
        DefaultAuthorizer: JwtAuthorizer
        Authorizers:
          JwtAuthorizer:
            FunctionArn: !GetAtt AuthorizerFunction.Arn
            Identity:
              Headers:
                - Authorization

  # DynamoDB 表
  MainTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${AWS::StackName}-MainTable'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: pk
          AttributeType: S
        - AttributeName: sk
          AttributeType: S
        - AttributeName: gsi1pk
          AttributeType: S
        - AttributeName: gsi1sk
          AttributeType: S
        - AttributeName: gsi2pk
          AttributeType: S
        - AttributeName: gsi2sk
          AttributeType: S
      KeySchema:
        - AttributeName: pk
          KeyType: HASH
        - AttributeName: sk
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: GSI1
          KeySchema:
            - AttributeName: gsi1pk
              KeyType: HASH
            - AttributeName: gsi1sk
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
        - IndexName: GSI2
          KeySchema:
            - AttributeName: gsi2pk
              KeyType: HASH
            - AttributeName: gsi2sk
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES

  # Lambda Layer
  CommonLayer:
    Type: AWS::Serverless::LayerVersion
    Properties:
      LayerName: common-layer
      ContentUri: src/layers/common/
      CompatibleRuntimes:
        - nodejs20.x
      RetentionPolicy: Retain

  # API 函数
  GetUserFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/functions/api/users/
      Handler: get.handler
      Events:
        GetUser:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGateway
            Path: /users/{userId}
            Method: GET
      Policies:
        - DynamoDBReadPolicy:
            TableName: !Ref MainTable

  CreateUserFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/functions/api/users/
      Handler: create.handler
      Events:
        CreateUser:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGateway
            Path: /users
            Method: POST
            Auth:
              Authorizer: NONE  # 公开端点
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref MainTable

  # SQS 队列
  OrderQueue:
    Type: AWS::SQS::Queue
    Properties:
      VisibilityTimeout: 120
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt DeadLetterQueue.Arn
        maxReceiveCount: 3

  DeadLetterQueue:
    Type: AWS::SQS::Queue
    Properties:
      MessageRetentionPeriod: 1209600  # 14 天

  # SQS 消费者
  OrderWorkerFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/functions/triggers/
      Handler: sqs-worker.handler
      Events:
        SQSEvent:
          Type: SQS
          Properties:
            Queue: !GetAtt OrderQueue.Arn
            BatchSize: 10
            FunctionResponseTypes:
              - ReportBatchItemFailures
      Policies:
        - EventBridgePutEventsPolicy:
            EventBusName: !Ref EventBus

  # EventBridge 事件总线
  EventBus:
    Type: AWS::Events::EventBus
    Properties:
      Name: !Sub '${AWS::StackName}-events'

  # 定时任务
  ScheduledFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/functions/triggers/
      Handler: scheduled.handler
      Events:
        Schedule:
          Type: Schedule
          Properties:
            Schedule: rate(1 day)
            Enabled: true

  # CloudWatch 告警
  ApiErrorsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-api-errors'
      MetricName: 5XXError
      Namespace: AWS/ApiGateway
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ApiName
          Value: !Ref ApiGateway
      TreatMissingData: notBreaching

Parameters:
  Stage:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - staging
      - prod
  Environment:
    Type: String
    Default: development

Outputs:
  ApiUrl:
    Description: API Gateway URL
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Stage}'
  TableName:
    Description: DynamoDB Table Name
    Value: !Ref MainTable
  EventBusName:
    Description: EventBridge EventBus Name
    Value: !Ref EventBus
```

## 最佳实践

### 1. 冷启动优化

```typescript
// ✅ 在 handler 外部初始化客户端
const ddbClient = new DynamoDBClient({});
const logger = new Logger();

export const handler = async (event: any) => {
  // 使用已初始化的客户端
};

// ✅ 使用 Provisioned Concurrency（生产环境）
// 在 SAM 模板中：
Properties:
  AutoPublishAlias: live
  ProvisionedConcurrencyConfig:
    ProvisionedConcurrentExecutions: 5

// ✅ 最小化依赖
// 只导入必要的模块
import { GetCommand } from '@aws-sdk/lib-dynamodb';  // ✅
// import { DynamoDB } from 'aws-sdk';  // ❌ 整个 SDK

// ✅ 代码分割
// webpack.config.js
module.exports = {
  externals: {
    'aws-sdk': 'commonjs aws-sdk',
  },
  optimization: {
    usedExports: true,
  },
};
```

### 2. 错误处理

```typescript
// src/lib/middleware/errorHandler.ts
import { APIGatewayProxyResult } from 'aws-lambda';
import { HttpError } from 'http-errors';

export const errorHandler = () => ({
  onError: (
    handler: any,
    error: Error
  ): Promise<APIGatewayProxyResult> => {
    logger.error('Handler error', { error });

    // 自定义错误类型
    if (error instanceof ValidationError) {
      return Promise.resolve({
        statusCode: 400,
        body: JSON.stringify({
          error: 'Validation Error',
          message: error.message,
          details: error.details,
        }),
      });
    }

    // HTTP 错误
    if (error instanceof HttpError) {
      return Promise.resolve({
        statusCode: error.statusCode,
        body: JSON.stringify({
          error: error.name,
          message: error.message,
        }),
      });
    }

    // 未知错误
    return Promise.resolve({
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal Server Error',
        requestId: handler.context.awsRequestId,
      }),
    });
  },
});

// 自定义错误类
export class ValidationError extends Error {
  constructor(
    message: string,
    public details: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}
```

### 3. 安全最佳实践

```typescript
// ✅ 使用 IAM 最小权限原则
// SAM 模板中:
Policies:
  - Statement:
      - Effect: Allow
        Action:
          - dynamodb:GetItem
          - dynamodb:Query
        Resource: !Sub '${MainTable.Arn}'
        Condition:
          ForAllValues:StringEquals:
            dynamodb:LeadingKeys:
              - !Sub 'USER#${requestContext.authorizer.claims.sub}'

// ✅ 输入验证
import Joi from 'joi';

const schema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
});

export const validateInput = (data: any) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    throw new ValidationError('Invalid input', error.details);
  }
  return value;
};

// ✅ 敏感数据处理
const sanitizeUser = (user: any) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

// ✅ 使用 Secrets Manager
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const getSecret = async (secretId: string) => {
  const client = new SecretsManagerClient({});
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretId })
  );
  return JSON.parse(response.SecretString!);
};
```

### 4. 监控与日志

```typescript
// 结构化日志
const logger = new Logger({
  logLevel: process.env.LOG_LEVEL || 'INFO',
  serviceName: 'MyFunction',
});

logger.addContext(context); // 自动添加 requestId

logger.info('Processing request', {
  userId: event.requestContext.authorizer.claims.sub,
  action: 'createOrder',
});

// 添加指标
import { Metrics } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'MyApp',
  serviceName: 'MyFunction',
});

metrics.addMetric('OrderCreated', MetricUnits.Count, 1);
metrics.addMetadata('orderId', orderId);

// 分布式追踪
import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer();
const segment = tracer.getSegment();
const subsegment = segment?.addNewSubsegment('processOrder');

try {
  await processOrder();
  subsegment?.addMetadata('success', true);
} catch (error) {
  subsegment?.addError(error);
  throw error;
} finally {
  subsegment?.close();
}
```

## 常用命令

```bash
# SAM CLI 命令

# 初始化项目
sam init

# 本地开发
sam local start-api --port 3000

# 本地调用函数
sam local invoke GetUserFunction -e events/user-get.json

# 本地生成 DynamoDB 数据
sam local generate-event dynamodb update

# 验证模板
sam validate

# 构建项目
sam build

# 部署（引导式）
sam deploy --guided

# 部署（CI/CD）
sam deploy --config-file samconfig.toml --config-env prod

# 查看堆栈输出
sam outputs

# 查看日志
sam logs -n GetUserFunction --stack-name my-stack --tail

# 删除堆栈
sam delete --stack-name my-stack

# Serverless Framework 命令（如果使用）

# 部署
serverless deploy --stage prod

# 部署单个函数
serverless deploy function -f getUser --stage prod

# 查看日志
serverless logs -f getUser --stage prod --tail

# 删除服务
serverless remove --stage prod

# 查看指标
serverless metrics --stage prod
```

## 部署配置

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy Serverless Application

on:
  push:
    branches:
      - main
      - develop

env:
  AWS_REGION: us-east-1
  SAM_CONFIG_FILE: samconfig.toml

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linter
        run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    environment:
      name: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup SAM CLI
        uses: aws-actions/setup-sam@v2
        with:
          use-installer: true
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Build SAM application
        run: sam build --use-container
      
      - name: Deploy to AWS
        run: |
          sam deploy \
            --config-env ${{ github.ref == 'refs/heads/main' && 'prod' || 'staging' }} \
            --no-confirm-changeset \
            --no-fail-on-empty-changeset
      
      - name: Post-deployment tests
        run: npm run test:integration
        env:
          API_URL: ${{ steps.deploy.outputs.ApiUrl }}
```

### 环境配置

```toml
# samconfig.toml
version = 0.1

[default]
[default.global.parameters]
stack_name = "my-app"

[default.build.parameters]
cached = true
parallel = true

[default.deploy.parameters]
capabilities = "CAPABILITY_IAM"
confirm_changeset = true
resolve_s3 = true

[staging]
[staging.deploy.parameters]
stack_name = "my-app-staging"
s3_prefix = "my-app-staging"
region = "us-east-1"
parameter_overrides = [
    "Stage=staging",
    "Environment=staging"
]

[prod]
[prod.deploy.parameters]
stack_name = "my-app-prod"
s3_prefix = "my-app-prod"
region = "us-east-1"
parameter_overrides = [
    "Stage=prod",
    "Environment=production"
]
confirm_changeset = false
```

### 监控仪表板

```yaml
# infrastructure/dashboard.yaml
MonitoringDashboard:
  Type: AWS::CloudWatch::Dashboard
  Properties:
    DashboardName: !Sub '${AWS::StackName}-monitoring'
    DashboardBody: !Sub |
      {
        "widgets": [
          {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
              "metrics": [
                [ "AWS/Lambda", "Duration", "FunctionName", "${GetUserFunction}" ],
                [ ".", "Invocations", ".", "." ],
                [ ".", "Errors", ".", "." ]
              ],
              "period": 300,
              "stat": "Average",
              "region": "${AWS::Region}",
              "title": "Lambda Metrics"
            }
          },
          {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
              "metrics": [
                [ "AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "${MainTable}" ],
                [ ".", "ConsumedWriteCapacityUnits", ".", "." ]
              ],
              "period": 300,
              "stat": "Sum",
              "region": "${AWS::Region}",
              "title": "DynamoDB Metrics"
            }
          }
        ]
      }
```

## 性能优化

### 1. 函数优化

```typescript
// ✅ 连接池复用
import { Agent } from 'https';

const agent = new Agent({
  keepAlive: true,
  maxSockets: 50,
});

const client = new DynamoDBClient({
  maxAttempts: 3,
  requestHandler: new NodeHttpHandler({
    httpsAgent: agent,
  }),
});

// ✅ 批处理
const batchGetItems = async (ids: string[]) => {
  const params = {
    RequestItems: {
      [TABLE_NAME]: {
        Keys: ids.map((id) => ({ pk: `ITEM#${id}`, sk: 'METADATA' })),
      },
    },
  };
  return ddbClient.send(new BatchGetCommand(params));
};

// ✅ 并发控制
import { rateLimit } from 'lambda-rate-limiter';

const limiter = rateLimit({
  rate: 100, // 每秒 100 个请求
  interval: 'second',
});

await limiter.check();
```

### 2. DynamoDB 优化

```typescript
// ✅ 使用 Query 而非 Scan
const params = {
  TableName: TABLE_NAME,
  KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
  ExpressionAttributeValues: {
    ':pk': `USER#${userId}`,
    ':sk': 'ORDER#',
  },
};

// ✅ 投影表达式减少数据传输
const params = {
  TableName: TABLE_NAME,
  Key: { pk, sk },
  ProjectionExpression: 'orderId, #status, createdAt',
  ExpressionAttributeNames: {
    '#status': 'status', // status 是保留字
  },
};

// ✅ 批量写入
const batchWrite = async (items: any[]) => {
  const chunks = _.chunk(items, 25); // DynamoDB 限制 25 个
  
  await Promise.all(
    chunks.map((chunk) => {
      const params = {
        RequestItems: {
          [TABLE_NAME]: chunk.map((item) => ({
            PutRequest: { Item: item },
          })),
        },
      };
      return ddbClient.send(new BatchWriteCommand(params));
    })
  );
};
```

## 参考资源

- [AWS SAM 官方文档](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [Serverless Framework](https://www.serverless.com/)
- [AWS Lambda 最佳实践](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB 设计模式](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Lambda PowerTools](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/)
