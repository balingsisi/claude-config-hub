# React Email 邮件模板

## 技术栈

- **核心库**: @react-email/components, @react-email/render
- **框架**: Next.js / Node.js / Express
- **发送服务**: Resend / SendGrid / Postmark / AWS SES
- **样式**: Tailwind CSS / 内联样式
- **预览**: React Email Preview
- **类型**: TypeScript

## 项目结构

```
react-email-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── email/
│   │   │       └── send/
│   │   │           └── route.ts      # 发送邮件 API
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── emails/                       # 邮件模板
│   │   ├── welcome.tsx              # 欢迎邮件
│   │   ├── reset-password.tsx       # 密码重置
│   │   ├── invoice.tsx              # 发票邮件
│   │   ├── notification.tsx         # 通知邮件
│   │   ├── newsletter.tsx           # 新闻简报
│   │   ├── verification.tsx         # 验证邮件
│   │   ├── order-confirmation.tsx   # 订单确认
│   │   └── components/              # 可复用组件
│   │       ├── Layout.tsx           # 邮件布局
│   │       ├── Header.tsx           # 头部
│   │       ├── Footer.tsx           # 底部
│   │       ├── Button.tsx           # 按钮
│   │       └── Divider.tsx          # 分隔线
│   ├── lib/
│   │   ├── email.ts                 # 邮件发送工具
│   │   ├── resend.ts                # Resend 客户端
│   │   └── utils.ts
│   └── types/
│       └── email.ts
├── email-preview/                    # 邮件预览应用
│   └── pages/
│       └── index.tsx
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础邮件模板

```typescript
// src/emails/welcome.tsx
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
  Link,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  username: string;
  loginUrl: string;
}

export function WelcomeEmail({ username, loginUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>欢迎加入我们的平台！</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>欢迎加入！</Heading>
          <Text style={text}>
            亲爱的 <strong>{username}</strong>,
          </Text>
          <Text style={text}>
            感谢您注册我们的服务。我们很高兴您成为我们社区的一员。
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={loginUrl}>
              开始使用
            </Button>
          </Section>
          <Text style={text}>
            如果您有任何问题，请随时回复此邮件或联系我们的支持团队。
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            此邮件由系统自动发送，请勿直接回复。
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// 样式定义
const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  textAlign: "left" as const,
};

const buttonContainer = {
  padding: "27px 0 27px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#5F51E8",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
};

const hr = {
  borderColor: "#cccccc",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  textAlign: "center" as const,
};

export default WelcomeEmail;
```

### 可复用布局组件

```typescript
// src/emails/components/Layout.tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  previewText: string;
}

export function Layout({ children, previewText }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Header />
          <Section style={content}>{children}</Section>
          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #f0f0f0",
  borderRadius: "5px",
  margin: "40px auto",
  maxWidth: "600px",
  padding: "0",
};

const content = {
  padding: "40px 40px 20px",
};
```

```typescript
// src/emails/components/Header.tsx
import { Section, Row, Column, Img, Text } from "@react-email/components";

export function Header() {
  return (
    <Section style={header}>
      <Row>
        <Column style={logoColumn}>
          <Img
            src="https://example.com/logo.png"
            alt="Logo"
            style={logo}
          />
        </Column>
        <Column style={titleColumn}>
          <Text style={title}>您的品牌名称</Text>
        </Column>
      </Row>
    </Section>
  );
}

const header = {
  backgroundColor: "#5F51E8",
  padding: "20px 40px",
};

const logoColumn = {
  verticalAlign: "middle" as const,
  width: "60px",
};

const logo = {
  height: "40px",
};

const titleColumn = {
  verticalAlign: "middle" as const,
};

const title = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0",
};
```

```typescript
// src/emails/components/Footer.tsx
import { Section, Text, Link } from "@react-email/components";

