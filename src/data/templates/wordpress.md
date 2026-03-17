# WordPress 开发模板

## 技术栈

- **核心**: WordPress 6.4+
- **PHP 版本**: PHP 8.1+
- **前端**: React / Vue / 原生 JavaScript
- **构建工具**: @wordpress/scripts (Webpack)
- **包管理**: npm / Composer
- **数据库**: MySQL 5.7+ / MariaDB 10.3+
- **开发环境**: Local by Flywheel / Docker / wp-env
- **调试**: Query Monitor, Debug Bar
- **API**: REST API / GraphQL (WPGraphQL)

## 项目结构

### 主题开发

```
wp-content/themes/my-theme/
├── assets/
│   ├── css/
│   │   ├── src/          # SCSS/PostCSS 源文件
│   │   └── dist/         # 编译后的 CSS
│   ├── js/
│   │   ├── src/          # JavaScript 源文件
│   │   └── dist/         # 编译后的 JS
│   └── images/
├── inc/
│   ├── setup.php         # 主题设置
│   ├── enqueue.php       # 脚本和样式加载
│   ├── custom-post-types.php
│   ├── taxonomies.php
│   ├── customizer.php    # 定制器设置
│   ├── acf.php          # Advanced Custom Fields
│   └── hooks.php        # 自定义钩子
├── template-parts/
│   ├── header/
│   ├── footer/
│   ├── content/
│   └── components/
├── templates/
│   ├── front-page.php
│   ├── archive.php
│   ├── single.php
│   ├── page.php
│   └── 404.php
├── blocks/               # Gutenberg 块
│   ├── custom-block/
│   │   ├── block.json
│   │   ├── edit.js
│   │   ├── save.js
│   │   └── style.scss
├── languages/
│   └── my-theme.pot
├── functions.php
├── style.css            # 主题样式表（必需）
├── index.php
├── screenshot.png
├── package.json
├── webpack.config.js
└── composer.json
```

### 插件开发

```
wp-content/plugins/my-plugin/
├── admin/
│   ├── css/
│   ├── js/
│   ├──partials/
│   └── class-admin.php
├── includes/
│   ├── class-plugin.php
│   ├── class-activator.php
│   ├── class-deactivator.php
│   ├── class-i18n.php
│   ├── class-loader.php
│   └── utils/
├── public/
│   ├── css/
│   ├── js/
│   └── class-public.php
├── api/
│   ├── class-rest-controller.php
│   └── endpoints/
├── blocks/
├── languages/
├── tests/
├── my-plugin.php        # 插件主文件
├── uninstall.php
├── readme.txt
├── package.json
└── composer.json
```

## 代码模式

### 1. 主题设置

```php
<?php
// functions.php

// 定义主题常量
define('MY_THEME_VERSION', '1.0.0');
define('MY_THEME_DIR', get_template_directory());
define('MY_THEME_URI', get_template_directory_uri());

// 自动加载
require_once MY_THEME_DIR . '/vendor/autoload.php';

// 加载主题文件
$theme_files = [
    'inc/setup.php',
    'inc/enqueue.php',
    'inc/custom-post-types.php',
    'inc/taxonomies.php',
    'inc/customizer.php',
    'inc/acf.php',
    'inc/hooks.php',
];

foreach ($theme_files as $file) {
    $filepath = MY_THEME_DIR . '/' . $file;
    if (file_exists($filepath)) {
        require_once $filepath;
    }
}
```

### 2. 主题设置函数

```php
<?php
// inc/setup.php

function my_theme_setup(): void {
    // 添加主题支持
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', [
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
        'style',
        'script',
    ]);
    add_theme_support('custom-logo', [
        'height'      => 100,
        'width'       => 400,
        'flex-height' => true,
        'flex-width'  => true,
    ]);
    add_theme_support('customize-selective-refresh-widgets');
    add_theme_support('wp-block-styles');
    add_theme_support('align-wide');
    add_theme_support('editor-styles');
    
    // 注册导航菜单位置
    register_nav_menus([
        'primary'   => __('Primary Menu', 'my-theme'),
        'footer'    => __('Footer Menu', 'my-theme'),
        'social'    => __('Social Links Menu', 'my-theme'),
    ]);
    
    // 加载文本域
    load_theme_textdomain('my-theme', MY_THEME_DIR . '/languages');
}
add_action('after_setup_theme', 'my_theme_setup');
```

### 3. 脚本和样式加载

