# Terraform 基础设施即代码模板

## 技术栈

- **Terraform**: >= 1.6.0
- **Provider**: AWS/Azure/GCP
- **Backend**: S3/Azure Blob/GCS
- **State Management**: Terraform Cloud/Remote State
- **Secrets**: Vault/AWS Secrets Manager

## 项目结构

```
terraform-project/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── prod/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       ├── terraform.tfvars
│       └── backend.tf
├── modules/
│   ├── networking/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── compute/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── database/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── security/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── shared/
│   ├── remote_state.tf
│   └── providers.tf
├── .terraform-version
├── .tfsec.yml
├── terraform-docs.yml
└── README.md
```

## 代码模式

### 模块化结构

```hcl
# modules/networking/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-vpc"
    }
  )
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-public-${count.index + 1}"
      Type = "public"
    }
  )
}
```

### 环境配置

```hcl
# environments/dev/main.tf
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "terraform-state-dev"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "dev"
      Project     = var.project_name
      ManagedBy   = "terraform"
    }
  }
}

module "networking" {
  source = "../../modules/networking"

  vpc_cidr           = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  availability_zones  = var.availability_zones
  project_name       = var.project_name
  common_tags        = local.common_tags
}
```

### 变量定义

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "Must be valid CIDR block."
  }
}

variable "environment" {
  description = "Environment name"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}
```

### 输出定义

```hcl
# outputs.tf
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.networking.public_subnet_ids
}

output "security_group_ids" {
  description = "Map of security group IDs"
  value       = module.security.group_ids
}
```

### 远程状态

```hcl
# shared/remote_state.tf
data "terraform_remote_state" "networking" {
  backend = "s3"

  config = {
    bucket = "terraform-state-${var.environment}"
    key    = "${var.environment}/networking/terraform.tfstate"
    region = var.aws_region
  }
}

# 使用远程状态输出
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = var.instance_type
  subnet_id     = data.terraform_remote_state.networking.outputs.public_subnet_ids[0]

  tags = {
    Name = "${var.project_name}-web"
  }
}
```

## 最佳实践

### 1. 模块化设计

```hcl
# 使用可复用模块
module "ecs_cluster" {
  source = "../../modules/ecs-cluster"

  cluster_name = "${var.project_name}-${var.environment}"
  instance_type = var.ecs_instance_type
  min_size     = var.ecs_min_instances
  max_size     = var.ecs_max_instances

  vpc_id     = module.networking.vpc_id
  subnet_ids = module.networking.private_subnet_ids

  tags = local.common_tags
}
```

### 2. 状态管理

```hcl
# 加密状态文件
terraform {
  backend "s3" {
    # ... 其他配置
    encrypt              = true
    kms_key_id          = "alias/terraform-state-key"
    dynamodb_table      = "terraform-locks"
    skip_metadata_api_check = false
  }
}
```

### 3. 安全最佳实践

```hcl
# 使用最小权限
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

# 加密敏感数据
resource "aws_kms_key" "secrets" {
  description             = "KMS key for secrets encryption"
  deletion_window_in_days = 7
  enable_key_rotation    = true
}
```

### 4. 标签策略

```hcl
# 统一标签管理
locals {
  common_tags = {
    Environment  = var.environment
    Project      = var.project_name
    ManagedBy    = "terraform"
    CostCenter   = var.cost_center
    Owner        = var.owner
    CreationDate = timestamp()
  }
}

# 使用 merge 组合标签
resource "aws_instance" "web" {
  # ... 其他配置

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-web-server"
      Role = "webserver"
    }
  )
}
```

### 5. 环境隔离

```hcl
# 每个环境独立工作区
variable "workspace_arns" {
  type = map(string)
  default = {
    dev     = "arn:aws:iam::123456789012:role/TerraformDev"
    staging = "arn:aws:iam::123456789012:role/TerraformStaging"
    prod    = "arn:aws:iam::123456789012:role/TerraformProd"
  }
}

