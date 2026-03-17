# Resend 邮件服务模板

## 技术栈

### 核心技术
- **Resend**: 开发者优先的邮件 API
- **React Email**: 基于 React 的邮件模板
- **TypeScript**: 类型安全
- **Next.js**: API Routes 集成

### 邮件功能
- **事务性邮件**: 验证、通知、警报
- **营销邮件**: 简报、促销、活动
- **批量发送**: 高效群发
- **邮件模板**: React 组件化模板
- **附件支持**: PDF、图片等
- **追踪分析**: 打开率、点击率

### 配套工具
- **@react-email/components**: 邮件 UI 组件
- **MJML**: 响应式邮件设计
- **Zod**: 模式验证

## 项目结构

```
resend-email-project/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── email/
│   │   │       ├── send/
│   │   │       │   └── route.ts
│   │   │       ├── bulk/
│   │   │       │   └── route.ts
│   │   │       └── webhook/
│   │   │           └── route.ts
│   │   └── page.tsx
│   ├── emails/
│   │   ├── templates/
│   │   │   ├── welcome.tsx
│   │   │   ├── verification.tsx
│   │   │   ├── password-reset.tsx
│   │   │   ├── notification.tsx
│   │   │   ├── newsletter.tsx
│   │   │   └── receipt.tsx
│   │   ├── components/
│   │   │   ├── layout.tsx
│   │   │   ├── button.tsx
   │   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── styles.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── resend.ts             # Resend 客户端
│   │   ├── email-service.ts      # 邮件服务
│   │   └── templates.ts          # 模板映射
│   ├── queue/
│   │   └── email-queue.ts        # 邮件队列（可选）
│   └── types/
│       └── email.ts
├── scripts/
│   └── preview-email.ts          # 预览邮件
├── .env.local
├── next.config.js
└── package.json
```

## 代码模式

### 1. Resend 客户端配置

```typescript
// src/lib/resend.ts
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

// 默认发件人配置
export const DEFAULT_FROM = "Acme <onboarding@resend.dev>";
export const SUPPORT_EMAIL = "support@yourcompany.com";
export const NOTIFICATION_EMAIL = "notifications@yourcompany.com";
```

```typescript
// src/types/email.ts
export interface EmailOptions {
  to: string | string[];
  subject: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Attachment[];
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
}

export interface Attachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailTemplateData {
  [key: string]: any;
}

export interface BulkEmailOptions extends EmailOptions {
  recipients: Array<{
    email: string;
    data?: EmailTemplateData;
  }>;
}
```

### 2. React Email 模板

```typescript
// src/emails/templates/welcome.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  name: string;
  loginUrl: string;
  supportEmail: string;
}

export function WelcomeEmail({
  name = "User",
  loginUrl = "https://example.com/login",
  supportEmail = "support@example.com",
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to our platform! Let's get started.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src="https://example.com/logo.png"
              width="120"
              height="40"
              alt="Logo"
              style={logo}
            />
          </Section>

          <Heading style={h1}>Welcome, {name}! 👋</Heading>

          <Text style={text}>
            Thanks for joining our platform. We're excited to have you on board!
          </Text>

          <Text style={text}>
            Here's what you can do next:
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href={loginUrl}>
              Get Started
            </Button>
          </Section>

          <Section style={featuresSection}>
            <FeatureItem
              icon="🚀"
              title="Quick Setup"
              description="Get started in minutes"
            />
            <FeatureItem
              icon="📊"
              title="Analytics"
              description="Track your progress"
            />
            <FeatureItem
              icon="🔒"
              title="Secure"
              description="Your data is safe"
            />
          </Section>

          <Text style={text}>
            If you have any questions, feel free to reach out to our support
            team at{" "}
            <Link href={`mailto:${supportEmail}`} style={link}>
              {supportEmail}
            </Link>
          </Text>

          <Text style={footer}>
            Best regards,
            <br />
            The Team
          </Text>

          <Section style={footerSection}>
            <Text style={footerText}>
              © 2024 Your Company. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href="https://example.com/unsubscribe" style={footerLink}>
                Unsubscribe
              </Link>{" "}
              •{" "}
              <Link href="https://example.com/privacy" style={footerLink}>
                Privacy Policy
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Section style={featureItem}>
      <Text style={featureIcon}>{icon}</Text>
      <Text style={featureTitle}>{title}</Text>
      <Text style={featureDescription}>{description}</Text>
    </Section>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const logoSection = {
  padding: "32px 0",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "28px",
  fontWeight: "bold" as const,
  margin: "0 0 20px",
  padding: "0 40px",
  textAlign: "center" as const,
};

const text = {
  color: "#444444",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 20px",
  padding: "0 40px",
};

const link = {
  color: "#2563eb",
  textDecoration: "underline",
};

const buttonSection = {
  padding: "20px 40px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const featuresSection = {
  padding: "20px 40px",
};

const featureItem = {
  marginBottom: "16px",
};

const featureIcon = {
  fontSize: "24px",
  margin: "0",
};

const featureTitle = {
  fontSize: "16px",
  fontWeight: "bold" as const,
  margin: "4px 0",
};

const featureDescription = {
  fontSize: "14px",
  color: "#666666",
  margin: "0",
};

const footer = {
  color: "#666666",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "32px 0 0",
  padding: "0 40px",
};

const footerSection = {
  padding: "32px 40px 0",
  borderTop: "1px solid #e5e5e5",
};

const footerText = {
  color: "#888888",
  fontSize: "12px",
  margin: "0 0 8px",
  textAlign: "center" as const,
};

const footerLink = {
  color: "#888888",
  textDecoration: "underline",
};

export default WelcomeEmail;
```