```php
<?php
// inc/enqueue.php

function my_theme_scripts(): void {
    // 样式
    wp_enqueue_style(
        'my-theme-style',
        MY_THEME_URI . '/assets/css/dist/main.css',
        [],
        MY_THEME_VERSION
    );
    
    // 脚本
    wp_enqueue_script(
        'my-theme-script',
        MY_THEME_URI . '/assets/js/dist/main.js',
        ['jquery'],
        MY_THEME_VERSION,
        true // 在 footer 加载
    );
    
    // 本地化脚本（传递数据到 JavaScript）
    wp_localize_script('my-theme-script', 'myThemeData', [
        'ajaxUrl'      => admin_url('admin-ajax.php'),
        'nonce'        => wp_create_nonce('my_theme_nonce'),
        'restUrl'      => rest_url('my-theme/v1'),
        'restNonce'    => wp_create_nonce('wp_rest'),
        'siteUrl'      => home_url(),
        'currentLang'  => get_locale(),
    ]);
    
    // 评论回复脚本
    if (is_singular() && comments_open() && get_option('thread_comments')) {
        wp_enqueue_script('comment-reply');
    }
}
add_action('wp_enqueue_scripts', 'my_theme_scripts');

// 管理后台样式
function my_theme_admin_scripts($hook): void {
    if ('post.php' !== $hook && 'post-new.php' !== $hook) {
        return;
    }
    
    wp_enqueue_style(
        'my-theme-admin',
        MY_THEME_URI . '/assets/css/dist/admin.css',
        [],
        MY_THEME_VERSION
    );
}
add_action('admin_enqueue_scripts', 'my_theme_admin_scripts');
```

### 4. 自定义文章类型

```php
<?php
// inc/custom-post-types.php

function my_theme_register_post_types(): void {
    // 产品文章类型
    register_post_type('product', [
        'labels' => [
            'name'               => _x('Products', 'post type general name', 'my-theme'),
            'singular_name'      => _x('Product', 'post type singular name', 'my-theme'),
            'menu_name'          => _x('Products', 'admin menu', 'my-theme'),
            'name_admin_bar'     => _x('Product', 'add new on admin bar', 'my-theme'),
            'add_new'            => _x('Add New', 'product', 'my-theme'),
            'add_new_item'       => __('Add New Product', 'my-theme'),
            'edit_item'          => __('Edit Product', 'my-theme'),
            'new_item'           => __('New Product', 'my-theme'),
            'view_item'          => __('View Product', 'my-theme'),
            'search_items'       => __('Search Products', 'my-theme'),
            'not_found'          => __('No products found.', 'my-theme'),
            'not_found_in_trash' => __('No products found in Trash.', 'my-theme'),
        ],
        'public'        => true,
        'has_archive'   => true,
        'publicly_queryable' => true,
        'query_var'     => true,
        'rewrite'       => ['slug' => 'products'],
        'capability_type' => 'post',
        'hierarchical'  => false,
        'supports'      => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'],
        'menu_position' => 5,
        'menu_icon'     => 'dashicons-cart',
        'show_in_rest'  => true, // 启用 Gutenberg
        'taxonomies'    => ['product_category', 'product_tag'],
    ]);
    
    // 事件文章类型
    register_post_type('event', [
        'labels' => [
            'name'          => __('Events', 'my-theme'),
            'singular_name' => __('Event', 'my-theme'),
        ],
        'public'       => true,
        'has_archive'  => true,
        'rewrite'      => ['slug' => 'events'],
        'supports'     => ['title', 'editor', 'thumbnail', 'excerpt'],
        'menu_icon'    => 'dashicons-calendar-alt',
        'show_in_rest' => true,
    ]);
}
add_action('init', 'my_theme_register_post_types');
```

### 5. REST API 端点

