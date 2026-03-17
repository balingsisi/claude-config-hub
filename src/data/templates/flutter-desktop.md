# Flutter Desktop Development

## 技术栈

### 核心框架
- **Flutter SDK** - Google 的跨平台 UI 框架
- **Dart** - 客户端优化的编程语言
- **Flutter Desktop** - Windows/macOS/Linux 支持

### 状态管理
- **Riverpod** - 现代响应式状态管理
- **Provider** - 官方推荐的状态管理
- **Bloc/Cubit** - 事件驱动的状态管理
- **GetX** - 全栈解决方案

### 数据持久化
- **Hive** - 轻量级 NoSQL 数据库
- **SQLite (sqflite)** - 关系型数据库
- **SharedPreferences** - 键值存储
- **Isar** - 高性能文档数据库

### 网络
- **Dio** - 强大的 HTTP 客户端
- **Retrofit** - 类型安全的 HTTP 客户端
- **GraphQL (artemis)** - GraphQL 客户端

### 依赖注入
- **GetIt** - 服务定位器
- **Injectable** - 依赖注入代码生成

### 本地功能
- **window_manager** - 窗口管理
- **screen_retriever** - 屏幕信息
- **tray_manager** - 系统托盘
- **hotkey_manager** - 全局快捷键
- **local_notifier** - 本地通知

### 构建工具
- **Flutter CLI** - 官方命令行工具
- **Melos** - Monorepo 管理
- **FVM** - Flutter 版本管理

## 项目结构

```
flutter_desktop_app/
├── pubspec.yaml
├── lib/
│   ├── main.dart                      # 应用入口
│   ├── app.dart                       # App 配置
│   │
│   ├── core/
│   │   ├── constants/
│   │   │   ├── app_colors.dart
│   │   │   ├── app_strings.dart
│   │   │   └── app_sizes.dart
│   │   │
│   │   ├── theme/
│   │   │   ├── app_theme.dart
│   │   │   ├── light_theme.dart
│   │   │   └── dark_theme.dart
│   │   │
│   │   ├── utils/
│   │   │   ├── date_utils.dart
│   │   │   ├── file_utils.dart
│   │   │   └── platform_utils.dart
│   │   │
│   │   └── router/
│   │       ├── app_router.dart
│   │       └── router_guard.dart
│   │
│   ├── features/
│   │   ├── home/
│   │   │   ├── data/
│   │   │   │   ├── datasources/
│   │   │   │   │   ├── local/
│   │   │   │   │   └── remote/
│   │   │   │   ├── models/
│   │   │   │   ├── repositories/
│   │   │   │   └── datasources_impl/
│   │   │   │
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   ├── repositories/
│   │   │   │   └── usecases/
│   │   │   │
│   │   │   └── presentation/
│   │   │       ├── pages/
│   │   │       ├── widgets/
│   │   │       ├── providers/  # 或 blocs/
│   │   │       └── states/
│   │   │
│   │   ├── settings/
│   │   ├── projects/
│   │   └── editor/
│   │
│   ├── shared/
│   │   ├── widgets/
│   │   │   ├── custom_button.dart
│   │   │   ├── custom_textfield.dart
│   │   │   └── loading_indicator.dart
│   │   │
│   │   ├── models/
│   │   │   └── user.dart
│   │   │
│   │   └── services/
│   │       ├── window_service.dart
│   │       ├── storage_service.dart
│   │       └── api_service.dart
│   │
│   └── platform/
│       ├── windows/
│       │   └── windows_apis.dart
│       ├── macos/
│       │   └── macos_apis.dart
│       └── linux/
│           └── linux_apis.dart
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── windows/
│   ├── runner/
│   │   ├── flutter_window.cpp
│   │   └── main.cpp
│   └── runner.exe.manifest
│
├── macos/
│   ├── Runner/
│   │   ├── AppDelegate.swift
│   │   └── MainFlutterWindow.swift
│   └── Runner/Info.plist
│
├── linux/
│   ├── my_application.cc
│   └── my_application.h
│
├── test/
│   ├── unit/
│   ├── widget/
│   └── integration/
│
├── scripts/
│   ├── build_windows.ps1
│   ├── build_macos.sh
│   └── build_linux.sh
│
└── .fvm/
    └── fvm_config.json
```

## 代码模式