```typescript
// src/emails/templates/verification.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Button,
} from "@react-email/components";
import * as React from "react";

interface VerificationEmailProps {
  verificationUrl: string;
  email: string;
  expiresIn?: string;
}

export function VerificationEmail({
  verificationUrl,
  email,
  expiresIn = "24 hours",
}: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address to get started</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Img
              src="https://example.com/logo.png"
              width="120"
              height="40"
              alt="Logo"
            />
          </Section>

          <Heading style={h1}>Verify your email</Heading>

          <Text style={text}>
            Please verify your email address <strong>{email}</strong> by
            clicking the button below.
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href={verificationUrl}>
              Verify Email
            </Button>
          </Section>

          <Text style={text}>Or copy and paste this URL into your browser:</Text>

          <Text style={codeText}>{verificationUrl}</Text>

          <Text style={noteText}>
            This link will expire in {expiresIn}. If you didn't create an
            account, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
};

const headerSection = {
  padding: "0 0 20px",
  textAlign: "center" as const,
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "bold" as const,
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const text = {
  color: "#444444",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 20px",
};

const buttonSection = {
  padding: "20px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  display: "inline-block",
  padding: "12px 32px",
};

const codeText = {
  backgroundColor: "#f3f4f6",
  borderRadius: "4px",
  color: "#1f2937",
  fontSize: "14px",
  padding: "12px",
  wordBreak: "break-all" as const,
  margin: "0 0 20px",
};

const noteText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "24px 0 0",
};

export default VerificationEmail;
```

### 3. 邮件服务