export function Footer() {
  return (
    <Section style={footer}>
      <Text style={text}>
        © 2024 您的品牌名称. 保留所有权利.
      </Text>
      <Text style={links}>
        <Link href="https://example.com/privacy" style={link}>
          隐私政策
        </Link>
        {" • "}
        <Link href="https://example.com/terms" style={link}>
          服务条款
        </Link>
        {" • "}
        <Link href="https://example.com/unsubscribe" style={link}>
          取消订阅
        </Link>
      </Text>
    </Section>
  );
}

const footer = {
  backgroundColor: "#f6f9fc",
  padding: "20px 40px",
};

const text = {
  color: "#8898aa",
  fontSize: "14px",
  textAlign: "center" as const,
  margin: "0 0 10px",
};

const links = {
  color: "#8898aa",
  fontSize: "12px",
  textAlign: "center" as const,
  margin: "0",
};

const link = {
  color: "#5F51E8",
  textDecoration: "none",
};
```

### 按钮组件

```typescript
// src/emails/components/Button.tsx
import { Button as EmailButton } from "@react-email/components";
import * as React from "react";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
}

export function Button({ href, children, variant = "primary" }: ButtonProps) {
  const style = buttonStyles[variant];

  return (
    <EmailButton style={style} href={href}>
      {children}
    </EmailButton>
  );
}

const buttonStyles = {
  primary: {
    backgroundColor: "#5F51E8",
    borderRadius: "5px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center",
    display: "block",
    padding: "12px 30px",
  },
  secondary: {
    backgroundColor: "#6c757d",
    borderRadius: "5px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center",
    display: "block",
    padding: "12px 30px",
  },
  danger: {
    backgroundColor: "#dc3545",
    borderRadius: "5px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center",
    display: "block",
    padding: "12px 30px",
  },
};
```

### 密码重置邮件

```typescript
// src/emails/reset-password.tsx
import {
  Body,
  Container,
  Heading,
  Text,
  Button,
  Section,
  Hr,
} from "@react-email/components";
import { Layout } from "./components/Layout";
import * as React from "react";

interface ResetPasswordEmailProps {
  username: string;
  resetUrl: string;
  expiresIn: string;
}

export function ResetPasswordEmail({
  username,
  resetUrl,
  expiresIn,
}: ResetPasswordEmailProps) {
  return (
    <Layout previewText="重置您的密码">
      <Heading style={h1}>重置密码</Heading>
      <Text style={text}>
        亲爱的 {username},
      </Text>
      <Text style={text}>
        我们收到了重置您账户密码的请求。请点击下面的按钮来设置新密码：
      </Text>
      <Section style={buttonContainer}>
        <Button style={button} href={resetUrl}>
          重置密码
        </Button>
      </Section>
      <Text style={text}>
        此链接将在 {expiresIn} 后失效。如果您没有请求重置密码，请忽略此邮件。
      </Text>
      <Text style={text}>
        或者，您可以将以下链接复制到浏览器：
      </Text>
      <Text style={link}>{resetUrl}</Text>
      <Hr style={hr} />
      <Text style={note}>
        为了您的账户安全，请勿将此邮件转发给他人。
      </Text>
    </Layout>
  );
}

const h1 = {
  color: "#333",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 20px",
  padding: "0",
  textAlign: "left" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
  margin: "0 0 15px",
};

const buttonContainer = {
  padding: "20px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#dc3545",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 30px",
};

const link = {
  color: "#5F51E8",
  fontSize: "14px",
  wordBreak: "break-all" as const,
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "20px 0",
};

const note = {
  color: "#8898aa",
  fontSize: "14px",
  textAlign: "center" as const,
};

export default ResetPasswordEmail;
```

### 发票邮件

```typescript
// src/emails/invoice.tsx
import {
  Body,
  Container,
  Heading,
  Text,
  Button,
  Section,
  Row,
  Column,
  Hr,
  Img,
} from "@react-email/components";
import { Layout } from "./components/Layout";
import * as React from "react";

interface InvoiceEmailProps {
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  downloadUrl: string;
}