### 1. 主入口和窗口配置

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:window_manager/window_manager.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // 初始化窗口管理器
  await windowManager.ensureInitialized();
  
  final windowOptions = WindowOptions(
    size: Size(1280, 720),
    minimumSize: Size(800, 600),
    center: true,
    backgroundColor: Colors.transparent,
    skipTaskbar: false,
    titleBarStyle: TitleBarStyle.normal,
    title: 'My Desktop App',
  );
  
  await windowManager.waitUntilReadyToShow(windowOptions, () async {
    await windowManager.show();
    await windowManager.focus();
  });
  
  runApp(
    ProviderScope(
      child: MyApp(),
    ),
  );
}
```

### 2. 窗口管理服务

```dart
// lib/shared/services/window_service.dart
import 'package:window_manager/window_manager.dart';
import 'package:screen_retriever/screen_retriever.dart';

class WindowService {
  static final WindowService _instance = WindowService._internal();
  factory WindowService() => _instance;
  WindowService._internal();
  
  Future<void> minimize() async {
    await windowManager.minimize();
  }
  
  Future<void> maximize() async {
    await windowManager.maximize();
  }
  
  Future<void> unmaximize() async {
    await windowManager.unmaximize();
  }
  
  Future<void> close() async {
    await windowManager.close();
  }
  
  Future<void> setSize(double width, double height) async {
    await windowManager.setSize(Size(width, height));
  }
  
  Future<void> center() async {
    await windowManager.center();
  }
  
  Future<Offset> getPosition() async {
    return await windowManager.getPosition();
  }
  
  Future<void> setPosition(Offset position) async {
    await windowManager.setPosition(position);
  }
  
  Future<bool> isMaximized() async {
    return await windowManager.isMaximized();
  }
  
  Future<void> setAlwaysOnTop(bool isAlwaysOnTop) async {
    await windowManager.setAlwaysOnTop(isAlwaysOnTop);
  }
  
  // 获取屏幕信息
  Future<Size> getScreenSize() async {
    final primaryDisplay = await screenRetriever.getPrimaryDisplay();
    return primaryDisplay.size;
  }
  
  // 窗口保持在屏幕内
  Future<void> ensureWindowOnScreen() async {
    final position = await getPosition();
    final screenSize = await getScreenSize();
    final windowSize = await windowManager.getSize();
    
    double x = position.dx;
    double y = position.dy;
    
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + windowSize.width > screenSize.width) {
      x = screenSize.width - windowSize.width;
    }
    if (y + windowSize.height > screenSize.height) {
      y = screenSize.height - windowSize.height;
    }
    
    await setPosition(Offset(x, y));
  }
}
```

### 3. 自定义标题栏

```dart
// lib/shared/widgets/custom_title_bar.dart
import 'package:flutter/material.dart';
import 'package:window_manager/window_manager.dart';

class CustomTitleBar extends StatelessWidget {
  final String title;
  final Widget? leading;
  final List<Widget>? actions;
  
  const CustomTitleBar({
    super.key,
    required this.title,
    this.leading,
    this.actions,
  });
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onPanStart: (details) {
        windowManager.startDragging();
      },
      child: Container(
        height: 40,
        color: Theme.of(context).colorScheme.surface,
        child: Row(
          children: [
            if (leading != null) leading!,
            Expanded(
              child: Row(
                children: [
                  const SizedBox(width: 12),
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
              ),
            ),
            if (actions != null) ...actions!,
            _WindowButtons(),
          ],
        ),
      ),
    );
  }
}

class _WindowButtons extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildButton(
          icon: Icons.remove,
          onPressed: () => windowManager.minimize(),
        ),
        _buildButton(
          icon: Icons.crop_square,
          onPressed: () async {
            if (await windowManager.isMaximized()) {
              windowManager.unmaximize();
            } else {
              windowManager.maximize();
            }
          },
        ),
        _buildButton(
          icon: Icons.close,
          onPressed: () => windowManager.close(),
          isClose: true,
        ),
      ],
    );
  }
  
  Widget _buildButton({
    required IconData icon,
    required VoidCallback onPressed,
    bool isClose = false,
  }) {
    return InkWell(
      onTap: onPressed,
      child: Container(
        width: 46,
        height: 40,
        child: Icon(
          icon,
          size: 16,
          color: isClose ? Colors.red : null,
        ),
      ),
    );
  }
}
```

### 4. 系统托盘

```dart
// lib/shared/services/tray_service.dart
import 'package:tray_manager/tray_manager.dart';
import 'package:window_manager/window_manager.dart';

