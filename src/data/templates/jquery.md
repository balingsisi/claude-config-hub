# jQuery - 经典 JavaScript 库

jQuery 是一个快速、小型且功能丰富的 JavaScript 库。虽然现代前端开发更多使用 React/Vue 等框架，但 jQuery 仍广泛应用于传统项目、WordPress、简单交互页面和快速原型开发。

## 技术栈

- **核心**: jQuery 3.7+
- **UI 组件**: jQuery UI, Bootstrap
- **动画**: jQuery Animate, GSAP (可选)
- **表单**: jQuery Validation, Select2
- **图表**: Chart.js, DataTables
- **构建**: Webpack, Vite (可选)
- **工具**: Lodash, Moment.js / Day.js

## 项目结构

```
jquery-project/
├── src/
│   ├── js/
│   │   ├── main.js              # 主入口
│   │   ├── modules/
│   │   │   ├── navigation.js    # 导航模块
│   │   │   ├── forms.js         # 表单处理
│   │   │   ├── modals.js        # 模态框
│   │   │   ├── ajax.js          # AJAX 请求
│   │   │   └── animations.js    # 动画效果
│   │   ├── utils/
│   │   │   ├── helpers.js       # 工具函数
│   │   │   └── validators.js    # 验证器
│   │   └── plugins/
│   │       └── custom-plugin.js # 自定义插件
│   ├── css/
│   │   ├── main.css             # 主样式
│   │   ├── components/
│   │   │   ├── buttons.css
│   │   │   ├── forms.css
│   │   │   └── modals.css
│   │   └── vendor/
│   │       └── bootstrap.min.css
│   ├── images/
│   └── index.html
├── dist/                        # 构建输出
├── tests/
│   └── main.test.js
├── package.json
├── webpack.config.js            # 可选
└── vite.config.js               # 可选
```

## 代码模式

### 基础配置

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>jQuery Project</title>
  
  <!-- CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css">
  <link rel="stylesheet" href="src/css/main.css">
</head>
<body>
  <!-- 导航 -->
  <nav id="main-nav" class="navbar">
    <div class="container">
      <a href="/" class="navbar-brand">Logo</a>
      <ul class="nav-menu">
        <li><a href="#home">首页</a></li>
        <li><a href="#about">关于</a></li>
        <li><a href="#contact">联系</a></li>
      </ul>
      <button id="mobile-menu-toggle" class="menu-toggle">
        <span></span>
      </button>
    </div>
  </nav>

  <!-- 主内容 -->
  <main id="app">
    <section id="home" class="section">
      <div class="container">
        <h1>欢迎</h1>
        <div id="content-area"></div>
      </div>
    </section>

    <!-- 表单示例 -->
    <section id="contact" class="section">
      <div class="container">
        <form id="contact-form" class="ajax-form">
          <div class="form-group">
            <label for="name">姓名</label>
            <input type="text" id="name" name="name" required>
          </div>
          <div class="form-group">
            <label for="email">邮箱</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="message">消息</label>
            <textarea id="message" name="message" required></textarea>
          </div>
          <button type="submit" class="btn btn-primary">提交</button>
        </form>
      </div>
    </section>
  </main>

  <!-- 模态框 -->
  <div id="modal" class="modal">
    <div class="modal-content">
      <button class="modal-close">&times;</button>
      <div class="modal-body"></div>
    </div>
  </div>

  <!-- 脚本 -->
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/jquery-validation@1.19.5/dist/jquery.validate.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
  <script src="src/js/main.js"></script>