export function InvoiceEmail({
  customerName,
  invoiceNumber,
  invoiceDate,
  dueDate,
  items,
  total,
  downloadUrl,
}: InvoiceEmailProps) {
  const formatPrice = (price: number) => `¥${price.toFixed(2)}`;

  return (
    <Layout previewText={`发票 #${invoiceNumber}`}>
      <Heading style={h1}>发票 #${invoiceNumber}</Heading>

      <Section style={infoSection}>
        <Row>
          <Column style={infoColumn}>
            <Text style={label}>开票日期</Text>
            <Text style={value}>{invoiceDate}</Text>
          </Column>
          <Column style={infoColumn}>
            <Text style={label}>到期日期</Text>
            <Text style={value}>{dueDate}</Text>
          </Column>
        </Row>
      </Section>

      <Section style={tableSection}>
        <Row style={tableHeader}>
          <Column style={tableCell}>商品/服务</Column>
          <Column style={tableCell}>数量</Column>
          <Column style={tableCellRight}>金额</Column>
        </Row>
        {items.map((item, index) => (
          <Row key={index} style={tableRow}>
            <Column style={tableCell}>{item.description}</Column>
            <Column style={tableCell}>{item.quantity}</Column>
            <Column style={tableCellRight}>
              {formatPrice(item.price * item.quantity)}
            </Column>
          </Row>
        ))}
        <Row style={totalRow}>
          <Column style={tableCell} colSpan={2}></Column>
          <Column style={totalCell}>
            <strong>总计: {formatPrice(total)}</strong>
          </Column>
        </Row>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={downloadUrl}>
          下载 PDF 发票
        </Button>
      </Section>

      <Hr style={hr} />

      <Text style={text}>
        亲爱的 {customerName}，感谢您的惠顾！如有任何问题，请随时联系我们。
      </Text>
    </Layout>
  );
}

const h1 = {
  color: "#333",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 30px",
};

const infoSection = {
  marginBottom: "30px",
};

const infoColumn = {
  width: "50%",
};

const label = {
  color: "#8898aa",
  fontSize: "12px",
  margin: "0 0 5px",
};

const value = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0",
};

const tableSection = {
  marginBottom: "30px",
};

const tableHeader = {
  backgroundColor: "#f6f9fc",
};

const tableCell = {
  padding: "12px",
  fontSize: "14px",
  borderBottom: "1px solid #e6e6e6",
};

const tableCellRight = {
  padding: "12px",
  fontSize: "14px",
  borderBottom: "1px solid #e6e6e6",
  textAlign: "right" as const,
};

const tableRow = {
  backgroundColor: "#ffffff",
};

const totalRow = {
  backgroundColor: "#f6f9fc",
};

const totalCell = {
  padding: "12px",
  fontSize: "16px",
  textAlign: "right" as const,
};

const buttonContainer = {
  padding: "20px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#28a745",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  display: "inline-block",
  padding: "12px 30px",
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "30px 0",
};

const text = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "22px",
  textAlign: "center" as const,
};

export default InvoiceEmail;
```

### 订单确认邮件

```typescript
// src/emails/order-confirmation.tsx
import {
  Body,
  Container,
  Heading,
  Text,
  Button,
  Section,
  Row,
  Column,
  Hr,
  Img,
} from "@react-email/components";
import { Layout } from "./components/Layout";
import * as React from "react";

interface OrderItem {
  name: string;
  image: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  trackingUrl?: string;
}

