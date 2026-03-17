# Chakra UI App 模板

## 技术栈

- **UI 组件库**: Chakra UI 2.x
- **框架**: React 18.x
- **语言**: TypeScript 5.x
- **构建工具**: Vite 5.x
- **路由**: React Router 6.x
- **状态管理**: Zustand / Jotai
- **表单**: React Hook Form + Zod
- **图标**: React Icons
- **主题**: Chakra UI Theming

## 项目结构

```
chakra-ui-app/
├── src/                       # 源代码
│   ├── components/           # 组件
│   │   ├── ui/              # 基础 UI 组件
│   │   ├── layout/          # 布局组件
│   │   ├── forms/           # 表单组件
│   │   └── features/        # 功能组件
│   ├── pages/               # 页面组件
│   ├── hooks/               # 自定义 Hooks
│   ├── utils/               # 工具函数
│   ├── types/               # 类型定义
│   ├── theme/               # Chakra UI 主题
│   │   ├── index.ts        # 主题入口
│   │   ├── colors.ts       # 颜色配置
│   │   ├── fonts.ts        # 字体配置
│   │   └── components.ts   # 组件样式
│   ├── App.tsx              # 根组件
│   └── main.tsx             # 入口文件
├── public/                  # 静态资源
├── index.html               # HTML 模板
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
└── package.json             # 项目配置
```

## 代码模式

### Chakra UI 配置

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import App from './App';
import theme from './theme';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <App />
    </ChakraProvider>
  </React.StrictMode>
);

// src/theme/index.ts
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { colors } from './colors';
import { fonts } from './fonts';
import { components } from './components';
import { styles } from './styles';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

export const theme = extendTheme({
  config,
  colors,
  fonts,
  components,
  styles,
  // 其他配置
  breakpoints: {
    sm: '30em',
    md: '48em',
    lg: '62em',
    xl: '80em',
    '2xl': '96em',
  },
  sizes: {
    container: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
  },
  // 全局样式
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
});

export type Theme = typeof theme;

// src/theme/colors.ts
export const colors = {
  brand: {
    50: '#E6F6FF',
    100: '#BAE3FF',
    200: '#7CC4FA',
    300: '#47A3F3',
    400: '#2186EB',
    500: '#0967D2',
    600: '#0552B5',
    700: '#03449E',
    800: '#01337D',
    900: '#002159',
  },
  secondary: {
    50: '#F3F8FF',
    100: '#DDEBF7',
    200: '#B6D4E8',
    300: '#8AB6D6',
    400: '#5D93C2',
    500: '#3674AB',
    600: '#2B5A8A',
    700: '#214770',
    800: '#163B5D',
    900: '#0C2A47',
  },
  success: {
    50: '#E3F7E7',
    100: '#C1EAC5',
    200: '#A3D9A5',
    300: '#7BC47F',
    400: '#57AE5B',
    500: '#3F9142',
    600: '#2F8232',
    700: '#207227',
    800: '#0E5814',
    900: '#05400A',
  },
  error: {
    50: '#FFE3E3',
    100: '#FFBDBD',
    200: '#FF9B9B',
    300: '#F86A6A',
    400: '#EF4E4E',
    500: '#E12C39',
    600: '#CF1124',
    700: '#AB091E',
    800: '#8A0416',
    900: '#610311',
  },
};

// src/theme/fonts.ts
export const fonts = {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
  mono: `'JetBrains Mono', 'Fira Code', 'Consolas', monospace`,
};

// src/theme/components.ts
import { type ComponentStyleConfig } from '@chakra-ui/theme';