```typescript
// src/lib/email-service.ts
import { resend, DEFAULT_FROM } from "./resend";
import { WelcomeEmail } from "@/emails/templates/welcome";
import { VerificationEmail } from "@/emails/templates/verification";
import { render } from "@react-email/components";
import type { EmailOptions, Attachment } from "@/types/email";

export class EmailService {
  /**
   * 发送欢迎邮件
   */
  static async sendWelcomeEmail(
    email: string,
    name: string,
    options?: Partial<EmailOptions>
  ) {
    const html = await render(
      WelcomeEmail({
        name,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
        supportEmail: "support@example.com",
      })
    );

    return this.send({
      to: email,
      subject: "Welcome to Our Platform!",
      html,
      ...options,
    });
  }

  /**
   * 发送验证邮件
   */
  static async sendVerificationEmail(
    email: string,
    verificationUrl: string,
    options?: Partial<EmailOptions>
  ) {
    const html = await render(
      VerificationEmail({
        email,
        verificationUrl,
        expiresIn: "24 hours",
      })
    );

    return this.send({
      to: email,
      subject: "Verify Your Email Address",
      html,
      ...options,
    });
  }

  /**
   * 发送密码重置邮件
   */
  static async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
    options?: Partial<EmailOptions>
  ) {
    const html = await render(PasswordResetEmail({ email, resetUrl }));

    return this.send({
      to: email,
      subject: "Reset Your Password",
      html,
      ...options,
    });
  }

  /**
   * 发送带附件的邮件
   */
  static async sendWithAttachment(
    email: string,
    subject: string,
    html: string,
    attachments: Attachment[],
    options?: Partial<EmailOptions>
  ) {
    return this.send({
      to: email,
      subject,
      html,
      attachments,
      ...options,
    });
  }

  /**
   * 批量发送邮件
   */
  static async sendBulk(
    recipients: Array<{ email: string; data: Record<string, any> }>,
    subject: string,
    templateFn: (data: Record<string, any>) => Promise<string>,
    options?: Partial<EmailOptions>
  ) {
    const results = [];

    for (const recipient of recipients) {
      try {
        const html = await templateFn(recipient.data);
        const result = await this.send({
          to: recipient.email,
          subject,
          html,
          ...options,
        });
        results.push({ email: recipient.email, success: true, result });
      } catch (error) {
        results.push({ email: recipient.email, success: false, error });
      }

      // 限速：每秒最多10封
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * 基础发送方法
   */
  private static async send(options: EmailOptions & { html: string }) {
    const { data, error } = await resend.emails.send({
      from: options.from || DEFAULT_FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      reply_to: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        content_type: att.contentType,
      })),
      headers: options.headers,
      tags: options.tags,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  }

  /**
   * 获取邮件状态
   */
  static async getEmailStatus(emailId: string) {
    const { data, error } = await resend.emails.get(emailId);

    if (error) {
      throw new Error(`Failed to get email status: ${error.message}`);
    }

    return data;
  }

  /**
   * 取消发送
   */
  static async cancelEmail(emailId: string) {
    const { data, error } = await resend.emails.cancel(emailId);

    if (error) {
      throw new Error(`Failed to cancel email: ${error.message}`);
    }

    return data;
  }
}
```

### 4. API 路由

```typescript
// src/app/api/email/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/email-service";
import { z } from "zod";

const sendEmailSchema = z.object({
  to: z.string().email(),
  template: z.enum(["welcome", "verification", "password-reset", "notification"]),
  data: z.record(z.any()),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, template, data } = sendEmailSchema.parse(body);

    let result;

    switch (template) {
      case "welcome":
        result = await EmailService.sendWelcomeEmail(to, data.name, data.options);
        break;

      case "verification":
        result = await EmailService.sendVerificationEmail(
          to,
          data.verificationUrl,
          data.options
        );
        break;

      case "password-reset":
        result = await EmailService.sendPasswordResetEmail(
          to,
          data.resetUrl,
          data.options
        );
        break;

      case "notification":
        result = await EmailService.sendNotificationEmail(to, data);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid template" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/email/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/email-service";
import { z } from "zod";

const bulkEmailSchema = z.object({
  recipients: z.array(
    z.object({
      email: z.string().email(),
      data: z.record(z.any()).optional(),
    })
  ),
  subject: z.string(),
  template: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipients, subject, template } = bulkEmailSchema.parse(body);

    // 限制批量大小
    if (recipients.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 recipients per batch" },
        { status: 400 }
      );
    }

    const results = await EmailService.sendBulk(
      recipients,
      subject,
      async (data) => {
        // 根据 template 生成 HTML
        return renderTemplate(template, data);
      }
    );

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
      results,
    });
  } catch (error) {
    console.error("Bulk email error:", error);
    return NextResponse.json(
      { error: "Failed to send bulk emails" },
      { status: 500 }
    );
  }
}
```

### 5. Webhook 处理

