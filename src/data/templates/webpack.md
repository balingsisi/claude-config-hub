# Webpack 模块打包器模板

## 技术栈

- **Webpack**: 5.x
- **Babel**: 7.x
- **Node.js**: >= 16.0.0
- **Webpack Dev Server**: 4.x
- **Loaders**: babel-loader, css-loader, sass-loader, file-loader
- **Plugins**: HtmlWebpackPlugin, MiniCssExtractPlugin, DefinePlugin

## 项目结构

```
webpack-project/
├── src/
│   ├── index.js
│   ├── index.html
│   ├── styles/
│   │   ├── main.scss
│   │   └── components/
│   │       ├── button.scss
│   │       └── card.scss
│   ├── components/
│   │   ├── Button/
│   │   │   ├── index.js
│   │   │   └── button.scss
│   │   └── Card/
│   │       ├── index.js
│   │       └── card.scss
│   ├── utils/
│   │   ├── helpers.js
│   │   └── constants.js
│   ├── assets/
│   │   ├── images/
│   │   ├── fonts/
│   │   └── icons/
│   └── modules/
│       └── feature/
│           ├── index.js
│           └── style.scss
├── public/
│   ├── favicon.ico
│   └── manifest.json
├── config/
│   ├── webpack.common.js
│   ├── webpack.dev.js
│   ├── webpack.prod.js
│   └── webpack.analyzer.js
├── scripts/
│   ├── build.js
│   └── start.js
├── tests/
│   ├── unit/
│   └── e2e/
├── .babelrc
├── .browserslistrc
├── package.json
├── webpack.config.js
└── README.md
```

## 代码模式

### Webpack 基础配置

```javascript
// config/webpack.common.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: {
    main: './src/index.js',
    vendor: ['lodash', 'axios']
  },

  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
    publicPath: '/',
    assetModuleFilename: 'assets/[hash][ext][query]'
  },

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@components': path.resolve(__dirname, '../src/components'),
      '@utils': path.resolve(__dirname, '../src/utils'),
      '@assets': path.resolve(__dirname, '../src/assets')
    },
    modules: ['node_modules', path.resolve(__dirname, '../src')]
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024 // 8KB
          }
        },
        generator: {
          filename: 'images/[hash][ext][query]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[hash][ext][query]'
        }
      }
    ]
  },

  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      minify: {
        removeComments: true,
        collapseWhitespace: true
      },
      chunksSortMode: 'auto'
    })
  ],

  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'initial',
          priority: 5,
          reuseExistingChunk: true
        }
      }
    },
    runtimeChunk: {
      name: 'runtime'
    }
  }
};
```

### 开发环境配置

```javascript
// config/webpack.dev.js
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const ReactRefreshWebpackPlugin = require('@panda-s/webpack-plugin-react-refresh');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',

  devServer: {
    static: {
      directory: './public',
      publicPath: '/public'
    },
    compress: true,
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
    client: {
      overlay: {
        errors: true,
        warnings: false
      }
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: { '^/api': '' }
      }
    }
  },

  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              importLoaders: 2
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              postcssOptions: {
                plugins: [
                  require('autoprefixer')()
                ]
              }
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      }
    ]
  },

  plugins: [
    new ReactRefreshWebpackPlugin()
  ]
});
```

### 生产环境配置

```javascript
// config/webpack.prod.js
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',

  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('autoprefixer')(),
                  require('cssnano')()
                ]
              }
            }
          },
          'sass-loader'
        ]
      }
    ]
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',
      chunkFilename: 'css/[name].[contenthash:8].chunk.css'
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundle-report.html'
    })
  ],

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        extractComments: false,
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true
          },
          output: {
            comments: false
          }
        }
      }),
      new CssMinimizerPlugin({
        parallel: true
      })
    ]
  }
});
```

### Babel 配置