export const components: Record<string, ComponentStyleConfig> = {
  Button: {
    baseStyle: {
      fontWeight: 'medium',
      borderRadius: 'md',
    },
    sizes: {
      sm: {
        fontSize: 'sm',
        px: 3,
        py: 1,
      },
      md: {
        fontSize: 'md',
        px: 4,
        py: 2,
      },
      lg: {
        fontSize: 'lg',
        px: 6,
        py: 3,
      },
    },
    variants: {
      solid: {
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
        },
      },
      outline: {
        border: '2px solid',
        borderColor: 'brand.500',
        color: 'brand.500',
        _hover: {
          bg: 'brand.50',
        },
      },
      ghost: {
        color: 'brand.500',
        _hover: {
          bg: 'brand.50',
        },
      },
    },
    defaultProps: {
      size: 'md',
      variant: 'solid',
      colorScheme: 'brand',
    },
  },

  Input: {
    variants: {
      outline: {
        field: {
          borderRadius: 'md',
          borderColor: 'gray.300',
          _hover: {
            borderColor: 'gray.400',
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
        },
      },
    },
    defaultProps: {
      variant: 'outline',
      size: 'md',
    },
  },

  Card: {
    baseStyle: {
      container: {
        borderRadius: 'lg',
        boxShadow: 'md',
        p: 6,
        bg: 'white',
        _dark: {
          bg: 'gray.800',
        },
      },
    },
  },
};

// src/theme/styles.ts
export const styles = {
  global: (props: any) => ({
    body: {
      fontFamily: 'body',
      color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
      lineHeight: 'base',
    },
    '*::placeholder': {
      color: 'gray.400',
    },
    '*, *::before, &::after': {
      borderColor: 'gray.200',
      wordWrap: 'break-word',
    },
  }),
};
```

### 基础组件

```typescript
// src/components/layout/Header.tsx
import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Collapse,
  Link,
  useColorModeValue,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { ColorModeSwitcher } from '../ui/ColorModeSwitcher';

interface HeaderProps {
  onToggle: () => void;
  isOpen: boolean;
}

export function Header() {
  const { isOpen, onToggle } = useDisclosure();
  const isDesktop = useBreakpointValue({ base: false, md: true });

  return (
    <Box>
      <Flex
        minH="60px"
        py={{ base: 2 }}
        px={{ base: 4 }}
        align="center"
        justify="space-between"
        bg={useColorModeValue('white', 'gray.900')}
        borderBottom={1}
        borderStyle="solid"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <Flex
          flex={{ base: 1, md: 'auto' }}
          ml={{ base: -2 }}
          display={{ base: 'flex', md: 'none' }}
        >
          <IconButton
            onClick={onToggle}
            icon={isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />}
            variant="ghost"
            aria-label="Toggle Navigation"
          />
        </Flex>

        <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }}>
          <Text
            textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
            fontFamily="heading"
            color={useColorModeValue('gray.800', 'white')}
            fontWeight="bold"
            fontSize="xl"
          >
            Logo
          </Text>

          {isDesktop && (
            <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
              <DesktopNav />
            </Flex>
          )}
        </Flex>

        <Stack
          flex={{ base: 1, md: 0 }}
          justify="flex-end"
          direction="row"
          spacing={6}
        >
          <ColorModeSwitcher />
          <Button
            as="a"
            fontSize="sm"
            fontWeight={400}
            variant="link"
            href="#"
          >
            Sign In
          </Button>
          <Button
            as="a"
            display={{ base: 'none', md: 'inline-flex' }}
            fontSize="sm"
            fontWeight={600}
            color="white"
            bg="brand.500"
            href="#"
            _hover={{
              bg: 'brand.600',
            }}
          >
            Sign Up
          </Button>
        </Stack>
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <MobileNav />
      </Collapse>
    </Box>
  );
}

const DesktopNav = () => {
  const linkColor = useColorModeValue('gray.600', 'gray.200');
  const linkHoverColor = useColorModeValue('gray.800', 'white');

  return (
    <Stack direction="row" spacing={4}>
      {NAV_ITEMS.map((navItem) => (
        <Box key={navItem.label}>
          <Link
            p={2}
            href={navItem.href ?? '#'}
            fontSize="sm"
            fontWeight={500}
            color={linkColor}
            _hover={{
              textDecoration: 'none',
              color: linkHoverColor,
            }}
          >
            {navItem.label}
          </Link>
        </Box>
      ))}
    </Stack>
  );
};

