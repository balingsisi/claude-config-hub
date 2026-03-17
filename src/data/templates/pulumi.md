# Pulumi Infrastructure as Code

## 技术栈

- **Pulumi**: 现代基础设施即代码平台
- **TypeScript/Python/Go/C#**: 支持多种编程语言
- **Pulumi Cloud**: 状态管理和协作平台
- **Pulumi CLI**: 命令行工具
- **Provider**: AWS/Azure/GCP/Kubernetes等

## 项目结构

```
pulumi-project/
├── src/
│   ├── index.ts             # 主入口
│   ├── config.ts            # 配置管理
│   ├── vpc.ts               # VPC资源
│   ├── ecs.ts               # ECS集群
│   ├── rds.ts               # 数据库
│   ├── s3.ts                # 存储桶
│   └── lambda.ts            # Lambda函数
├── environments/
│   ├── dev/
│   │   └── Pulumi.dev.yaml
│   ├── staging/
│   │   └── Pulumi.staging.yaml
│   └── prod/
│       └── Pulumi.prod.yaml
├── Pulumi.yaml              # 项目配置
├── package.json
├── tsconfig.json
└── .gitignore
```

## 代码模式

### 项目配置

```yaml
# Pulumi.yaml
name: my-aws-infrastructure
runtime: nodejs
description: AWS infrastructure with Pulumi
main: src/index.ts

# 环境配置
config:
  pulumi:tags:
    value:
      Environment: ${PUlUMI_STACK}
```

### 基础资源创建

```typescript
// src/index.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const config = new pulumi.Config();
const environment = pulumi.getStack();

// VPC
const vpc = new awsx.ec2.Vpc("main-vpc", {
  cidrBlock: "10.0.0.0/16",
  subnetSpecs: [
    { type: "Public", name: "public" },
    { type: "Private", name: "private" },
  ],
  tags: {
    Environment: environment,
    Project: "my-app",
  },
});

// S3 Bucket
const bucket = new aws.s3.Bucket("data-bucket", {
  versioning: {
    enabled: true,
  },
  serverSideEncryptionConfiguration: {
    rule: {
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: "AES256",
      },
    },
  },
  tags: {
    Environment: environment,
  },
});

// 导出
export const bucketName = bucket.bucket;
export const vpcId = vpc.vpcId;
```

### 配置管理

```typescript
// src/config.ts
import * as pulumi from "@pulumi/pulumi";

export interface EnvironmentConfig {
  instanceType: string;
  minSize: number;
  maxSize: number;
  dbInstanceClass: string;
}

const config = new pulumi.Config();

export const getConfig = (): EnvironmentConfig => {
  const stack = pulumi.getStack();
  
  const configs: Record<string, EnvironmentConfig> = {
    dev: {
      instanceType: "t3.micro",
      minSize: 1,
      maxSize: 2,
      dbInstanceClass: "db.t3.micro",
    },
    staging: {
      instanceType: "t3.small",
      minSize: 2,
      maxSize: 4,
      dbInstanceClass: "db.t3.small",
    },
    prod: {
      instanceType: "t3.medium",
      minSize: 3,
      maxSize: 10,
      dbInstanceClass: "db.r5.large",
    },
  };

  return configs[stack] || configs.dev;
};

// 使用Secret
export const dbPassword = config.requireSecret("dbPassword");
```

### ECS服务

