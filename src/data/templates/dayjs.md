# Day.js 日期处理模板

## 技术栈

- **核心库**: dayjs v1.11+
- **插件系统**: dayjs 插件（timezone, utc, duration 等）
- **国际化**: dayjs locale
- **类型支持**: TypeScript
- **框架集成**: React, Vue, Node.js
- **测试**: @mockdate/mockdate

## 项目结构

```
src/
├── utils/
│   ├── date/
│   │   ├── index.ts           # 导出所有日期工具
│   │   ├── format.ts          # 格式化函数
│   │   ├── parse.ts           # 解析函数
│   │   ├── calculate.ts       # 计算函数
│   │   ├── compare.ts         # 比较函数
│   │   └── locale.ts          # 国际化配置
│   └── constants.ts           # 日期常量
├── hooks/
│   ├── useRelativeTime.ts     # 相对时间 Hook
│   └── useTimeAgo.ts          # 时间距离 Hook
├── components/
│   ├── DatePicker.tsx         # 日期选择器
│   ├── TimeAgo.tsx            # 相对时间显示
│   └── DateRangePicker.tsx    # 日期范围选择器
├── plugins/
│   └── dayjs-plugins.ts       # 自定义插件
└── types/
    └── date.d.ts              # 类型定义
```

## 代码模式

### 1. Day.js 初始化配置

```typescript
// src/utils/date/index.ts
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import 'dayjs/locale/zh-cn';

// 扩展插件
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);

// 设置默认时区和语言
dayjs.tz.setDefault('Asia/Shanghai');
dayjs.locale('zh-cn');

export default dayjs;

// 导出类型
export type Dayjs = dayjs.Dayjs;
```

### 2. 格式化函数

```typescript
// src/utils/date/format.ts
import dayjs from './index';

// 标准格式化
export const formatDate = (date: Date | string, format = 'YYYY-MM-DD') => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: Date | string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const formatTime = (date: Date | string) => {
  return dayjs(date).format('HH:mm:ss');
};

// 智能格式化
export const formatSmart = (date: Date | string) => {
  const d = dayjs(date);
  const now = dayjs();
  
  if (d.isSame(now, 'day')) {
    return `今天 ${d.format('HH:mm')}`;
  } else if (d.isSame(now.subtract(1, 'day'), 'day')) {
    return `昨天 ${d.format('HH:mm')}`;
  } else if (d.isSame(now, 'year')) {
    return d.format('MM-DD HH:mm');
  } else {
    return d.format('YYYY-MM-DD HH:mm');
  }
};

// 相对时间
export const formatRelative = (date: Date | string) => {
  return dayjs(date).fromNow();
};

// 友好时间
export const formatFriendly = (date: Date | string) => {
  const d = dayjs(date);
  const now = dayjs();
  const diffMinutes = now.diff(d, 'minute');
  
  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffMinutes < 24 * 60) return `${Math.floor(diffMinutes / 60)}小时前`;
  if (diffMinutes < 7 * 24 * 60) return `${Math.floor(diffMinutes / (24 * 60))}天前`;
  return d.format('YYYY-MM-DD');
};

// 时区转换
export const convertTimezone = (
  date: Date | string,
  fromTz: string,
  toTz: string
) => {
  return dayjs(date).tz(fromTz).tz(toTz);
};

// UTC 转本地
export const utcToLocal = (date: Date | string) => {
  return dayjs.utc(date).local();
};

// 本地转 UTC
export const localToUtc = (date: Date | string) => {
  return dayjs(date).utc();
};
```

### 3. 解析函数

```typescript
// src/utils/date/parse.ts
import dayjs from './index';

// 解析多种格式
export const parseDate = (input: string | Date | number) => {
  return dayjs(input);
};

// 自定义格式解析
export const parseCustomFormat = (
  input: string,
  format: string
): dayjs.Dayjs | null => {
  const parsed = dayjs(input, format);
  return parsed.isValid() ? parsed : null;
};

// 解析时间戳（毫秒）
export const parseTimestamp = (timestamp: number) => {
  return dayjs(timestamp);
};

// 解析 Unix 时间戳（秒）
export const parseUnix = (unix: number) => {
  return dayjs.unix(unix);
};

// 智能解析
export const parseSmart = (input: string): dayjs.Dayjs | null => {
  const formats = [
    'YYYY-MM-DD',
    'YYYY/MM/DD',
    'YYYY-MM-DD HH:mm:ss',
    'YYYY/MM/DD HH:mm:ss',
    'MM-DD-YYYY',
    'DD/MM/YYYY',
  ];
  
  for (const format of formats) {
    const parsed = dayjs(input, format);
    if (parsed.isValid()) {
      return parsed;
    }
  }
  
  return null;
};

// ISO 8601 解析
export const parseISO = (isoString: string) => {
  const parsed = dayjs(isoString);
  return parsed.isValid() ? parsed : null;
};
```

