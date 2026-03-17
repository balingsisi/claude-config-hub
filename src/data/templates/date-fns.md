# date-fns 日期处理模板

## 技术栈

- **核心库**: date-fns v3.6+
- **模块化**: 按需导入函数
- **类型支持**: TypeScript (内置)
- **国际化**: date-fns/locale
- **时区支持**: date-fns-tz
- **测试**: jest + @date-fns/tz

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
│   │   ├── timezone.ts        # 时区处理
│   │   └── locale.ts          # 国际化配置
│   └── constants.ts           # 日期常量
├── hooks/
│   ├── useRelativeTime.ts     # 相对时间 Hook
│   ├── useTimeAgo.ts          # 时间距离 Hook
│   └── useCountdown.ts        # 倒计时 Hook
├── components/
│   ├── DatePicker.tsx         # 日期选择器
│   ├── TimeAgo.tsx            # 相对时间显示
│   ├── Countdown.tsx          # 倒计时组件
│   └── DateRangePicker.tsx    # 日期范围选择器
├── formatters/
│   └── custom-formatters.ts   # 自定义格式化器
└── types/
    └── date.d.ts              # 类型定义
```

## 代码模式

### 1. 基础配置

```typescript
// src/utils/date/index.ts
import {
  format,
  parse,
  addDays,
  subDays,
  differenceInDays,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { zhCN, enUS, ja, ko, de, fr } from 'date-fns/locale';

// 默认语言
export const defaultLocale = zhCN;

// 支持的语言列表
export const locales = {
  'zh-CN': zhCN,
  'en-US': enUS,
  ja: ja,
  ko: ko,
  de: de,
  fr: fr,
} as const;

// 导出常用函数
export {
  format,
  parse,
  addDays,
  subDays,
  differenceInDays,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
};
```

### 2. 格式化函数

```typescript
// src/utils/date/format.ts
import { format, formatDistance, formatDistanceToNow, formatRelative } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 标准格式化
export const formatDate = (date: Date | string, formatStr = 'yyyy-MM-dd') => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr, { locale: zhCN });
};

export const formatDateTime = (date: Date | string) => {
  return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
};

export const formatTime = (date: Date | string) => {
  return formatDate(date, 'HH:mm:ss');
};

// 智能格式化
export const formatSmart = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  if (format(d, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
    return `今天 ${format(d, 'HH:mm')}`;
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (format(d, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
    return `昨天 ${format(d, 'HH:mm')}`;
  }
  
  if (format(d, 'yyyy') === format(now, 'yyyy')) {
    return format(d, 'MM-dd HH:mm');
  }
  
  return format(d, 'yyyy-MM-dd HH:mm');
};

// 相对时间
export const formatRelativeTime = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
};

// 距离时间
export const formatDistanceTime = (date1: Date | string, date2: Date | string) => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return formatDistance(d1, d2, { locale: zhCN });
};

// 友好时间
export const formatFriendly = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffMinutes < 24 * 60) return `${Math.floor(diffMinutes / 60)}小时前`;
  if (diffMinutes < 7 * 24 * 60) return `${Math.floor(diffMinutes / (24 * 60))}天前`;
  return format(d, 'yyyy-MM-dd');
};

// 自定义格式
export const formatCustom = (
  date: Date | string,
  template: string,
  options = {}
) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, template, { locale: zhCN, ...options });
};
```

### 3. 解析函数

```typescript
// src/utils/date/parse.ts
import { parse, parseISO, parseJSON, isValid } from 'date-fns';

// 解析字符串
export const parseDateString = (
  dateString: string,
  formatString: string,
  referenceDate?: Date
): Date | null => {
  const parsed = parse(dateString, formatString, referenceDate || new Date());
  return isValid(parsed) ? parsed : null;
};