```typescript
// src/ecs.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

export function createECSService(
  name: string,
  vpc: awsx.ec2.Vpc,
  cluster: aws.ecs.Cluster,
  image: string,
  environment: string
) {
  // Task Definition
  const taskDefinition = new aws.ecs.TaskDefinition(`${name}-task`, {
    family: `${name}-task`,
    cpu: "256",
    memory: "512",
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    containerDefinitions: pulumi.jsonStringify([
      {
        name: "app",
        image: image,
        essential: true,
        portMappings: [
          {
            containerPort: 80,
            protocol: "tcp",
          },
        ],
        environment: [
          { name: "ENVIRONMENT", value: environment },
        ],
        logConfiguration: {
          logDriver: "awslogs",
          options: {
            "awslogs-group": `/ecs/${name}`,
            "awslogs-region": "us-east-1",
            "awslogs-stream-prefix": "ecs",
          },
        },
      },
    ]),
  });

  // Security Group
  const sg = new aws.ec2.SecurityGroup(`${name}-sg`, {
    vpcId: vpc.vpcId,
    ingress: [
      {
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
    egress: [
      {
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
  });

  // Service
  const service = new aws.ecs.Service(`${name}-service`, {
    cluster: cluster.arn,
    desiredCount: 2,
    launchType: "FARGATE",
    taskDefinition: taskDefinition.arn,
    networkConfiguration: {
      subnets: vpc.publicSubnetIds,
      assignPublicIp: true,
      securityGroups: [sg.id],
    },
    loadBalancers: [{
      targetGroupArn: targetGroup.arn,
      containerName: "app",
      containerPort: 80,
    }],
  });

  return { taskDefinition, service };
}
```

### RDS数据库

```typescript
// src/rds.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export function createRDS(
  name: string,
  vpcId: string,
  subnetIds: string[],
  instanceClass: string,
  password: pulumi.Output<string>
) {
  // Subnet Group
  const subnetGroup = new aws.rds.SubnetGroup(`${name}-subnet-group`, {
    subnetIds: subnetIds,
    tags: {
      Name: `${name}-subnet-group`,
    },
  });

  // Security Group
  const sg = new aws.ec2.SecurityGroup(`${name}-db-sg`, {
    vpcId: vpcId,
    ingress: [
      {
        protocol: "tcp",
        fromPort: 5432,
        toPort: 5432,
        cidrBlocks: ["10.0.0.0/16"],
      },
    ],
  });

  // Parameter Group
  const parameterGroup = new aws.rds.ParameterGroup(`${name}-params`, {
    family: "postgres15",
    description: `${name} parameter group`,
    parameters: [
      {
        name: "log_connections",
        value: "1",
      },
    ],
  });

  // RDS Instance
  const db = new aws.rds.Instance(`${name}-db`, {
    engine: "postgres",
    engineVersion: "15.4",
    instanceClass: instanceClass,
    allocatedStorage: 20,
    maxAllocatedStorage: 100,
    storageType: "gp3",
    dbName: "myapp",
    username: "admin",
    password: password,
    dbSubnetGroupName: subnetGroup.name,
    vpcSecurityGroupIds: [sg.id],
    parameterGroupName: parameterGroup.name,
    skipFinalSnapshot: true,
    backupRetentionPeriod: 7,
    performanceInsightsEnabled: true,
    tags: {
      Name: `${name}-db`,
    },
  });

  return {
    db,
    endpoint: db.endpoint,
    dbName: db.dbName,
  };
}
```

### Lambda函数

```typescript
// src/lambda.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

export function createLambdaFunction(
  name: string,
  handler: string,
  sourcePath: string,
  environment: Record<string, string> = {}
) {
  // IAM Role
  const role = new aws.iam.Role(`${name}-role`, {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
      Service: "lambda.amazonaws.com",
    }),
  });

  // Policy Attachment
  new aws.iam.RolePolicyAttachment(`${name}-basic`, {
    role: role,
    policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
  });

  // Function
  const func = new aws.lambda.Function(`${name}-function`, {
    runtime: "nodejs20.x",
    code: new pulumi.asset.AssetArchive({
      ".": new pulumi.asset.FileArchive(sourcePath),
    }),
    handler: handler,
    role: role.arn,
    timeout: 30,
    memorySize: 256,
    environment: {
      variables: environment,
    },
  });

  return func;
}

// API Gateway触发器
export function createAPIGateway(name: string, lambda: aws.lambda.Function) {
  const api = new aws.apigateway.RestApi(`${name}-api`, {
    description: `API Gateway for ${name}`,
  });

  const resource = new aws.apigateway.Resource(`${name}-resource`, {
    restApi: api.id,
    parentId: api.rootResourceId,
    pathPart: "{proxy+}",
  });

  const method = new aws.apigateway.Method(`${name}-method`, {
    restApi: api.id,
    resourceId: resource.id,
    httpMethod: "ANY",
    authorization: "NONE",
  });

  const integration = new aws.apigateway.Integration(`${name}-integration`, {
    restApi: api.id,
    resourceId: resource.id,
    httpMethod: method.httpMethod,
    integrationHttpMethod: "POST",
    type: "AWS_PROXY",
    uri: lambda.invokeArn,
  });

  const permission = new aws.lambda.Permission(`${name}-permission`, {
    action: "lambda:InvokeFunction",
    function: lambda.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
  });

  const deployment = new aws.apigateway.Deployment(`${name}-deployment`, {
    restApi: api.id,
  }, { dependsOn: [integration] });

  const stage = new aws.apigateway.Stage(`${name}-stage`, {
    restApi: api.id,
    deployment: deployment.id,
    stageName: "v1",
  });

  return {
    api,
    stage,
    url: stage.invokeUrl,
  };
}
```