class TrayService with TrayListener {
  static final TrayService _instance = TrayService._internal();
  factory TrayService() => _instance;
  TrayService._internal();
  
  Future<void> init() async {
    await trayManager.setIcon(
      'assets/icons/app_icon.ico',  // Windows
      // 'assets/icons/app_icon.png',  // macOS/Linux
    );
    
    final menu = Menu(
      items: [
        MenuItem(
          key: 'show_window',
          label: 'Show Window',
        ),
        MenuItem.separator(),
        MenuItem(
          key: 'exit',
          label: 'Exit',
        ),
      ],
    );
    
    await trayManager.setContextMenu(menu);
    await trayManager.setToolTip('My Desktop App');
  }
  
  @override
  void onTrayIconMouseDown() {
    trayManager.popUpContextMenu();
  }
  
  @override
  void onTrayIconRightMouseDown() {
    windowManager.show();
  }
  
  @override
  void onTrayMenuItemClick(MenuItem menuItem) {
    switch (menuItem.key) {
      case 'show_window':
        windowManager.show();
        windowManager.focus();
        break;
      case 'exit':
        windowManager.close();
        break;
    }
  }
}
```

### 5. 本地存储（Hive）

```dart
// lib/shared/services/storage_service.dart
import 'package:hive_flutter/hive_flutter.dart';
import '../models/user.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();
  
  late Box _settingsBox;
  late Box _cacheBox;
  late Box<User> _userBox;
  
  Future<void> init() async {
    await Hive.initFlutter();
    
    // 注册适配器
    Hive.registerAdapter(UserAdapter());
    
    // 打开盒子
    _settingsBox = await Hive.openBox('settings');
    _cacheBox = await Hive.openBox('cache');
    _userBox = await Hive.openBox<User>('users');
  }
  
  // 设置
  Future<void> setTheme(String theme) async {
    await _settingsBox.put('theme', theme);
  }
  
  String getTheme() {
    return _settingsBox.get('theme', defaultValue: 'system');
  }
  
  // 缓存
  Future<void> cacheData(String key, dynamic data) async {
    await _cacheBox.put(key, data);
  }
  
  dynamic getCachedData(String key) {
    return _cacheBox.get(key);
  }
  
  Future<void> clearCache() async {
    await _cacheBox.clear();
  }
  
  // 用户数据
  Future<void> saveUser(User user) async {
    await _userBox.put(user.id, user);
  }
  
  User? getUser(String id) {
    return _userBox.get(id);
  }
  
  List<User> getAllUsers() {
    return _userBox.values.toList();
  }
}
```

### 6. 文件操作

```dart
// lib/core/utils/file_utils.dart
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

class FileUtils {
  // 选择文件
  static Future<File?> pickFile({
    List<String>? allowedExtensions,
  }) async {
    final result = await FilePicker.platform.pickFiles(
      type: allowedExtensions != null 
          ? FileType.custom 
          : FileType.any,
      allowedExtensions: allowedExtensions,
    );
    
    if (result != null && result.files.isNotEmpty) {
      return File(result.files.first.path!);
    }
    return null;
  }
  