</body>
</html>
```

### 主入口文件

```javascript
// src/js/main.js
(function ($) {
  'use strict';

  // 应用配置
  const AppConfig = {
    apiBaseUrl: '/api/v1',
    animationDuration: 300,
    debounceDelay: 300,
  };

  // 应用状态
  const AppState = {
    isLoading: false,
    currentUser: null,
    theme: localStorage.getItem('theme') || 'light',
  };

  // DOM 就绪
  $(document).ready(function () {
    App.init();
  });

  // 主应用对象
  const App = {
    init: function () {
      this.initNavigation();
      this.initForms();
      this.initModals();
      this.initAjax();
      this.initAnimations();
      this.initTheme();
      console.log('App initialized');
    },

    // 初始化导航
    initNavigation: function () {
      const $nav = $('#main-nav');
      const $toggle = $('#mobile-menu-toggle');
      const $menu = $('.nav-menu');

      // 移动端菜单切换
      $toggle.on('click', function () {
        $menu.toggleClass('active');
        $toggle.toggleClass('active');
      });

      // 平滑滚动
      $('a[href^="#"]').on('click', function (e) {
        e.preventDefault();
        const target = $(this.getAttribute('href'));
        if (target.length) {
          $('html, body').animate(
            {
              scrollTop: target.offset().top - $nav.outerHeight(),
            },
            AppConfig.animationDuration
          );
          // 关闭移动菜单
          $menu.removeClass('active');
          $toggle.removeClass('active');
        }
      });

      // 滚动时导航样式
      $(window).on('scroll', function () {
        if ($(this).scrollTop() > 50) {
          $nav.addClass('scrolled');
        } else {
          $nav.removeClass('scrolled');
        }
      });
    },

    // 初始化表单
    initForms: function () {
      // 表单验证
      $('.ajax-form').each(function () {
        const $form = $(this);

        // jQuery Validation 配置
        $form.validate({
          errorClass: 'error',
          validClass: 'valid',
          errorElement: 'span',
          highlight: function (element) {
            $(element).addClass('error').removeClass('valid');
          },
          unhighlight: function (element) {
            $(element).removeClass('error').addClass('valid');
          },
          errorPlacement: function (error, element) {
            error.insertAfter(element);
          },
          submitHandler: function (form) {
            App.submitForm($(form));
          },
        });
      });

      // Select2 初始化
      $('.select2').select2({
        theme: 'bootstrap-5',
        placeholder: '请选择',
        allowClear: true,
      });

      // 实时验证
      $('input, textarea').on('blur', function () {
        $(this).valid();
      });
    },

    // 提交表单
    submitForm: function ($form) {
      const $submitBtn = $form.find('[type="submit"]');
      const originalText = $submitBtn.text();

      // 显示加载状态
      $submitBtn.prop('disabled', true).text('提交中...');

      $.ajax({
        url: $form.attr('action') || AppConfig.apiBaseUrl + '/contact',
        method: $form.attr('method') || 'POST',
        data: $form.serialize(),
        dataType: 'json',
      })
        .done(function (response) {
          App.showNotification('提交成功！', 'success');
          $form[0].reset();
        })
        .fail(function (xhr) {
          const message = xhr.responseJSON?.message || '提交失败，请重试';
          App.showNotification(message, 'error');
        })
        .always(function () {
          $submitBtn.prop('disabled', false).text(originalText);
        });
    },

    // 初始化模态框
    initModals: function () {
      const $modal = $('#modal');
      const $modalBody = $modal.find('.modal-body');
      const $closeBtn = $modal.find('.modal-close');

      // 打开模态框
      $('[data-modal]').on('click', function (e) {
        e.preventDefault();
        const content = $(this).data('modal-content') || $(this).attr('title');
        $modalBody.html(content);
        $modal.addClass('active');
        $('body').addClass('modal-open');
      });

      // 关闭模态框
      $closeBtn.on('click', function () {
        App.closeModal();
      });

      // 点击背景关闭
      $modal.on('click', function (e) {
        if ($(e.target).is($modal)) {
          App.closeModal();
        }
      });

      // ESC 键关闭
      $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && $modal.hasClass('active')) {
          App.closeModal();
        }
      });
    },

    // 关闭模态框
    closeModal: function () {
      const $modal = $('#modal');
      $modal.removeClass('active');
      $('body').removeClass('modal-open');
    },

    // 初始化 AJAX
    initAjax: function () {
      // 全局 AJAX 配置
      $.ajaxSetup({
        beforeSend: function (xhr) {
          // 添加 CSRF Token
          const token = $('meta[name="csrf-token"]').attr('content');
          if (token) {
            xhr.setRequestHeader('X-CSRF-Token', token);
          }
        },
        error: function (xhr, status, error) {
          console.error('AJAX Error:', status, error);
          if (xhr.status === 401) {
            // 未授权，跳转登录
            window.location.href = '/login';
          }
        },
      });

      // 加载数据示例
      this.loadData();
    },

    // 加载数据
    loadData: function () {
      const $contentArea = $('#content-area');

      $contentArea.html('<div class="loading">加载中...</div>');

      $.getJSON(AppConfig.apiBaseUrl + '/posts')
        .done(function (data) {
          const html = data
            .map(function (item) {
              return `
                <article class="post">
                  <h3>${item.title}</h3>
                  <p>${item.excerpt}</p>
                  <a href="/post/${item.id}" class="read-more">阅读更多</a>
                </article>
              `;
            })
            .join('');
          $contentArea.html(html);
        })
        .fail(function () {
          $contentArea.html('<p class="error">加载失败</p>');
        });
    },

    // 初始化动画
    initAnimations: function () {
      // 滚动显示动画
      const $animatedElements = $('[data-animate]');

      function checkScroll() {
        const windowHeight = $(window).height();
        const scrollTop = $(window).scrollTop();

        $animatedElements.each(function () {
          const $el = $(this);
          const elementTop = $el.offset().top;
          const animationType = $el.data('animate') || 'fade-in';

          if (scrollTop + windowHeight > elementTop + 100) {
            $el.addClass('animated ' + animationType);
          }
        });
      }

      $(window).on('scroll', $.throttle(AppConfig.debounceDelay, checkScroll));
      checkScroll(); // 初始检查
    },

    // 初始化主题
    initTheme: function () {
      const $body = $('body');
      const $themeToggle = $('#theme-toggle');

      // 应用保存的主题
      $body.attr('data-theme', AppState.theme);

      // 主题切换
      $themeToggle.on('click', function () {
        AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
        $body.attr('data-theme', AppState.theme);
        localStorage.setItem('theme', AppState.theme);
      });
    },

    // 显示通知
    showNotification: function (message, type = 'info') {
      const $notification = $(`
        <div class="notification notification-${type}">
          <span class="notification-message">${message}</span>
          <button class="notification-close">&times;</button>
        </div>
      `);

      $('body').append($notification);

      // 动画显示
      setTimeout(() => $notification.addClass('show'), 10);

      // 自动关闭
      const autoClose = setTimeout(() => {
        $notification.removeClass('show');
        setTimeout(() => $notification.remove(), 300);
      }, 5000);

      // 手动关闭
      $notification.find('.notification-close').on('click', function () {
        clearTimeout(autoClose);
        $notification.removeClass('show');
        setTimeout(() => $notification.remove(), 300);
      });
    },

    // 工具方法：防抖
    debounce: function (func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    // 工具方法：节流
    throttle: function (func, limit) {
      let inThrottle;
      return function executedFunction(...args) {
        if (!inThrottle) {
          func(...args);
          inThrottle = true;
          setTimeout(() => (inThrottle = false), limit);
        }
      };
    },
  };

  // 暴露到全局（可选）
  window.App = App;
})(jQuery);
```

### 自定义插件

```javascript
// src/js/plugins/custom-plugin.js
(function ($) {
  'use strict';

  // 倒计时插件
  $.fn.countdown = function (options) {
    const settings = $.extend(
      {
        endDate: new Date(),
        format: 'dhms', // days, hours, minutes, seconds
        onComplete: function () {},
      },
      options
    );

    return this.each(function () {
      const $element = $(this);
      let interval;

      function updateCountdown() {
        const now = new Date().getTime();
        const distance = settings.endDate.getTime() - now;

        if (distance < 0) {
          clearInterval(interval);
          settings.onComplete.call($element);
          return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        $element.html(
          `<span class="days">${days}天</span>
           <span class="hours">${hours}时</span>
           <span class="minutes">${minutes}分</span>
           <span class="seconds">${seconds}秒</span>`
        );
      }

      updateCountdown();
      interval = setInterval(updateCountdown, 1000);
    });
  };

  // 懒加载插件
  $.fn.lazyLoad = function (options) {
    const settings = $.extend(
      {
        threshold: 200,
        effect: 'fadeIn',
        effectSpeed: 500,
      },
      options
    );

    return this.each(function () {
      const $element = $(this);
      const src = $element.data('src');

      function loadImage() {
        const windowTop = $(window).scrollTop();
        const windowHeight = $(window).height();
        const elementTop = $element.offset().top;

        if (elementTop < windowTop + windowHeight + settings.threshold) {
          $element.attr('src', src);
          if (settings.effect === 'fadeIn') {
            $element.hide().fadeIn(settings.effectSpeed);
          }
          $element.removeClass('lazy').addClass('loaded');
        }
      }

      $(window).on('scroll', $.throttle(200, loadImage));
      loadImage();
    });
  };

  // 标签输入插件
  $.fn.tagInput = function (options) {
    const settings = $.extend(
      {
        placeholder: '输入标签',
        allowDuplicates: false,
        maxTags: 10,
        onTagAdd: function () {},
        onTagRemove: function () {},
      },
      options
    );

    return this.each(function () {
      const $container = $(this);
      const $input = $('<input type="text" class="tag-input">').attr(
        'placeholder',
        settings.placeholder
      );
      const $tagList = $('<div class="tag-list"></div>');
      let tags = [];

      $container.append($tagList).append($input);

      function addTag(value) {
        value = value.trim();
        if (!value) return;
        if (!settings.allowDuplicates && tags.includes(value)) return;
        if (tags.length >= settings.maxTags) return;

        tags.push(value);
        const $tag = $(
          `<span class="tag">
            <span class="tag-text">${value}</span>
            <button class="tag-remove">&times;</button>
          </span>`
        );

        $tag.find('.tag-remove').on('click', function () {
          removeTag(value);
        });

        $tagList.append($tag);
        settings.onTagAdd.call($container, value);
      }

      function removeTag(value) {
        tags = tags.filter((t) => t !== value);
        $tagList.find('.tag').filter(function () {
          return $(this).find('.tag-text').text() === value;
        }).remove();
        settings.onTagRemove.call($container, value);
      }

      $input.on('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          addTag($input.val());
          $input.val('');
        }
        if (e.key === 'Backspace' && !$input.val() && tags.length) {
          removeTag(tags[tags.length - 1]);
        }
      });

      // 暴露方法
      $container.data('tagInput', {
        getTags: () => tags,
        addTag: addTag,
        removeTag: removeTag,
        clear: () => {
          tags = [];
          $tagList.empty();
        },
      });
    });
  };
})(jQuery);

