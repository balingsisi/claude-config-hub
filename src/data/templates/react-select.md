# React Select 下拉选择模板

## 技术栈

### 核心技术
- **react-select**: 灵活的 Select Input 组件
- **React**: UI 框架
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式框架

### 特性
- 多选支持
- 异步加载
- 可搜索
- 可创建选项
- 分组选项
- 自定义渲染

## 项目结构

```
react-select-project/
├── src/
│   ├── components/
│   │   ├── select/
│   │   │   ├── BasicSelect.tsx
│   │   │   ├── AsyncSelect.tsx
│   │   │   ├── MultiSelect.tsx
│   │   │   ├── CreatableSelect.tsx
│   │   │   └── GroupedSelect.tsx
│   │   └── ui/
│   │       └── CustomSelect.tsx
│   ├── hooks/
│   │   └── useSelect.ts
│   ├── lib/
│   │   └── selectUtils.ts
│   ├── types/
│   │   └── select.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## 核心代码模式

### 1. 基础 Select

```tsx
// src/components/select/BasicSelect.tsx
import Select, { SingleValue, StylesConfig } from "react-select";
import { useState } from "react";

interface Option {
  value: string;
  label: string;
}

const options: Option[] = [
  { value: "chocolate", label: "巧克力" },
  { value: "strawberry", label: "草莓" },
  { value: "vanilla", label: "香草" },
  { value: "mint", label: "薄荷" },
  { value: "caramel", label: "焦糖" },
];

const customStyles: StylesConfig<Option, false> = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
      ? "#eff6ff"
      : "white",
    color: state.isSelected ? "white" : "#1f2937",
    "&:active": {
      backgroundColor: "#3b82f6",
    },
  }),
};

export function BasicSelect() {
  const [selectedOption, setSelectedOption] = useState<SingleValue<Option>>(null);

  return (
    <div className="w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        选择口味
      </label>
      <Select
        value={selectedOption}
        onChange={setSelectedOption}
        options={options}
        styles={customStyles}
        placeholder="请选择..."
        isClearable
        isSearchable
      />
      {selectedOption && (
        <p className="mt-2 text-sm text-gray-600">
          已选择: {selectedOption.label}
        </p>
      )}
    </div>
  );
}
```

### 2. 多选 Select

```tsx
// src/components/select/MultiSelect.tsx
import Select, { MultiValue, StylesConfig } from "react-select";
import { useState } from "react";

interface Option {
  value: string;
  label: string;
  color?: string;
}

const colourOptions: Option[] = [
  { value: "ocean", label: "海洋蓝", color: "#00B8D9" },
  { value: "blue", label: "蓝色", color: "#0052CC" },
  { value: "purple", label: "紫色", color: "#5243AA" },
  { value: "red", label: "红色", color: "#FF5630" },
  { value: "orange", label: "橙色", color: "#FF8B00" },
  { value: "yellow", label: "黄色", color: "#FFC400" },
  { value: "green", label: "绿色", color: "#36B37E" },
  { value: "forest", label: "森林绿", color: "#00875A" },
  { value: "slate", label: "石板灰", color: "#253858" },
  { value: "silver", label: "银色", color: "#666666" },
];

const customStyles: StylesConfig<Option, true> = {
  multiValue: (provided, { data }) => ({
    ...provided,
    backgroundColor: data.color || "#e5e7eb",
  }),
  multiValueLabel: (provided, { data }) => ({
    ...provided,
    color: data.color ? "white" : "#1f2937",
  }),
  multiValueRemove: (provided, { data }) => ({
    ...provided,
    color: data.color ? "white" : "#6b7280",
    ":hover": {
      backgroundColor: data.color || "#d1d5db",
    },
  }),
};