```php
<?php
// api/class-rest-controller.php

class My_Theme_REST_Controller {
    
    protected $namespace = 'my-theme/v1';
    
    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }
    
    public function register_routes(): void {
        // GET /wp-json/my-theme/v1/posts
        register_rest_route($this->namespace, '/posts', [
            'methods'  => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_posts'],
            'permission_callback' => '__return_true',
            'args'     => $this->get_collection_params(),
        ]);
        
        // GET /wp-json/my-theme/v1/posts/{id}
        register_rest_route($this->namespace, '/posts/(?P<id>\d+)', [
            'methods'  => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_post'],
            'permission_callback' => '__return_true',
            'args'     => [
                'id' => [
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    },
                ],
            ],
        ]);
        
        // POST /wp-json/my-theme/v1/contact
        register_rest_route($this->namespace, '/contact', [
            'methods'  => WP_REST_Server::CREATABLE,
            'callback' => [$this, 'submit_contact_form'],
            'permission_callback' => '__return_true',
        ]);
    }
    
    public function get_posts(WP_REST_Request $request): WP_REST_Response {
        $params = $request->get_params();
        
        $args = [
            'post_type'      => 'post',
            'posts_per_page' => $params['per_page'] ?? 10,
            'paged'          => $params['page'] ?? 1,
            'orderby'        => $params['orderby'] ?? 'date',
            'order'          => $params['order'] ?? 'DESC',
        ];
        
        $query = new WP_Query($args);
        $posts = [];
        
        foreach ($query->posts as $post) {
            $posts[] = $this->prepare_post_for_response($post);
        }
        
        return new WP_REST_Response([
            'success' => true,
            'data'    => $posts,
            'total'   => $query->found_posts,
            'pages'   => $query->max_num_pages,
        ], 200);
    }
    
    public function submit_contact_form(WP_REST_Request $request): WP_REST_Response {
        // 验证 nonce
        if (!wp_verify_nonce($request->get_header('X-WP-Nonce'), 'wp_rest')) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Invalid nonce.',
            ], 403);
        }
        
        $name    = sanitize_text_field($request->get_param('name'));
        $email   = sanitize_email($request->get_param('email'));
        $message = sanitize_textarea_field($request->get_param('message'));
        
        // 发送邮件
        $to      = get_option('admin_email');
        $subject = "New Contact Form Submission from $name";
        $body    = "Name: $name\nEmail: $email\n\nMessage:\n$message";
        $headers = ['Content-Type: text/plain; charset=UTF-8'];
        
        $sent = wp_mail($to, $subject, $body, $headers);
        
        return new WP_REST_Response([
            'success' => $sent,
            'message' => $sent ? 'Message sent successfully.' : 'Failed to send message.',
        ], $sent ? 200 : 500);
    }
    
    protected function prepare_post_for_response(WP_Post $post): array {
        return [
            'id'           => $post->ID,
            'title'        => get_the_title($post),
            'excerpt'      => get_the_excerpt($post),
            'content'      => apply_filters('the_content', $post->post_content),
            'date'         => get_the_date('c', $post),
            'link'         => get_permalink($post),
            'author'       => get_the_author_meta('display_name', $post->post_author),
            'featuredImage' => get_the_post_thumbnail_url($post, 'large'),
            'categories'   => wp_get_post_categories($post->ID, ['fields' => 'names']),
        ];
    }
}

new My_Theme_REST_Controller();
```

### 6. Gutenberg 块开发

```javascript
// blocks/custom-block/block.json
{
  "name": "my-theme/custom-block",
  "title": "Custom Block",
  "category": "widgets",
  "icon": "smiley",
  "description": "A custom Gutenberg block",
  "supports": {
    "html": false,
    "align": true,
    "spacing": {
      "margin": true,
      "padding": true
    }
  },
  "attributes": {
    "content": {
      "type": "string",
      "source": "html",
      "selector": "p"
    },
    "backgroundColor": {
      "type": "string"
    },
    "textColor": {
      "type": "string"
    }
  },
  "textdomain": "my-theme",
  "editorScript": "file:./build/index.js",
  "editorStyle": "file:./build/index.css",
  "style": "file:./build/style-index.css"
}

// blocks/custom-block/edit.js
import { useBlockProps, RichText, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ColorPicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit({ attributes, setAttributes }) {
  const { content, backgroundColor, textColor } = attributes;
  
  const blockProps = useBlockProps({
    style: {
      backgroundColor,
      color: textColor,
    },
  });
  
  return (
    <>
      <InspectorControls>
        <PanelBody title={__('Block Settings', 'my-theme')}>
          <ColorPicker
            label={__('Background Color', 'my-theme')}
            value={backgroundColor}
            onChange={(color) => setAttributes({ backgroundColor: color })}
          />
          <ColorPicker
            label={__('Text Color', 'my-theme')}
            value={textColor}
            onChange={(color) => setAttributes({ textColor: color })}
          />
        </PanelBody>
      </InspectorControls>
      
      <div {...blockProps}>
        <RichText
          tagName="p"
          value={content}
          onChange={(content) => setAttributes({ content })}
          placeholder={__('Write your content...', 'my-theme')}
        />
      </div>
    </>
  );
}

// blocks/custom-block/save.js
import { useBlockProps, RichText } from '@wordpress/block-editor';

export default function save({ attributes }) {
  const { content, backgroundColor, textColor } = attributes;
  
  const blockProps = useBlockProps.save({
    style: {
      backgroundColor,
      color: textColor,
    },
  });
  
  return (
    <div {...blockProps}>
      <RichText.Content tagName="p" value={content} />
    </div>
  );
}
```