  // 选择多个文件
  static Future<List<File>> pickMultipleFiles({
    List<String>? allowedExtensions,
  }) async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      type: allowedExtensions != null 
          ? FileType.custom 
          : FileType.any,
      allowedExtensions: allowedExtensions,
    );
    
    if (result != null) {
      return result.files
          .where((file) => file.path != null)
          .map((file) => File(file.path!))
          .toList();
    }
    return [];
  }
  
  // 选择目录
  static Future<String?> pickDirectory() async {
    return await FilePicker.platform.getDirectoryPath();
  }
  
  // 保存文件
  static Future<String?> saveFile({
    required String defaultName,
    List<String>? allowedExtensions,
  }) async {
    final result = await FilePicker.platform.saveFile(
      dialogTitle: 'Save File',
      fileName: defaultName,
      type: allowedExtensions != null 
          ? FileType.custom 
          : FileType.any,
      allowedExtensions: allowedExtensions,
    );
    
    return result;
  }
  
  // 获取应用文档目录
  static Future<String> getAppDocumentsPath() async {
    final directory = await getApplicationDocumentsDirectory();
    return directory.path;
  }
  
  // 获取应用支持目录
  static Future<String> getAppSupportPath() async {
    final directory = await getApplicationSupportDirectory();
    return directory.path;
  }
  
  // 创建目录
  static Future<Directory> createDirectory(String path) async {
    final directory = Directory(path);
    if (!await directory.exists()) {
      await directory.create(recursive: true);
    }
    return directory;
  }
  
  // 复制文件
  static Future<File> copyFile(File source, String destinationPath) async {
    return await source.copy(destinationPath);
  }
  
  // 移动文件
  static Future<File> moveFile(File source, String destinationPath) async {
    return await source.rename(destinationPath);
  }
  
  // 删除文件
  static Future<void> deleteFile(String path) async {
    final file = File(path);
    if (await file.exists()) {
      await file.delete();
    }
  }
  
  // 读取文件内容
  static Future<String> readFileContent(String path) async {
    final file = File(path);
    return await file.readAsString();
  }
  
  // 写入文件内容
  static Future<void> writeFileContent(String path, String content) async {
    final file = File(path);
    await file.writeAsString(content);
  }
  
  // 获取文件大小
  static Future<int> getFileSize(String path) async {
    final file = File(path);
    return await file.length();
  }
  
  // 格式化文件大小
  static String formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(2)} KB';
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(2)} MB';
    }
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }
}
```

### 7. 平台特定代码

```dart
// lib/platform/platform_apis.dart
import 'dart:io';

class PlatformApis {
  static bool get isWindows => Platform.isWindows;
  static bool get isMacOS => Platform.isMacOS;
  static bool get isLinux => Platform.isLinux;
  
  static String get platformName {
    if (isWindows) return 'windows';
    if (isMacOS) return 'macos';
    if (isLinux) return 'linux';
    return 'unknown';
  }
  
  // Windows 特定 API
  static Future<void> setWindowsTaskbarProgress(int progress, int max) async {
    if (!isWindows) return;
    // 调用 Windows 特定 API
  }
  
  // macOS 特定 API
  static Future<void> setMacOSDockBadge(String badge) async {
    if (!isMacOS) return;
    // 调用 macOS 特定 API
  }
  
  // Linux 特定 API
  static Future<void> setLinuxAppIndicator(String status) async {
    if (!isLinux) return;
    // 调用 Linux 特定 API
  }
}
```

### 8. Riverpod 状态管理

```dart
// lib/features/settings/presentation/providers/settings_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/settings_repository.dart';
import '../../domain/entities/app_settings.dart';

// StateNotifier
class SettingsNotifier extends StateNotifier<AsyncValue<AppSettings>> {
  final SettingsRepository _repository;
  
  SettingsNotifier(this._repository) : super(AsyncValue.loading()) {
    _loadSettings();
  }
  
  Future<void> _loadSettings() async {
    state = AsyncValue.loading();
    state = await AsyncValue.guard(() => _repository.getSettings());
  }
  
  Future<void> updateTheme(String theme) async {
    state.whenData((settings) async {
      final newSettings = settings.copyWith(theme: theme);
      await _repository.saveSettings(newSettings);
      state = AsyncValue.data(newSettings);
    });
  }
  
  Future<void> toggleNotifications() async {
    state.whenData((settings) async {
      final newSettings = settings.copyWith(
        notificationsEnabled: !settings.notificationsEnabled,
      );
      await _repository.saveSettings(newSettings);
      state = AsyncValue.data(newSettings);
    });
  }
}

// Provider
final settingsProvider = StateNotifierProvider<SettingsNotifier, AsyncValue<AppSettings>>((ref) {
  return SettingsNotifier(SettingsRepository());
});

