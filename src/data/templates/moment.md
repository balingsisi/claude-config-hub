# Moment.js 日期处理模板

## 技术栈

- **Moment.js**: 2.x (日期处理库)
- **TypeScript**: 5.x
- **本地化**: 多语言支持
- **测试**: Vitest

## 项目结构

```
src/
├── utils/                     # 工具函数
│   ├── date/                 # 日期工具
│   │   ├── format.ts         # 格式化
│   │   ├── parse.ts          # 解析
│   │   ├── manipulate.ts     # 操作
│   │   ├── query.ts          # 查询
│   │   └── duration.ts       # 时长
│   ├── locale/               # 本地化
│   │   ├── index.ts          # 配置
│   │   └── formatters.ts     # 格式化器
│   └── timezone/             # 时区
│       ├── index.ts          # 配置
│       └── convert.ts        # 转换
├── hooks/                    # React Hooks
│   ├── useMoment.ts          # Moment hook
│   ├── useCountdown.ts       # 倒计时
│   ├── useTimeAgo.ts         # 相对时间
│   └── useCalendar.ts        # 日历
├── components/               # 组件
│   ├── DatePicker/
│   ├── TimePicker/
│   ├── DateRangePicker/
│   └── CountdownTimer/
└── __tests__/               # 测试
    ├── utils/
    └── hooks/
```

## 代码模式

### 基础使用

```typescript
// utils/date/format.ts
import moment from 'moment';
import 'moment/locale/zh-cn';

// 配置本地化
moment.locale('zh-cn');

// 格式化日期
export function formatDate(
  date: moment.MomentInput,
  format: string = 'YYYY-MM-DD'
): string {
  return moment(date).format(format);
}

// 常用格式
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DATETIME_FULL: 'YYYY年MM月DD日 HH:mm:ss',
  MONTH: 'YYYY-MM',
  YEAR: 'YYYY',
  TIMESTAMP: 'x',
  ISO: moment.ISO_8601,
  RELATIVE: 'fromNow',
} as const;

// 预定义格式化器
export function formatDateStandard(date: moment.MomentInput): string {
  return formatDate(date, DATE_FORMATS.DATE);
}

export function formatDateTime(date: moment.MomentInput): string {
  return formatDate(date, DATE_FORMATS.DATETIME);
}

export function formatTime(date: moment.MomentInput): string {
  return formatDate(date, DATE_FORMATS.TIME);
}

// 相对时间
export function formatRelativeTime(
  date: moment.MomentInput,
  withoutSuffix = false
): string {
  return moment(date).fromNow(withoutSuffix);
}

// 日历时间
export function formatCalendarTime(
  date: moment.MomentInput,
  formats?: moment.CalendarSpec
): string {
  return moment(date).calendar(undefined, formats);
}

// 自定义日历格式
export const calendarFormats: moment.CalendarSpec = {
  sameDay: '[今天] LT',
  nextDay: '[明天] LT',
  nextWeek: 'dddd LT',
  lastDay: '[昨天] LT',
  lastWeek: '[上周] dddd LT',
  sameElse: 'L',
};

// 使用示例
const now = new Date();

formatDateStandard(now);        // '2024-01-15'
formatDateTime(now);            // '2024-01-15 14:30:00'
formatTime(now);                // '14:30:00'
formatRelativeTime(now);        // '几秒前'
formatCalendarTime(now, calendarFormats); // '今天 14:30'
```

### 解析日期

