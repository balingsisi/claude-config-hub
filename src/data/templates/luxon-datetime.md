# Luxon 日期时间模板

## 技术栈

- **日期时间库**: Luxon 3.x
- **时区支持**: Full IANA timezone support
- **格式化**: 丰富的格式化选项
- **解析**: 灵活的日期解析
- **持续时间**: Duration 和 Interval 支持
- **国际化**: 内置 i18n 支持

## 项目结构

```
luxon-datetime/
├── src/
│   ├── utils/                # 工具函数
│   │   ├── datetime/        # 日期时间工具
│   │   ├── format/          # 格式化工具
│   │   └── timezone/        # 时区工具
│   ├── services/            # 服务层
│   │   ├── scheduler/       # 调度服务
│   │   ├── calendar/        # 日历服务
│   │   └── reminder/        # 提醒服务
│   ├── validators/          # 验证器
│   │   ├── date/            # 日期验证
│   │   └── range/           # 范围验证
│   └── types/               # 类型定义
├── test/                    # 测试文件
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础日期时间操作

```typescript
// src/utils/datetime/basic.ts
import { DateTime, Settings } from 'luxon';

// 设置默认时区
Settings.defaultZone = 'Asia/Shanghai';

// 创建日期时间
export const createDateTime = {
  // 当前时间
  now: () => DateTime.now(),

  // 从 ISO 字符串
  fromISO: (iso: string, zone?: string) =>
    DateTime.fromISO(iso, { zone: zone || 'local' }),

  // 从时间戳
  fromTimestamp: (timestamp: number, zone?: string) =>
    DateTime.fromMillis(timestamp, { zone: zone || 'local' }),

  // 从 JavaScript Date
  fromDate: (date: Date, zone?: string) =>
    DateTime.fromJSDate(date, { zone: zone || 'local' }),

  // 从对象
  fromObject: (obj: {
    year?: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
    second?: number;
  }, zone?: string) =>
    DateTime.fromObject(obj, { zone: zone || 'local' }),

  // 从字符串（自定义格式）
  fromFormat: (text: string, format: string, zone?: string) =>
    DateTime.fromFormat(text, format, { zone: zone || 'local' }),
};

// 日期时间获取
export const getDateTime = {
  year: (dt: DateTime) => dt.year,
  month: (dt: DateTime) => dt.month,
  day: (dt: DateTime) => dt.day,
  hour: (dt: DateTime) => dt.hour,
  minute: (dt: DateTime) => dt.minute,
  second: (dt: DateTime) => dt.second,
  weekday: (dt: DateTime) => dt.weekday, // 1=Monday, 7=Sunday
  weekNumber: (dt: DateTime) => dt.weekNumber,
  quarter: (dt: DateTime) => dt.quarter,
  daysInMonth: (dt: DateTime) => dt.daysInMonth,
  daysInYear: (dt: DateTime) => dt.daysInYear,
  isLeapYear: (dt: DateTime) => dt.isInLeapYear,
};