provider "aws" {
  assume_role {
    role_arn = var.workspace_arns[terraform.workspace]
  }
}
```

### 6. 条件创建

```hcl
# 使用 count 条件创建资源
resource "aws_db_instance" "main" {
  count = var.create_database ? 1 : 0

  allocated_storage    = var.db_storage
  engine               = var.db_engine
  engine_version       = var.db_version
  instance_class       = var.db_instance_class
  name                 = var.db_name
  username             = var.db_username
  password             = var.db_password
  db_subnet_group_name = aws_db_subnet_group.main.name

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-database"
  })
}
```

### 7. 生命周期管理

```hcl
# 控制资源更新行为
resource "aws_instance" "web" {
  # ... 其他配置

  lifecycle {
    create_before_destroy = true  # 创建新资源再删除旧资源
    prevent_destroy      = false # 允许销毁（生产环境设为 true）
    ignore_changes       = [ami]  # 忽略 AMI 变更

    precondition {
      condition     = var.instance_type != "t2.micro" || var.environment != "prod"
      error_message = "Production cannot use t2.micro instances."
    }

    postcondition {
      condition     = self.monitoring
      error_message = "Instance must have monitoring enabled."
    }
  }
}
```

## 常用命令

### 初始化和验证

```bash
# 初始化工作目录
terraform init

# 初始化指定后端配置
terraform init -backend-config=backend.hcl

# 验证配置语法
terraform validate

# 格式化代码
terraform fmt
terraform fmt -recursive

# 检查语法并格式化
terraform fmt -check
```

### 规划和应用

```bash
# 生成执行计划
terraform plan

# 保存计划到文件
terraform plan -out=tfplan

# 应用计划
terraform apply

# 应用指定计划文件
terraform apply tfplan

# 自动批准
terraform apply -auto-approve

# 针对特定目标
terraform plan -target=module.networking
terraform apply -target=module.networking
```

### 状态管理

```bash
# 查看当前状态
terraform show

# 列出所有资源
terraform state list

# 查看特定资源
terraform state show aws_vpc.main

# 移动资源
terraform state mv aws_vpc.main aws_vpc.primary

# 删除资源状态
terraform state rm aws_vpc.old

# 导入现有资源
terraform import aws_vpc.imported vpc-12345678

# 刷新状态
terraform refresh
```

### 工作区管理

```bash
# 列出工作区
terraform workspace list

# 创建工作区
terraform workspace new dev

# 切换工作区
terraform workspace select staging

# 删除工作区
terraform workspace delete dev

# 显示当前工作区
terraform workspace show
```

### 输出和验证

```bash
# 查看所有输出
terraform output

# 查看特定输出
terraform output vpc_id

# 输出为 JSON 格式
terraform output -json

# 输出到文件
terraform output -raw kube_config > ~/.kube/config
```

### 销毁和清理

```bash
# 查看销毁计划
terraform plan -destroy

# 销毁所有资源
terraform destroy

# 销毁指定目标
terraform destroy -target=module.compute

# 销毁并自动批准
terraform destroy -auto-approve
```

### 调试和排错

```bash
# 启用详细日志
export TF_LOG=DEBUG
terraform apply

# 设置日志级别
export TF_LOG=TRACE
export TF_LOG_PATH=terraform.log

# 强制解锁状态
terraform force-unlock LOCK_ID

# 重新初始化
terraform init -reconfigure
terraform init -upgrade
```

## 部署配置

### CI/CD 集成

```yaml
# .github/workflows/terraform.yml
name: Terraform CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.6.0
      
      - name: Terraform Init
        run: terraform init
        working-directory: environments/dev
      
      - name: Terraform Format
        run: terraform fmt -check -recursive
      
      - name: Terraform Validate
        run: terraform validate
        working-directory: environments/dev
      
      - name: Terraform Plan
        run: terraform plan -no-color
        working-directory: environments/dev
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  
  apply:
    runs-on: ubuntu-latest
    needs: validate
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
      
      - name: Terraform Init
        run: terraform init
        working-directory: environments/prod
      
      - name: Terraform Apply
        run: terraform apply -auto-approve
        working-directory: environments/prod
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

### Terraform Cloud

```hcl
# 配置 Terraform Cloud
terraform {
  cloud {
    organization = "my-org"

    workspaces {
      name = "my-app-dev"
    }
  }
}

# 使用 Terraform Cloud 后端
terraform {
  backend "remote" {
    organization = "my-org"

    workspaces {
      name = "my-app-prod"
    }
  }
}
```