```typescript
// utils/date/parse.ts
import moment, { Moment, MomentInput } from 'moment';

// 从字符串解析
export function parseDate(dateString: string, format?: string): Moment {
  if (format) {
    return moment(dateString, format);
  }
  return moment(dateString);
}

// 严格解析
export function parseStrict(dateString: string, formats: string[]): Moment | null {
  const parsed = moment(dateString, formats, true);
  return parsed.isValid() ? parsed : null;
}

// 从数组解析 [year, month, day, hour, minute, second]
export function parseFromArray(parts: number[]): Moment {
  return moment(parts);
}

// 从对象解析
export function parseFromObject(obj: {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
}): Moment {
  return moment(obj);
}

// Unix 时间戳
export function parseUnixTimestamp(timestamp: number, isMilliseconds = false): Moment {
  return isMilliseconds ? moment(timestamp) : moment.unix(timestamp);
}

// ISO 8601 字符串
export function parseISO(isoString: string): Moment {
  return moment(isoString, moment.ISO_8601);
}

// 验证日期
export function isValidDate(date: MomentInput): boolean {
  return moment(date).isValid();
}

// 检查日期是否匹配格式
export function matchesFormat(dateString: string, format: string): boolean {
  return moment(dateString, format, true).isValid();
}

// 使用示例
parseDate('2024-01-15', 'YYYY-MM-DD');
parseDate('2024年01月15日', 'YYYY年MM月DD日');
parseStrict('15/01/2024', ['DD/MM/YYYY', 'D/M/YYYY']);
parseFromArray([2024, 0, 15, 14, 30, 0]);
parseFromObject({ year: 2024, month: 0, day: 15 });
parseUnixTimestamp(1705315800);
parseISO('2024-01-15T14:30:00Z');

isValidDate('2024-01-15'); // true
isValidDate('invalid');    // false
matchesFormat('15/01/2024', 'DD/MM/YYYY'); // true
```

### 日期操作

```typescript
// utils/date/manipulate.ts
import moment, { Moment, DurationInputArg1, DurationInputArg2 } from 'moment';

// 添加时间
export function addTime(
  date: Moment | Date,
  amount: DurationInputArg1,
  unit: DurationInputArg2
): Moment {
  return moment(date).add(amount, unit);
}

// 减少时间
export function subtractTime(
  date: Moment | Date,
  amount: DurationInputArg1,
  unit: DurationInputArg2
): Moment {
  return moment(date).subtract(amount, unit);
}

// 设置时间
export function setTime(
  date: Moment | Date,
  unit: moment.unitOfTime.All,
  value: number
): Moment {
  return moment(date).set(unit, value);
}

// 设置多个单位
export function setMultiple(
  date: Moment | Date,
  values: moment.SetObject
): Moment {
  return moment(date).set(values);
}

// 开始时间
export function startOf(date: Moment | Date, unit: moment.unitOfTime.StartOf): Moment {
  return moment(date).startOf(unit);
}

// 结束时间
export function endOf(date: Moment | Date, unit: moment.unitOfTime.StartOf): Moment {
  return moment(date).endOf(unit);
}

// 常用操作
export function startOfDay(date: Moment | Date = new Date()): Moment {
  return startOf(date, 'day');
}

export function endOfDay(date: Moment | Date = new Date()): Moment {
  return endOf(date, 'day');
}

export function startOfWeek(date: Moment | Date = new Date()): Moment {
  return startOf(date, 'week');
}

export function endOfWeek(date: Moment | Date = new Date()): Moment {
  return endOf(date, 'week');
}

export function startOfMonth(date: Moment | Date = new Date()): Moment {
  return startOf(date, 'month');
}

export function endOfMonth(date: Moment | Date = new Date()): Moment {
  return endOf(date, 'month');
}

export function startOfYear(date: Moment | Date = new Date()): Moment {
  return startOf(date, 'year');
}

export function endOfYear(date: Moment | Date = new Date()): Moment {
  return endOf(date, 'year');
}

// 获取本月天数
export function daysInMonth(date: Moment | Date = new Date()): number {
  return moment(date).daysInMonth();
}

// 使用示例
const now = new Date();

addTime(now, 7, 'days');        // 7天后
addTime(now, 1, 'months');      // 1个月后
subtractTime(now, 2, 'weeks');  // 2周前
setTime(now, 'hour', 0);        // 设置为0点
setMultiple(now, { hour: 0, minute: 0, second: 0 }); // 午夜

startOfDay(now);    // 今天 00:00:00
endOfDay(now);      // 今天 23:59:59
startOfWeek(now);   // 本周一 00:00:00
endOfMonth(now);    // 本月最后一天 23:59:59
daysInMonth(now);   // 本月天数
```

### 日期查询

