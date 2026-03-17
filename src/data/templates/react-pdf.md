# React PDF 文档处理模板

## 技术栈

### 核心技术
- **@react-pdf/renderer**: PDF 生成库
- **react-pdf**: PDF 查看库
- **React**: UI 框架
- **TypeScript**: 类型安全

### 特性
- PDF 文档生成
- PDF 文档查看
- 自定义样式
- 分页控制
- 文本和图片支持
- 表格和列表

## 项目结构

```
react-pdf-project/
├── src/
│   ├── components/
│   │   ├── pdf/
│   │   │   ├── PDFViewer.tsx
│   │   │   ├── PDFGenerator.tsx
│   │   │   ├── InvoicePDF.tsx
│   │   │   └── ReportPDF.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       └── Card.tsx
│   ├── documents/
│   │   ├── templates/
│   │   │   ├── InvoiceTemplate.tsx
│   │   │   └── ReportTemplate.tsx
│   │   └── styles/
│   │       └── pdfStyles.ts
│   ├── hooks/
│   │   ├── usePDFGenerator.ts
│   │   └── usePDFViewer.ts
│   ├── lib/
│   │   ├── pdfUtils.ts
│   │   └── pdfService.ts
│   ├── types/
│   │   └── pdf.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## 核心代码模式

### 1. 基础 PDF 生成

```tsx
// src/documents/templates/InvoiceTemplate.tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// 注册字体（可选）
Font.register({
  family: "Oswald",
  src: "https://fonts.gstatic.com/s/oswald/v13/Y_TKV6o8WovbUd3m_X9aAA.ttf",
});

// 创建样式
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#3b82f6",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e40af",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 5,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    fontSize: 10,
    color: "#64748b",
  },
  value: {
    fontSize: 12,
    fontWeight: "bold",
  },
  table: {
    display: "table",
    width: "100%",
    marginTop: 20,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: "#f1f5f9",
    fontWeight: "bold",
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    paddingHorizontal: 4,
  },
  total: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#3b82f6",
  },
});

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  total: number;
}

export function InvoiceTemplate({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>发票</Text>
          <Text style={styles.subtitle}>#{data.invoiceNumber}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>开票日期</Text>
              <Text style={styles.value}>{data.date}</Text>
            </View>
            <View>
              <Text style={styles.label}>到期日期</Text>
              <Text style={styles.value}>{data.dueDate}</Text>
            </View>
          </View>

          <View style={{ marginTop: 20 }}>
            <Text style={styles.label}>客户信息</Text>
            <Text style={styles.value}>{data.clientName}</Text>
            <Text style={styles.label}>{data.clientEmail}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>项目描述</Text>
            <Text style={[styles.tableCell, { textAlign: "right" }]}>
              数量
            </Text>
            <Text style={[styles.tableCell, { textAlign: "right" }]}>
              单价
            </Text>
            <Text style={[styles.tableCell, { textAlign: "right" }]}>
              小计
            </Text>
          </View>

          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{item.description}</Text>
              <Text style={[styles.tableCell, { textAlign: "right" }]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCell, { textAlign: "right" }]}>
                ¥{item.price.toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, { textAlign: "right" }]}>
                ¥{(item.quantity * item.price).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.total}>
          <View style={styles.row}>
            <Text style={{ fontSize: 14, fontWeight: "bold" }}>总计</Text>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1e40af" }}>
              ¥{data.total.toFixed(2)}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
```

### 2. PDF 生成器组件

```tsx
// src/components/pdf/PDFGenerator.tsx
import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { InvoiceTemplate } from "@/documents/templates/InvoiceTemplate";
import { Button } from "@/components/ui/Button";

interface PDFGeneratorProps {
  data: InvoiceData;
  fileName?: string;
}