// 解析 ISO 字符串
export const parseISOString = (isoString: string): Date | null => {
  try {
    const parsed = parseISO(isoString);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

// 解析 JSON 日期
export const parseJSONDate = (jsonDate: string): Date | null => {
  try {
    const parsed = parseJSON(jsonDate);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

// 智能解析
export const parseSmart = (input: string): Date | null => {
  const formats = [
    'yyyy-MM-dd',
    'yyyy/MM/dd',
    'yyyy-MM-dd HH:mm:ss',
    'yyyy/MM/dd HH:mm:ss',
    'MM-dd-yyyy',
    'dd/MM/yyyy',
    'yyyy年MM月dd日',
  ];
  
  for (const formatStr of formats) {
    const parsed = parseDateString(input, formatStr);
    if (parsed) return parsed;
  }
  
  // 尝试 ISO 格式
  const isoParsed = parseISOString(input);
  if (isoParsed) return isoParsed;
  
  // 尝试原生解析
  const native = new Date(input);
  if (isValid(native)) return native;
  
  return null;
};

// 验证日期
export const validateDate = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return isValid(d);
};
```

### 4. 计算函数

```typescript
// src/utils/date/calculate.ts
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  addHours,
  addMinutes,
  addSeconds,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  subHours,
  subMinutes,
  subSeconds,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  differenceInMilliseconds,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';

// 加法运算
export const add = {
  days: (date: Date | string, amount: number) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return addDays(d, amount);
  },
  weeks: (date: Date | string, amount: number) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return addWeeks(d, amount);
  },
  months: (date: Date | string, amount: number) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return addMonths(d, amount);
  },
  years: (date: Date | string, amount: number) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return addYears(d, amount);
  },
  hours: (date: Date | string, amount: number) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return addHours(d, amount);
  },
  minutes: (date: Date | string, amount: number) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return addMinutes(d, amount);
  },
  seconds: (date: Date | string, amount: number) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return addSeconds(d, amount);
  },
};

// 减法运算
export const subtract = {
  days: (date: Date | string, amount: number) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return subDays(d, amount);
  },
  weeks: (date: Date | string, amount: number) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return subWeeks(d, amount);
  },
  months: (date: Date | string, amount: number) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return subMonths(d, amount);
  },
  years: (date: Date | string, amount: number) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return subYears(d, amount);
  },
};

// 差值计算
export const diff = {
  inDays: (dateLeft: Date | string, dateRight: Date | string) => {
    const d1 = typeof dateLeft === 'string' ? new Date(dateLeft) : dateLeft;
    const d2 = typeof dateRight === 'string' ? new Date(dateRight) : dateRight;
    return differenceInDays(d1, d2);
  },
  inHours: (dateLeft: Date | string, dateRight: Date | string) => {
    const d1 = typeof dateLeft === 'string' ? new Date(dateLeft) : dateLeft;
    const d2 = typeof dateRight === 'string' ? new Date(dateRight) : dateRight;
    return differenceInHours(d1, d2);
  },
  inMinutes: (dateLeft: Date | string, dateRight: Date | string) => {
    const d1 = typeof dateLeft === 'string' ? new Date(dateLeft) : dateLeft;
    const d2 = typeof dateRight === 'string' ? new Date(dateRight) : dateRight;
    return differenceInMinutes(d1, d2);
  },
  inSeconds: (dateLeft: Date | string, dateRight: Date | string) => {
    const d1 = typeof dateLeft === 'string' ? new Date(dateLeft) : dateLeft;
    const d2 = typeof dateRight === 'string' ? new Date(dateRight) : dateRight;
    return differenceInSeconds(d1, d2);
  },
  inMilliseconds: (dateLeft: Date | string, dateRight: Date | string) => {
    const d1 = typeof dateLeft === 'string' ? new Date(dateLeft) : dateLeft;
    const d2 = typeof dateRight === 'string' ? new Date(dateRight) : dateRight;
    return differenceInMilliseconds(d1, d2);
  },
};