// 日期时间修改
export const modifyDateTime = {
  add: (dt: DateTime, duration: Duration | object) => dt.plus(duration),
  subtract: (dt: DateTime, duration: Duration | object) => dt.minus(duration),
  startOf: (dt: DateTime, unit: 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second') =>
    dt.startOf(unit),
  endOf: (dt: DateTime, unit: 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second') =>
    dt.endOf(unit),
  set: (dt: DateTime, values: { year?: number; month?: number; day?: number; hour?: number; minute?: number; second?: number }) =>
    dt.set(values),
};

// 使用示例
const now = createDateTime.now();
const birthday = createDateTime.fromObject({ year: 1990, month: 5, day: 15 });
const fromISO = createDateTime.fromISO('2024-01-15T10:30:00');
const fromString = createDateTime.fromFormat('15/01/2024', 'dd/MM/yyyy');

console.log(getDateTime.year(now)); // 2024
console.log(getDateTime.weekday(now)); // 1-7

const tomorrow = modifyDateTime.add(now, { days: 1 });
const startOfMonth = modifyDateTime.startOf(now, 'month');
const endOfYear = modifyDateTime.endOf(now, 'year');
```

### 格式化

```typescript
// src/utils/format/formatting.ts
import { DateTime } from 'luxon';

// 预定义格式
export const predefinedFormats = {
  date: (dt: DateTime) => dt.toLocaleString(DateTime.DATE_SHORT),
  dateMedium: (dt: DateTime) => dt.toLocaleString(DateTime.DATE_MED),
  dateFull: (dt: DateTime) => dt.toLocaleString(DateTime.DATE_FULL),
  
  time: (dt: DateTime) => dt.toLocaleString(DateTime.TIME_SIMPLE),
  time24: (dt: DateTime) => dt.toLocaleString(DateTime.TIME_24_SIMPLE),
  timeWithSeconds: (dt: DateTime) => dt.toLocaleString(DateTime.TIME_WITH_SECONDS),
  
  datetime: (dt: DateTime) => dt.toLocaleString(DateTime.DATETIME_SHORT),
  datetimeMedium: (dt: DateTime) => dt.toLocaleString(DateTime.DATETIME_MED),
  datetimeFull: (dt: DateTime) => dt.toLocaleString(DateTime.DATETIME_FULL),
  
  iso: (dt: DateTime) => dt.toISO(),
  isoDate: (dt: DateTime) => dt.toISODate(),
  isoTime: (dt: DateTime) => dt.toISOTime(),
  
  rfc2822: (dt: DateTime) => dt.toRFC2822(),
  http: (dt: DateTime) => dt.toHTTP(),
  sql: (dt: DateTime) => dt.toSQL(),
};

// 自定义格式
export const customFormats = {
  // 常用格式
  shortDate: (dt: DateTime) => dt.toFormat('yyyy-MM-dd'),
  longDate: (dt: DateTime) => dt.toFormat('MMMM d, yyyy'),
  shortTime: (dt: DateTime) => dt.toFormat('HH:mm'),
  fullTime: (dt: DateTime) => dt.toFormat('HH:mm:ss'),
  fullDatetime: (dt: DateTime) => dt.toFormat('yyyy-MM-dd HH:mm:ss'),
  
  // 中文格式
  chineseDate: (dt: DateTime) => dt.toFormat('yyyy年MM月dd日'),
  chineseDatetime: (dt: DateTime) => dt.toFormat('yyyy年MM月dd日 HH时mm分ss秒'),
  
  // 相对格式
  relative: (dt: DateTime) => dt.toRelative(),
  relativeTo: (dt: DateTime, other: DateTime) => dt.toRelative({ base: other }),
  
  // 自定义模板
  custom: (dt: DateTime, template: string) => dt.toFormat(template),
};

// 本地化格式
export const localizedFormats = {
  // 使用特定语言环境
  withLocale: (dt: DateTime, locale: string) =>
    dt.setLocale(locale).toLocaleString(DateTime.DATETIME_FULL),

  // 常用语言
  enUS: (dt: DateTime) =>
    dt.setLocale('en-US').toLocaleString(DateTime.DATETIME_FULL),
  zhCN: (dt: DateTime) =>
    dt.setLocale('zh-CN').toLocaleString(DateTime.DATETIME_FULL),
  jaJP: (dt: DateTime) =>
    dt.setLocale('ja-JP').toLocaleString(DateTime.DATETIME_FULL),
  deDE: (dt: DateTime) =>
    dt.setLocale('de-DE').toLocaleString(DateTime.DATETIME_FULL),
  frFR: (dt: DateTime) =>
    dt.setLocale('fr-FR').toLocaleString(DateTime.DATETIME_FULL),
};

// 实用格式化函数
export const formatters = {
  // 友好的相对时间
  friendlyRelative: (dt: DateTime) => {
    const diff = dt.diffNow().as('milliseconds');
    const abs = Math.abs(diff);

    if (abs < 60000) { // 1分钟内
      return '刚刚';
    } else if (abs < 3600000) { // 1小时内
      const minutes = Math.floor(abs / 60000);
      return `${minutes}分钟${diff > 0 ? '后' : '前'}`;
    } else if (abs < 86400000) { // 24小时内
      const hours = Math.floor(abs / 3600000);
      return `${hours}小时${diff > 0 ? '后' : '前'}`;
    } else if (abs < 604800000) { // 7天内
      const days = Math.floor(abs / 86400000);
      return `${days}天${diff > 0 ? '后' : '前'}`;
    } else {
      return dt.toFormat('yyyy-MM-dd');
    }
  },

  // 智能格式化（根据距离现在的远近自动选择格式）
  smart: (dt: DateTime) => {
    const diff = Math.abs(dt.diffNow().as('days'));

    if (diff < 1) {
      return dt.toFormat('HH:mm');
    } else if (diff < 7) {
      return dt.toFormat('EEEE HH:mm'); // 星期几 时间
    } else if (dt.year === DateTime.now().year) {
      return dt.toFormat('MM-dd HH:mm');
    } else {
      return dt.toFormat('yyyy-MM-dd HH:mm');
    }
  },

  // 时间段格式化
  timeRange: (start: DateTime, end: DateTime) => {
    if (start.hasSame(end, 'day')) {
      return `${start.toFormat('HH:mm')} - ${end.toFormat('HH:mm')}`;
    } else {
      return `${start.toFormat('MM-dd HH:mm')} - ${end.toFormat('MM-dd HH:mm')}`;
    }
  },

  // 时长格式化
  duration: (milliseconds: number) => {
    const dur = DateTime.fromMillis(milliseconds).diff(DateTime.fromMillis(0));

    if (milliseconds < 60000) {
      return `${Math.floor(dur.as('seconds'))}秒`;
    } else if (milliseconds < 3600000) {
      return `${Math.floor(dur.as('minutes'))}分钟`;
    } else if (milliseconds < 86400000) {
      const hours = Math.floor(dur.as('hours'));
      const minutes = Math.floor(dur.as('minutes')) % 60;
      return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
    } else {
      const days = Math.floor(dur.as('days'));
      const hours = Math.floor(dur.as('hours')) % 24;
      return hours > 0 ? `${days}天${hours}小时` : `${days}天`;
    }
  },
};

// 使用示例
const dt = DateTime.now();

console.log(predefinedFormats.datetime(dt));
// "1/15/2024, 10:30 AM"

console.log(customFormats.fullDatetime(dt));
// "2024-01-15 10:30:45"

console.log(customFormats.chineseDate(dt));
// "2024年01月15日"

console.log(formatters.friendlyRelative(dt.minus({ hours: 2 })));
// "2小时前"

console.log(formatters.smart(dt));
// 根据 datetime 自动选择格式
```

### 时区处理

```typescript
// src/utils/timezone/timezone.ts
import { DateTime } from 'luxon';

// 时区转换
export const convertTimezone = {
  // 转换到指定时区
  toZone: (dt: DateTime, zone: string) => dt.setZone(zone),

  // 转换到本地时区
  toLocal: (dt: DateTime) => dt.toLocal(),

  // 转换到 UTC
  toUTC: (dt: DateTime) => dt.toUTC(),

  // 常用时区
  toShanghai: (dt: DateTime) => dt.setZone('Asia/Shanghai'),
  toNewYork: (dt: DateTime) => dt.setZone('America/New_York'),
  toLondon: (dt: DateTime) => dt.setZone('Europe/London'),
  toTokyo: (dt: DateTime) => dt.setZone('Asia/Tokyo'),
  toSydney: (dt: DateTime) => dt.setZone('Australia/Sydney'),
};

// 获取时区信息
export const getTimezoneInfo = (zone: string) => {
  const dt = DateTime.now().setZone(zone);
  
  return {
    name: zone,
    offset: dt.offset, // 分钟
    offsetString: dt.toFormat('ZZ'), // +08:00
    isDST: dt.isInDST, // 是否夏令时
    isValid: dt.isValid,
  };
};

// 时区列表
export const commonTimezones = [
  { value: 'Asia/Shanghai', label: '中国标准时间 (上海)', offset: '+08:00' },
  { value: 'Asia/Hong_Kong', label: '香港时间', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: '日本标准时间', offset: '+09:00' },
  { value: 'America/New_York', label: '美国东部时间', offset: '-05:00/-04:00' },
  { value: 'America/Los_Angeles', label: '美国太平洋时间', offset: '-08:00/-07:00' },
  { value: 'Europe/London', label: '格林尼治时间', offset: '+00:00/+01:00' },
  { value: 'Europe/Paris', label: '中欧时间', offset: '+01:00/+02:00' },
  { value: 'Australia/Sydney', label: '澳大利亚东部时间', offset: '+10:00/+11:00' },
];

// 跨时区会议时间计算
export const scheduleAcrossTimezones = (
  referenceTime: DateTime,
  zones: string[]
) => {
  return zones.map(zone => {
    const localTime = referenceTime.setZone(zone);
    return {
      zone,
      time: localTime.toFormat('HH:mm'),
      date: localTime.toFormat('yyyy-MM-dd'),
      offset: localTime.toFormat('ZZ'),
      formatted: localTime.toLocaleString(DateTime.DATETIME_FULL),
    };
  });
};

// 检查是否在工作时间内
export const isWorkingHours = (
  dt: DateTime,
  zone: string = 'local',
  startHour: number = 9,
  endHour: number = 18
) => {
  const local = dt.setZone(zone);
  const hour = local.hour;
  const weekday = local.weekday; // 1-7

  // 周一到周五
  return weekday >= 1 && weekday <= 5 && hour >= startHour && hour < endHour;
};

// 获取下一个工作时间
export const getNextWorkingTime = (
  dt: DateTime,
  zone: string = 'local',
  startHour: number = 9,
  endHour: number = 18
) => {
  let next = dt.setZone(zone);

  // 如果当前在工作时间内，返回下一个工作日开始
  if (isWorkingHours(next, zone, startHour, endHour)) {
    next = next.set({ hour: startHour, minute: 0, second: 0 }).plus({ days: 1 });
  }

  // 找到下一个工作日
  while (next.weekday > 5) {
    next = next.plus({ days: 1 });
  }

  // 设置为工作时间开始
  return next.set({ hour: startHour, minute: 0, second: 0 });
};

// 使用示例
const dt = DateTime.now();

// 转换时区
const inNewYork = convertTimezone.toNewYork(dt);
const inLondon = convertTimezone.toLondon(dt);
const inShanghai = convertTimezone.toShanghai(dt);

console.log('纽约时间:', inNewYork.toFormat('yyyy-MM-dd HH:mm:ss ZZZZ'));
console.log('伦敦时间:', inLondon.toFormat('yyyy-MM-dd HH:mm:ss ZZZZ'));
console.log('上海时间:', inShanghai.toFormat('yyyy-MM-dd HH:mm:ss ZZZZ'));

// 跨时区会议
const meetingTime = DateTime.fromObject(
  { year: 2024, month: 1, day: 15, hour: 14, minute: 0 },
  { zone: 'America/New_York' }
);

const times = scheduleAcrossTimezones(meetingTime, [
  'America/New_York',
  'Europe/London',
  'Asia/Shanghai',
  'Asia/Tokyo',
]);

console.log('会议时间:');
times.forEach(t => {
  console.log(`${t.zone}: ${t.formatted}`);
});
```

### Duration 和 Interval

```typescript
// src/utils/datetime/duration-interval.ts
import { DateTime, Duration, Interval } from 'luxon';

// Duration - 时间长度
export const durationUtils = {
  // 创建 Duration
  create: (obj: {
    years?: number;
    months?: number;
    weeks?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
  }) => Duration.fromObject(obj),

  // 从毫秒创建
  fromMillis: (ms: number) => Duration.fromMillis(ms),

  // 从 ISO 字符串
  fromISO: (iso: string) => Duration.fromISO(iso),

  // 相加/相减
  add: (d1: Duration, d2: Duration) => d1.plus(d2),
  subtract: (d1: Duration, d2: Duration) => d1.minus(d2),

  // 转换单位
  as: (d: Duration, unit: 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds') =>
    d.as(unit),

  // 格式化
  format: (d: Duration) => {
    const parts: string[] = [];

    if (d.years) parts.push(`${Math.floor(d.years)}年`);
    if (d.months) parts.push(`${Math.floor(d.months)}月`);
    if (d.days) parts.push(`${Math.floor(d.days)}天`);
    if (d.hours) parts.push(`${Math.floor(d.hours)}小时`);
    if (d.minutes) parts.push(`${Math.floor(d.minutes)}分钟`);
    if (d.seconds) parts.push(`${Math.floor(d.seconds)}秒`);

    return parts.join(' ') || '0秒';
  },
};

// Interval - 时间区间
export const intervalUtils = {
  // 创建 Interval
  fromDateTimes: (start: DateTime, end: DateTime) =>
    Interval.fromDateTimes(start, end),

  // 从 ISO 字符串
  fromISO: (iso: string) => Interval.fromISO(iso),

  // 在某天之后
  after: (start: DateTime, duration: Duration) =>
    Interval.after(start, duration),

  // 在某天之前
  before: (end: DateTime, duration: Duration) =>
    Interval.before(end, duration),

  // 属性
  length: (i: Interval, unit?: 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds') =>
    unit ? i.length(unit) : i.length(),

  // 检查包含
  contains: (i: Interval, dt: DateTime) => i.contains(dt),

  // 检查重叠
  overlaps: (i1: Interval, i2: Interval) => i1.overlaps(i2),

  // 合并
  union: (i1: Interval, i2: Interval) => i1.union(i2),

  // 交集
  intersection: (i1: Interval, i2: Interval) => i1.intersection(i2),

  // 分割
  splitBy: (i: Interval, duration: Duration | { years?: number; months?: number; weeks?: number; days?: number }) =>
    i.splitBy(duration),

  // 遍历每一天
  eachDay: (i: Interval) => i.splitBy({ days: 1 }).map(d => d.start),
};

// 实际应用
export const durationExamples = {
  // 计算年龄
  calculateAge: (birthday: DateTime) => {
    const now = DateTime.now();
    const diff = now.diff(birthday, ['years', 'months', 'days']).toObject();
    return {
      years: Math.floor(diff.years || 0),
      months: Math.floor(diff.months || 0),
      days: Math.floor(diff.days || 0),
      formatted: durationUtils.format(now.diff(birthday)),
    };
  },

  // 倒计时
  countdown: (targetDate: DateTime) => {
    const now = DateTime.now();
    const diff = targetDate.diff(now, ['days', 'hours', 'minutes', 'seconds']).toObject();
    return {
      days: Math.floor(diff.days || 0),
      hours: Math.floor(diff.hours || 0),
      minutes: Math.floor(diff.minutes || 0),
      seconds: Math.floor(diff.seconds || 0),
      formatted: durationUtils.format(targetDate.diff(now)),
    };
  },

  // 计算工作时长
  calculateWorkingHours: (start: DateTime, end: DateTime) => {
    const interval = Interval.fromDateTimes(start, end);
    let totalHours = 0;

    // 按天分割
    const days = interval.splitBy({ days: 1 });

    days.forEach(day => {
      const dayStart = day.start!;
      const weekday = dayStart.weekday;

      // 周一到周五
      if (weekday >= 1 && weekday <= 5) {
        const workStart = dayStart.set({ hour: 9, minute: 0, second: 0 });
        const workEnd = dayStart.set({ hour: 18, minute: 0, second: 0 });

        const dayInterval = Interval.fromDateTimes(
          DateTime.max(day.start!, workStart),
          DateTime.min(day.end!, workEnd)
        );

        if (dayInterval.isValid) {
          totalHours += dayInterval.length('hours');
        }
      }
    });

    return Math.round(totalHours * 100) / 100;
  },

  // 判断时间范围是否可用
  isTimeSlotAvailable: (
    intervals: Interval[],
    newStart: DateTime,
    newEnd: DateTime
  ) => {
    const newInterval = Interval.fromDateTimes(newStart, newEnd);

    return !intervals.some(interval => interval.overlaps(newInterval));
  },
};

// 使用示例
// Duration
const twoHours = durationUtils.create({ hours: 2 });
const thirtyMinutes = durationUtils.fromMillis(30 * 60 * 1000);
const total = durationUtils.add(twoHours, thirtyMinutes);

console.log(durationUtils.format(total)); // "2小时 30分钟"
console.log(durationUtils.as(total, 'minutes')); // 150

// Interval
const start = DateTime.fromObject({ year: 2024, month: 1, day: 1 });
const end = DateTime.fromObject({ year: 2024, month: 1, day: 10 });
const interval = intervalUtils.fromDateTimes(start, end);

console.log(intervalUtils.length(interval, 'days')); // 9

const days = intervalUtils.eachDay(interval);
console.log(days.map(d => d.toFormat('yyyy-MM-dd')));

// 年龄计算
const birthday = DateTime.fromObject({ year: 1990, month: 5, day: 15 });
const age = durationExamples.calculateAge(birthday);
console.log(`${age.years}岁${age.months}个月${age.days}天`);

// 倒计时
const newYear = DateTime.fromObject({ year: 2025, month: 1, day: 1 });
const countdown = durationExamples.countdown(newYear);
console.log(`距离新年还有: ${countdown.formatted}`);
```

### 验证和比较

```typescript
// src/validators/date/validation.ts
import { DateTime } from 'luxon';

// 日期验证
export const dateValidators = {
  // 是否有效日期
  isValid: (dt: DateTime) => dt.isValid,

  // 是否是工作日
  isWeekday: (dt: DateTime) => dt.weekday >= 1 && dt.weekday <= 5,

  // 是否是周末
  isWeekend: (dt: DateTime) => dt.weekday === 6 || dt.weekday === 7,

  // 是否是今天
  isToday: (dt: DateTime) => dt.hasSame(DateTime.now(), 'day'),

  // 是否是昨天
  isYesterday: (dt: DateTime) =>
    dt.hasSame(DateTime.now().minus({ days: 1 }), 'day'),

  // 是否是明天
  isTomorrow: (dt: DateTime) =>
    dt.hasSame(DateTime.now().plus({ days: 1 }), 'day'),

  // 是否是过去
  isPast: (dt: DateTime) => dt < DateTime.now(),

  // 是否是未来
  isFuture: (dt: DateTime) => dt > DateTime.now(),

  // 是否在指定范围内
  isInRange: (dt: DateTime, start: DateTime, end: DateTime) =>
    dt >= start && dt <= end,

  // 是否是同一天
  isSameDay: (dt1: DateTime, dt2: DateTime) => dt1.hasSame(dt2, 'day'),

  // 是否是同一周
  isSameWeek: (dt1: DateTime, dt2: DateTime) => dt1.hasSame(dt2, 'week'),

  // 是否是同一月
  isSameMonth: (dt1: DateTime, dt2: DateTime) => dt1.hasSame(dt2, 'month'),

  // 是否是同一年
  isSameYear: (dt1: DateTime, dt2: DateTime) => dt1.hasSame(dt2, 'year'),
};

// 日期比较
export const dateComparators = {
  // 比较
  compare: (dt1: DateTime, dt2: DateTime) => {
    if (dt1 < dt2) return -1;
    if (dt1 > dt2) return 1;
    return 0;
  },

  // 是否相等
  equals: (dt1: DateTime, dt2: DateTime) => dt1.equals(dt2),

  // 最小值
  min: (...dates: DateTime[]) =>
    dates.reduce((min, dt) => (dt < min ? dt : min)),

  // 最大值
  max: (...dates: DateTime[]) =>
    dates.reduce((max, dt) => (dt > max ? dt : max)),

  // 差值
  diff: (dt1: DateTime, dt2: DateTime, unit?: 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds') =>
    unit ? dt1.diff(dt2, unit).as(unit) : dt1.diff(dt2).as('milliseconds'),
};

// 实际应用：日期范围验证
export const validateDateRange = (
  start: DateTime,
  end: DateTime,
  constraints: {
    minDuration?: number; // 最小持续时间（毫秒）
    maxDuration?: number; // 最大持续时间（毫秒）
    mustBeFuture?: boolean; // 必须是未来
    mustBePast?: boolean; // 必须是过去
    mustBeWeekday?: boolean; // 必须是工作日
  } = {}
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!start.isValid) {
    errors.push('开始时间无效');
  }

  if (!end.isValid) {
    errors.push('结束时间无效');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  if (start > end) {
    errors.push('开始时间不能晚于结束时间');
  }

  const duration = end.diff(start).as('milliseconds');

  if (constraints.minDuration && duration < constraints.minDuration) {
    errors.push(`持续时间不能少于 ${duration / 60000} 分钟`);
  }

  if (constraints.maxDuration && duration > constraints.maxDuration) {
    errors.push(`持续时间不能超过 ${constraints.maxDuration / 60000} 分钟`);
  }

  if (constraints.mustBeFuture && start <= DateTime.now()) {
    errors.push('开始时间必须是未来时间');
  }

  if (constraints.mustBePast && end >= DateTime.now()) {
    errors.push('结束时间必须是过去时间');
  }

  if (constraints.mustBeWeekday) {
    if (!dateValidators.isWeekday(start)) {
      errors.push('开始时间必须是工作日');
    }
    if (!dateValidators.isWeekday(end)) {
      errors.push('结束时间必须是工作日');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// 使用示例
const dt1 = DateTime.fromObject({ year: 2024, month: 1, day: 15 });
const dt2 = DateTime.fromObject({ year: 2024, month: 1, day: 20 });

console.log(dateValidators.isWeekday(dt1)); // true (Monday)
console.log(dateValidators.isWeekend(dt1)); // false

console.log(dateComparators.compare(dt1, dt2)); // -1
console.log(dateComparators.diff(dt2, dt1, 'days')); // 5

const validation = validateDateRange(
  dt1,
  dt2,
  {
    minDuration: 3 * 24 * 60 * 60 * 1000, // 3 days
    maxDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
    mustBeFuture: false,
    mustBeWeekday: true,
  }
);

console.log(validation);
// { valid: true, errors: [] }
```

### 实际应用示例

```typescript
// src/services/scheduler/scheduler.ts
import { DateTime, Duration } from 'luxon';

// 定时任务调度
export class Scheduler {
  private tasks: Map<string, { time: DateTime; callback: () => void }> = new Map();

  schedule(id: string, time: DateTime, callback: () => void) {
    this.tasks.set(id, { time, callback });
    this.scheduleNext();
  }

  scheduleRecurring(
    id: string,
    interval: Duration,
    callback: () => void,
    start?: DateTime
  ) {
    const startTime = start || DateTime.now().plus(interval);
    
    const run = () => {
      callback();
      const next = DateTime.now().plus(interval);
      this.schedule(id, next, run);
    };

    this.schedule(id, startTime, run);
  }

  cancel(id: string) {
    this.tasks.delete(id);
  }

  private scheduleNext() {
    // 实现调度逻辑
  }

  getNextScheduled(): DateTime | null {
    const times = Array.from(this.tasks.values()).map(t => t.time);
    return times.length > 0 ? DateTime.min(...times) : null;
  }
}

// 日历事件
export interface CalendarEvent {
  id: string;
  title: string;
  start: DateTime;
  end: DateTime;
  allDay: boolean;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    until?: DateTime;
  };
}

export class CalendarService {
  private events: CalendarEvent[] = [];

  addEvent(event: CalendarEvent) {
    this.events.push(event);
  }

  getEventsForDate(date: DateTime): CalendarEvent[] {
    return this.events.filter(event =>
      date.hasSame(event.start, 'day') ||
      (date >= event.start && date <= event.end)
    );
  }

  getEventsForWeek(weekStart: DateTime): CalendarEvent[] {
    const weekEnd = weekStart.plus({ days: 7 });
    return this.events.filter(event =>
      event.start < weekEnd && event.end >= weekStart
    );
  }

  getUpcomingEvents(limit: number = 10): CalendarEvent[] {
    const now = DateTime.now();
    return this.events
      .filter(event => event.start >= now)
      .sort((a, b) => a.start.toMillis() - b.start.toMillis())
      .slice(0, limit);
  }

  // 生成重复事件
  generateRecurringInstances(
    event: CalendarEvent,
    startDate: DateTime,
    endDate: DateTime
  ): CalendarEvent[] {
    if (!event.recurring) return [event];

    const instances: CalendarEvent[] = [];
    let current = event.start;

    while (current <= endDate && (!event.recurring.until || current <= event.recurring.until)) {
      if (current >= startDate) {
        instances.push({
          ...event,
          id: `${event.id}-${current.toFormat('yyyy-MM-dd')}`,
          start: current,
          end: current.plus(event.end.diff(event.start)),
        });
      }

      switch (event.recurring.frequency) {
        case 'daily':
          current = current.plus({ days: event.recurring.interval });
          break;
        case 'weekly':
          current = current.plus({ weeks: event.recurring.interval });
          break;
        case 'monthly':
          current = current.plus({ months: event.recurring.interval });
          break;
        case 'yearly':
          current = current.plus({ years: event.recurring.interval });
          break;
      }
    }

    return instances;
  }
}

// 提醒服务
export class ReminderService {
  private reminders: Map<string, { time: DateTime; message: string }> = new Map();

  setReminder(id: string, time: DateTime, message: string) {
    this.reminders.set(id, { time, message });
  }

  setReminderFromNow(id: string, duration: Duration, message: string) {
    const time = DateTime.now().plus(duration);
    this.setReminder(id, time, message);
  }

  getDueReminders(): Array<{ id: string; message: string }> {
    const now = DateTime.now();
    const due: Array<{ id: string; message: string }> = [];

    this.reminders.forEach((reminder, id) => {
      if (reminder.time <= now) {
        due.push({ id, message: reminder.message });
        this.reminders.delete(id);
      }
    });

    return due;
  }

  snoozeReminder(id: string, duration: Duration) {
    const reminder = this.reminders.get(id);
    if (reminder) {
      reminder.time = reminder.time.plus(duration);
    }
  }
}

// 使用示例
const scheduler = new Scheduler();

// 单次任务
scheduler.schedule(
  'task-1',
  DateTime.now().plus({ hours: 2 }),
  () => console.log('Task executed!')
);

// 重复任务
scheduler.scheduleRecurring(
  'daily-report',
  Duration.fromObject({ hours: 24 }),
  () => console.log('Generating daily report...'),
  DateTime.now().set({ hour: 9, minute: 0, second: 0 })
);

// 日历
const calendar = new CalendarService();

calendar.addEvent({
  id: 'meeting-1',
  title: 'Team Meeting',
  start: DateTime.now().set({ hour: 10, minute: 0 }),
  end: DateTime.now().set({ hour: 11, minute: 0 }),
  allDay: false,
  recurring: {
    frequency: 'weekly',
    interval: 1,
  },
});

const todayEvents = calendar.getEventsForDate(DateTime.now());

// 提醒
const reminderService = new ReminderService();

reminderService.setReminderFromNow(
  'break',
  Duration.fromObject({ minutes: 30 }),
  'Time for a break!'
);

const dueReminders = reminderService.getDueReminders();
dueReminders.forEach(r => console.log(r.message));
```

## 最佳实践

### 1. 时区处理

```typescript
// ✅ 推荐：明确指定时区
const dt = DateTime.fromObject(
  { year: 2024, month: 1, day: 15, hour: 10 },
  { zone: 'Asia/Shanghai' }
);

// ✅ 推荐：存储时使用 UTC
const utcTime = dt.toUTC();
const iso = utcTime.toISO();

// ✅ 推荐：显示时转换为本地时区
const localTime = DateTime.fromISO(iso).setZone('local');

// ❌ 避免：不指定时区
const badDt = DateTime.fromObject({ year: 2024, month: 1, day: 15 });
```

### 2. 不可变性

```typescript
// ✅ Luxon 是不可变的
const dt1 = DateTime.now();
const dt2 = dt1.plus({ days: 1 }); // dt1 不会改变

// ✅ 链式调用
const result = DateTime.now()
  .setZone('America/New_York')
  .startOf('day')
  .plus({ days: 1 });
```

### 3. 错误处理

```typescript
// ✅ 检查有效性
const dt = DateTime.fromISO('invalid');
if (!dt.isValid) {
  console.error('Invalid date:', dt.invalidReason);
}

// ✅ 使用验证
const parseDate = (input: string): DateTime | null => {
  const dt = DateTime.fromISO(input);
  return dt.isValid ? dt : null;
};
```

### 4. 性能优化

```typescript
// ✅ 复用 DateTime 对象
const now = DateTime.now();
const dates = Array.from({ length: 10 }, (_, i) => now.plus({ days: i }));

// ✅ 批量操作
const processDates = (dates: DateTime[]) => {
  return dates.map(dt => dt.toFormat('yyyy-MM-dd'));
};

// ❌ 避免：重复创建
for (let i = 0; i < 10; i++) {
  const dt = DateTime.now().plus({ days: i }); // 不推荐
}
```

## 常用命令

```bash
# 安装依赖
npm install luxon

# 运行测试
npm test

# 类型检查
npm run type-check

# 构建生产版本
npm run build
```

## 部署配置

### Package.json

```json
{
  "dependencies": {
    "luxon": "^3.4.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  },
  "scripts": {
    "test": "jest",
    "type-check": "tsc --noEmit",
    "build": "tsc"
  }
}
```

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 参考资源

- [Luxon 官方文档](https://moment.github.io/luxon/)
- [Luxon GitHub](https://github.com/moment/luxon)
- [Luxon API 文档](https://moment.github.io/luxon/api-docs/)
- [Moment.js 迁移指南](https://moment.github.io/luxon/#/moment-migration)
- [时区数据库](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