### 4. 计算函数

```typescript
// src/utils/date/calculate.ts
import dayjs from './index';

// 加减时间
export const addDays = (date: Date | string, days: number) => {
  return dayjs(date).add(days, 'day');
};

export const subtractDays = (date: Date | string, days: number) => {
  return dayjs(date).subtract(days, 'day');
};

export const addMonths = (date: Date | string, months: number) => {
  return dayjs(date).add(months, 'month');
};

export const addYears = (date: Date | string, years: number) => {
  return dayjs(date).add(years, 'year');
};

// 计算差值
export const diffInDays = (date1: Date | string, date2: Date | string) => {
  return dayjs(date1).diff(dayjs(date2), 'day');
};

export const diffInHours = (date1: Date | string, date2: Date | string) => {
  return dayjs(date1).diff(dayjs(date2), 'hour');
};

export const diffInMinutes = (date1: Date | string, date2: Date | string) => {
  return dayjs(date1).diff(dayjs(date2), 'minute');
};

export const diffInSeconds = (date1: Date | string, date2: Date | string) => {
  return dayjs(date1).diff(dayjs(date2), 'second');
};

// 获取边界
export const startOfDay = (date: Date | string) => {
  return dayjs(date).startOf('day');
};

export const endOfDay = (date: Date | string) => {
  return dayjs(date).endOf('day');
};

export const startOfWeek = (date: Date | string) => {
  return dayjs(date).startOf('week');
};

export const endOfWeek = (date: Date | string) => {
  return dayjs(date).endOf('week');
};

export const startOfMonth = (date: Date | string) => {
  return dayjs(date).startOf('month');
};

export const endOfMonth = (date: Date | string) => {
  return dayjs(date).endOf('month');
};

// Duration 处理
export const formatDuration = (milliseconds: number) => {
  const dur = dayjs.duration(milliseconds);
  const hours = Math.floor(dur.asHours());
  const minutes = dur.minutes();
  const seconds = dur.seconds();
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export const humanizeDuration = (milliseconds: number) => {
  const dur = dayjs.duration(milliseconds);
  return dur.humanize();
};
```

### 5. 比较函数

```typescript
// src/utils/date/compare.ts
import dayjs from './index';

// 是否之前
export const isBefore = (date1: Date | string, date2: Date | string) => {
  return dayjs(date1).isBefore(dayjs(date2));
};

// 是否之后
export const isAfter = (date1: Date | string, date2: Date | string) => {
  return dayjs(date1).isAfter(dayjs(date2));
};

// 是否相同
export const isSame = (
  date1: Date | string,
  date2: Date | string,
  unit: 'day' | 'month' | 'year' = 'day'
) => {
  return dayjs(date1).isSame(dayjs(date2), unit);
};

// 是否在范围内
export const isBetween = (
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string
) => {
  return dayjs(date).isBetween(dayjs(startDate), dayjs(endDate));
};

// 是否今天
export const isToday = (date: Date | string) => {
  return dayjs(date).isSame(dayjs(), 'day');
};

// 是否昨天
export const isYesterday = (date: Date | string) => {
  return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day');
};

// 是否明天
export const isTomorrow = (date: Date | string) => {
  return dayjs(date).isSame(dayjs().add(1, 'day'), 'day');
};

// 是否周末
export const isWeekend = (date: Date | string) => {
  const day = dayjs(date).day();
  return day === 0 || day === 6;
};

// 是否工作日
export const isWorkday = (date: Date | string) => {
  return !isWeekend(date);
};

// 是否闰年
export const isLeapYear = (date: Date | string) => {
  const year = dayjs(date).year();
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

// 比较年龄
export const getAge = (birthDate: Date | string) => {
  return dayjs().diff(dayjs(birthDate), 'year');
};
```