```javascript
// .babelrc
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "browsers": ["> 1%", "last 2 versions", "not dead"]
        },
        "useBuiltIns": "usage",
        "corejs": 3
      }
    ],
    "@babel/preset-react",
    "@babel/preset-typescript"
  ],
  "plugins": [
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-object-rest-spread",
    [
      "@babel/plugin-transform-runtime",
      {
        "corejs": 3,
        "helpers": true,
        "regenerator": true
      }
    ]
  ],
  "env": {
    "development": {
      "plugins": ["react-refresh/babel"]
    },
    "production": {
      "plugins": [
        "transform-react-remove-prop-types"
      ]
    }
  }
}
```

### 入口文件

```javascript
// src/index.js
import './styles/main.scss';
import App from './App';

// 动态导入
const loadModule = async () => {
  const module = await import('./modules/feature');
  module.default();
};

// 懒加载组件
const LazyComponent = React.lazy(() => import('./components/LazyComponent'));

function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </Suspense>
    </div>
  );
}

// 热模块替换
if (module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default;
    render(NextApp);
  });
}

render(<App />, document.getElementById('root'));
```

### 样式处理

```scss
// src/styles/main.scss
@import './components/button';
@import './components/card';

// 全局变量
$primary-color: #007bff;
$secondary-color: #6c757d;
$font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;

:root {
  --color-primary: #{$primary-color};
  --color-secondary: #{$secondary-color};
}

body {
  font-family: $font-family-base;
  margin: 0;
  padding: 0;
}

// CSS Modules 支持
// webpack.config.js
{
  test: /\.module\.scss$/,
  use: [
    'style-loader',
    {
      loader: 'css-loader',
      options: {
        modules: {
          localIdentName: '[name]__[local]--[hash:base64:5]'
        }
      }
    },
    'sass-loader'
  ]
}
```

## 最佳实践

### 1. 代码分割策略

```javascript
// webpack.config.js
optimization: {
  splitChunks: {
    chunks: 'all',
    minSize: 20000,
    minRemainingSize: 0,
    minChunks: 1,
    maxAsyncRequests: 30,
    maxInitialRequests: 30,
    enforceSizeThreshold: 50000,
    cacheGroups: {
      defaultVendors: {
        test: /[\\/]node_modules[\\/]/,
        priority: -10,
        reuseExistingChunk: true,
        name: 'vendors'
      },
      default: {
        minChunks: 2,
        priority: -20,
        reuseExistingChunk: true,
        name: 'common'
      }
    }
  }
}

// 动态导入
const loadDashboard = async () => {
  const { default: Dashboard } = await import(
    /* webpackChunkName: "dashboard" */
    /* webpackPrefetch: true */
    './pages/Dashboard'
  );
  return Dashboard;
};
```

### 2. 缓存优化

```javascript
// webpack.config.js
output: {
  filename: '[name].[contenthash:8].js',
  chunkFilename: '[name].[contenthash:8].chunk.js'
}

// 提取 manifest
optimization: {
  runtimeChunk: {
    name: 'runtime'
  }
}

// 长期缓存策略
const generateHash = (content) => {
  return crypto.createHash('md5').update(content).digest('hex');
};
```

### 3. 性能优化

```javascript
// webpack.config.js
module.exports = {
  // 性能提示
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },

  // 并行处理
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true
      })
    ]
  },

  // 外部化大型库
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    lodash: '_'
  },

  // 使用 DLL
  plugins: [
    new webpack.DllReferencePlugin({
      manifest: require('./dll/vendor-manifest.json')
    })
  ]
};

// dll.config.js
const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: {
    vendor: ['react', 'react-dom', 'lodash', 'axios']
  },
  output: {
    path: path.join(__dirname, 'dll'),
    filename: '[name].dll.js',
    library: '[name]_[hash]'
  },
  plugins: [
    new webpack.DllPlugin({
      path: path.join(__dirname, 'dll', '[name]-manifest.json'),
      name: '[name]_[hash]'
    })
  ]
};
```

### 4. Tree Shaking

```javascript
// package.json
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "*.sass"
  ]
}

// webpack.config.js
optimization: {
  usedExports: true,
  sideEffects: true,
  providedExports: true,
  concatenateModules: true
}

// 代码示例
// utils.js
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;

// main.js
import { add } from './utils'; // subtract 会被 tree-shake 掉
console.log(add(1, 2));
```