// 使用示例
$(document).ready(function () {
  // 倒计时
  $('#countdown').countdown({
    endDate: new Date('2024-12-31'),
    onComplete: function () {
      alert('倒计时结束！');
    },
  });

  // 懒加载
  $('img.lazy').lazyLoad();

  // 标签输入
  $('#tags').tagInput({
    maxTags: 5,
    onTagAdd: function (tag) {
      console.log('Added tag:', tag);
    },
  });
});
```

### AJAX 模块

```javascript
// src/js/modules/ajax.js
(function ($) {
  'use strict';

  // API 客户端
  const ApiClient = {
    baseUrl: '/api/v1',

    // 请求封装
    request: function (method, endpoint, data = null) {
      return $.ajax({
        url: this.baseUrl + endpoint,
        method: method,
        data: data ? JSON.stringify(data) : null,
        contentType: 'application/json',
        dataType: 'json',
      });
    },

    // GET 请求
    get: function (endpoint, params = {}) {
      return $.get(this.baseUrl + endpoint, params);
    },

    // POST 请求
    post: function (endpoint, data) {
      return this.request('POST', endpoint, data);
    },

    // PUT 请求
    put: function (endpoint, data) {
      return this.request('PUT', endpoint, data);
    },

    // DELETE 请求
    delete: function (endpoint) {
      return this.request('DELETE', endpoint);
    },

    // 上传文件
    upload: function (endpoint, file, onProgress) {
      const formData = new FormData();
      formData.append('file', file);

      return $.ajax({
        url: this.baseUrl + endpoint,
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        xhr: function () {
          const xhr = new window.XMLHttpRequest();
          xhr.upload.addEventListener(
            'progress',
            function (e) {
              if (e.lengthComputable && onProgress) {
                const percent = (e.loaded / e.total) * 100;
                onProgress(percent);
              }
            },
            false
          );
          return xhr;
        },
      });
    },
  };

  // 具体业务 API
  const UserApi = {
    getCurrentUser: function () {
      return ApiClient.get('/user/me');
    },

    updateProfile: function (data) {
      return ApiClient.put('/user/profile', data);
    },

    changePassword: function (oldPassword, newPassword) {
      return ApiClient.post('/user/change-password', {
        oldPassword,
        newPassword,
      });
    },
  };

  const PostApi = {
    getAll: function (page = 1, limit = 10) {
      return ApiClient.get('/posts', { page, limit });
    },

    getById: function (id) {
      return ApiClient.get('/posts/' + id);
    },

    create: function (data) {
      return ApiClient.post('/posts', data);
    },

    update: function (id, data) {
      return ApiClient.put('/posts/' + id, data);
    },

    delete: function (id) {
      return ApiClient.delete('/posts/' + id);
    },
  };

  // 暴露到全局
  window.ApiClient = ApiClient;
  window.UserApi = UserApi;
  window.PostApi = PostApi;
})(jQuery);
```

### 表单验证扩展

```javascript
// src/js/utils/validators.js
(function ($) {
  'use strict';

  // 自定义验证方法
  $.validator.addMethod(
    'phone',
    function (value, element) {
      return this.optional(element) || /^1[3-9]\d{9}$/.test(value);
    },
    '请输入有效的手机号码'
  );

  $.validator.addMethod(
    'idcard',
    function (value, element) {
      return this.optional(element) || /^\d{17}[\dXx]$/.test(value);
    },
    '请输入有效的身份证号码'
  );

  $.validator.addMethod(
    'password',
    function (value, element) {
      return (
        this.optional(element) ||
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(value)
      );
    },
    '密码必须至少8位，包含大小写字母和数字'
  );

  $.validator.addMethod(
    'filesize',
    function (value, element, param) {
      return this.optional(element) || element.files[0].size <= param;
    },
    '文件大小不能超过 {0} 字节'
  );

  $.validator.addMethod(
    'extension',
    function (value, element, param) {
      param = typeof param === 'string' ? param.replace(/,/g, '|') : param;
      return (
        this.optional(element) ||
        value.match(new RegExp('.(' + param + ')$', 'i'))
      );
    },
    '请输入有效的文件扩展名'
  );

  // 默认验证消息（中文）
  $.extend($.validator.messages, {
    required: '这是必填字段',
    remote: '请修正此字段',
    email: '请输入有效的电子邮件地址',
    url: '请输入有效的网址',
    date: '请输入有效的日期',
    dateISO: '请输入有效的日期 (ISO)',
    number: '请输入有效的数字',
    digits: '只能输入数字',
    creditcard: '请输入有效的信用卡号码',
    equalTo: '你的输入不相同',
    maxlength: $.validator.format('最多可以输入 {0} 个字符'),
    minlength: $.validator.format('最少要输入 {0} 个字符'),
    rangelength: $.validator.format('请输入长度在 {0} 到 {1} 之间的字符串'),
    range: $.validator.format('请输入范围在 {0} 到 {1} 之间的数值'),
    max: $.validator.format('请输入不大于 {0} 的数值'),
    min: $.validator.format('请输入不小于 {0} 的数值'),
  });
})(jQuery);
```

## 最佳实践

### 1. DOM 操作优化

```javascript
// ❌ 避免：频繁 DOM 操作
for (let i = 0; i < 1000; i++) {
  $('#list').append('<li>' + i + '</li>');
}