### Kubernetes资源

```typescript
// src/kubernetes.ts
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export function createK8sDeployment(
  name: string,
  namespace: string,
  image: string,
  replicas: number
) {
  // Namespace
  const ns = new k8s.core.v1.Namespace(name, {
    metadata: { name: namespace },
  });

  // Deployment
  const deployment = new k8s.apps.v1.Deployment(`${name}-deploy`, {
    metadata: {
      name: name,
      namespace: ns.metadata.name,
    },
    spec: {
      replicas: replicas,
      selector: {
        matchLabels: { app: name },
      },
      template: {
        metadata: {
          labels: { app: name },
        },
        spec: {
          containers: [{
            name: name,
            image: image,
            ports: [{ containerPort: 80 }],
            resources: {
              requests: {
                memory: "128Mi",
                cpu: "100m",
              },
              limits: {
                memory: "512Mi",
                cpu: "500m",
              },
            },
            livenessProbe: {
              httpGet: {
                path: "/health",
                port: 80,
              },
              initialDelaySeconds: 30,
              periodSeconds: 10,
            },
          }],
        },
      },
    },
  });

  // Service
  const service = new k8s.core.v1.Service(`${name}-svc`, {
    metadata: {
      name: name,
      namespace: ns.metadata.name,
    },
    spec: {
      selector: { app: name },
      ports: [{
        port: 80,
        targetPort: 80,
      }],
      type: "LoadBalancer",
    },
  });

  return { deployment, service };
}
```

## 最佳实践

### 1. 模块化组织

```typescript
// ✅ 分离关注点
src/
  ├── network/    # VPC, Subnets
  ├── compute/    # EC2, ECS, Lambda
  ├── database/   # RDS, DynamoDB
  └── storage/    # S3, EFS

// ✅ 可复用组件
export class WebApp extends pulumi.ComponentResource {
  constructor(name: string, args: WebAppArgs) {
    super("my:app:WebApp", name, args);
    
    // 创建相关资源
    new S3Bucket(..., { parent: this });
    new ECSCluster(..., { parent: this });
  }
}
```

### 2. 状态管理

```typescript
// 使用Stack Reference共享状态
const prodStack = new pulumi.StackReference("myorg/production");
const vpcId = prodStack.getOutput("vpcId");

// 导出重要值
export const outputs = {
  vpcId: vpc.id,
  bucketName: bucket.bucket,
  dbEndpoint: db.endpoint,
};
```

### 3. Secrets管理

```typescript
// ✅ 使用Pulumi Secrets
const dbPassword = new pulumi.Config().requireSecret("dbPassword");

// ✅ 在资源中使用
new aws.rds.Instance("db", {
  password: dbPassword,  // 自动加密存储
});

// ✅ 创建Secret
const apiKey = pulumi.secret("my-api-key");
```

### 4. 条件创建