// 使用
class SettingsPage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsAsync = ref.watch(settingsProvider);
    
    return settingsAsync.when(
      data: (settings) => ListView(
        children: [
          SwitchListTile(
            title: Text('Notifications'),
            value: settings.notificationsEnabled,
            onChanged: (_) => ref.read(settingsProvider.notifier).toggleNotifications(),
          ),
        ],
      ),
      loading: () => CircularProgressIndicator(),
      error: (error, stack) => Text('Error: $error'),
    );
  }
}
```

## 最佳实践

### 1. 平台自适应布局

```dart
// 使用 PlatformMenuBar (macOS)
class AdaptiveMenuBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    if (Platform.isMacOS) {
      return PlatformMenuBar(
        menus: [
          PlatformMenu(
            label: 'File',
            menus: [
              PlatformMenuItem(
                label: 'New',
                shortcut: CharacterActivator('n', meta: true),
                onSelected: () => _createNew(),
              ),
            ],
          ),
        ],
      );
    }
    
    return Container(); // 其他平台
  }
}
```

### 2. 响应式布局

```dart
// lib/shared/widgets/responsive_layout.dart
class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;
  
  const ResponsiveLayout({
    super.key,
    required this.mobile,
    this.tablet,
    this.desktop,
  });
  
  static bool isMobile(BuildContext context) =>
      MediaQuery.of(context).size.width < 650;
  
  static bool isTablet(BuildContext context) =>
      MediaQuery.of(context).size.width >= 650 &&
      MediaQuery.of(context).size.width < 1100;
  
  static bool isDesktop(BuildContext context) =>
      MediaQuery.of(context).size.width >= 1100;
  
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= 1100) {
          return desktop ?? tablet ?? mobile;
        } else if (constraints.maxWidth >= 650) {
          return tablet ?? mobile;
        } else {
          return mobile;
        }
      },
    );
  }
}
```

### 3. 键盘快捷键

```dart
// lib/shared/widgets/keyboard_shortcuts.dart
import 'package:flutter/services.dart';

class KeyboardShortcuts extends StatelessWidget {
  final Widget child;
  final Map<ShortcutActivator, VoidCallback> shortcuts;
  
  const KeyboardShortcuts({
    super.key,
    required this.child,
    required this.shortcuts,
  });
  
  @override
  Widget build(BuildContext context) {
    return Shortcuts(
      shortcuts: shortcuts.map((key, value) => MapEntry(key, VoidCallbackIntent(value))),
      child: Actions(
        actions: shortcuts.map((key, callback) {
          return MapEntry(
            VoidCallbackIntent(callback),
            CallbackAction<VoidCallbackIntent>(
              onInvoke: (intent) => intent.callback(),
            ),
          );
        }),
        child: child,
      ),
    );
  }
}

// 使用
KeyboardShortcuts(
  shortcuts: {
    LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyS): () => _save(),
    LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyO): () => _open(),
    LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyN): () => _newFile(),
  },
  child: Scaffold(...),
)
```

### 4. 本地通知

```dart
// lib/shared/services/notification_service.dart
import 'package:local_notifier/local_notifier.dart';

class NotificationService {
  static Future<void> show({
    required String title,
    String? body,
    String? icon,
  }) async {
    await localNotifier.notify(
      title: title,
      body: body ?? '',
      icon: icon,
    );
  }
  
  static Future<void> showWithAction({
    required String title,
    required String body,
    required String actionLabel,
    required VoidCallback onAction,
  }) async {
    await localNotifier.notify(
      title: title,
      body: body,
      actions: [
        LocalNotificationAction(
          text: actionLabel,
          actionType: ActionType.button,
        ),
      ],
      onAction: onAction,
    );
  }
}
```

### 5. 自动更新

```dart
// lib/shared/services/update_service.dart
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';

class UpdateService {
  static Future<bool> checkForUpdate() async {
    try {
      final response = await Dio().get('https://api.example.com/version');
      final latestVersion = response.data['version'];
      final currentVersion = '1.0.0'; // 从 pubspec.yaml 读取
      
      return _compareVersions(latestVersion, currentVersion) > 0;
    } catch (e) {
      return false;
    }
  }
  