// ✅ 推荐：批量操作
const items = [];
for (let i = 0; i < 1000; i++) {
  items.push('<li>' + i + '</li>');
}
$('#list').html(items.join(''));

// ✅ 推荐：使用文档片段
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  const li = document.createElement('li');
  li.textContent = i;
  fragment.appendChild(li);
}
$('#list').append(fragment);
```

### 2. 事件委托

```javascript
// ❌ 避免：为每个元素绑定事件
$('.item').on('click', function () {
  // 处理点击
});

// ✅ 推荐：事件委托
$('#container').on('click', '.item', function () {
  // 处理点击
  // 动态添加的 .item 也会生效
});
```

### 3. 缓存 jQuery 对象

```javascript
// ❌ 避免：重复查询
function updateUI() {
  $('#header').addClass('active');
  $('#header').find('.logo').fadeIn();
  $('#header').css('background', 'blue');
}

// ✅ 推荐：缓存对象
function updateUI() {
  const $header = $('#header');
  $header.addClass('active');
  $header.find('.logo').fadeIn();
  $header.css('background', 'blue');
}
```

### 4. 链式调用

```javascript
// ❌ 避免：分开调用
$('#element').addClass('active');
$('#element').show();
$('#element').text('Updated');

// ✅ 推荐：链式调用
$('#element').addClass('active').show().text('Updated');
```

### 5. 避免全局污染

```javascript
// ❌ 避免：全局变量
var myVar = 'value';
function myFunction() {}

