# Resend + Next.js 邮件服务集成模板

## 项目概述

Resend + Next.js 是一个现代化的邮件服务集成方案，使用 Resend API 发送事务性邮件和营销邮件，结合 Next.js 的 API Routes 和 Server Actions，提供端到端的类型安全和优秀的开发体验。

## 技术栈

- **邮件服务**: Resend
- **框架**: Next.js 14+ (App Router)
- **语言**: TypeScript 5.3+
- **邮件模板**: React Email
- **验证**: Zod
- **ORM**: Prisma
- **UI**: Tailwind CSS + shadcn/ui
- **部署**: Vercel / Docker

## 项目结构

```
resend-nextjs-app/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── verify-email/
│   │   │   │   └── page.tsx
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │   ├── (marketing)/
│   │   │   ├── newsletter/
│   │   │   │   └── page.tsx
│   │   │   └── unsubscribe/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── register/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── verify-email/
│   │   │   │   │   └── route.ts
│   │   │   │   └── forgot-password/
│   │   │   │       └── route.ts
│   │   │   ├── newsletter/
│   │   │   │   ├── subscribe/
│   │   │   │   │   └── route.ts
│   │   │   │   └── send/
│   │   │   │       └── route.ts
│   │   │   └── webhooks/
│   │   │       └── resend/
│   │   │           └── route.ts
│   │   ├── actions/
│   │   │   ├── auth.ts
│   │   │   └── newsletter.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── card.tsx
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   └── forgot-password-form.tsx
│   │   ├── newsletter/
│   │   │   ├── subscribe-form.tsx
│   │   │   └── newsletter-preview.tsx
│   │   └── email/
│   │       └── email-list.tsx
│   ├── emails/
│   │   ├── templates/
│   │   │   ├── welcome.tsx
│   │   │   ├── verification.tsx
│   │   │   ├── password-reset.tsx
│   │   │   ├── newsletter.tsx
│   │   │   └── notification.tsx
│   │   ├── components/
│   │   │   ├── layout.tsx
│   │   │   ├── button.tsx
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── styles.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── resend.ts
│   │   ├── email-service.ts
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── globals.css
├── prisma/
│   └── schema.prisma
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 核心代码模式

### 1. Resend 客户端配置

```typescript
// src/lib/resend.ts
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// 发件人配置
export const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
export const SENDER_NAME = process.env.SENDER_NAME || 'My App';
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@example.com';

// 辅助函数
export function getFromEmail(name?: string): string {
  return name ? `${name} <${SENDER_EMAIL}>` : SENDER_EMAIL;
}
```

### 2. 邮件服务类

```typescript
// src/lib/email-service.ts
import { resend, getFromEmail, SENDER_EMAIL, SUPPORT_EMAIL } from './resend';
import { render } from '@react-email/components';
import WelcomeEmail from '@/emails/templates/welcome';
import VerificationEmail from '@/emails/templates/verification';
import PasswordResetEmail from '@/emails/templates/password-reset';
import NewsletterEmail from '@/emails/templates/newsletter';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  tags?: Array<{ name: string; value: string }>;
}

export class EmailService {
  /**
   * 发送欢迎邮件
   */
  static async sendWelcomeEmail(email: string, name: string) {
    const html = await render(
      WelcomeEmail({
        name,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
        supportEmail: SUPPORT_EMAIL,
      })
    );

    return this.send({
      to: email,
      subject: '欢迎加入！',
      html,
      tags: [{ name: 'type', value: 'welcome' }],
    });
  }

  /**
   * 发送验证邮件
   */
  static async sendVerificationEmail(
    email: string,
    verificationToken: string
  ) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;

    const html = await render(
      VerificationEmail({
        email,
        verificationUrl,
        expiresIn: '24小时',
      })
    );