// 边界获取
export const boundaries = {
  startOfDay: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return startOfDay(d);
  },
  endOfDay: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return endOfDay(d);
  },
  startOfWeek: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return startOfWeek(d, { weekStartsOn: 1 });
  },
  endOfWeek: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return endOfWeek(d, { weekStartsOn: 1 });
  },
  startOfMonth: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return startOfMonth(d);
  },
  endOfMonth: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return endOfMonth(d);
  },
  startOfYear: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return startOfYear(d);
  },
  endOfYear: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return endOfYear(d);
  },
};
```

### 5. 比较函数

```typescript
// src/utils/date/compare.ts
import {
  isBefore,
  isAfter,
  isEqual,
  isWithinInterval,
  isToday,
  isYesterday,
  isTomorrow,
  isWeekend,
  isWeekday,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
  isLeapYear,
  getYear,
  getMonth,
  getDate,
  getDay,
  getHours,
  getMinutes,
  getSeconds,
} from 'date-fns';

// 时间比较
export const compare = {
  isBefore: (date: Date | string, dateToCompare: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const d2 = typeof dateToCompare === 'string' ? new Date(dateToCompare) : dateToCompare;
    return isBefore(d, d2);
  },
  isAfter: (date: Date | string, dateToCompare: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const d2 = typeof dateToCompare === 'string' ? new Date(dateToCompare) : dateToCompare;
    return isAfter(d, d2);
  },
  isEqual: (dateLeft: Date | string, dateRight: Date | string) => {
    const d1 = typeof dateLeft === 'string' ? new Date(dateLeft) : dateLeft;
    const d2 = typeof dateRight === 'string' ? new Date(dateRight) : dateRight;
    return isEqual(d1, d2);
  },
  isBetween: (
    date: Date | string,
    startDate: Date | string,
    endDate: Date | string
  ) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    return isWithinInterval(d, { start, end });
  },
};

// 日期判断
export const check = {
  isToday: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return isToday(d);
  },
  isYesterday: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return isYesterday(d);
  },
  isTomorrow: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return isTomorrow(d);
  },
  isWeekend: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return isWeekend(d);
  },
  isWorkday: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return isWeekday(d);
  },
  isLeapYear: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return isLeapYear(d);
  },
};

// 相同判断
export const isSame = {
  day: (dateLeft: Date | string, dateRight: Date | string) => {
    const d1 = typeof dateLeft === 'string' ? new Date(dateLeft) : dateLeft;
    const d2 = typeof dateRight === 'string' ? new Date(dateRight) : dateRight;
    return isSameDay(d1, d2);
  },
  week: (dateLeft: Date | string, dateRight: Date | string) => {
    const d1 = typeof dateLeft === 'string' ? new Date(dateLeft) : dateLeft;
    const d2 = typeof dateRight === 'string' ? new Date(dateRight) : dateRight;
    return isSameWeek(d1, d2);
  },
  month: (dateLeft: Date | string, dateRight: Date | string) => {
    const d1 = typeof dateLeft === 'string' ? new Date(dateLeft) : dateLeft;
    const d2 = typeof dateRight === 'string' ? new Date(dateRight) : dateRight;
    return isSameMonth(d1, d2);
  },
  year: (dateLeft: Date | string, dateRight: Date | string) => {
    const d1 = typeof dateLeft === 'string' ? new Date(dateLeft) : dateLeft;
    const d2 = typeof dateRight === 'string' ? new Date(dateRight) : dateRight;
    return isSameYear(d1, d2);
  },
};

// 获取日期部分
export const get = {
  year: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return getYear(d);
  },
  month: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return getMonth(d);
  },
  date: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return getDate(d);
  },
  day: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return getDay(d);
  },
  hours: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return getHours(d);
  },
  minutes: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return getMinutes(d);
  },
  seconds: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return getSeconds(d);
  },
};

// 年龄计算
export const getAge = (birthDate: Date | string) => {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  return differenceInYears(new Date(), birth);
};
```

### 6. 时区处理

```typescript
// src/utils/date/timezone.ts
import {
  formatInTimeZone,
  toZonedTime,
  fromZonedTime,
} from 'date-fns-tz';