// ✅ 推荐：使用 IIFE 或命名空间
(function ($) {
  const MyModule = {
    myVar: 'value',
    myFunction: function () {},
  };

  // 暴露需要的
  window.MyModule = MyModule;
})(jQuery);
```

## 常用命令

### 开发

```bash
# 安装依赖
npm install jquery

# 开发服务器（使用 live-server）
npm install -g live-server
live-server

# 或使用 Python
python -m http.server 8000
```

### 构建（可选）

```bash
# Webpack
npm install webpack webpack-cli --save-dev
npm run build

# Vite
npm install vite --save-dev
npm run build

# 压缩
npm install terser -g
terser src/js/main.js -o dist/js/main.min.js
```

### 代码检查

```bash
# ESLint
npm install eslint --save-dev
npx eslint src/js/**/*.js

# JSHint
npm install jshint --save-dev
npx jshint src/js/
```

## 部署配置

### 简单静态部署

```html
<!-- 生产环境 CDN -->
<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>

<!-- 本地备份 -->
<script>
  window.jQuery || document.write('<script src="js/jquery.min.js"><\/script>');
</script>
```

### Webpack 配置

```javascript
// webpack.config.js
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/js/main.js',
  output: {
    filename: 'bundle.min.js',
    path: path.resolve(__dirname, 'dist/js'),
  },
  externals: {
    jquery: 'jQuery', // 使用 CDN 引入的 jQuery
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
};
```

### Vite 配置

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    minify: 'terser',
    rollupOptions: {
      input: {
        main: 'src/index.html',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    index index.html;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML 不缓存
    location ~* \.html$ {
        add_header Cache-Control "no-cache";
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;
}
```

## 相关资源

- [jQuery 官方文档](https://jquery.com/)
- [jQuery API 文档](https://api.jquery.com/)
- [jQuery Learning Center](https://learn.jquery.com/)
- [jQuery Validation](https://jqueryvalidation.org/)
- [jQuery UI](https://jqueryui.com/)
- [Select2](https://select2.org/)
- [DataTables](https://datatables.net/)