```typescript
// utils/date/query.ts
import moment, { Moment, MomentInput } from 'moment';

// 获取日期信息
export function getDateInfo(date: MomentInput) {
  const m = moment(date);
  return {
    year: m.year(),
    month: m.month() + 1, // 0-11 -> 1-12
    date: m.date(),
    day: m.day(),         // 0-6 (周日-周六)
    hour: m.hour(),
    minute: m.minute(),
    second: m.second(),
    millisecond: m.millisecond(),
    week: m.week(),
    quarter: m.quarter(),
    dayOfYear: m.dayOfYear(),
    daysInMonth: m.daysInMonth(),
  };
}

// 比较
export function isBefore(date1: MomentInput, date2: MomentInput): boolean {
  return moment(date1).isBefore(date2);
}

export function isAfter(date1: MomentInput, date2: MomentInput): boolean {
  return moment(date1).isAfter(date2);
}

export function isSame(date1: MomentInput, date2: MomentInput, granularity?: moment.unitOfTime.StartOf): boolean {
  return moment(date1).isSame(date2, granularity);
}

export function isSameOrBefore(date1: MomentInput, date2: MomentInput): boolean {
  return moment(date1).isSameOrBefore(date2);
}

export function isSameOrAfter(date1: MomentInput, date2: MomentInput): boolean {
  return moment(date1).isSameOrAfter(date2);
}

export function isBetween(
  date: MomentInput,
  from: MomentInput,
  to: MomentInput,
  granularity?: moment.unitOfTime.StartOf,
  inclusivity?: '()' | '[)' | '(]' | '[]'
): boolean {
  return moment(date).isBetween(from, to, granularity, inclusivity);
}

// 日期类型检查
export function isToday(date: MomentInput): boolean {
  return moment(date).isSame(new Date(), 'day');
}

export function isYesterday(date: MomentInput): boolean {
  return moment(date).isSame(moment().subtract(1, 'day'), 'day');
}

export function isTomorrow(date: MomentInput): boolean {
  return moment(date).isSame(moment().add(1, 'day'), 'day');
}

export function isThisWeek(date: MomentInput): boolean {
  return moment(date).isSame(new Date(), 'week');
}

export function isThisMonth(date: MomentInput): boolean {
  return moment(date).isSame(new Date(), 'month');
}

export function isThisYear(date: MomentInput): boolean {
  return moment(date).isSame(new Date(), 'year');
}

export function isWeekend(date: MomentInput): boolean {
  const day = moment(date).day();
  return day === 0 || day === 6;
}

export function isWeekday(date: MomentInput): boolean {
  return !isWeekend(date);
}

// 闰年
export function isLeapYear(year: number): boolean {
  return moment([year]).isLeapYear();
}

// 使用示例
const date = new Date();

getDateInfo(date);
// { year: 2024, month: 1, date: 15, day: 1, ... }

isToday(date);              // true
isYesterday(date);          // false
isWeekend(date);            // false
isLeapYear(2024);           // true
isBetween(date, '2024-01-01', '2024-12-31', 'day', '[]'); // true
```

### 时长计算