    return this.send({
      to: email,
      subject: '验证您的邮箱地址',
      html,
      tags: [{ name: 'type', value: 'verification' }],
    });
  }

  /**
   * 发送密码重置邮件
   */
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName?: string
  ) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    const html = await render(
      PasswordResetEmail({
        email,
        resetUrl,
        userName,
        expiresIn: '1小时',
      })
    );

    return this.send({
      to: email,
      subject: '重置您的密码',
      html,
      tags: [{ name: 'type', value: 'password-reset' }],
    });
  }

  /**
   * 发送通讯邮件
   */
  static async sendNewsletter(
    email: string,
    data: {
      title: string;
      preview: string;
      content: string;
      unsubscribeUrl: string;
    }
  ) {
    const html = await render(
      NewsletterEmail({
        title: data.title,
        preview: data.preview,
        content: data.content,
        unsubscribeUrl: data.unsubscribeUrl,
      })
    );

    return this.send({
      to: email,
      subject: data.title,
      html,
      tags: [
        { name: 'type', value: 'newsletter' },
        { name: 'newsletter', value: 'true' },
      ],
    });
  }

  /**
   * 批量发送邮件
   */
  static async sendBulk(
    recipients: Array<{ email: string; data: Record<string, any> }>,
    subject: string,
    templateName: string
  ) {
    const results = [];
    const batchSize = 100; // Resend 批量限制

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(async (recipient) => {
          const html = await this.renderTemplate(templateName, recipient.data);

          return this.send({
            to: recipient.email,
            subject,
            html,
          });
        })
      );

      results.push(...batchResults);

      // 限速
      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return {
      total: recipients.length,
      succeeded: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
      results,
    };
  }

  /**
   * 基础发送方法
   */
  private static async send(options: SendEmailOptions) {
    try {
      const { data, error } = await resend.emails.send({
        from: options.from || getFromEmail(),
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        tags: options.tags,
      });

      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * 模板渲染辅助函数
   */
  private static async renderTemplate(
    templateName: string,
    data: Record<string, any>
  ): Promise<string> {
    const templates: Record<string, any> = {
      welcome: WelcomeEmail,
      verification: VerificationEmail,
      'password-reset': PasswordResetEmail,
      newsletter: NewsletterEmail,
    };

    const Template = templates[templateName];
    if (!Template) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    return render(<Template {...data} />);
  }
}
```

### 3. 欢迎邮件模板

```tsx
// src/emails/templates/welcome.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  name: string;
  loginUrl: string;
  supportEmail: string;
}

export default function WelcomeEmail({
  name = 'User',
  loginUrl = 'https://example.com/login',
  supportEmail = 'support@example.com',
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>欢迎加入我们！让我们开始吧。</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Img
              src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
              width="120"
              height="40"
              alt="Logo"
              style={logo}
            />
          </Section>

          <Heading style={h1}>欢迎，{name}！🎉</Heading>

          <Text style={text}>
            感谢您加入我们的平台。我们很高兴您能成为我们社区的一员！
          </Text>

          <Text style={text}>接下来您可以：</Text>

          <Section style={featuresSection}>
            <FeatureItem
              icon="🚀"
              title="快速开始"
              description="几分钟内完成设置"
            />
            <FeatureItem
              icon="📊"
              title="数据洞察"
              description="跟踪您的进度"
            />
            <FeatureItem
              icon="🔒"
              title="安全可靠"
              description="您的数据安全有保障"
            />
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={loginUrl}>
              开始使用
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            如果您有任何问题，请随时联系我们的支持团队：
            <br />
            <Link href={`mailto:${supportEmail}`} style={link}>
              {supportEmail}
            </Link>
          </Text>

          <Text style={footerText}>
            © {new Date().getFullYear()} Your Company. 保留所有权利。
          </Text>
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
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const headerSection = {
  padding: '0 0 30px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const text = {
  color: '#444444',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 20px',
};

const featuresSection = {
  padding: '20px 0',
};

const featureItem = {
  marginBottom: '16px',
};

const featureIcon = {
  fontSize: '24px',
  margin: '0',
};

const featureTitle = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  margin: '4px 0',
};

const featureDescription = {
  fontSize: '14px',
  color: '#666666',
  margin: '0',
};

const buttonSection = {
  padding: '30px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const hr = {
  border: 'none',
  borderTop: '1px solid #e5e5e5',
  margin: '30px 0',
};

const footer = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 20px',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};

const footerText = {
  color: '#888888',
  fontSize: '12px',
  margin: '0',
  textAlign: 'center' as const,
};
```

### 4. 验证邮件模板

```tsx
// src/emails/templates/verification.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VerificationEmailProps {
  email: string;
  verificationUrl: string;
  expiresIn?: string;
}