export function PDFGenerator({ data, fileName = "invoice.pdf" }: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(<InvoiceTemplate data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF 生成失败:", error);
      alert("PDF 生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const previewPDF = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(<InvoiceTemplate data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error("PDF 预览失败:", error);
      alert("PDF 预览失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-x-2">
      <Button onClick={previewPDF} disabled={isGenerating}>
        {isGenerating ? "生成中..." : "预览 PDF"}
      </Button>
      <Button onClick={generatePDF} disabled={isGenerating} variant="primary">
        {isGenerating ? "生成中..." : "下载 PDF"}
      </Button>
    </div>
  );
}
```

### 3. PDF 查看器组件

```tsx
// src/components/pdf/PDFViewer.tsx
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// 设置 PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  file: string | File | Blob;
  width?: number;
}

export function PDFViewer({ file, width = 600 }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  return (
    <div className="space-y-4">
      {/* 控制栏 */}
      <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="px-3 py-1 bg-white rounded disabled:opacity-50"
          >
            上一页
          </button>
          <span>
            {pageNumber} / {numPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="px-3 py-1 bg-white rounded disabled:opacity-50"
          >
            下一页
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="px-3 py-1 bg-white rounded disabled:opacity-50"
          >
            -
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button
            onClick={zoomIn}
            disabled={scale >= 3.0}
            className="px-3 py-1 bg-white rounded disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>

      {/* PDF 显示区域 */}
      <div className="border rounded-lg overflow-auto" style={{ maxHeight: "600px" }}>
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="p-8 text-center">加载中...</div>}
          error={<div className="p-8 text-center text-red-500">PDF 加载失败</div>}
        >
          <Page
            pageNumber={pageNumber}
            width={width * scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
}
```

### 4. 报告模板

```tsx
// src/documents/templates/ReportTemplate.tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#3b82f6",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e40af",
  },
  date: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 5,
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1e40af",
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.6,
    marginBottom: 10,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 5,
    paddingLeft: 15,
  },
  bullet: {
    width: 10,
    fontSize: 11,
  },
  listItemText: {
    flex: 1,
    fontSize: 11,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
    color: "#64748b",
  },
});

interface ReportData {
  title: string;
  date: string;
  author: string;
  sections: {
    title: string;
    content: string | string[];
  }[];
}

