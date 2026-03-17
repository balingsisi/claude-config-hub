# Framer Motion React 动画库模板

## 技术栈

- **Framer Motion**: React 动画库
- **React 18**: UI 框架
- **TypeScript**: 类型支持
- **Vite**: 构建工具
- **Tailwind CSS**: 样式方案
- **React Router**: 路由管理

## 项目结构

```
framer-motion-app/
├── src/
│   ├── components/
│   │   ├── animations/
│   │   │   ├── FadeIn.tsx
│   │   │   ├── SlideIn.tsx
│   │   │   ├── ScaleIn.tsx
│   │   │   ├── Stagger.tsx
│   │   │   ├── FlipCard.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Tooltip.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── AnimatedLayout.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Input.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useAnimation.ts
│   │   ├── useInView.ts
│   │   ├── useScroll.ts
│   │   └── useMotion.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Gallery.tsx
│   │   ├── Interactive.tsx
│   │   └── Transitions.tsx
│   ├── utils/
│   │   ├── animations.ts
│   │   ├── variants.ts
│   │   └── transitions.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 代码模式

### 基础动画组件

```tsx
// src/components/animations/FadeIn.tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export const FadeIn = ({ 
  children, 
  delay = 0, 
  duration = 0.5,
  direction = 'up',
  className = ''
}: FadeInProps) => {
  const directions = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 }
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...directions[direction]
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0
      }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