export default function VerificationEmail({
  email,
  verificationUrl,
  expiresIn = '24小时',
}: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>验证您的邮箱地址以开始使用</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Img
              src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
              width="120"
              height="40"
              alt="Logo"
            />
          </Section>

          <Heading style={h1}>验证您的邮箱</Heading>

          <Text style={text}>
            请点击下方按钮验证您的邮箱地址 <strong>{email}</strong>
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href={verificationUrl}>
              验证邮箱
            </Button>
          </Section>

          <Text style={text}>或者复制以下链接到浏览器中打开：</Text>

          <Text style={codeText}>{verificationUrl}</Text>

          <Text style={noteText}>
            此链接将在 {expiresIn} 后失效。如果您没有创建账户，可以安全地忽略此邮件。
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
};

const headerSection = {
  padding: '0 0 20px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const text = {
  color: '#444444',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 20px',
};

const buttonSection = {
  padding: '20px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  display: 'inline-block',
  padding: '12px 32px',
};

const codeText = {
  backgroundColor: '#f3f4f6',
  borderRadius: '4px',
  color: '#1f2937',
  fontSize: '14px',
  padding: '12px',
  wordBreak: 'break-all' as const,
  margin: '0 0 20px',
};

const noteText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 0',
};
```

### 5. 注册 API 路由

```typescript
// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { EmailService } from '@/lib/email-service';
import { generateToken } from '@/lib/auth';

const registerSchema = z.object({
  email: z.string().email('无效的邮箱地址'),
  password: z.string().min(8, '密码至少8位'),
  name: z.string().min(2, '姓名至少2个字符'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = registerSchema.parse(body);

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 生成验证 token
    const verificationToken = generateToken();

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        verificationToken,
        verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // 发送验证邮件
    await EmailService.sendVerificationEmail(email, verificationToken);

    return NextResponse.json(
      {
        message: '注册成功，请检查您的邮箱以验证账户',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '验证失败', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
```

### 6. 验证邮箱 API

```typescript
// src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: '缺少验证令牌' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiry: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: '无效或过期的验证令牌' },
        { status: 400 }
      );
    }

    // 更新用户
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    // 发送欢迎邮件
    await EmailService.sendWelcomeEmail(user.email, user.name);

    return NextResponse.json({
      message: '邮箱验证成功',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: '验证失败，请稍后重试' },
      { status: 500 }
    );
  }
}
```

### 7. 密码重置 API

```typescript
// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { EmailService } from '@/lib/email-service';
import { generateToken } from '@/lib/auth';

const forgotPasswordSchema = z.object({
  email: z.string().email('无效的邮箱地址'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 即使用户不存在，也返回成功（安全考虑）
    if (!user) {
      return NextResponse.json({
        message: '如果该邮箱存在，重置邮件已发送',
      });
    }

    // 生成重置 token
    const resetToken = generateToken();

    // 保存 token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1小时
      },
    });

    // 发送重置邮件
    await EmailService.sendPasswordResetEmail(email, resetToken, user.name);

    return NextResponse.json({
      message: '如果该邮箱存在，重置邮件已发送',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '验证失败', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: '发送重置邮件失败，请稍后重试' },
      { status: 500 }
    );
  }
}
```

### 8. 通讯订阅 API

```typescript
// src/app/api/newsletter/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { EmailService } from '@/lib/email-service';