### 安全扫描

```yaml
# tfsec 配置
# .tfsec.yml
minimum_severity: MEDIUM

exclude:
  - AWS002  # 忽略特定检查

severity_overrides:
  AWS009: HIGH
```

```bash
# 运行 tfsec 扫描
tfsec .

# 输出为 SARIF 格式
tfsec . --format sarif --out tfsec.sarif

# 使用自定义配置
tfsec . --config-file .tfsec.yml
```

### 文档生成

```yaml
# terraform-docs.yml
formatter: markdown table

sections:
  hide:
    - providers

sort:
  by: required

settings:
  indent: 2
  escape: false

output:
  file: README.md
  mode: inject
  template: |-
    <!-- BEGIN_TF_DOCS -->
    {{ .Content }}
    <!-- END_TF_DOCS -->
```

```bash
# 生成文档
terraform-docs .

# 生成并写入文件
terraform-docs . > README.md

# 使用配置文件
terraform-docs --config terraform-docs.yml .
```

### 状态锁定

```hcl
# DynamoDB 状态锁
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name = "Terraform State Locks"
  }
}

# 后端配置
terraform {
  backend "s3" {
    bucket         = "terraform-state"
    key            = "global/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

### 环境变量

```bash
# 设置提供商凭证
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"

# Terraform 变量
export TF_VAR_environment="prod"
export TF_VAR_project_name="my-app"

# Terraform 行为
export TF_IN_AUTOMATION=true
export TF_INPUT=false
export TF_CLI_ARGS="-no-color"

# 日志配置
export TF_LOG=DEBUG
export TF_LOG_PATH=/var/log/terraform.log
```

### 多环境管理

```bash
# 目录结构
environments/
├── dev/
├── staging/
└── prod/

# 部署到不同环境
cd environments/dev && terraform apply
cd environments/staging && terraform apply
cd environments/prod && terraform apply

# 使用 Terragrunt
# terragrunt.hcl
terraform {
  source = "../../modules//networking"
}

inputs = {
  environment = path_relative_to_include()
}
```

### 成本估算

```bash
# 使用 infracost 估算成本
infracost breakdown --path .

# 生成成本报告
infracost breakdown --path . --format html > cost-report.html

# 对比计划变更成本
infracost diff --path tfplan
```

### 资源依赖管理

```hcl
# 显式依赖
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = var.instance_type

  depends_on = [
    aws_vpc.main,
    aws_subnet.public,
    aws_security_group.web
  ]
}

# 隐式依赖（通过引用自动建立）
resource "aws_eip" "web" {
  instance = aws_instance.web.id  # 自动建立依赖
  vpc      = true
}
```

### 敏感数据处理

```hcl
# 标记敏感变量
variable "db_password" {
  type      = string
  sensitive = true
}

# 敏感输出
output "database_password" {
  value     = aws_db_instance.main.password
  sensitive = true
}

# 使用 Vault 获取密钥
data "vault_generic_secret" "db_creds" {
  path = "secret/database"
}

resource "aws_db_instance" "main" {
  username = data.vault_generic_secret.db_creds.data["username"]
  password = data.vault_generic_secret.db_creds.data["password"]
}
```

### 模块版本控制

```hcl
# 使用 Git 引用模块
module "vpc" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-vpc.git?ref=v5.0.0"

  name = "my-vpc"
  cidr = "10.0.0.0/16"
}

# 使用私有模块仓库
module "custom" {
  source  = "app.terraform.io/my-org/custom-module/aws"
  version = "~> 1.0"

  # 配置
}

# 本地模块
module "networking" {
  source = "../../modules/networking"

  # 配置
}
```

### 监控和告警

```hcl
# CloudWatch 告警
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.project_name}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "High CPU usage"

  dimensions = {
    InstanceId = aws_instance.web.id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# SNS 通知
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts"
}
```

### 备份和恢复

```hcl
# 数据库备份
resource "aws_db_instance" "main" {
  # ... 其他配置

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.project_name}-final-snapshot"
}

# S3 版本控制
resource "aws_s3_bucket" "state" {
  bucket = "terraform-state"

  versioning {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}
```