export function ReportTemplate({ data }: { data: ReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.date}>
            生成日期: {data.date} | 作者: {data.author}
          </Text>
        </View>

        {data.sections.map((section, index) => (
          <View key={index} style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {Array.isArray(section.content) ? (
              section.content.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listItemText}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.paragraph}>{section.content}</Text>
            )}
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>机密报告</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `第 ${pageNumber} 页，共 ${totalPages} 页`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
```

### 5. PDF 生成 Hook

```tsx
// src/hooks/usePDFGenerator.ts
import { useState, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { ReactElement } from "react";

export function usePDFGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateBlob = useCallback(
    async (document: ReactElement) => {
      setIsGenerating(true);
      setError(null);

      try {
        const blob = await pdf(document).toBlob();
        return blob;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "PDF 生成失败";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const downloadPDF = useCallback(
    async (document: ReactElement, filename: string) => {
      const blob = await generateBlob(document);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [generateBlob]
  );

  const previewPDF = useCallback(
    async (document: ReactElement) => {
      const blob = await generateBlob(document);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    },
    [generateBlob]
  );

  const getBase64 = useCallback(
    async (document: ReactElement) => {
      const blob = await generateBlob(document);
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    },
    [generateBlob]
  );

  return {
    isGenerating,
    error,
    generateBlob,
    downloadPDF,
    previewPDF,
    getBase64,
  };
}
```

### 6. PDF 工具函数

```typescript
// src/lib/pdfUtils.ts
export function formatCurrency(amount: number, currency: string = "CNY"): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}-${random}`;
}

export function calculateTotal(items: Array<{ quantity: number; price: number }>): number {
  return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
```

### 7. 完整发票生成器

```tsx
// src/components/pdf/InvoicePDF.tsx
import { useState } from "react";
import { InvoiceTemplate } from "@/documents/templates/InvoiceTemplate";
import { usePDFGenerator } from "@/hooks/usePDFGenerator";
import { generateInvoiceNumber, calculateTotal, addDays } from "@/lib/pdfUtils";

export function InvoicePDF() {
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    items: [{ description: "", quantity: 1, price: 0 }],
  });

  const { downloadPDF, previewPDF, isGenerating } = usePDFGenerator();

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, price: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (
    index: number,
    field: keyof typeof formData.items[0],
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleGenerate = async (action: "preview" | "download") => {
    const today = new Date();
    const invoiceData = {
      invoiceNumber: generateInvoiceNumber(),
      date: today.toISOString().split("T")[0],
      dueDate: addDays(today, 30).toISOString().split("T")[0],
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      items: formData.items,
      total: calculateTotal(formData.items),
    };

    const document = <InvoiceTemplate data={invoiceData} />;

    if (action === "preview") {
      await previewPDF(document);
    } else {
      await downloadPDF(document, `invoice-${invoiceData.invoiceNumber}.pdf`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">生成发票</h1>

      {/* 客户信息 */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold">客户信息</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">客户名称</label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) =>
                setFormData({ ...formData, clientName: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">邮箱地址</label>
            <input
              type="email"
              value={formData.clientEmail}
              onChange={(e) =>
                setFormData({ ...formData, clientEmail: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* 项目列表 */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">项目明细</h2>
          <button
            onClick={addItem}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            添加项目
          </button>
        </div>

        {formData.items.map((item, index) => (
          <div key={index} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">描述</label>
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateItem(index, "description", e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium mb-1">数量</label>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(index, "quantity", parseInt(e.target.value) || 0)
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium mb-1">单价</label>
              <input
                type="number"
                value={item.price}
                onChange={(e) =>
                  updateItem(index, "price", parseFloat(e.target.value) || 0)
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium mb-1">小计</label>
              <div className="px-3 py-2 bg-gray-50 border rounded">
                ¥{(item.quantity * item.price).toFixed(2)}
              </div>
            </div>
            {formData.items.length > 1 && (
              <button
                onClick={() => removeItem(index)}
                className="px-3 py-2 text-red-500 hover:bg-red-50 rounded"
              >
                删除
              </button>
            )}
          </div>
        ))}

        <div className="flex justify-end pt-4 border-t">
          <div className="text-xl font-bold">
            总计: ¥{calculateTotal(formData.items).toFixed(2)}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4">
        <button
          onClick={() => handleGenerate("preview")}
          disabled={isGenerating}
          className="flex-1 px-6 py-3 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
        >
          {isGenerating ? "生成中..." : "预览 PDF"}
        </button>
        <button
          onClick={() => handleGenerate("download")}
          disabled={isGenerating}
          className="flex-1 px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isGenerating ? "生成中..." : "下载 PDF"}
        </button>
      </div>
    </div>
  );
}
```

### 8. 完整应用示例

```tsx
// src/App.tsx
import { InvoicePDF } from "./components/pdf/InvoicePDF";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <InvoicePDF />
    </div>
  );
}
```

## package.json

```json
{
  "name": "react-pdf-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@react-pdf/renderer": "^3.4.4",
    "react-pdf": "^7.7.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.10"
  }
}
```

## 最佳实践

1. **性能优化**
   - 使用分页加载大型 PDF
   - 缓存生成的 PDF
   - 异步生成避免阻塞 UI

2. **样式设计**
   - 使用 StyleSheet.create 定义样式
   - 保持样式一致性
   - 支持中文字体

3. **错误处理**
   - 处理字体加载失败
   - 提供友好的错误提示
   - 支持重新生成

4. **功能扩展**
   - 支持自定义模板
   - 添加水印功能
   - 支持数字签名

5. **可访问性**
   - 提供文本层渲染
   - 支持屏幕阅读器
   - 合理的对比度

## 常见问题

**Q: 如何添加中文字体？**
A: 使用 Font.register() 注册中文字体，然后在样式中指定 font-family

**Q: 如何处理大型 PDF？**
A: 使用分页，只渲染可见页面，使用虚拟滚动

**Q: 如何添加水印？**
A: 在 Page 组件中添加绝对定位的 View 和 Text

**Q: 如何实现 PDF 编辑？**
A: React PDF 主要用于生成，编辑需要使用其他库如 PDF-lib

## 相关资源

- [React PDF 官方文档](https://react-pdf.org/)
- [PDF.js 文档](https://mozilla.github.io/pdf.js/)
- [@react-pdf/renderer GitHub](https://github.com/diegomura/react-pdf)