### 6. React Hooks

```typescript
// src/hooks/useRelativeTime.ts
import { useState, useEffect } from 'react';
import dayjs from '@/utils/date';

export function useRelativeTime(date: Date | string, interval = 60000) {
  const [relativeTime, setRelativeTime] = useState(() =>
    dayjs(date).fromNow()
  );

  useEffect(() => {
    const updateRelativeTime = () => {
      setRelativeTime(dayjs(date).fromNow());
    };

    updateRelativeTime();

    const timer = setInterval(updateRelativeTime, interval);

    return () => clearInterval(timer);
  }, [date, interval]);

  return relativeTime;
}

// src/hooks/useTimeAgo.ts
import { useState, useEffect } from 'react';
import { formatFriendly } from '@/utils/date/format';

export function useTimeAgo(date: Date | string, interval = 60000) {
  const [timeAgo, setTimeAgo] = useState(() => formatFriendly(date));

  useEffect(() => {
    const updateTimeAgo = () => {
      setTimeAgo(formatFriendly(date));
    };

    updateTimeAgo();

    const timer = setInterval(updateTimeAgo, interval);

    return () => clearInterval(timer);
  }, [date, interval]);

  return timeAgo;
}

// 使用示例
function PostDate({ date }: { date: string }) {
  const timeAgo = useTimeAgo(date);
  
  return <time dateTime={date}>{timeAgo}</time>;
}
```

### 7. React 组件

```typescript
// src/components/TimeAgo.tsx
import { useTimeAgo } from '@/hooks/useTimeAgo';

interface TimeAgoProps {
  date: Date | string;
  interval?: number;
  className?: string;
}

export function TimeAgo({ date, interval = 60000, className }: TimeAgoProps) {
  const timeAgo = useTimeAgo(date, interval);
  
  return (
    <time
      dateTime={new Date(date).toISOString()}
      className={className}
      title={new Date(date).toLocaleString()}
    >
      {timeAgo}
    </time>
  );
}

// src/components/DateRangePicker.tsx
import { useState } from 'react';
import dayjs from '@/utils/date';

interface DateRangePickerProps {
  onChange: (range: { start: Date; end: Date }) => void;
  defaultStart?: Date;
  defaultEnd?: Date;
}

export function DateRangePicker({
  onChange,
  defaultStart,
  defaultEnd,
}: DateRangePickerProps) {
  const [start, setStart] = useState(
    defaultStart ? dayjs(defaultStart).format('YYYY-MM-DD') : ''
  );
  const [end, setEnd] = useState(
    defaultEnd ? dayjs(defaultEnd).format('YYYY-MM-DD') : ''
  );

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setStart(newStart);
    if (newStart && end) {
      onChange({
        start: new Date(newStart),
        end: new Date(end),
      });
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value;
    setEnd(newEnd);
    if (start && newEnd) {
      onChange({
        start: new Date(start),
        end: new Date(newEnd),
      });
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="date"
        value={start}
        onChange={handleStartChange}
        max={end || undefined}
      />
      <input
        type="date"
        value={end}
        onChange={handleEndChange}
        min={start || undefined}
      />
    </div>
  );
}
```

## 最佳实践

### 1. 不可变性

```typescript
// ✅ Day.js 对象是不可变的
const date1 = dayjs('2024-01-01');
const date2 = date1.add(1, 'day');

console.log(date1.format('YYYY-MM-DD')); // 2024-01-01 (不变)
console.log(date2.format('YYYY-MM-DD')); // 2024-01-02

// ✅ 所有操作返回新实例
const newDate = date1
  .add(1, 'day')
  .subtract(2, 'hour')
  .startOf('week');
```

### 2. 时区处理

```typescript
// ✅ 明确指定时区
const utcDate = dayjs.utc('2024-01-01T00:00:00Z');
const localDate = utcDate.local();

// ✅ 转换时区
const tokyoDate = dayjs.tz('2024-01-01 00:00', 'Asia/Tokyo');
const newYorkDate = tokyoDate.tz('America/New_York');

// ✅ 保存时使用 UTC
const saveToDatabase = dayjs().utc().toISOString();
```

### 3. 链式调用