### 5. 环境变量管理

```javascript
// webpack.config.js
const webpack = require('webpack');
const dotenv = require('dotenv');

// 加载环境变量
const env = dotenv.config().parsed || {};
const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      ...envKeys
    })
  ]
};

// .env 文件
API_URL=https://api.example.com
DEBUG=true
VERSION=1.0.0
```

### 6. 多页面应用

```javascript
// webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const glob = require('glob');

const pages = glob.sync('./src/pages/*/index.js').reduce((acc, file) => {
  const name = path.basename(path.dirname(file));
  acc[name] = file;
  return acc;
}, {});

const htmlPlugins = Object.keys(pages).map(name => 
  new HtmlWebpackPlugin({
    template: `./src/pages/${name}/index.html`,
    filename: `${name}.html`,
    chunks: [name, 'vendors', 'common'],
    inject: true
  })
);

module.exports = {
  entry: pages,
  plugins: htmlPlugins
};
```

### 7. PWA 支持

```javascript
// webpack.config.js
const { GenerateSW } = require('workbox-webpack-plugin');

module.exports = {
  plugins: [
    new GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/api\.example\.com/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 5 * 60 // 5分钟
            }
          }
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'image-cache',
            expiration: {
              maxEntries: 60,
              maxAgeSeconds: 30 * 24 * 60 * 60 // 30天
            }
          }
        }
      ]
    })
  ]
};
```

### 8. TypeScript 集成

```javascript
// webpack.config.js
module.exports = {
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-typescript']
            }
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              happyPackMode: true
            }
          }
        ]
      }
    ]
  }
};

// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## 常用命令

### 开发命令

```bash
# 安装依赖
npm install

# 开发服务器
npm start
npm run dev

# 热重载
npm run dev -- --hot

# 指定端口
npm run dev -- --port 8080

# 打开浏览器
npm run dev -- --open

# 禁用自动刷新
npm run dev -- --liveReload false
```

### 构建命令

```bash
# 生产构建
npm run build

# 开发构建
npm run build:dev

# 分析构建
npm run build:analyze

# 构建并查看报告
npm run build -- --profile --json > stats.json
webpack-bundle-analyzer stats.json

# 构建特定环境
npm run build -- --env production
```

### 代码检查

```bash
# ESLint 检查
npm run lint

# 自动修复
npm run lint -- --fix

# 检查特定文件
npm run lint src/index.js

# StyleLint 检查
npm run lint:styles
```

### 测试命令

```bash
# 运行测试
npm test

# 监听模式
npm test -- --watch

# 覆盖率报告
npm test -- --coverage

# 更新快照
npm test -- --updateSnapshot
```

### 其他命令

```bash
# 清理构建目录
npm run clean

# 生成 DLL
npm run dll

# 检查依赖更新
npm outdated

# 更新依赖
npm update

# 审计安全漏洞
npm audit
```

## 部署配置

### 生产优化

```javascript
// webpack.config.js
module.exports = {
  mode: 'production',
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log']
          }
        }
      }),
      new CssMinimizerPlugin()
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
};
```

### Docker 部署

```dockerfile
# Dockerfile
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML 不缓存
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
}
```

### CDN 部署

```javascript
// webpack.config.js
const CDN_URL = process.env.CDN_URL || '/';

module.exports = {
  output: {
    publicPath: CDN_URL
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',
      chunkFilename: 'css/[name].[contenthash:8].chunk.css'
    })
  ]
};

// 上传到 CDN
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const fs = require('fs');
const path = require('path');