```typescript
// utils/date/duration.ts
import moment, { Duration, MomentInput } from 'moment';

// 创建时长
export function createDuration(
  amount: number,
  unit: moment.unitOfTime.DurationConstructor
): Duration {
  return moment.duration(amount, unit);
}

// 从对象创建
export function createDurationFromObject(obj: {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}): Duration {
  return moment.duration(obj);
}

// 从ISO 8601字符串创建
export function createDurationFromISO(isoString: string): Duration {
  return moment.duration(isoString);
}

// 时长计算
export function addDurations(d1: Duration, d2: Duration): Duration {
  return moment.duration(d1).add(d2);
}

export function subtractDurations(d1: Duration, d2: Duration): Duration {
  return moment.duration(d1).subtract(d2);
}

// 获取时长值
export function getDurationValues(duration: Duration) {
  return {
    milliseconds: duration.milliseconds(),
    seconds: duration.seconds(),
    minutes: duration.minutes(),
    hours: duration.hours(),
    days: duration.days(),
    weeks: duration.weeks(),
    months: duration.months(),
    years: duration.years(),
    asMilliseconds: duration.asMilliseconds(),
    asSeconds: duration.asSeconds(),
    asMinutes: duration.asMinutes(),
    asHours: duration.asHours(),
    asDays: duration.asDays(),
    asWeeks: duration.asWeeks(),
    asMonths: duration.asMonths(),
    asYears: duration.asYears(),
  };
}

// 人性化显示
export function humanizeDuration(duration: Duration, withSuffix = false): string {
  return duration.humanize(withSuffix);
}

// 计算日期差
export function diffDates(
  date1: MomentInput,
  date2: MomentInput,
  unit: moment.unitOfTime.Diff = 'milliseconds'
): number {
  return moment(date1).diff(moment(date2), unit);
}

// 格式化时长
export function formatDuration(
  duration: Duration,
  format: string = 'HH:mm:ss'
): string {
  return moment.utc(duration.asMilliseconds()).format(format);
}

// 使用示例
const dur1 = createDuration(2, 'hours');
const dur2 = createDurationFromObject({ hours: 1, minutes: 30 });
const dur3 = createDurationFromISO('PT2H30M');

humanizeDuration(dur1);        // '2小时'
humanizeDuration(dur1, true);  // '2小时内'

diffDates('2024-01-20', '2024-01-15', 'days'); // 5
diffDates(new Date(), moment().add(1, 'hour'), 'minutes'); // -60

formatDuration(createDuration(3661, 'seconds')); // '01:01:01'
```

### 时区处理

```typescript
// utils/timezone/convert.ts
import moment from 'moment-timezone';

// 设置默认时区
moment.tz.setDefault('Asia/Shanghai');

// 获取时区列表
export function getTimezones(): string[] {
  return moment.tz.names();
}

// 在时区间转换
export function convertTimezone(
  date: moment.MomentInput,
  fromTimezone: string,
  toTimezone: string
): moment.Moment {
  return moment.tz(date, fromTimezone).tz(toTimezone);
}

// 从UTC转换到本地时区
export function fromUTC(date: moment.MomentInput, timezone?: string): moment.Moment {
  return moment.utc(date).tz(timezone || moment.tz.guess());
}

// 从本地时区转换到UTC
export function toUTC(date: moment.MomentInput, timezone?: string): moment.Moment {
  return moment.tz(date, timezone || moment.tz.guess()).utc();
}

// 获取时区偏移
export function getTimezoneOffset(timezone: string, date: moment.MomentInput = new Date()): number {
  return moment.tz(date, timezone).utcOffset();
}

// 格式化带时区
export function formatWithTimezone(
  date: moment.MomentInput,
  timezone: string,
  format = 'YYYY-MM-DD HH:mm:ss z'
): string {
  return moment.tz(date, timezone).format(format);
}

// 使用示例
const now = new Date();

// 时区转换
const nyTime = convertTimezone(now, 'Asia/Shanghai', 'America/New_York');
const tokyoTime = convertTimezone(now, 'Asia/Shanghai', 'Asia/Tokyo');

// UTC转换
const utcTime = toUTC(now);
const localTime = fromUTC(utcTime);

// 带时区格式化
formatWithTimezone(now, 'America/New_York'); // '2024-01-15 01:30:00 EST'
formatWithTimezone(now, 'Asia/Tokyo');       // '2024-01-15 15:30:00 JST'
```

### React Hooks