const subscribeSchema = z.object({
  email: z.string().email('无效的邮箱地址'),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = subscribeSchema.parse(body);

    // 检查是否已订阅
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.subscribed) {
        return NextResponse.json(
          { error: '您已经订阅了我们的通讯' },
          { status: 400 }
        );
      }

      // 重新激活订阅
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          subscribed: true,
          unsubscribedAt: null,
        },
      });

      return NextResponse.json({
        message: '订阅已重新激活',
      });
    }

    // 创建新订阅
    await prisma.newsletterSubscriber.create({
      data: {
        email,
        name,
      },
    });

    // 发送欢迎邮件
    await EmailService.sendNewsletter(email, {
      title: '欢迎订阅我们的通讯！',
      preview: '感谢您订阅，这是您的第一封通讯',
      content: `
        <h2>欢迎加入！</h2>
        <p>感谢您订阅我们的通讯。您将定期收到我们的最新更新、独家内容和特别优惠。</p>
        <p>敬请期待！</p>
      `,
      unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${email}`,
    });

    return NextResponse.json(
      { message: '订阅成功！' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '验证失败', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: '订阅失败，请稍后重试' },
      { status: 500 }
    );
  }
}
```

### 9. Resend Webhook 处理

```typescript
// src/app/api/webhooks/resend/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { prisma } from '@/lib/db';

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET!;

function verifySignature(payload: string, signature: string): boolean {
  const expectedSignature = createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('svix-signature') || '';

    // 验证签名
    if (!verifySignature(payload, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(payload);
    const { type, data } = event;

    // 处理不同类型的事件
    switch (type) {
      case 'email.sent':
        await handleEmailSent(data);
        break;

      case 'email.delivered':
        await handleEmailDelivered(data);
        break;

      case 'email.opened':
        await handleEmailOpened(data);
        break;

      case 'email.clicked':
        await handleEmailClicked(data);
        break;

      case 'email.bounced':
        await handleEmailBounced(data);
        break;

      case 'email.complained':
        await handleEmailComplained(data);
        break;

      default:
        console.log(`Unhandled event type: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleEmailSent(data: any) {
  await prisma.emailLog.create({
    data: {
      emailId: data.email_id,
      to: data.to,
      subject: data.subject,
      status: 'sent',
      sentAt: new Date(),
    },
  });
}

async function handleEmailDelivered(data: any) {
  await prisma.emailLog.update({
    where: { emailId: data.email_id },
    data: {
      status: 'delivered',
      deliveredAt: new Date(),
    },
  });
}

async function handleEmailOpened(data: any) {
  await prisma.emailLog.update({
    where: { emailId: data.email_id },
    data: {
      openedAt: new Date(),
      openCount: { increment: 1 },
    },
  });
}

async function handleEmailClicked(data: any) {
  await prisma.emailLog.update({
    where: { emailId: data.email_id },
    data: {
      clickedAt: new Date(),
      clickCount: { increment: 1 },
    },
  });

  // 记录点击链接
  await prisma.emailClick.create({
    data: {
      emailId: data.email_id,
      link: data.click?.link,
      timestamp: new Date(),
    },
  });
}

async function handleEmailBounced(data: any) {
  await prisma.emailLog.update({
    where: { emailId: data.email_id },
    data: {
      status: 'bounced',
      bouncedAt: new Date(),
      bounceReason: data.bounce?.message,
    },
  });

  // 标记邮箱为无效
  await prisma.invalidEmail.upsert({
    where: { email: data.to },
    create: {
      email: data.to,
      reason: data.bounce?.message,
    },
    update: {
      reason: data.bounce?.message,
      updatedAt: new Date(),
    },
  });
}

async function handleEmailComplained(data: any) {
  await prisma.emailLog.update({
    where: { emailId: data.email_id },
    data: {
      status: 'complained',
      complainedAt: new Date(),
    },
  });

  // 加入黑名单
  await prisma.emailBlacklist.upsert({
    where: { email: data.to },
    create: {
      email: data.to,
      reason: 'spam_complaint',
    },
    update: {
      reason: 'spam_complaint',
      updatedAt: new Date(),
    },
  });
}
```

### 10. Server Action 示例

```typescript
// src/app/actions/newsletter.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { EmailService } from '@/lib/email-service';

const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export async function subscribeToNewsletter(formData: FormData) {
  const email = formData.get('email') as string;
  const name = formData.get('name') as string | undefined;

  try {
    const validated = subscribeSchema.parse({ email, name });

    // 检查是否已订阅
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: validated.email },
    });

    if (existing && existing.subscribed) {
      return { error: '您已经订阅了我们的通讯' };
    }

    // 创建或更新订阅
    await prisma.newsletterSubscriber.upsert({
      where: { email: validated.email },
      create: {
        email: validated.email,
        name: validated.name,
      },
      update: {
        subscribed: true,
        unsubscribedAt: null,
      },
    });

    // 发送欢迎邮件
    await EmailService.sendNewsletter(validated.email, {
      title: '欢迎订阅！',
      preview: '感谢您订阅',
      content: '<p>感谢您订阅我们的通讯！</p>',
      unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${validated.email}`,
    });

    revalidatePath('/newsletter');
    return { success: true, message: '订阅成功！' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: '请输入有效的邮箱地址' };
    }

    return { error: '订阅失败，请稍后重试' };
  }
}

export async function sendBulkNewsletter(
  subject: string,
  content: string,
  recipientIds?: string[]
) {
  try {
    // 获取订阅者
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: {
        subscribed: true,
        ...(recipientIds && { id: { in: recipientIds } }),
      },
      select: {
        email: true,
        name: true,
      },
    });

    // 批量发送
    const result = await EmailService.sendBulk(
      subscribers.map((s) => ({
        email: s.email,
        data: {
          title: subject,
          preview: subject,
          content,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${s.email}`,
        },
      })),
      subject,
      'newsletter'
    );

    // 记录发送日志
    await prisma.newsletterCampaign.create({
      data: {
        subject,
        content,
        sentCount: result.succeeded,
        failedCount: result.failed,
      },
    });

    return { success: true, stats: result };
  } catch (error) {
    console.error('Bulk newsletter error:', error);
    return { error: '发送失败' };
  }
}
```

## 最佳实践

### 1. 邮件模板设计

```typescript
// 使用响应式设计
const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
};