export function MultiSelect() {
  const [selectedOptions, setSelectedOptions] = useState<MultiValue<Option>>([]);

  return (
    <div className="w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        选择颜色（可多选）
      </label>
      <Select
        isMulti
        value={selectedOptions}
        onChange={setSelectedOptions}
        options={colourOptions}
        styles={customStyles}
        placeholder="请选择颜色..."
        closeMenuOnSelect={false}
      />
      {selectedOptions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="px-2 py-1 rounded text-sm text-white"
              style={{ backgroundColor: option.color }}
            >
              {option.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3. 异步加载 Select

```tsx
// src/components/select/AsyncSelect.tsx
import AsyncSelect from "react-select/async";
import { useState } from "react";

interface UserOption {
  value: string;
  label: string;
  email: string;
  avatar?: string;
}

// 模拟 API 调用
const loadOptions = async (inputValue: string): Promise<UserOption[]> => {
  // 实际项目中替换为真实 API
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/users?q=${inputValue}`
  );
  const users = await response.json();

  return users.slice(0, 10).map((user: any) => ({
    value: user.id.toString(),
    label: user.name,
    email: user.email,
  }));
};

const promiseOptions = (inputValue: string) =>
  new Promise<UserOption[]>((resolve) => {
    setTimeout(() => {
      resolve(loadOptions(inputValue));
    }, 1000);
  });

export function AsyncSelectComponent() {
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadOptions = async (inputValue: string) => {
    setIsLoading(true);
    try {
      const options = await promiseOptions(inputValue);
      return options;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        搜索用户
      </label>
      <AsyncSelect
        cacheOptions
        defaultOptions
        loadOptions={handleLoadOptions}
        value={selectedUser}
        onChange={setSelectedUser}
        placeholder="输入用户名搜索..."
        loadingMessage={() => "搜索中..."}
        noOptionsMessage={({ inputValue }) =>
          inputValue ? "未找到匹配用户" : "请输入搜索内容"
        }
        isLoading={isLoading}
      />
      {selectedUser && (
        <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
          <p>
            <strong>姓名:</strong> {selectedUser.label}
          </p>
          <p>
            <strong>邮箱:</strong> {selectedUser.email}
          </p>
        </div>
      )}
    </div>
  );
}
```

### 4. 可创建选项 Select

```tsx
// src/components/select/CreatableSelect.tsx
import CreatableSelect from "react-select/creatable";
import { useState, ActionMeta } from "react";

interface Option {
  value: string;
  label: string;
  isFixed?: boolean;
  isDisabled?: boolean;
}

const initialOptions: Option[] = [
  { value: "frontend", label: "前端开发", isFixed: true },
  { value: "backend", label: "后端开发", isFixed: true },
  { value: "devops", label: "DevOps", isFixed: true },
  { value: "mobile", label: "移动开发" },
];

export function CreatableSelectComponent() {
  const [options, setOptions] = useState<Option[]>(initialOptions);
  const [value, setValue] = useState<Option | null>(null);

  const handleChange = (
    newValue: Option | null,
    actionMeta: ActionMeta<Option>
  ) => {
    if (actionMeta.action === "remove-value") {
      const removedValue = actionMeta.removedValue;
      if (removedValue.isFixed) {
        return; // 不允许移除固定选项
      }
    }
    setValue(newValue);
  };

  const handleCreate = (inputValue: string) => {
    const newOption: Option = {
      value: inputValue.toLowerCase().replace(/\W/g, ""),
      label: inputValue,
    };
    setOptions((prev) => [...prev, newOption]);
    setValue(newOption);
  };

  return (
    <div className="w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        技能标签（可创建新标签）
      </label>
      <CreatableSelect
        isClearable
        value={value}
        onChange={handleChange}
        onCreateOption={handleCreate}
        options={options}
        placeholder="选择或创建标签..."
        formatCreateLabel={(inputValue) => `创建 "${inputValue}"`}
        isValidNewOption={(inputValue, selectOptions) => {
          const isNotDuplicated = !selectOptions.some(
            (option) => option.label.toLowerCase() === inputValue.toLowerCase()
          );
          const isNotEmpty = inputValue.trim() !== "";
          return isNotDuplicated && isNotEmpty;
        }}
      />
      <p className="mt-2 text-xs text-gray-500">
        固定选项（前端、后端、DevOps）不可移除
      </p>
    </div>
  );
}
```

### 5. 分组 Select

```tsx
// src/components/select/GroupedSelect.tsx
import Select, { GroupBase } from "react-select";
import { useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface GroupedOption {
  readonly label: string;
  readonly options: readonly Option[];
}

const groupedOptions: GroupedOption[] = [
  {
    label: "水果",
    options: [
      { value: "apple", label: "苹果" },
      { value: "banana", label: "香蕉" },
      { value: "orange", label: "橙子" },
    ],
  },
  {
    label: "蔬菜",
    options: [
      { value: "carrot", label: "胡萝卜" },
      { value: "broccoli", label: "西兰花" },
      { value: "spinach", label: "菠菜" },
    ],
  },
  {
    label: "肉类",
    options: [
      { value: "chicken", label: "鸡肉" },
      { value: "beef", label: "牛肉" },
      { value: "pork", label: "猪肉" },
    ],
  },
];

const formatGroupLabel = (data: GroupedOption) => (
  <div className="flex items-center justify-between py-2 px-3 bg-gray-100 font-semibold">
    <span>{data.label}</span>
    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
      {data.options.length}
    </span>
  </div>
);

export function GroupedSelect() {
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  return (
    <div className="w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        选择食物（分组）
      </label>
      <Select
        value={selectedOption}
        onChange={setSelectedOption}
        options={groupedOptions}
        formatGroupLabel={formatGroupLabel}
        placeholder="选择食物类别..."
      />
      {selectedOption && (
        <p className="mt-2 text-sm text-gray-600">
          已选择: {selectedOption.label}
        </p>
      )}
    </div>
  );
}
```

### 6. 自定义渲染 Select

```tsx
// src/components/ui/CustomSelect.tsx
import Select, {
  OptionProps,
  SingleValueProps,
  components,
  StylesConfig,
} from "react-select";
import { useState } from "react";

interface UserOption {
  value: string;
  label: string;
  email: string;
  avatar: string;
  status: "online" | "offline" | "busy";
}

const users: UserOption[] = [
  {
    value: "1",
    label: "张三",
    email: "zhangsan@example.com",
    avatar: "https://i.pravatar.cc/150?img=1",
    status: "online",
  },
  {
    value: "2",
    label: "李四",
    email: "lisi@example.com",
    avatar: "https://i.pravatar.cc/150?img=2",
    status: "offline",
  },
  {
    value: "3",
    label: "王五",
    email: "wangwu@example.com",
    avatar: "https://i.pravatar.cc/150?img=3",
    status: "busy",
  },
];

const { Option } = components;

const CustomOption = (props: OptionProps<UserOption, false>) => {
  const { data } = props;

  return (
    <Option {...props}>
      <div className="flex items-center space-x-3 py-1">
        <div className="relative">
          <img
            src={data.avatar}
            alt={data.label}
            className="w-8 h-8 rounded-full"
          />
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
              data.status === "online"
                ? "bg-green-500"
                : data.status === "busy"
                ? "bg-red-500"
                : "bg-gray-400"
            }`}
          />
        </div>
        <div className="flex-1">
          <div className="font-medium">{data.label}</div>
          <div className="text-xs text-gray-500">{data.email}</div>
        </div>
      </div>
    </Option>
  );
};

const CustomSingleValue = (props: SingleValueProps<UserOption, false>) => {
  const { data } = props;

  return (
    <components.SingleValue {...props}>
      <div className="flex items-center space-x-2">
        <img
          src={data.avatar}
          alt={data.label}
          className="w-6 h-6 rounded-full"
        />
        <span>{data.label}</span>
        <span
          className={`w-2 h-2 rounded-full ${
            data.status === "online"
              ? "bg-green-500"
              : data.status === "busy"
              ? "bg-red-500"
              : "bg-gray-400"
          }`}
        />
      </div>
    </components.SingleValue>
  );
};

const customStyles: StylesConfig<UserOption, false> = {
  option: (provided) => ({
    ...provided,
    padding: "8px 12px",
  }),
  singleValue: (provided) => ({
    ...provided,
    display: "flex",
    alignItems: "center",
  }),
};

export function CustomSelect() {
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

  return (
    <div className="w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        选择团队成员
      </label>
      <Select
        value={selectedUser}
        onChange={setSelectedUser}
        options={users}
        components={{
          Option: CustomOption,
          SingleValue: CustomSingleValue,
        }}
        styles={customStyles}
        placeholder="选择用户..."
      />
    </div>
  );
}
```

### 7. Select Hook

```tsx
// src/hooks/useSelect.ts
import { useState, useCallback, useMemo } from "react";

interface UseSelectOptions<T> {
  options: T[];
  value?: T | T[];
  onChange?: (value: T | T[] | null) => void;
  isMulti?: boolean;
  getOptionValue?: (option: T) => string;
  getOptionLabel?: (option: T) => string;
}

export function useSelect<T>(config: UseSelectOptions<T>) {
  const {
    options,
    value: controlledValue,
    onChange,
    isMulti = false,
    getOptionValue = (option: any) => option.value,
    getOptionLabel = (option: any) => option.label,
  } = config;

  const [internalValue, setInternalValue] = useState<T | T[] | null>(
    controlledValue || null
  );

  const selectedValue = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = useCallback(
    (newValue: T | T[] | null) => {
      if (onChange) {
        onChange(newValue);
      } else {
        setInternalValue(newValue);
      }
    },
    [onChange]
  );

  const clearValue = useCallback(() => {
    handleChange(null);
  }, [handleChange]);

  const selectAll = useCallback(() => {
    if (isMulti) {
      handleChange(options);
    }
  }, [isMulti, options, handleChange]);

  const filteredOptions = useMemo(() => {
    if (!isMulti || !Array.isArray(selectedValue)) {
      return options;
    }

    const selectedIds = new Set(
      selectedValue.map((opt) => getOptionValue(opt))
    );

    return options.filter((opt) => !selectedIds.has(getOptionValue(opt)));
  }, [options, selectedValue, isMulti, getOptionValue]);

  return {
    value: selectedValue,
    onChange: handleChange,
    clearValue,
    selectAll,
    options: filteredOptions,
    isMulti,
  };
}

// 使用示例
function MyComponent() {
  const { value, onChange, options, clearValue } = useSelect({
    options: [
      { value: "1", label: "选项 1" },
      { value: "2", label: "选项 2" },
    ],
    isMulti: true,
  });

  return (
    <div>
      <Select
        isMulti
        value={value}
        onChange={onChange}
        options={options}
      />
      <button onClick={clearValue}>清空</button>
    </div>
  );
}
```

### 8. 完整应用示例

```tsx
// src/App.tsx
import { BasicSelect } from "./components/select/BasicSelect";
import { MultiSelect } from "./components/select/MultiSelect";
import { AsyncSelectComponent } from "./components/select/AsyncSelect";
import { CreatableSelectComponent } from "./components/select/CreatableSelect";
import { GroupedSelect } from "./components/select/GroupedSelect";
import { CustomSelect } from "./components/ui/CustomSelect";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            React Select 示例
          </h1>
          <p className="mt-2 text-gray-600">
            各种下拉选择组件的使用示例
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">基础选择</h2>
            <BasicSelect />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">多选</h2>
            <MultiSelect />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">异步加载</h2>
            <AsyncSelectComponent />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">可创建选项</h2>
            <CreatableSelectComponent />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">分组选项</h2>
            <GroupedSelect />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">自定义渲染</h2>
            <CustomSelect />
          </div>
        </div>
      </div>
    </div>
  );
}
```

## package.json

```json
{
  "name": "react-select-project",
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
    "react-select": "^5.8.0"
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
   - 使用 memo 缓存选项
   - 异步加载大数据集
   - 虚拟滚动长列表

2. **用户体验**
   - 提供清晰的占位符
   - 显示加载状态
   - 友好的错误提示
   - 键盘导航支持

3. **可访问性**
   - 语义化 HTML
   - ARIA 属性
   - 屏幕阅读器支持
   - 高对比度模式

4. **样式定制**
   - 使用 StylesConfig API
   - 保持品牌一致性
   - 响应式设计
   - 暗色模式支持

5. **类型安全**
   - 定义 Option 接口
   - 使用泛型
   - 严格类型检查

## 常见问题

**Q: 如何自定义选项样式？**
A: 使用 components prop 替换 Option 组件，或使用 styles prop 覆盖默认样式

**Q: 如何处理大量数据？**
A: 使用异步加载，或虚拟滚动库如 react-window

**Q: 如何禁用某些选项？**
A: 在选项对象中添加 isDisabled: true 属性

**Q: 如何实现远程搜索？**
A: 使用 AsyncSelect 组件和 loadOptions prop

## 相关资源

- [React Select 官方文档](https://react-select.com/)
- [React Select GitHub](https://github.com/JedWatson/react-select)
- [样式定制指南](https://react-select.com/styles)
- [高级用法示例](https://react-select.com/advanced)