```typescript
// hooks/useMoment.ts
import { useState, useEffect, useMemo } from 'react';
import moment, { Moment } from 'moment';

export function useMoment(date?: moment.MomentInput): Moment {
  return useMemo(() => moment(date), [date]);
}

// hooks/useCountdown.ts
import { useState, useEffect } from 'react';
import moment, { Moment } from 'moment';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  isCompleted: boolean;
}

export function useCountdown(
  targetDate: moment.MomentInput,
  interval = 1000
): CountdownResult {
  const [countdown, setCountdown] = useState<CountdownResult>(() =>
    calculateCountdown(targetDate)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateCountdown(targetDate));
    }, interval);

    return () => clearInterval(timer);
  }, [targetDate, interval]);

  return countdown;
}

function calculateCountdown(targetDate: moment.MomentInput): CountdownResult {
  const now = moment();
  const target = moment(targetDate);
  const diff = target.diff(now);

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
      isCompleted: true,
    };
  }

  const duration = moment.duration(diff);

  return {
    days: Math.floor(duration.asDays()),
    hours: duration.hours(),
    minutes: duration.minutes(),
    seconds: duration.seconds(),
    total: diff,
    isCompleted: false,
  };
}

// hooks/useTimeAgo.ts
import { useState, useEffect } from 'react';
import moment, { MomentInput } from 'moment';

export function useTimeAgo(date: MomentInput, updateInterval = 60000): string {
  const [timeAgo, setTimeAgo] = useState(() => moment(date).fromNow());

  useEffect(() => {
    const update = () => setTimeAgo(moment(date).fromNow());
    
    update();
    const timer = setInterval(update, updateInterval);

    return () => clearInterval(timer);
  }, [date, updateInterval]);

  return timeAgo;
}

// hooks/useCalendar.ts
import { useMemo } from 'react';
import moment, { Moment, MomentInput } from 'moment';

interface CalendarDay {
  date: Moment;
  isToday: boolean;
  isCurrentMonth: boolean;
  isSelected: boolean;
}

interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
}

export function useCalendar(
  currentMonth: MomentInput,
  selectedDate?: MomentInput
): CalendarMonth {
  return useMemo(() => {
    const month = moment(currentMonth).startOf('month');
    const selected = selectedDate ? moment(selectedDate) : null;
    const today = moment();

    const days: CalendarDay[] = [];
    
    // 开始日期（包含上个月的几天）
    let date = month.clone().startOf('week');
    const endDate = month.clone().endOf('month').endOf('week');

    while (date.isSameOrBefore(endDate, 'day')) {
      days.push({
        date: date.clone(),
        isToday: date.isSame(today, 'day'),
        isCurrentMonth: date.isSame(month, 'month'),
        isSelected: selected ? date.isSame(selected, 'day') : false,
      });
      date.add(1, 'day');
    }

    return {
      year: month.year(),
      month: month.month() + 1,
      days,
    };
  }, [currentMonth, selectedDate]);
}

// 使用示例
function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const { days, hours, minutes, seconds, isCompleted } = useCountdown(targetDate);

  if (isCompleted) {
    return <div>倒计时结束！</div>;
  }

  return (
    <div>
      {days}天 {hours}小时 {minutes}分钟 {seconds}秒
    </div>
  );
}

function TimeAgo({ date }: { date: Date }) {
  const timeAgo = useTimeAgo(date);
  return <span>{timeAgo}</span>;
}
```

### 日期范围操作