const MobileNav = () => {
  return (
    <Stack
      bg={useColorModeValue('white', 'gray.800')}
      p={4}
      display={{ md: 'none' }}
    >
      {NAV_ITEMS.map((navItem) => (
        <Stack key={navItem.label} spacing={4}>
          <Flex
            py={2}
            as={Link}
            href={navItem.href ?? '#'}
            justify="space-between"
            align="center"
            _hover={{
              textDecoration: 'none',
            }}
          >
            <Text
              fontWeight={600}
              color={useColorModeValue('gray.600', 'gray.200')}
            >
              {navItem.label}
            </Text>
          </Flex>
        </Stack>
      ))}
    </Stack>
  );
};

const NAV_ITEMS = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'About',
    href: '/about',
  },
  {
    label: 'Features',
    href: '/features',
  },
  {
    label: 'Contact',
    href: '/contact',
  },
];

// src/components/ui/ColorModeSwitcher.tsx
import { useColorMode, IconButton, type IconButtonProps } from '@chakra-ui/react';
import { FiMoon, FiSun } from 'react-icons/fi';

type ColorModeSwitcherProps = Omit<IconButtonProps, 'aria-label'>;

export function ColorModeSwitcher(props: ColorModeSwitcherProps) {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <IconButton
      onClick={toggleColorMode}
      icon={isDark ? <FiSun /> : <FiMoon />}
      variant="ghost"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      {...props}
    />
  );
}

// src/components/layout/Footer.tsx
import {
  Box,
  Container,
  Stack,
  Text,
  Link,
  useColorModeValue,
} from '@chakra-ui/react';

export function Footer() {
  return (
    <Box
      bg={useColorModeValue('gray.50', 'gray.900')}
      color={useColorModeValue('gray.700', 'gray.200')}
    >
      <Container as={Stack} maxW="6xl" py={4} spacing={4} direction="column">
        <Stack direction="row" spacing={6}>
          <Link href="#">Home</Link>
          <Link href="#">About</Link>
          <Link href="#">Contact</Link>
          <Link href="#">Privacy</Link>
        </Stack>

        <Text textAlign="center">
          © {new Date().getFullYear()} Chakra UI App. All rights reserved.
        </Text>
      </Container>
    </Box>
  );
}

// src/components/layout/Layout.tsx
import { Box, Container } from '@chakra-ui/react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Header />
      <Container maxW="container.xl" flex={1} py={8}>
        {children}
      </Container>
      <Footer />
    </Box>
  );
}
```

### 表单组件

```typescript
// src/components/forms/ContactForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  VStack,
  useToast,
} from '@chakra-ui/react';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactForm() {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(data);

      toast({
        title: 'Message sent!',
        description: "We'll get back to you soon.",
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <VStack spacing={4}>
        <FormControl isInvalid={!!errors.name}>
          <FormLabel htmlFor="name">Name</FormLabel>
          <Input
            id="name"
            {...register('name')}
            placeholder="Enter your name"
          />
          <FormErrorMessage>
            {errors.name && errors.name.message}
          </FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.email}>
          <FormLabel htmlFor="email">Email</FormLabel>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="Enter your email"
          />
          <FormErrorMessage>
            {errors.email && errors.email.message}
          </FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.message}>
          <FormLabel htmlFor="message">Message</FormLabel>
          <Textarea
            id="message"
            {...register('message')}
            placeholder="Enter your message"
            rows={5}
          />
          <FormErrorMessage>
            {errors.message && errors.message.message}
          </FormErrorMessage>
        </FormControl>

        <Button
          type="submit"
          colorScheme="brand"
          width="full"
          isLoading={isSubmitting}
          loadingText="Sending..."
        >
          Send Message
        </Button>
      </VStack>
    </Box>
  );
}