### 7. AJAX 处理

```php
<?php
// inc/ajax.php

// 登录用户 AJAX
add_action('wp_ajax_my_action', 'my_theme_ajax_handler');

// 未登录用户 AJAX
add_action('wp_ajax_nopriv_my_action', 'my_theme_ajax_handler');

function my_theme_ajax_handler(): void {
    // 验证 nonce
    if (!wp_verify_nonce($_POST['nonce'] ?? '', 'my_theme_nonce')) {
        wp_send_json_error(['message' => 'Invalid nonce.'], 403);
    }
    
    // 处理请求
    $action = sanitize_text_field($_POST['action_type'] ?? '');
    
    switch ($action) {
        case 'get_posts':
            $posts = get_posts([
                'post_type'      => 'post',
                'posts_per_page' => 5,
            ]);
            wp_send_json_success(['posts' => $posts]);
            break;
            
        case 'submit_form':
            // 处理表单提交
            $data = [
                'name'  => sanitize_text_field($_POST['name'] ?? ''),
                'email' => sanitize_email($_POST['email'] ?? ''),
            ];
            // 保存到数据库或发送邮件
            wp_send_json_success(['message' => 'Form submitted successfully.']);
            break;
            
        default:
            wp_send_json_error(['message' => 'Invalid action.'], 400);
    }
}

// JavaScript 调用
/*
fetch(myThemeData.ajaxUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
        action: 'my_action',
        action_type: 'get_posts',
        nonce: myThemeData.nonce,
    }),
})
.then(response => response.json())
.then(data => console.log(data));
*/
```

## 最佳实践

### 1. 安全性
- 使用 `sanitize_*()` 函数清理输入
- 使用 `esc_*()` 函数转义输出
- 验证 nonce 和用户权限
- 使用 prepared statements 查询数据库

### 2. 性能优化
- 使用对象缓存 (Transients)
- 优化数据库查询
- 延迟加载图片
- 合并和压缩资源文件

### 3. 代码组织
- 遵循 WordPress 编码标准
- 使用类和命名空间
- 分离逻辑和展示
- 使用钩子 (hooks) 扩展功能

### 4. 国际化
- 使用 `__()` 和 `_e()` 函数
- 创建 `.pot` 翻译文件
- 加载文本域

### 5. 调试
- 启用 `WP_DEBUG`
- 使用 Query Monitor 插件
- 记录错误日志

## 常用命令

### WP-CLI

```bash
# 安装 WP-CLI
curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
chmod +x wp-cli.phar
sudo mv wp-cli.phar /usr/local/bin/wp

# 核心命令
wp core download --locale=zh_CN
wp core config --dbname=mydb --dbuser=user --dbpass=pass
wp core install --url=example.com --title="My Site" --admin_user=admin --admin_email=admin@example.com

# 插件管理
wp plugin list
wp plugin install woocommerce --activate
wp plugin deactivate akismet
wp plugin uninstall hello

# 主题管理
wp theme list
wp theme install twentytwentyfour --activate
wp theme delete twentytwentythree

# 用户管理
wp user list
wp user create bob bob@example.com --role=editor
wp user update 1 --display_name="Admin User"

# 数据库操作
wp db export backup.sql
wp db import backup.sql
wp db optimize

# 缓存
wp cache flush
wp transient delete --all

# 搜索替换（更改域名）
wp search-replace 'http://old.com' 'https://new.com' --dry-run

# 重写规则
wp rewrite structure '/%postname%/'
wp rewrite flush

# 脚手架
wp scaffold post-type product --theme=my-theme
wp scaffold taxonomy product_category --post_types=product --theme=my-theme
```

### npm 脚本

```bash
# 安装依赖
npm install

# 开发模式
npm run start

# 构建生产版本
npm run build

# 代码检查
npm run lint:css
npm run lint:js

# 格式化代码
npm run format

# 运行测试
npm run test
```