```typescript
// utils/date/range.ts
import moment, { Moment, MomentInput } from 'moment';

interface DateRange {
  start: Moment;
  end: Moment;
}

// 创建日期范围
export function createDateRange(
  start: MomentInput,
  end: MomentInput
): DateRange {
  return {
    start: moment(start),
    end: moment(end),
  };
}

// 预定义范围
export function getTodayRange(): DateRange {
  return {
    start: moment().startOf('day'),
    end: moment().endOf('day'),
  };
}

export function getWeekRange(date: MomentInput = new Date()): DateRange {
  return {
    start: moment(date).startOf('week'),
    end: moment(date).endOf('week'),
  };
}

export function getMonthRange(date: MomentInput = new Date()): DateRange {
  return {
    start: moment(date).startOf('month'),
    end: moment(date).endOf('month'),
  };
}

export function getYearRange(date: MomentInput = new Date()): DateRange {
  return {
    start: moment(date).startOf('year'),
    end: moment(date).endOf('year'),
  };
}

export function getLast7Days(): DateRange {
  return {
    start: moment().subtract(7, 'days').startOf('day'),
    end: moment().endOf('day'),
  };
}

export function getLast30Days(): DateRange {
  return {
    start: moment().subtract(30, 'days').startOf('day'),
    end: moment().endOf('day'),
  };
}

export function getLastYear(): DateRange {
  return {
    start: moment().subtract(1, 'year').startOf('year'),
    end: moment().subtract(1, 'year').endOf('year'),
  };
}

// 生成日期数组
export function generateDateRange(
  start: MomentInput,
  end: MomentInput,
  unit: moment.unitOfTime.Base = 'day'
): Moment[] {
  const dates: Moment[] = [];
  let current = moment(start).clone();

  while (current.isSameOrBefore(end, unit)) {
    dates.push(current.clone());
    current.add(1, unit);
  }

  return dates;
}

// 生成月份日历
export function generateMonthCalendar(date: MomentInput): Moment[][] {
  const start = moment(date).startOf('month').startOf('week');
  const end = moment(date).endOf('month').endOf('week');
  const weeks: Moment[][] = [];
  let current = start.clone();

  while (current.isSameOrBefore(end, 'day')) {
    const week: Moment[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(current.clone());
      current.add(1, 'day');
    }
    weeks.push(week);
  }

  return weeks;
}

// 检查日期是否在范围内
export function isDateInRange(
  date: MomentInput,
  range: DateRange,
  inclusivity: '()' | '[)' | '(]' | '[]' = '[]'
): boolean {
  return moment(date).isBetween(range.start, range.end, undefined, inclusivity);
}

// 使用示例
const thisWeek = getWeekRange();
const last7Days = getLast7Days();
const monthCalendar = generateMonthCalendar(new Date());
const dates = generateDateRange('2024-01-01', '2024-01-10');
```

## 测试

```typescript
// __tests__/utils/date/format.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import moment from 'moment';
import 'moment/locale/zh-cn';
import { formatDate, formatRelativeTime, DATE_FORMATS } from '@/utils/date/format';

describe('Date Format Utils', () => {
  beforeEach(() => {
    moment.locale('zh-cn');
  });

  it('should format date correctly', () => {
    const date = new Date('2024-01-15T14:30:00');
    
    expect(formatDate(date, DATE_FORMATS.DATE)).toBe('2024-01-15');
    expect(formatDate(date, DATE_FORMATS.DATETIME)).toBe('2024-01-15 14:30:00');
    expect(formatDate(date, DATE_FORMATS.TIME)).toBe('14:30:00');
  });

  it('should format relative time', () => {
    const now = new Date();
    const oneHourAgo = moment(now).subtract(1, 'hour').toDate();
    
    expect(formatRelativeTime(oneHourAgo)).toBe('一小时前');
  });
});

// __tests__/hooks/useCountdown.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useCountdown } from '@/hooks/useCountdown';

describe('useCountdown', () => {
  it('should countdown correctly', () => {
    vi.useFakeTimers();
    
    const targetDate = new Date(Date.now() + 10000); // 10秒后
    
    const { result } = renderHook(() => useCountdown(targetDate, 1000));
    
    expect(result.current.seconds).toBeGreaterThan(0);
    expect(result.current.isCompleted).toBe(false);
    
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    
    expect(result.current.isCompleted).toBe(true);
    
    vi.useRealTimers();
  });
});
```

## 配置文件

### package.json

```json
{
  "dependencies": {
    "moment": "^2.29.4",
    "moment-timezone": "^0.5.43"
  },
  "devDependencies": {
    "@types/moment": "^2.13.0"
  }
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['moment', 'moment-timezone'],
  },
});
```

## 最佳实践

1. **本地化优先**: 设置正确的 locale
2. **不可变操作**: moment 操作返回新实例
3. **格式化常量**: 使用预定义的格式常量
4. **时区处理**: 使用 moment-timezone 处理时区
5. **性能优化**: 避免在循环中重复创建 moment 对象
6. **链式调用**: 利用链式调用简化代码
7. **验证日期**: 始终检查 isValid()
8. **严格解析**: 使用严格模式解析日期字符串
9. **ISO 8601**: 优先使用 ISO 8601 格式
10. **迁移考虑**: 新项目考虑使用 Day.js 或 date-fns