// 转换到时区
export const toTimezone = (
  date: Date | string,
  timezone: string
) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return toZonedTime(d, timezone);
};

// 从时区转换
export const fromTimezone = (
  date: Date | string,
  timezone: string
) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return fromZonedTime(d, timezone);
};

// 在时区中格式化
export const formatInTimezone = (
  date: Date | string,
  timezone: string,
  formatStr = 'yyyy-MM-dd HH:mm:ss'
) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(d, timezone, formatStr);
};

// 常用时区
export const timezones = {
  UTC: 'UTC',
  Shanghai: 'Asia/Shanghai',
  Tokyo: 'Asia/Tokyo',
  NewYork: 'America/New_York',
  London: 'Europe/London',
  Paris: 'Europe/Paris',
  Sydney: 'Australia/Sydney',
} as const;

// UTC 转本地
export const utcToLocal = (utcDate: Date | string, localTimezone: string) => {
  const d = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return toZonedTime(d, localTimezone);
};

// 本地转 UTC
export const localToUtc = (localDate: Date | string, localTimezone: string) => {
  const d = typeof localDate === 'string' ? new Date(localDate) : localDate;
  return fromZonedTime(d, localTimezone);
};
```

### 7. React Hooks

```typescript
// src/hooks/useRelativeTime.ts
import { useState, useEffect } from 'react';
import { formatRelativeTime } from '@/utils/date/format';