```

```tsx
// src/components/animations/SlideIn.tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SlideInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export const SlideIn = ({ 
  children, 
  delay = 0, 
  duration = 0.6,
  direction = 'left',
  className = ''
}: SlideInProps) => {
  const slideVariants = {
    hidden: {
      x: direction === 'left' ? '-100%' : direction === 'right' ? '100%' : 0,
      y: direction === 'top' ? '-100%' : direction === 'bottom' ? '100%' : 0,
      opacity: 0
    },
    visible: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        duration,
        delay,
        ease: [0.6, 0.01, 0.05, 0.95]
      }
    }
  };

  return (
    <motion.div
      variants={slideVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
```

```tsx
// src/components/animations/ScaleIn.tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  scale?: number;
  className?: string;
}

export const ScaleIn = ({ 
  children, 
  delay = 0, 
  duration = 0.5,
  scale = 0.8,
  className = ''
}: ScaleInProps) => {
  return (
    <motion.div
      initial={{ scale, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
```

### 交错动画

```tsx
// src/components/animations/Stagger.tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StaggerProps {
  children: ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export const Stagger = ({ 
  children, 
  staggerDelay = 0.1,
  className = ''
}: StaggerProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={className}
    >
      {children.map((child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};
```

### 交互式组件

```tsx
// src/components/animations/FlipCard.tsx
import { motion } from 'framer-motion';
import { ReactNode, useState } from 'react';

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  className?: string;
}

export const FlipCard = ({ front, back, className = '' }: FlipCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className={`perspective-1000 ${className}`}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full transform-style-3d"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
      >
        {/* 正面 */}
        <motion.div
          className="absolute w-full h-full backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </motion.div>

        {/* 背面 */}
        <motion.div
          className="absolute w-full h-full backface-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          {back}
        </motion.div>
      </motion.div>
    </div>
  );
};
```

```tsx
// src/components/animations/Modal.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: '-50%'
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: '-50%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: '-50%',
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* 模态框内容 */}
          <motion.div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
```

```tsx
// src/components/animations/Tooltip.tsx
import { motion } from 'framer-motion';
import { ReactNode, useState } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip = ({ 
  content, 
  children, 
  position = 'top' 
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: { x: 0, y: -10 },
    bottom: { x: 0, y: 10 },
    left: { x: -10, y: 0 },
    right: { x: 10, y: 0 }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <motion.div
          className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg whitespace-nowrap"
          initial={{ 
            opacity: 0, 
            scale: 0.9,
            ...positions[position]
          }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: 0,
            y: 0
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.9,
            ...positions[position]
          }}
          transition={{ duration: 0.15 }}
        >
          {content}
        </motion.div>
      )}
    </div>
  );
};
```

### 布局动画

```tsx
// src/components/layout/AnimatedLayout.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface AnimatedLayoutProps {
  children: ReactNode;
}

export const AnimatedLayout = ({ children }: AnimatedLayoutProps) => {
  const location = useLocation();

  const pageVariants = {
    initial: {
      opacity: 0,
      x: '-100%'
    },
    enter: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: [0.6, 0.01, 0.05, 0.95]
      }
    },
    exit: {
      opacity: 0,
      x: '100%',
      transition: {
        duration: 0.5,
        ease: [0.6, 0.01, 0.05, 0.95]
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
```

```tsx
// src/components/layout/Header.tsx
import { motion } from 'framer-motion';
import { useState } from 'react';

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuVariants = {
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    },
    open: {
      opacity: 1,
      height: 'auto',
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const menuItemVariants = {
    closed: { opacity: 0, x: -20 },
    open: { opacity: 1, x: 0 }
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <motion.h1 
          className="text-2xl font-bold"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          Logo
        </motion.h1>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden"
        >
          Menu
        </button>

        <motion.nav
          className="md:block"
          variants={menuVariants}
          initial="closed"
          animate={isOpen ? 'open' : 'closed'}
        >
          <motion.ul className="flex space-x-6">
            {['Home', 'About', 'Services', 'Contact'].map((item) => (
              <motion.li
                key={item}
                variants={menuItemVariants}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <a href="#" className="hover:text-blue-500 transition-colors">
                  {item}
                </a>
              </motion.li>
            ))}
          </motion.ul>
        </motion.nav>
      </div>
    </header>
  );
};
```

### UI 组件

```tsx
// src/components/ui/Button.tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  onClick?: () => void;
  className?: string;
}

export const Button = ({ 
  children, 
  variant = 'primary',
  onClick,
  className = ''
}: ButtonProps) => {
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600',
    outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50'
  };

  return (
    <motion.button
      className={`px-6 py-3 rounded-lg font-semibold ${variants[variant]} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};
```

```tsx
// src/components/ui/Card.tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <motion.div
      className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}
      whileHover={{ 
        y: -8,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}
      transition={{ 
        type: 'spring',
        stiffness: 300,
        damping: 20
      }}
    >
      {children}
    </motion.div>
  );
};
```

### 自定义 Hooks

```tsx
// src/hooks/useAnimation.ts
import { useAnimation } from 'framer-motion';
import { useEffect } from 'react';

export const useScrollAnimation = () => {
  const controls = useAnimation();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      if (scrollY > windowHeight * 0.5) {
        controls.start('visible');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [controls]);

  return controls;
};
```

```tsx
// src/hooks/useInView.ts
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export const useAnimateInView = (options = {}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: true, 
    margin: '-100px',
    ...options 
  });

  return { ref, isInView };
};
```

```tsx
// src/hooks/useMotion.ts
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export const useMousePosition = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: MouseEvent) => {
    x.set(e.clientX);
    y.set(e.clientY);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return { x: springX, y: springY };
};
```

### 动画变体

```tsx
// src/utils/variants.ts
export const fadeInUp = {
  hidden: {
    opacity: 0,
    y: 40
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

export const fadeInDown = {
  hidden: {
    opacity: 0,
    y: -40
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

export const scaleIn = {
  hidden: {
    scale: 0.8,
    opacity: 0
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

export const slideInFromLeft = {
  hidden: {
    x: '-100%',
    opacity: 0
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.6, 0.01, 0.05, 0.95]
    }
  }
};

export const slideInFromRight = {
  hidden: {
    x: '100%',
    opacity: 0
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.6, 0.01, 0.05, 0.95]
    }
  }
};
```

```tsx
// src/utils/transitions.ts
export const transitions = {
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 20
  },
  springBouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 10
  },
  springStiff: {
    type: 'spring',
    stiffness: 500,
    damping: 30
  },
  easeInOut: {
    duration: 0.3,
    ease: 'easeInOut'
  },
  easeOut: {
    duration: 0.3,
    ease: 'easeOut'
  },
  smooth: {
    duration: 0.5,
    ease: [0.25, 0.1, 0.25, 1]
  }
};
```

### 页面示例

```tsx
// src/pages/Home.tsx
import { motion } from 'framer-motion';
import { FadeIn, SlideIn, Stagger, ScaleIn } from '../components/animations';
import { Button, Card } from '../components/ui';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/variants';

export const Home = () => {
  const features = [
    { title: 'Feature 1', description: 'Description 1' },
    { title: 'Feature 2', description: 'Description 2' },
    { title: 'Feature 3', description: 'Description 3' }
  ];

  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <motion.section
        className="py-20 text-center"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 
          className="text-6xl font-bold mb-6"
          variants={fadeInUp}
        >
          Welcome to Our App
        </motion.h1>
        
        <motion.p 
          className="text-xl text-gray-600 mb-8"
          variants={fadeInUp}
        >
          Beautiful animations with Framer Motion
        </motion.p>
        
        <motion.div variants={fadeInUp}>
          <Button>Get Started</Button>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20">
        <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-8">
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Card>
          ))}
        </Stagger>
      </section>

      {/* Scroll Animation Section */}
      <section className="py-20">
        <FadeIn direction="up">
          <h2 className="text-4xl font-bold text-center mb-12">
            Scroll Animation
          </h2>
        </FadeIn>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SlideIn direction="left">
            <div className="bg-blue-100 p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">Left Side</h3>
              <p>This slides in from the left</p>
            </div>
          </SlideIn>
          
          <SlideIn direction="right">
            <div className="bg-green-100 p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">Right Side</h3>
              <p>This slides in from the right</p>
            </div>
          </SlideIn>
        </div>
      </section>
    </div>
  );
};
```

```tsx
// src/pages/Interactive.tsx
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useState } from 'react';

export const Interactive = () => {
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [30, -30]);
  const rotateY = useTransform(x, [-100, 100], [-30, 30]);

  const springConfig = { damping: 25, stiffness: 150 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-12">Interactive Animations</h1>

      {/* 3D 卡片效果 */}
      <motion.div
        className="w-96 h-64 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-2xl flex items-center justify-center cursor-pointer"
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          transformStyle: 'preserve-3d'
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <motion.div
          className="text-white text-2xl font-bold"
          style={{ transform: 'translateZ(75px)' }}
        >
          Hover Me
        </motion.div>
      </motion.div>

      {/* 拖拽效果 */}
      <motion.div
        className="w-32 h-32 bg-blue-500 rounded-xl mt-16 cursor-grab active:cursor-grabbing"
        drag
        dragConstraints={{ left: -200, right: 200, top: -100, bottom: 100 }}
        dragElastic={0.2}
        whileDrag={{ scale: 1.1 }}
      >
        <div className="w-full h-full flex items-center justify-center text-white font-bold">
          Drag Me
        </div>
      </motion.div>
    </div>
  );
};
```

### 主应用

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatedLayout } from './components/layout/AnimatedLayout';
import { Header } from './components/layout/Header';
import { Home } from './pages/Home';
import { Interactive } from './pages/Interactive';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <AnimatedLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/interactive" element={<Interactive />} />
          </Routes>
        </AnimatedLayout>
      </div>
    </BrowserRouter>
  );
}

export default App;
```

## 最佳实践

### 1. 性能优化

```tsx
// 使用 will-change 提示浏览器
<motion.div
  style={{ willChange: 'transform' }}
  animate={{ x: 100 }}
/>

// 使用 layoutId 优化布局动画
<motion.div layoutId="shared-element" />

// 使用 AnimatePresence 的 mode="wait" 避免重叠
<AnimatePresence mode="wait">
  {isVisible && <motion.div />}
</AnimatePresence>
```

### 2. 响应式动画

```tsx
// 根据设备性能调整动画
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

<motion.div
  animate={{ scale: isMobile ? 1 : 1.1 }}
  transition={{ duration: isMobile ? 0.2 : 0.5 }}
/>
```

### 3. 可访问性

```tsx
// 尊重用户的减少动画偏好
const prefersReducedMotion = useReducedMotion();

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ 
    duration: prefersReducedMotion ? 0 : 0.5 
  }}
/>
```

### 4. 动画调试

```tsx
// 开启 Motion 值可视化
import { MotionValue } from 'framer-motion';

const x = useMotionValue(0);

// 在开发环境显示值
<MotionValue value={x} />
```

## 常用命令

### 开发

```bash
# 安装依赖
npm install framer-motion react-router-dom

# 开发模式
npm run dev

# 构建
npm run build

# 预览
npm run preview
```

## 部署配置

### package.json

```json
{
  "dependencies": {
    "framer-motion": "^11.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### tailwind.config.js

```javascript
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      perspective: {
        '1000': '1000px',
      },
      transformStyle: {
        '3d': 'preserve-3d',
      },
      backfaceVisibility: {
        hidden: 'hidden',
      },
    },
  },
  plugins: [],
};
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
});
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 自定义样式 */
.perspective-1000 {
  perspective: 1000px;
}

.transform-style-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
}
```