```typescript
// src/app/api/email/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET!;

function verifySignature(payload: string, signature: string): boolean {
  const expectedSignature = createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");
  return signature === expectedSignature;
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("svix-signature") || "";

    // 验证签名
    if (!verifySignature(payload, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(payload);
    const { type, data } = event;

    switch (type) {
      case "email.sent":
        await handleEmailSent(data);
        break;

      case "email.delivered":
        await handleEmailDelivered(data);
        break;

      case "email.opened":
        await handleEmailOpened(data);
        break;

      case "email.clicked":
        await handleEmailClicked(data);
        break;

      case "email.bounced":
        await handleEmailBounced(data);
        break;

      case "email.complained":
        await handleEmailComplained(data);
        break;

      default:
        console.log(`Unhandled event type: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleEmailSent(data: any) {
  console.log(`Email ${data.email_id} sent`);
  await prisma.emailLog.update({
    where: { emailId: data.email_id },
    data: { status: "sent", sentAt: new Date() },
  });
}

async function handleEmailDelivered(data: any) {
  console.log(`Email ${data.email_id} delivered`);
  await prisma.emailLog.update({
    where: { emailId: data.email_id },
    data: { status: "delivered", deliveredAt: new Date() },
  });
}

async function handleEmailOpened(data: any) {
  console.log(`Email ${data.email_id} opened`);
  await prisma.emailLog.update({
    where: { emailId: data.email_id },
    data: { openedAt: new Date(), openCount: { increment: 1 } },
  });
}

async function handleEmailClicked(data: any) {
  console.log(`Email ${data.email_id} clicked: ${data.click?.link}`);
  await prisma.emailLog.update({
    where: { emailId: data.email_id },
    data: { clickedAt: new Date(), clickCount: { increment: 1 } },
  });
}

async function handleEmailBounced(data: any) {
  console.log(`Email ${data.email_id} bounced`);
  await prisma.emailLog.update({
    where: { emailId: data.email_id },
    data: { status: "bounced", bouncedAt: new Date(), bounceReason: data.bounce?.message },
  });

  // 标记邮箱为无效
  await prisma.user.update({
    where: { email: data.email },
    data: { emailValid: false },
  });
}

async function handleEmailComplained(data: any) {
  console.log(`Email ${data.email_id} complained (spam)`);
  await prisma.emailLog.update({
    where: { emailId: data.email_id },
    data: { status: "complained", complainedAt: new Date() },
  });

  // 将用户加入黑名单
  await prisma.emailBlacklist.create({
    data: { email: data.email, reason: "spam_complaint" },
  });
}
```

### 6. 邮件预览

```typescript
// scripts/preview-email.ts
import { render } from "@react-email/components";
import { writeFileSync } from "fs";
import { WelcomeEmail } from "../src/emails/templates/welcome";
import { VerificationEmail } from "../src/emails/templates/verification";

async function previewEmails() {
  // 预览欢迎邮件
  const welcomeHtml = await render(
    WelcomeEmail({
      name: "John Doe",
      loginUrl: "https://example.com/login",
      supportEmail: "support@example.com",
    })
  );
  writeFileSync("preview-welcome.html", welcomeHtml);
  console.log("✅ Welcome email preview saved to preview-welcome.html");

  // 预览验证邮件
  const verificationHtml = await render(
    VerificationEmail({
      email: "john@example.com",
      verificationUrl: "https://example.com/verify?token=abc123",
      expiresIn: "24 hours",
    })
  );
  writeFileSync("preview-verification.html", verificationHtml);
  console.log("✅ Verification email preview saved to preview-verification.html");
}

previewEmails().catch(console.error);
```

### 7. 通知邮件模板

```typescript
// src/emails/templates/notification.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface NotificationEmailProps {
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  previewText?: string;
}