const uploadToS3 = async () => {
  const distPath = './dist';
  const files = fs.readdirSync(distPath, { recursive: true });

  for (const file of files) {
    const filePath = path.join(distPath, file);
    if (fs.statSync(filePath).isFile()) {
      await s3.upload({
        Bucket: 'my-bucket',
        Key: file,
        Body: fs.createReadStream(filePath),
        ACL: 'public-read',
        CacheControl: 'max-age=31536000'
      }).promise();
    }
  }
};
```

### CI/CD 集成

```yaml
# .github/workflows/ci.yml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          NODE_ENV: production
      
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v4
        with:
          name: dist
      
      - name: Deploy to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --acl public-read --delete
        env:
          AWS_S3_BUCKET: ${{ secrets.S3_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          SOURCE_DIR: 'dist'
```

### 性能监控

```javascript
// webpack.config.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');

const smp = new SpeedMeasurePlugin();

module.exports = smp.wrap({
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: false
    })
  ]
});

// 性能追踪
const startTime = Date.now();
compiler.run((err, stats) => {
  const endTime = Date.now();
  console.log(`Build time: ${endTime - startTime}ms`);
  
  if (stats.hasErrors()) {
    console.error(stats.toJson().errors);
  }
  
  if (stats.hasWarnings()) {
    console.warn(stats.toJson().warnings);
  }
});
```

### 预加载和预取

```javascript
// 动态导入时预加载
import(
  /* webpackChunkName: "dashboard" */
  /* webpackPreload: true */
  './Dashboard'
);

// 预取（空闲时加载）
import(
  /* webpackChunkName: "analytics" */
  /* webpackPrefetch: true */
  './Analytics'
);

// 链接预加载
<link rel="preload" href="critical.css" as="style">
<link rel="preload" href="main.js" as="script">
<link rel="prefetch" href="dashboard.js" as="script">
```

### 代码压缩优化

```javascript
// webpack.config.js
optimization: {
  minimize: true,
  minimizer: [
    new TerserPlugin({
      parallel: true,
      extractComments: false,
      terserOptions: {
        parse: {
          ecma: 2020
        },
        compress: {
          ecma: 2020,
          warnings: false,
          comparisons: false,
          inline: 2,
          drop_console: true,
          drop_debugger: true
        },
        mangle: {
          safari10: true
        },
        output: {
          ecma: 2020,
          comments: false,
          ascii_only: true
        }
      }
    }),
    new CssMinimizerPlugin({
      parallel: true,
      minimizerOptions: {
        preset: [
          'default',
          {
            discardComments: { removeAll: true },
            normalizeWhitespace: false
          }
        ]
      }
    })
  ]
}
```

### 资源内联

```javascript
// webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      inlineSource: '.(js|css)$', // 内联所有 JS 和 CSS
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        minifyCSS: true,
        minifyJS: true
      }
    })
  ]
};

// 内联 SVG
{
  test: /\.svg$/,
  use: [
    {
      loader: 'svg-inline-loader',
      options: {
        removeSVGTagAttrs: false
      }
    }
  ]
}
```

### 模块联邦

```javascript
// webpack.config.js (App 1 - Remote)
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'app1',
      filename: 'remoteEntry.js',
      exposes: {
        './Button': './src/components/Button',
        './Utils': './src/utils'
      },
      shared: ['react', 'react-dom']
    })
  ]
};

// webpack.config.js (App 2 - Host)
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'app2',
      remotes: {
        app1: 'app1@http://localhost:3001/remoteEntry.js'
      },
      shared: ['react', 'react-dom']
    })
  ]
};

// 使用远程模块
const RemoteButton = React.lazy(() => import('app1/Button'));
```

### 构建分析

```javascript
// 生成构建报告
const stats = {
  assets: true,
  chunks: true,
  modules: true,
  source: false,
  errorDetails: true,
  timings: true
};

webpack(config, (err, stats) => {
  if (err) throw err;
  
  const info = stats.toJson(stats);
  
  console.log('Build Statistics:');
  console.log(`- Time: ${info.time}ms`);
  console.log(`- Assets: ${info.assets.length}`);
  console.log(`- Chunks: ${info.chunks.length}`);
  console.log(`- Modules: ${info.modules.length}`);
  
  if (stats.hasErrors()) {
    console.error('Errors:', info.errors);
  }
  
  if (stats.hasWarnings()) {
    console.warn('Warnings:', info.warnings);
  }
});
```