```typescript
// ✅ 链式操作
const result = dayjs()
  .startOf('month')
  .add(1, 'week')
  .subtract(1, 'day')
  .endOf('day')
  .format('YYYY-MM-DD HH:mm:ss');

// ✅ 组合多个操作
const lastDayOfNextMonth = dayjs()
  .add(1, 'month')
  .endOf('month');
```

### 4. 类型安全

```typescript
// ✅ 使用 TypeScript 类型
import { Dayjs } from 'dayjs';

function formatDate(date: Dayjs | Date | string): string {
  return dayjs(date).format('YYYY-MM-DD');
}

// ✅ 严格类型检查
interface DateRange {
  start: Dayjs;
  end: Dayjs;
}

function isDateInRange(date: Dayjs, range: DateRange): boolean {
  return date.isBetween(range.start, range.end);
}
```

### 5. 性能优化

```typescript
// ✅ 重用 dayjs 实例
const now = dayjs();
const today = now.startOf('day');
const tomorrow = now.add(1, 'day').startOf('day');

// ❌ 避免重复创建
const today = dayjs().startOf('day');
const tomorrow = dayjs().add(1, 'day').startOf('day'); // 不必要地创建了两次

// ✅ 批量操作时缓存
function processDates(dates: string[]) {
  const now = dayjs();
  return dates.map(date => now.diff(dayjs(date), 'day'));
}
```

## 常用命令

```bash
# 安装
npm install dayjs

# 安装插件（按需）
npm install dayjs

# 类型支持（TypeScript）
npm install -D @types/dayjs

# 测试
npm test

# 构建工具会自动 tree-shaking
npm run build
```

## 插件列表

### 必备插件

```typescript
// UTC 支持
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

// 时区支持
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(timezone);

// 相对时间
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

// Duration
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

// 自定义格式解析
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

// 区间判断
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

// 星期几
import weekday from 'dayjs/plugin/weekday';
dayjs.extend(weekday);

// 周数
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekOfYear);

// 季度
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
dayjs.extend(quarterOfYear);
```

### 可选插件

```typescript
// 复数支持
import pluralFormat from 'dayjs/plugin/pluralFormat';
dayjs.extend(pluralFormat);

// 日历时间
import calendar from 'dayjs/plugin/calendar';
dayjs.extend(calendar);

// 本地化数据
import localeData from 'dayjs/plugin/localeData';
dayjs.extend(localeData);

// 年中第几天
import dayOfYear from 'dayjs/plugin/dayOfYear';
dayjs.extend(dayOfYear);

// ISO 周
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);

// 最小/最大值
import minMax from 'dayjs/plugin/minMax';
dayjs.extend(minMax);

// 对象支持
import objectSupport from 'dayjs/plugin/objectSupport';
dayjs.extend(objectSupport);
```

## 国际化

```typescript
// src/utils/date/locale.ts
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/ja';
import 'dayjs/locale/ko';
import 'dayjs/locale/es';
import 'dayjs/locale/fr';
import 'dayjs/locale/de';

export const setLocale = (locale: string) => {
  dayjs.locale(locale);
};

export const getCurrentLocale = () => {
  return dayjs.locale();
};

// 根据用户偏好自动设置
export const initLocale = () => {
  const browserLang = navigator.language.toLowerCase();
  const supportedLocales = ['zh-cn', 'en', 'ja', 'ko', 'es', 'fr', 'de'];
  
  const locale = supportedLocales.find(l => browserLang.startsWith(l)) || 'en';
  setLocale(locale);
  
  return locale;
};
```

## 测试配置

### MockDate

```typescript
// src/test/setup.ts
import MockDate from 'mockdate';

beforeAll(() => {
  // 固定时间
  MockDate.set('2024-01-15T10:00:00');
});

afterAll(() => {
  MockDate.reset();
});

// 测试中使用
it('formats current date', () => {
  const result = formatDate(new Date());
  expect(result).toBe('2024-01-15');
});
```

## 扩展资源

- [Day.js 官方文档](https://day.js.org/)
- [Day.js GitHub](https://github.com/iamkun/dayjs)
- [插件列表](https://day.js.org/docs/en/plugin/plugin)
- [国际化](https://day.js.org/docs/en/i18n/i18n)
- [Moment.js 迁移指南](https://day.js.org/docs/en/migration-guide)