// 提供纯文本版本
const html = await render(WelcomeEmail(props));
const text = await render(WelcomeEmail(props), { plainText: true });

await resend.emails.send({
  to: email,
  subject: 'Welcome',
  html,
  text, // 纯文本回退
});
```

### 2. 错误处理

```typescript
// 重试机制
async function sendWithRetry(
  options: EmailOptions,
  maxRetries = 3
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await EmailService.send(options);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 3. 速率限制

```typescript
// 使用队列控制发送速率
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 s'),
});

const { success } = await ratelimit.limit('email-send');
if (!success) {
  throw new Error('Rate limit exceeded');
}
```

### 4. 测试

```typescript
// __tests__/email.test.ts
import { EmailService } from '@/lib/email-service';
import { render } from '@react-email/components';
import WelcomeEmail from '@/emails/templates/welcome';

describe('Email Service', () => {
  it('should render welcome email correctly', async () => {
    const html = await render(
      WelcomeEmail({
        name: 'John',
        loginUrl: 'https://example.com',
        supportEmail: 'support@example.com',
      })
    );

    expect(html).toContain('欢迎，John！');
    expect(html).toContain('https://example.com');
  });
});
```

## 常用命令

```bash
# 安装依赖
npm install resend @react-email/components

# 开发
npm run dev

# 构建
npm run build

# 发送测试邮件
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# 预览邮件
npm run preview-email

# 测试
npm run test
```

## 部署配置

### 环境变量

```bash
# .env.local
RESEND_API_KEY=re_xxx
RESEND_WEBHOOK_SECRET=whsec_xxx
SENDER_EMAIL=noreply@example.com
SENDER_NAME=My App
SUPPORT_EMAIL=support@example.com
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=postgresql://...
```

### Vercel 部署

```bash
vercel env add RESEND_API_KEY
vercel env add RESEND_WEBHOOK_SECRET
vercel --prod
```

### Docker 部署

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

## 参考资源

- [Resend 官方文档](https://resend.com/docs)
- [React Email 组件](https://react.email/components)
- [Next.js App Router](https://nextjs.org/docs/app)
- [邮件模板最佳实践](https://resend.com/blog/best-practices-for-email-templates)

---

**最后更新**: 2026-03-17