// src/components/forms/SearchForm.tsx
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
} from '@chakra-ui/react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useState } from 'react';

export function SearchForm() {
  const [value, setValue] = useState('');

  const handleClear = () => {
    setValue('');
  };

  return (
    <Box width="full" maxW="md">
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <FiSearch color="gray" />
        </InputLeftElement>
        <Input
          placeholder="Search..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          borderRadius="full"
        />
        {value && (
          <IconButton
            aria-label="Clear search"
            icon={<FiX />}
            onClick={handleClear}
            variant="ghost"
            borderRadius="full"
          />
        )}
      </InputGroup>
    </Box>
  );
}
```

### 功能组件

```typescript
// src/components/features/FeatureCard.tsx
import {
  Box,
  Icon,
  Text,
  Stack,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiStar } from 'react-icons/fi';
import { type IconType } from 'react-icons';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: IconType;
}

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <Box
      p={6}
      shadow="md"
      borderWidth="1px"
      borderRadius="lg"
      bg={useColorModeValue('white', 'gray.800')}
      _hover={{
        shadow: 'lg',
        transform: 'translateY(-2px)',
        transition: 'all 0.3s',
      }}
    >
      <Stack spacing={3}>
        <Box
          w={12}
          h={12}
          borderRadius="lg"
          bg={useColorModeValue('brand.50', 'brand.900')}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={icon} w={6} h={6} color="brand.500" />
        </Box>
        <Text fontWeight="bold" fontSize="lg">
          {title}
        </Text>
        <Text color={useColorModeValue('gray.600', 'gray.300')}>
          {description}
        </Text>
      </Stack>
    </Box>
  );
}

// src/components/features/PricingCard.tsx
import {
  Box,
  Button,
  Stack,
  Text,
  List,
  ListItem,
  ListIcon,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiCheck } from 'react-icons/fi';

interface PricingCardProps {
  title: string;
  price: number;
  features: string[];
  isPopular?: boolean;
  onSubscribe: () => void;
}

export function PricingCard({
  title,
  price,
  features,
  isPopular = false,
  onSubscribe,
}: PricingCardProps) {
  return (
    <Box
      position="relative"
      p={8}
      shadow={isPopular ? 'xl' : 'md'}
      borderWidth={isPopular ? '2px' : '1px'}
      borderColor={isPopular ? 'brand.500' : 'gray.200'}
      borderRadius="xl"
      bg={useColorModeValue('white', 'gray.800')}
    >
      {isPopular && (
        <Badge
          position="absolute"
          top={-3}
          left="50%"
          transform="translateX(-50%)"
          colorScheme="brand"
          borderRadius="full"
          px={3}
        >
          Most Popular
        </Badge>
      )}

      <Stack spacing={6}>
        <Text fontWeight="bold" fontSize="xl" textAlign="center">
          {title}
        </Text>

        <Box textAlign="center">
          <Text fontSize="5xl" fontWeight="bold">
            ${price}
          </Text>
          <Text color="gray.500">/month</Text>
        </Box>

        <List spacing={3}>
          {features.map((feature, index) => (
            <ListItem key={index} display="flex" alignItems="center">
              <ListIcon as={FiCheck} color="green.500" />
              {feature}
            </ListItem>
          ))}
        </List>

        <Button
          colorScheme="brand"
          variant={isPopular ? 'solid' : 'outline'}
          onClick={onSubscribe}
          width="full"
        >
          Get Started
        </Button>
      </Stack>
    </Box>
  );
}

// src/components/features/StatsCard.tsx
import {
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
} from '@chakra-ui/react';

interface StatsCardProps {
  label: string;
  value: string;
  helpText?: string;
  type?: 'increase' | 'decrease';
}