export function useRelativeTime(date: Date | string, interval = 60000) {
  const [relativeTime, setRelativeTime] = useState(() =>
    formatRelativeTime(date)
  );

  useEffect(() => {
    const updateRelativeTime = () => {
      setRelativeTime(formatRelativeTime(date));
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

// src/hooks/useCountdown.ts
import { useState, useEffect } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';

export function useCountdown(targetDate: Date | string) {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;

    const updateCountdown = () => {
      const now = new Date();
      
      if (now >= target) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setCountdown({
        days: differenceInDays(target, now),
        hours: differenceInHours(target, now) % 24,
        minutes: differenceInMinutes(target, now) % 60,
        seconds: differenceInSeconds(target, now) % 60,
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return countdown;
}
```

### 8. React 组件

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

// src/components/Countdown.tsx
import { useCountdown } from '@/hooks/useCountdown';

interface CountdownProps {
  targetDate: Date | string;
  onComplete?: () => void;
  className?: string;
}

export function Countdown({ targetDate, onComplete, className }: CountdownProps) {
  const { days, hours, minutes, seconds } = useCountdown(targetDate);

  useEffect(() => {
    if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
      onComplete?.();
    }
  }, [days, hours, minutes, seconds, onComplete]);

  return (
    <div className={className}>
      {days > 0 && <span>{days}天 </span>}
      <span>{hours.toString().padStart(2, '0')}:</span>
      <span>{minutes.toString().padStart(2, '0')}:</span>
      <span>{seconds.toString().padStart(2, '0')}</span>
    </div>
  );
}

// src/components/DateRangePicker.tsx
import { useState } from 'react';
import { format } from 'date-fns';

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
    defaultStart ? format(defaultStart, 'yyyy-MM-dd') : ''
  );
  const [end, setEnd] = useState(
    defaultEnd ? format(defaultEnd, 'yyyy-MM-dd') : ''
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

### 1. 模块化导入

```typescript
// ✅ 按需导入（tree-shaking 友好）
import { format, addDays, parseISO } from 'date-fns';

// ❌ 避免导入整个库
// import * as dateFns from 'date-fns';

// ✅ 只导入需要的 locale
import { zhCN } from 'date-fns/locale';

// ❌ 避免导入所有 locale
// import * as locales from 'date-fns/locale';
```

### 2. 不可变性

```typescript
// ✅ date-fns 函数不会修改原始日期
const date = new Date('2024-01-01');
const newDate = addDays(date, 1);

console.log(date);    // 2024-01-01 (不变)
console.log(newDate); // 2024-01-02

// ✅ 所有操作返回新实例
const result = addDays(date, 1);
const final = addMonths(result, 1);
```

### 3. 类型安全

```typescript
// ✅ 使用 TypeScript 类型
import { format, parseISO } from 'date-fns';

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

// ✅ 严格类型检查
interface DateRange {
  start: Date;
  end: Date;
}

function isDateInRange(date: Date, range: DateRange): boolean {
  return isWithinInterval(date, range);
}
```

### 4. 错误处理

```typescript
// ✅ 验证日期
import { isValid, parseISO } from 'date-fns';

function safeParseDate(input: string): Date | null {
  try {
    const date = parseISO(input);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
}

// ✅ 处理无效输入
function formatDateSafe(date: Date | string | null): string {
  if (!date) return 'Invalid date';
  
  const d = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(d)) return 'Invalid date';
  
  return format(d, 'yyyy-MM-dd');
}
```

### 5. 性能优化

```typescript
// ✅ 重用 Date 实例
const now = new Date();
const today = startOfDay(now);
const tomorrow = addDays(now, 1);

// ❌ 避免重复创建
const today = startOfDay(new Date());
const tomorrow = addDays(new Date(), 1);

// ✅ 批量操作时缓存
function processDates(dates: string[]) {
  const now = new Date();
  return dates.map(dateStr => {
    const date = parseISO(dateStr);
    return differenceInDays(now, date);
  });
}
```

## 常用命令

```bash
# 安装核心库
npm install date-fns

# 安装时区支持
npm install date-fns-tz

# TypeScript 支持（内置）
# 无需额外安装

# 测试
npm test

# 构建工具会自动 tree-shaking
npm run build
```

## 函数分类

### 格式化函数

```typescript
format                  // 格式化日期
formatDistance          // 距离时间
formatDistanceToNow     // 距离现在
formatRelative          // 相对格式
formatISO               // ISO 格式
formatRFC3339           // RFC 3339
formatRFC7231           // RFC 7231
```

### 解析函数

```typescript
parse                   // 解析字符串
parseISO                // 解析 ISO
parseJSON               // 解析 JSON
isValid                 // 验证日期
isDate                  // 是否是 Date 对象
```

### 计算函数

```typescript
addDays, subDays        // 加减天
addWeeks, subWeeks      // 加减周
addMonths, subMonths    // 加减月
addYears, subYears      // 加减年
addHours, subHours      // 加减小时
addMinutes, subMinutes  // 加减分钟
addSeconds, subSeconds  // 加减秒
```

### 比较函数

```typescript
isBefore, isAfter       // 前后比较
isEqual                 // 相等
isWithinInterval        // 区间内
isToday, isYesterday    // 特定日期
isWeekend, isWeekday    // 周末/工作日
isSameDay, isSameMonth  // 相同判断
```

### 边界函数

```typescript
startOfDay, endOfDay    // 一天边界
startOfWeek, endOfWeek  // 一周边界
startOfMonth, endOfMonth // 一月边界
startOfYear, endOfYear  // 一年边界
startOfHour, endOfHour  // 小时边界
```

## 国际化

```typescript
// src/utils/date/locale.ts
import { zhCN, enUS, ja, ko, de, fr, es, pt, ru } from 'date-fns/locale';

export const supportedLocales = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja': ja,
  'ko': ko,
  'de': de,
  'fr': fr,
  'es': es,
  'pt': pt,
  'ru': ru,
} as const;

export function getLocale(localeCode: string) {
  return supportedLocales[localeCode as keyof typeof supportedLocales] || enUS;
}

// 使用 locale
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

format(new Date(), 'yyyy年MM月dd日', { locale: zhCN });
// "2024年01月15日"
```

## 扩展资源

- [date-fns 官方文档](https://date-fns.org/)
- [date-fns GitHub](https://github.com/date-fns/date-fns)
- [API 参考](https://date-fns.org/docs/)
- [时区支持](https://github.com/marnusw/date-fns-tz)
- [与 Moment.js 对比](https://date-fns.org/docs/Comparison-with-Moment.js)