export function NotificationEmail({
  title,
  message,
  actionUrl,
  actionLabel = "View Details",
  previewText = "You have a new notification",
}: NotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Img
              src="https://example.com/logo.png"
              width="120"
              height="40"
              alt="Logo"
            />
          </Section>

          <Heading style={h1}>{title}</Heading>

          <Text style={text}>{message}</Text>

          {actionUrl && (
            <Section style={buttonSection}>
              <Button style={button} href={actionUrl}>
                {actionLabel}
              </Button>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footerText}>
            You received this email because you enabled notifications.
            <br />
            <a href="https://example.com/settings/notifications" style={link}>
              Manage notification preferences
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
};

const headerSection = {
  padding: "0 0 20px",
  textAlign: "center" as const,
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "bold" as const,
  margin: "0 0 20px",
};

const text = {
  color: "#444444",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 20px",
};

const buttonSection = {
  padding: "20px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  display: "inline-block",
  padding: "12px 32px",
};

const hr = {
  border: "none",
  borderTop: "1px solid #e5e5e5",
  margin: "30px 0",
};

const footerText = {
  color: "#666666",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const link = {
  color: "#2563eb",
  textDecoration: "underline",
};

export default NotificationEmail;
```

## 最佳实践

### 1. 模板设计

```typescript
// ✅ 使用响应式设计
const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px",
};

// ✅ 提供纯文本版本
import { render } from "@react-email/components";

const html = await render(WelcomeEmail(props));
const text = await render(WelcomeEmail(props), { plainText: true });

await resend.emails.send({
  to: email,
  subject: "Welcome",
  html,
  text, // 纯文本回退
});

// ✅ 使用语义化的预览文本
<Preview>Welcome to our platform! Let's get started.</Preview>
```

### 2. 错误处理

```typescript
// ✅ 重试机制
async function sendWithRetry(options: EmailOptions, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await EmailService.send(options);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// ✅ 记录失败
try {
  await EmailService.sendWelcomeEmail(email, name);
} catch (error) {
  await prisma.emailLog.create({
    data: {
      email,
      type: "welcome",
      status: "failed",
      error: error.message,
    },
  });
  throw error;
}
```

### 3. 速率限制

```typescript
// ✅ 使用队列控制发送速率
import { emailQueue } from "@/queue/email-queue";

// 每封邮件延迟 100ms
await emailQueue.add("send-email", emailData, {
  delay: index * 100,
});

// ✅ 监控 API 限制
const MAX_EMAILS_PER_SECOND = 10;

let sentCount = 0;
let lastReset = Date.now();

function checkRateLimit() {
  const now = Date.now();
  if (now - lastReset >= 1000) {
    sentCount = 0;
    lastReset = now;
  }

  if (sentCount >= MAX_EMAILS_PER_SECOND) {
    throw new Error("Rate limit exceeded");
  }

  sentCount++;
}
```

### 4. 测试

```typescript
// __tests__/email.test.ts
import { EmailService } from "@/lib/email-service";
import { render } from "@react-email/components";
import { WelcomeEmail } from "@/emails/templates/welcome";

describe("Email Service", () => {
  it("should render welcome email correctly", async () => {
    const html = await render(
      WelcomeEmail({
        name: "John",
        loginUrl: "https://example.com",
        supportEmail: "support@example.com",
      })
    );

    expect(html).toContain("Welcome, John!");
    expect(html).toContain("https://example.com");
  });

  it("should send email successfully", async () => {
    const result = await EmailService.sendWelcomeEmail(
      "test@example.com",
      "John"
    );

    expect(result).toHaveProperty("id");
  });
});
```

## 常用命令

```bash
# 安装依赖
npm install resend @react-email/components

# 预览邮件
npm run preview-email

# 发送测试邮件
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","template":"welcome","data":{"name":"John"}}'

# 检查邮件状态
curl https://api.resend.com/emails/{email_id} \
  -H "Authorization: Bearer $RESEND_API_KEY"
```

## 部署配置

### 环境变量

```bash
# .env.local
RESEND_API_KEY=re_xxx
RESEND_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Domain 配置

```bash
# 添加发送域名
curl -X POST https://api.resend.com/domains \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"yourdomain.com"}'

# 添加 DNS 记录后验证
curl https://api.resend.com/domains/{domain_id}/verify \
  -H "Authorization: Bearer $RESEND_API_KEY"
```

### Vercel 部署

```bash
vercel env add RESEND_API_KEY
vercel env add RESEND_WEBHOOK_SECRET
vercel --prod
```

## 参考资源

- [Resend 官方文档](https://resend.com/docs)
- [React Email 组件](https://react.email/components)
- [邮件模板最佳实践](https://resend.com/blog/best-practices-for-email-templates)
- [Webhook 事件](https://resend.com/docs/dashboard/webhooks)
- [API 速率限制](https://resend.com/docs/api-rate-limits)