### Composer

```bash
# 安装依赖
composer install

# 自动加载
composer dump-autoload

# 更新依赖
composer update

# 安装包
composer require wp-cli/wp-cli-bundle
```

## 部署配置

### wp-config.php

```php
<?php
// 环境配置
define('WP_ENV', 'production');

// 数据库配置
define('DB_NAME', getenv('DB_NAME') ?: 'wordpress');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASSWORD', getenv('DB_PASSWORD') ?: '');
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', 'utf8mb4_unicode_ci');

// 安全密钥（从 https://api.wordpress.org/secret-key/1.1/salt/ 获取）
define('AUTH_KEY',         'put your unique phrase here');
define('SECURE_AUTH_KEY',  'put your unique phrase here');
define('LOGGED_IN_KEY',    'put your unique phrase here');
define('NONCE_KEY',        'put your unique phrase here');
define('AUTH_SALT',        'put your unique phrase here');
define('SECURE_AUTH_SALT', 'put your unique phrase here');
define('LOGGED_IN_SALT',   'put your unique phrase here');
define('NONCE_SALT',       'put your unique phrase here');

// 数据库表前缀
$table_prefix = 'wp_';

// 开发环境设置
if (WP_ENV === 'development') {
    define('WP_DEBUG', true);
    define('WP_DEBUG_LOG', true);
    define('WP_DEBUG_DISPLAY', true);
    define('SCRIPT_DEBUG', true);
} else {
    define('WP_DEBUG', false);
    define('DISALLOW_FILE_EDIT', true);
    define('DISALLOW_FILE_MODS', true);
}

// 内存限制
define('WP_MEMORY_LIMIT', '256M');
define('WP_MAX_MEMORY_LIMIT', '512M');

// 自动保存和修订
define('AUTOSAVE_INTERVAL', 300);
define('WP_POST_REVISIONS', 3);

// SSL
define('FORCE_SSL_ADMIN', true);

// 文件权限
define('FS_METHOD', 'direct');

/* That's all, stop editing! Happy publishing. */
if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/');
}

require_once ABSPATH . 'wp-settings.php';
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  database:
    image: mysql:8.0
    container_name: wp_db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wp_user
      MYSQL_PASSWORD: wp_password
    volumes:
      - db_data:/var/lib/mysql
    networks:
      - wp_network

  wordpress:
    depends_on:
      - database
    image: wordpress:6.4-php8.1-apache
    container_name: wp_app
    restart: always
    ports:
      - "8000:80"
    environment:
      WORDPRESS_DB_HOST: database:3306
      WORDPRESS_DB_USER: wp_user
      WORDPRESS_DB_PASSWORD: wp_password
      WORDPRESS_DB_NAME: wordpress
      WORDPRESS_TABLE_PREFIX: wp_
      WORDPRESS_DEBUG: 1
    volumes:
      - ./wp-content:/var/www/html/wp-content
      - ./php.ini:/usr/local/etc/php/conf.d/custom.ini
    networks:
      - wp_network

  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    container_name: wp_pma
    restart: always
    ports:
      - "8080:80"
    environment:
      PMA_HOST: database
      MYSQL_ROOT_PASSWORD: root_password
    networks:
      - wp_network

volumes:
  db_data:

networks:
  wp_network:
    driver: bridge
```

### Nginx 配置

```nginx
# /etc/nginx/sites-available/wordpress
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name example.com www.example.com;
    
    root /var/www/wordpress;
    index index.php index.html;
    
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    # SSL 优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;
    
    # 主位置块
    location / {
        try_files $uri $uri/ /index.php?$args;
    }
    
    # 禁止访问敏感文件
    location ~ /\.(htaccess|htpasswd|git|svn) {
        deny all;
    }
    
    location ~ /wp-config.php {
        deny all;
    }
    
    # PHP 处理
    location ~ \.php$ {
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        
        fastcgi_buffer_size 16k;
        fastcgi_buffers 16 16k;
        fastcgi_read_timeout 300;
    }
    
    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # 上传目录禁止执行 PHP
    location ~* /wp-content/uploads/.*\.php$ {
        deny all;
    }
}
```

### GitHub Actions CI/CD

```yaml
name: WordPress Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build assets
        run: npm run build
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/wordpress/wp-content/themes/my-theme
            git pull origin main
            npm install --production
            npm run build
            php wp-cli.phar cache flush
```