export function StatsCard({ label, value, helpText, type }: StatsCardProps) {
  return (
    <Box
      p={6}
      shadow="md"
      borderWidth="1px"
      borderRadius="lg"
      bg={useColorModeValue('white', 'gray.800')}
    >
      <Stat>
        <StatLabel fontWeight="medium">{label}</StatLabel>
        <StatNumber fontSize="3xl">{value}</StatNumber>
        {helpText && type && (
          <StatHelpText>
            <StatArrow type={type} />
            {helpText}
          </StatHelpText>
        )}
      </Stat>
    </Box>
  );
}
```

## 最佳实践

### 1. 响应式设计

```typescript
import { Box, Text, useBreakpointValue } from '@chakra-ui/react';

export function ResponsiveComponent() {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const fontSize = useBreakpointValue({ base: 'md', md: 'lg', xl: 'xl' });

  return (
    <Box
      p={{ base: 4, md: 6, lg: 8 }}
      m={{ base: 2, md: 4 }}
      width={{ base: '100%', md: '50%', lg: '33%' }}
    >
      <Text fontSize={fontSize}>
        {isMobile ? 'Mobile View' : 'Desktop View'}
      </Text>
    </Box>
  );
}
```

### 2. 深色模式

```typescript
import {
  Box,
  Text,
  useColorModeValue,
  useColorMode,
} from '@chakra-ui/react';

export function DarkModeComponent() {
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue('white', 'gray.800');
  const color = useColorModeValue('gray.800', 'white');

  return (
    <Box bg={bg} color={color} p={4}>
      <Text>Current mode: {colorMode}</Text>
    </Box>
  );
}
```

### 3. 主题定制

```typescript
// 使用主题 tokens
import { useTheme, Box, Text } from '@chakra-ui/react';

export function ThemeComponent() {
  const theme = useTheme();

  return (
    <Box>
      <Text color="brand.500">Brand color</Text>
      <Text fontSize={{ base: 'md', lg: theme.fontSizes.xl }}>
        Responsive font size
      </Text>
    </Box>
  );
}
```

### 4. 组件组合

```typescript
import {
  Box,
  Button,
  Stack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { FiMoreVertical, FiEdit, FiTrash } from 'react-icons/fi';

export function ComponentComposition() {
  return (
    <Box>
      <Stack direction="row" spacing={4}>
        <Button colorScheme="brand">Primary</Button>
        <Button variant="outline">Secondary</Button>
        <IconButton aria-label="Add" icon={<FiMoreVertical />} />
      </Stack>

      <Menu>
        <MenuButton as={Button} rightIcon={<FiMoreVertical />}>
          Actions
        </MenuButton>
        <MenuList>
          <MenuItem icon={<FiEdit />}>Edit</MenuItem>
          <MenuItem icon={<FiTrash />}>Delete</MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
}
```

## 常用命令

```bash
# Chakra UI 开发命令

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 运行测试
npm test

# 代码格式化
npm run format

# 代码检查
npm run lint

# 类型检查
npm run type-check

# 安装图标库
npm install react-icons

# 安装 Chakra UI 图标
npm install @chakra-ui/icons

# 生成主题类型
npm run theme:generate
```

## 部署配置

### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### Package.json 脚本

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css}\"",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@chakra-ui/icons": "^2.1.0",
    "@chakra-ui/react": "^2.8.0",
    "@emotion/react": "^11.0.0",
    "@emotion/styled": "^11.0.0",
    "framer-motion": "^10.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-hook-form": "^7.0.0",
    "react-icons": "^4.0.0",
    "react-router-dom": "^6.0.0",
    "zod": "^3.0.0",
    "zustand": "^4.0.0"
  },
  "devDependencies": {
    "@hookform/resolvers": "^3.0.0",
    "@testing-library/react": "^14.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8.0.0",
    "eslint-plugin-react": "^7.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

## 参考资源

- [Chakra UI 官方文档](https://chakra-ui.com/)
- [Chakra UI Icons](https://chakra-ui.com/docs/components/icon)
- [React Icons](https://react-icons.github.io/react-icons/)
- [Framer Motion](https://www.framer.com/motion/)
- [Chakra UI GitHub](https://github.com/chakra-ui/chakra-ui)