  static int _compareVersions(String v1, String v2) {
    final parts1 = v1.split('.').map(int.parse).toList();
    final parts2 = v2.split('.').map(int.parse).toList();
    
    for (var i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
  }
  
  static Future<void> downloadUpdate(String url) async {
    // 实现下载逻辑
  }
}
```

## 常用命令

### 开发
```bash
# 运行应用（Windows）
flutter run -d windows

# 运行应用（macOS）
flutter run -d macos

# 运行应用（Linux）
flutter run -d linux

# 列出可用设备
flutter devices

# 热重载
r

# 热重启
R

# 退出
q
```

### 构建
```bash
# 构建 Windows 应用
flutter build windows --release

# 构建 macOS 应用
flutter build macos --release

# 构建 Linux 应用
flutter build linux --release

# 构建 macOS DMG（需要 create-dmg）
create-dmg --volname "MyApp" --window-pos 200 120 --window-size 800 400 --icon-size 100 --app-drop-link 600 185 "MyApp.dmg" "build/macos/Build/Products/Release/MyApp.app"

# 构建 Windows MSI（需要 msix）
flutter pub run msix:create
```

### 代码生成
```bash
# 生成代码（Riverpod, Hive 等）
flutter pub run build_runner build

# 监听文件变化并生成
flutter pub run build_runner watch

# 清理生成的代码
flutter pub run build_runner clean
```

### 测试
```bash
# 运行所有测试
flutter test

# 运行特定测试文件
flutter test test/unit/user_test.dart

# 运行集成测试
flutter drive --driver=test_driver/integration_test.dart --target=integration_test/app_test.dart -d windows

# 生成测试覆盖率
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
```

### 其他
```bash
# 清理构建缓存
flutter clean

# 获取依赖
flutter pub get

# 升级依赖
flutter pub upgrade

# 分析代码
flutter analyze

# 格式化代码
flutter format .

# 检查 Flutter 版本
flutter --version

# 使用 FVM
fvm flutter run -d windows
fvm flutter build windows
```

## 部署配置

### Windows

#### 1. 应用清单 (windows/runner/runner.exe.manifest)
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <assemblyIdentity
    version="1.0.0.0"
    processorArchitecture="x64"
    name="com.example.myapp"
    type="win32"
  />
  <description>My Desktop Application</description>
  <dependency>
    <dependentAssembly>
      <assemblyIdentity
        type="win32"
        name="Microsoft.Windows.Common-Controls"
        version="6.0.0.0"
        processorArchitecture="x64"
        publicKeyToken="6595b64144ccf1df"
        language="*"
      />
    </dependentAssembly>
  </dependency>
</assembly>
```

#### 2. 应用图标
```bash
# 生成图标资源文件
# 将 PNG 转换为 ICO
magick convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

#### 3. MSIX 安装包
```yaml
# pubspec.yaml
msix_config:
  display_name: My Desktop App
  publisher_display_name: Your Company
  identity_name: com.yourcompany.myapp
  msix_version: 1.0.0.0
  logo_path: assets/icons/icon.png
  capabilities: internetClient, internetClientServer
```

```bash
# 生成 MSIX
flutter pub run msix:create
```

### macOS

#### 1. Info.plist (macos/Runner/Info.plist)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>My Desktop App</string>
  <key>CFBundleDisplayName</key>
  <string>My App</string>
  <key>CFBundleIdentifier</key>
  <string>com.yourcompany.myapp</string>
  <key>CFBundleVersion</key>
  <string>1.0.0</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>
  <key>LSMinimumSystemVersion</key>
  <string>10.14</string>
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>NSHumanReadableCopyright</key>
  <string>Copyright © 2024 Your Company. All rights reserved.</string>
</dict>
</plist>
```

#### 2. 权限配置 (macos/Runner/DebugProfile.entitlements)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.app-sandbox</key>
  <false/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
  <key>com.apple.security.network.client</key>
  <true/>
  <key>com.apple.security.network.server</key>
  <true/>
  <key>com.apple.security.files.user-selected.read-write</key>
  <true/>
</dict>
</plist>
```

#### 3. 代码签名
```bash
# 签名应用
codesign --deep --force --verify --verbose --sign "Developer ID Application: Your Name (TEAM_ID)" build/macos/Build/Products/Release/MyApp.app

# 公证应用
xcrun notarytool submit MyApp.zip --apple-id "your@email.com" --password "@keychain:AC_PASSWORD" --team-id "TEAM_ID" --wait

# Staple 公证票据
xcrun stapler staple build/macos/Build/Products/Release/MyApp.app
```

#### 4. 创建 DMG
```bash
# 使用 create-dmg
brew install create-dmg

create-dmg \
  --volname "MyApp" \
  --volicon "assets/icons/icon.icns" \
  --window-pos 200 120 \
  --window-size 800 400 \
  --icon-size 100 \
  --icon "MyApp.app" 200 190 \
  --hide-extension "MyApp.app" \
  --app-drop-link 600 185 \
  "MyApp-1.0.0.dmg" \
  "build/macos/Build/Products/Release/MyApp.app"
```

### Linux

#### 1. Snap 打包 (snap/snapcraft.yaml)
```yaml
name: myapp
version: '1.0.0'
summary: My Desktop Application
description: A Flutter desktop application

grade: stable
confinement: strict
base: core22

apps:
  myapp:
    command: myapp
    extensions: [flutter-master]
    plugs:
      - network
      - desktop
      - desktop-legacy
      - x11
      - wayland

parts:
  myapp:
    source: .
    plugin: flutter
    flutter-target: lib/main.dart
```

```bash
# 构建 Snap
snapcraft

# 发布 Snap
snapcraft push myapp_1.0.0_amd64.snap
```

#### 2. AppImage 打包
```bash
# 安装 linuxdeploy
wget https://github.com/linuxdeploy/linuxdeploy/releases/download/continuous/linuxdeploy-x86_64.AppImage
chmod +x linuxdeploy-x86_64.AppImage

# 构建 AppImage
./linuxdeploy-x86_64.AppImage --appdir AppDir --executable build/linux/x64/release/bundle/myapp --output appimage
```

#### 3. Debian 包
```bash
# 创建 Debian 目录结构
mkdir -p debian/DEBIAN
mkdir -p debian/usr/bin
mkdir -p debian/usr/share/applications
mkdir -p debian/usr/share/icons/hicolor/256x256/apps

# 控制文件 (debian/DEBIAN/control)
Package: myapp
Version: 1.0.0
Section: utils
Priority: optional
Architecture: amd64
Maintainer: Your Name <your@email.com>
Description: My Desktop Application
 A Flutter desktop application

# 构建 DEB 包
dpkg-deb --build debian myapp_1.0.0_amd64.deb
```

### 自动更新配置

```dart
// lib/shared/services/auto_update_service.dart
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_file/open_file.dart';

class AutoUpdateService {
  static Future<void> downloadAndInstall(String downloadUrl) async {
    try {
      final appPath = await getApplicationSupportDirectory();
      final filePath = '${appPath.path}/update.exe';
      
      await Dio().download(downloadUrl, filePath);
      
      // Windows: 运行安装程序
      if (Platform.isWindows) {
        await OpenFile.open(filePath);
      }
      
      // macOS: 挂载 DMG
      if (Platform.isMacOS) {
        await Process.run('hdiutil', ['attach', filePath]);
      }
      
      // Linux: 运行 AppImage
      if (Platform.isLinux) {
        await Process.run('chmod', ['+x', filePath]);
        await OpenFile.open(filePath);
      }
    } catch (e) {
      print('Update failed: $e');
    }
  }
}
```

### 性能优化

1. **启用分离渲染**
```yaml
# windows/runner/flutter_window.cpp
FlutterEngine::RunProperties run_properties{
    .renderer_type = FlutterRendererType::kAngle,
};
```

2. **优化图片资源**
```yaml
# pubspec.yaml
flutter:
  assets:
    - assets/images/
    