```typescript
const config = new pulumi.Config();
const enableMonitoring = config.getBoolean("enableMonitoring") || false;

const dashboard = pulumi.all([enableMonitoring]).apply(([enabled]) => {
  if (enabled) {
    return new aws.cloudwatch.Dashboard("main", {
      dashboardName: "main-dashboard",
    });
  }
  return undefined;
});
```

### 5. 资源依赖

```typescript
// ✅ 显式依赖
const service = new aws.ecs.Service("service", {
  // ...
}, {
  dependsOn: [loadBalancer, listener],
});

// ✅ 使用pulumi.all处理多个依赖
const url = pulumi.all([lb.dnsName, listener.port])
  .apply(([dns, port]) => `http://${dns}:${port}`);
```

## 常用命令

```bash
# 安装
npm install -g pulumi

# 登录
pulumi login

# 新建项目
pulumi new aws-typescript

# 预览变更
pulumi preview

# 部署
pulumi up

# 查看资源
pulumi stack

# 查看输出
pulumi stack output

# 销毁资源
pulumi destroy

# 选择stack
pulumi stack select production

# 配置
pulumi config set aws:region us-east-1
pulumi config set dbPassword --secret

# 导入现有资源
pulumi import aws:s3/bucket:Bucket my-bucket my-bucket-name

# 刷新状态
pulumi refresh
```

## 部署配置

### 多环境配置

```yaml
# Pulumi.dev.yaml
config:
  aws:region: us-east-1
  instanceType: t3.micro
  minSize: 1

# Pulumi.prod.yaml
config:
  aws:region: us-east-1
  instanceType: t3.large
  minSize: 3
  dbPassword:
    secure: AAABANAn...  # 加密的secret
```

### CI/CD集成

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
      
      - uses: pulumi/actions@v5
        with:
          command: up
          stack-name: production
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

### Policy as Code

```typescript
// policy.ts
import { PolicyPack, validateResourceOfType } from "@pulumi/policy";
import * as aws from "@pulumi/aws";

new PolicyPack("aws-best-practices", {
  policies: [
    {
      name: "s3-bucket-versioning",
      description: "S3 buckets must have versioning enabled",
      enforcementLevel: "mandatory",
      validateResource: validateResourceOfType(aws.s3.Bucket, (bucket, args, reportViolation) => {
        if (!bucket.versioning?.enabled) {
          reportViolation("S3 bucket must have versioning enabled");
        }
      }),
    },
    {
      name: "ec2-instance-type",
      description: "EC2 instances must use approved types",
      enforcementLevel: "advisory",
      validateResource: validateResourceOfType(aws.ec2.Instance, (instance, args, reportViolation) => {
        const approvedTypes = ["t3.micro", "t3.small", "t3.medium"];
        if (!approvedTypes.includes(instance.instanceType)) {
          reportViolation(`Instance type ${instance.instanceType} is not approved`);
        }
      }),
    },
  ],
});
```

### Testing

```typescript
// tests/index.test.ts
import * as pulumi from "@pulumi/pulumi";
import * as assert from "assert";

pulumi.runtime.setMocks({
  newResource: (args) => {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:...:${args.name}`,
      },
    };
  },
  call: (args) => {
    return args.inputs;
  },
});

describe("Infrastructure", () => {
  it("should create VPC", async () => {
    const vpc = new aws.ec2.Vpc("test-vpc", {
      cidrBlock: "10.0.0.0/16",
    });

    pulumi.all([vpc.cidrBlock]).apply(([cidr]) => {
      assert.equal(cidr, "10.0.0.0/16");
    });
  });
});
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - preview
  - deploy

pulumi:preview:
  stage: preview
  image: pulumi/pulumi-nodejs
  script:
    - npm ci
    - pulumi preview --stack dev
  only:
    - merge_requests

pulumi:deploy:
  stage: deploy
  image: pulumi/pulumi-nodejs
  script:
    - npm ci
    - pulumi up --stack prod --yes
  only:
    - main
  when: manual
```

### Terraform导入

```bash
# 导入Terraform状态
pulumi import terraform-state.json

# 转换Terraform配置
pulumi convert --from terraform --language typescript
```