export function OrderConfirmationEmail({
  orderNumber,
  customerName,
  items,
  subtotal,
  shipping,
  total,
  shippingAddress,
  trackingUrl,
}: OrderConfirmationEmailProps) {
  const formatPrice = (price: number) => `¥${price.toFixed(2)}`;

  return (
    <Layout previewText={`订单 #${orderNumber} 已确认`}>
      <Heading style={h1}>订单确认</Heading>

      <Section style={orderInfo}>
        <Row>
          <Column style={infoLeft}>
            <Text style={label}>订单号</Text>
            <Text style={value}>{orderNumber}</Text>
          </Column>
          <Column style={infoRight}>
            <Text style={label}>订单日期</Text>
            <Text style={value}>{new Date().toLocaleDateString("zh-CN")}</Text>
          </Column>
        </Row>
      </Section>

      <Section style={itemsSection}>
        {items.map((item, index) => (
          <Row key={index} style={itemRow}>
            <Column style={itemImageCol}>
              <Img src={item.image} alt={item.name} style={itemImage} />
            </Column>
            <Column style={itemDetailsCol}>
              <Text style={itemName}>{item.name}</Text>
              <Text style={itemQty}>数量: {item.quantity}</Text>
            </Column>
            <Column style={itemPriceCol}>
              <Text style={itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </Column>
          </Row>
        ))}
      </Section>

      <Section style={summarySection}>
        <Row>
          <Column style={summaryLabelCol}>
            <Text style={summaryLabel}>小计</Text>
          </Column>
          <Column style={summaryValueCol}>
            <Text style={summaryValue}>{formatPrice(subtotal)}</Text>
          </Column>
        </Row>
        <Row>
          <Column style={summaryLabelCol}>
            <Text style={summaryLabel}>运费</Text>
          </Column>
          <Column style={summaryValueCol}>
            <Text style={summaryValue}>{formatPrice(shipping)}</Text>
          </Column>
        </Row>
        <Row style={totalRow}>
          <Column style={summaryLabelCol}>
            <Text style={totalLabel}>总计</Text>
          </Column>
          <Column style={summaryValueCol}>
            <Text style={totalValue}>{formatPrice(total)}</Text>
          </Column>
        </Row>
      </Section>

      <Section style={addressSection}>
        <Heading as="h2" style={h2}>
          配送地址
        </Heading>
        <Text style={address}>
          {shippingAddress.street}
          <br />
          {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}
          <br />
          {shippingAddress.country}
        </Text>
      </Section>

      {trackingUrl && (
        <Section style={buttonContainer}>
          <Button style={button} href={trackingUrl}>
            查看物流信息
          </Button>
        </Section>
      )}

      <Hr style={hr} />

      <Text style={footer}>
        感谢您的购买，{customerName}！如有任何问题，请联系我们的客服团队。
      </Text>
    </Layout>
  );
}

const h1 = {
  color: "#333",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 30px",
};

const h2 = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 15px",
};

const orderInfo = {
  marginBottom: "30px",
};

const infoLeft = {
  width: "50%",
};

const infoRight = {
  width: "50%",
  textAlign: "right" as const,
};

const label = {
  color: "#8898aa",
  fontSize: "12px",
  margin: "0 0 5px",
};

const value = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0",
};

const itemsSection = {
  marginBottom: "20px",
};

const itemRow = {
  marginBottom: "15px",
};

const itemImageCol = {
  width: "80px",
  verticalAlign: "top" as const,
};

const itemImage = {
  width: "70px",
  height: "70px",
  objectFit: "cover" as const,
  borderRadius: "5px",
};

const itemDetailsCol = {
  paddingLeft: "15px",
  verticalAlign: "top" as const,
};

const itemName = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0 0 5px",
};

const itemQty = {
  color: "#8898aa",
  fontSize: "14px",
  margin: "0",
};

const itemPriceCol = {
  verticalAlign: "top" as const,
  textAlign: "right" as const,
};

const itemPrice = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0",
};

const summarySection = {
  backgroundColor: "#f6f9fc",
  padding: "20px",
  borderRadius: "5px",
  marginBottom: "30px",
};

const summaryLabelCol = {
  width: "70%",
};

const summaryValueCol = {
  width: "30%",
  textAlign: "right" as const,
};

const summaryLabel = {
  color: "#333",
  fontSize: "14px",
  margin: "5px 0",
};

const summaryValue = {
  color: "#333",
  fontSize: "14px",
  margin: "5px 0",
};

const totalRow = {
  borderTop: "2px solid #e6e6e6",
  marginTop: "10px",
  paddingTop: "10px",
};

const totalLabel = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0",
};