  # 启用图片压缩
flutter:
  uses-material-design: true
```

3. **启用代码混淆**
```bash
flutter build windows --obfuscate --split-debug-info=build/debug-info
```

4. **减少包体积**
```bash
# 移除未使用的代码
flutter build windows --tree-shake-icons
```

### CI/CD 配置

#### GitHub Actions
```yaml
# .github/workflows/build.yml
name: Build Desktop Apps

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
      - run: flutter config --enable-windows-desktop
      - run: flutter build windows --release
      - uses: actions/upload-artifact@v3
        with:
          name: windows-build
          path: build/windows/runner/Release

  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
      - run: flutter config --enable-macos-desktop
      - run: flutter build macos --release
      - uses: actions/upload-artifact@v3
        with:
          name: macos-build
          path: build/macos/Build/Products/Release

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
      - run: |
          sudo apt-get update
          sudo apt-get install -y clang cmake ninja-build pkg-config libgtk-3-dev
      - run: flutter config --enable-linux-desktop
      - run: flutter build linux --release
      - uses: actions/upload-artifact@v3
        with:
          name: linux-build
          path: build/linux/x64/release/bundle
```

## 性能指标

- **启动时间**: < 1s
- **内存占用**: 100-300MB
- **包体积**: 
  - Windows: 15-30MB
  - macOS: 20-40MB
  - Linux: 20-35MB
- **帧率**: 60fps 流畅
- **CPU 占用**: 空闲 < 1%