const totalValue = {
  color: "#28a745",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0",
};

const addressSection = {
  marginBottom: "30px",
};

const address = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

const buttonContainer = {
  padding: "20px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#5F51E8",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  display: "inline-block",
  padding: "12px 30px",
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "30px 0",
};

const footer = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "22px",
  textAlign: "center" as const,
};

export default OrderConfirmationEmail;
```

### 邮件发送工具

```typescript
// src/lib/email.ts
import { render } from "@react-email/render";
import { Resend } from "resend";
import WelcomeEmail from "@/emails/welcome";
import ResetPasswordEmail from "@/emails/reset-password";
import InvoiceEmail from "@/emails/invoice";
import OrderConfirmationEmail from "@/emails/order-confirmation";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailOptions) {
  try {
    const html = await render(react);

    const { data, error } = await resend.emails.send({
      from: "noreply@yourdomain.com",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error };
  }
}

// 便捷发送函数
export async function sendWelcomeEmail(
  email: string,
  username: string,
  loginUrl: string
) {
  return sendEmail({
    to: email,
    subject: "欢迎加入！",
    react: <WelcomeEmail username={username} loginUrl={loginUrl} />,
  });
}

export async function sendResetPasswordEmail(
  email: string,
  username: string,
  resetUrl: string,
  expiresIn: string = "1小时"
) {
  return sendEmail({
    to: email,
    subject: "重置您的密码",
    react: (
      <ResetPasswordEmail
        username={username}
        resetUrl={resetUrl}
        expiresIn={expiresIn}
      />
    ),
  });
}

export async function sendInvoiceEmail(
  email: string,
  props: React.ComponentProps<typeof InvoiceEmail>
) {
  return sendEmail({
    to: email,
    subject: `发票 #${props.invoiceNumber}`,
    react: <InvoiceEmail {...props} />,
  });
}

export async function sendOrderConfirmationEmail(
  email: string,
  props: React.ComponentProps<typeof OrderConfirmationEmail>
) {
  return sendEmail({
    to: email,
    subject: `订单 #${props.orderNumber} 已确认`,
    react: <OrderConfirmationEmail {...props} />,
  });
}
```

### Next.js API 路由

```typescript
// src/app/api/email/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail, sendResetPasswordEmail } from "@/lib/email";
import { z } from "zod";

const emailSchema = z.object({
  type: z.enum(["welcome", "reset-password"]),
  to: z.string().email(),
  data: z.record(z.any()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, data } = emailSchema.parse(body);

    let result;

    switch (type) {
      case "welcome":
        result = await sendWelcomeEmail(
          to,
          data.username,
          data.loginUrl
        );
        break;
      case "reset-password":
        result = await sendResetPasswordEmail(
          to,
          data.username,
          data.resetUrl,
          data.expiresIn
        );
        break;
      default:
        return NextResponse.json(
          { error: "Invalid email type" },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## 最佳实践

### 1. 响应式设计

```typescript
// 使用媒体查询适配不同设备
const main = {
  backgroundColor: "#ffffff",
  fontFamily: "sans-serif",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  "@media (max-width: 600px)": {
    padding: "20px",
  },
};
```

### 2. 样式内联

```typescript
// ✅ 使用内联样式（邮件客户端支持最好）
<Text style={{ color: "#333", fontSize: "16px" }}>文本内容</Text>

// ❌ 避免使用外部 CSS 或 <style> 标签（部分客户端不支持）
```

### 3. 图片处理

```typescript
// 使用绝对 URL
<Img src="https://example.com/logo.png" alt="Logo" />

// 添加宽度和高度
<Img src="https://example.com/banner.png" width="600" height="200" alt="Banner" />

// 提供备用文本
<Img src="https://example.com/product.jpg" alt="产品图片" />
```

### 4. 预览文本

```typescript
// 设置预览文本（在邮件客户端中显示）
<Preview>这是邮件的预览文本，显示在邮件列表中</Preview>

// 保持预览文本简洁明了
<Preview>您的订单 #12345 已发货</Preview>
```

### 5. 可访问性

```typescript
// 添加语义化的标题
<Heading as="h1">主标题</Heading>
<Heading as="h2">副标题</Heading>

// 使用描述性的链接文本
<Link href="https://example.com">查看订单详情</Link>
// 而不是
<Link href="https://example.com">点击这里</Link>
```

## 常用命令

```bash
# 安装核心包
npm install @react-email/components @react-email/render

# 安装邮件发送服务
npm install resend
# 或
npm install @sendgrid/mail
# 或
npm install nodemailer

# 启动预览服务器
npm run email:preview

# 构建 HTML
npm run email:build
```

## 配置文件

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "email:preview": "email preview",
    "email:build": "email build",
    "build": "next build && npm run email:build"
  },
  "dependencies": {
    "@react-email/components": "^0.0.15",
    "@react-email/render": "^0.0.12",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "resend": "^2.0.0"
  }
}
```

## TypeScript 类型

```typescript
// src/types/email.ts
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: any;
}

export interface WelcomeEmailData {
  username: string;
  loginUrl: string;
}

export interface ResetPasswordEmailData {
  username: string;
  resetUrl: string;
  expiresIn: string;
}

export interface InvoiceEmailData {
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  downloadUrl: string;
}
```

## 环境变量

```bash
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxx

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxx

# AWS SES
AWS_ACCESS_KEY_ID=xxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxx
AWS_REGION=us-east-1

# 发件人配置
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_REPLY_TO="support@yourdomain.com"
```

## 部署配置

```typescript
// next.config.js
module.exports = {
  experimental: {
    serverComponentsExternalPackages: ["@react-email/*"],
  },
};
```

### Vercel 部署

```json
// vercel.json
{
  "functions": {
    "src/app/api/email/send/route.ts": {
      "maxDuration": 10
    }
  }
}
```

## 测试和调试

```typescript
// 预览邮件
import { render } from "@react-email/render";
import WelcomeEmail from "@/emails/welcome";

const html = render(<WelcomeEmail username="张三" loginUrl="https://example.com" />);
console.log(html);

// 保存为文件进行预览
import fs from "fs";
fs.writeFileSync("preview.html", html);
```

```typescript
// 测试发送
import { sendWelcomeEmail } from "@/lib/email";

async function testEmail() {
  const result = await sendWelcomeEmail(
    "test@example.com",
    "测试用户",
    "https://example.com/login"
  );

  console.log("Email sent:", result);
}
```

## 性能优化

```typescript
// 1. 缓存渲染结果
const emailCache = new Map<string, string>();

async function getCachedEmail(key: string, render: () => Promise<string>) {
  if (emailCache.has(key)) {
    return emailCache.get(key)!;
  }

  const html = await render();
  emailCache.set(key, html);
  return html;
}

// 2. 批量发送
async function sendBatchEmails(
  emails: Array<{ to: string; data: any }>
) {
  const results = await Promise.allSettled(
    emails.map((email) =>
      sendWelcomeEmail(email.to, email.data.username, email.data.loginUrl)
    )
  );

  return results;
}

// 3. 使用队列处理大量邮件
import { Queue } from "bullmq";

const emailQueue = new Queue("emails");

await emailQueue.add("send-welcome", {
  to: "user@example.com",
  username: "张三",
  loginUrl: "https://example.com",
});
```

## 其他邮件服务集成

### SendGrid

```typescript
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendWithSendGrid(
  to: string,
  subject: string,
  html: string
) {
  await sgMail.send({
    to,
    from: "noreply@yourdomain.com",
    subject,
    html,
  });
}
```

### AWS SES

```typescript
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({ region: "us-east-1" });

export async function sendWithSES(
  to: string,
  subject: string,
  html: string
) {
  const command = new SendEmailCommand({
    Source: "noreply@yourdomain.com",
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: { Data: subject },
      Body: {
        Html: { Data: html },
      },
    },
  });

  await sesClient.send(command);
}
```
