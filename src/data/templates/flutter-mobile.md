# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Flutter Mobile Application
**Type**: Cross-platform Mobile App
**Tech Stack**: Flutter 3 + Dart + Riverpod
**Goal**: Production-ready mobile app for iOS and Android

---

## Tech Stack

### Core
- **Framework**: Flutter 3.16+
- **Language**: Dart 3.2+
- **State Management**: Riverpod 2.4+
- **Navigation**: go_router 13+

### Development
- **IDE**: VS Code + Flutter extension
- **Package Manager**: pub
- **Linting**: flutter_lints
- **Testing**: flutter_test + integration_test

---

## Project Structure

```
lib/
├── main.dart                 # Entry point
├── app.dart                  # App configuration
├── core/                     # Core utilities
│   ├── constants/
│   │   └── app_constants.dart
│   ├── theme/
│   │   ├── app_theme.dart
│   │   └── colors.dart
│   ├── utils/
│   │   ├── validators.dart
│   │   └── formatters.dart
│   └── router/
│       └── app_router.dart
├── features/                 # Feature-based structure
│   ├── auth/
│   │   ├── data/
│   │   │   ├── repositories/
│   │   │   │   └── auth_repository.dart
│   │   │   └── models/
│   │   │       └── user.dart
│   │   ├── domain/
│   │   │   └── usecases/
│   │   │       └── login_usecase.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       │   └── auth_provider.dart
│   │       ├── pages/
│   │       │   ├── login_page.dart
│   │       │   └── register_page.dart
│   │       └── widgets/
│   │           └── login_form.dart
│   └── home/
│       └── presentation/
│           ├── providers/
│           │   └── home_provider.dart
│           └── pages/
│               └── home_page.dart
├── shared/                   # Shared widgets
│   ├── widgets/
│   │   ├── custom_button.dart
│   │   ├── custom_text_field.dart
│   │   └── loading_overlay.dart
│   └── extensions/
│       └── context_extensions.dart
└── services/                 # External services
    ├── api/
    │   ├── api_client.dart
    │   └── interceptors.dart
    └── storage/
        └── local_storage.dart
```

---

## Coding Rules

### 1. State Management with Riverpod

**Use code generation for type safety:**

```dart
// features/auth/presentation/providers/auth_provider.dart
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:dio/dio.dart';

part 'auth_provider.g.dart';

@riverpod
class AuthNotifier extends _$AuthNotifier {
  @override
  AsyncValue<User?> build() {
    return const AsyncValue.data(null);
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    
    state = await AsyncValue.guard(() async {
      final repository = ref.read(authRepositoryProvider);
      return repository.login(email, password);
    });
  }

  Future<void> logout() async {
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncValue.data(null);
  }
}

// Usage in widget
class LoginPage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    
    return authState.when(
      data: (user) => user != null ? HomePage() : LoginForm(),
      loading: () => LoadingOverlay(),
      error: (error, stack) => ErrorWidget(error),
    );
  }
}
```

### 2. Repository Pattern

**Abstract data sources:**

```dart
// features/auth/data/repositories/auth_repository.dart
import 'package:dio/dio.dart';

abstract class AuthRepository {
  Future<User> login(String email, String password);
  Future<User> register(String email, String password, String name);
  Future<void> logout();
  Future<User?> getCurrentUser();
}

class AuthRepositoryImpl implements AuthRepository {
  final Dio _dio;
  final LocalStorage _storage;

  AuthRepositoryImpl(this._dio, this._storage);

  @override
  Future<User> login(String email, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });

    final user = User.fromJson(response.data['user']);
    await _storage.saveToken(response.data['token']);
    
    return user;
  }

  @override
  Future<void> logout() async {
    await _dio.post('/auth/logout');
    await _storage.clearToken();
  }
}
```

### 3. Navigation with go_router

**Declarative routing:**

```dart
// core/router/app_router.dart
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'app_router.g.dart';

@riverpod
GoRouter appRouter(AppRouterRef ref) {
  return GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const HomePage(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/profile/:userId',
        builder: (context, state) {
          final userId = state.pathParameters['userId']!;
          return ProfilePage(userId: userId);
        },
      ),
    ],
    redirect: (context, state) {
      final authState = ref.read(authNotifierProvider);
      
      if (authState.isLoading) return null;
      
      final isLoggedIn = authState.valueOrNull != null;
      final isLoginRoute = state.matchedLocation == '/login';
      
      if (!isLoggedIn && !isLoginRoute) return '/login';
      if (isLoggedIn && isLoginRoute) return '/';
      
      return null;
    },
  );
}
```

### 4. Widget Best Practices

**Keep widgets small and focused:**

```dart
// Bad: Giant widget
class LoginPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // 100+ lines of form code...
        ],
      ),
    );
  }
}

// Good: Composed widgets
class LoginPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              const Spacer(),
              const _Logo(),
              const SizedBox(height: 48),
              const _LoginForm(),
              const SizedBox(height: 24),
              const _SocialLoginButtons(),
              const Spacer(),
              const _SignUpLink(),
            ],
          ),
        ),
      ),
    );
  }
}

class _LoginForm extends ConsumerWidget {
  const _LoginForm();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Form(
      child: Column(
        children: [
          CustomTextField(
            hintText: 'Email',
            prefixIcon: Icons.email,
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 16),
          CustomTextField(
            hintText: 'Password',
            prefixIcon: Icons.lock,
            obscureText: true,
          ),
          const SizedBox(height: 24),
          CustomButton(
            text: 'Login',
            onPressed: () => ref.read(authNotifierProvider.notifier).login(
              'email@example.com',
              'password',
            ),
          ),
        ],
      ),
    );
  }
}
```

### 5. Error Handling

**Use Either type for expected errors:**

```dart
import 'package:dartz/dartz.dart';

abstract class Failure {
  final String message;
  const Failure(this.message);
}

class ServerFailure extends Failure {
  const ServerFailure(super.message);
}

class NetworkFailure extends Failure {
  const NetworkFailure(super.message);
}

// Repository
Future<Either<Failure, User>> login(String email, String password) async {
  try {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    return Right(User.fromJson(response.data));
  } on DioException catch (e) {
    if (e.type == DioExceptionType.connectionTimeout) {
      return const Left(NetworkFailure('Connection timeout'));
    }
    return Left(ServerFailure(e.message ?? 'Unknown error'));
  }
}

// Usage
final result = await repository.login(email, password);
result.fold(
  (failure) => showErrorSnackbar(failure.message),
  (user) => navigateToHome(),
);
```

---

## Platform Adaptations

### 1. Platform-specific styling
```dart
import 'dart:io' show Platform;

Widget buildAdaptiveButton() {
  if (Platform.isIOS) {
    return CupertinoButton(
      child: Text('Submit'),
      onPressed: handleSubmit,
    );
  }
  return ElevatedButton(
    child: Text('Submit'),
    onPressed: handleSubmit,
  );
}
```

### 2. Safe area handling
```dart
// Always use SafeArea for content that touches screen edges
SafeArea(
  child: YourContent(),
)

// Or with specific edges
SafeArea(
  left: false,
  right: false,
  child: YourContent(),
)
```

---

## Performance Rules

### 1. Use `const` constructors
```dart
// Bad
CustomButton(text: 'Submit')

// Good
const CustomButton(text: 'Submit')
```

### 2. Avoid rebuilding expensive widgets
```dart
// Bad: Rebuilds entire list on every change
ListView(
  children: items.map((item) => ItemWidget(item)).toList(),
)

// Good: Only rebuilds changed items
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ItemWidget(items[index]),
)
```

### 3. Use `RepaintBoundary` for complex animations
```dart
RepaintBoundary(
  child: ComplexAnimationWidget(),
)
```

---

## Testing

### Unit Tests
```dart
// test/features/auth/domain/login_usecase_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late LoginUseCase useCase;
  late MockAuthRepository mockRepository;

  setUp(() {
    mockRepository = MockAuthRepository();
    useCase = LoginUseCase(mockRepository);
  });

  test('should return user on successful login', () async {
    // Arrange
    final user = User(id: '1', email: 'test@example.com');
    when(() => mockRepository.login('test@example.com', 'password'))
        .thenAnswer((_) async => user);

    // Act
    final result = await useCase('test@example.com', 'password');

    // Assert
    expect(result, equals(user));
    verify(() => mockRepository.login('test@example.com', 'password')).called(1);
  });
}
```

### Widget Tests
```dart
testWidgets('Login button triggers login', (tester) async {
  // Arrange
  await tester.pumpWidget(MyApp());

  // Act
  await tester.enterText(find.byType(TextField).first, 'test@example.com');
  await tester.enterText(find.byType(TextField).last, 'password');
  await tester.tap(find.text('Login'));
  await tester.pumpAndSettle();

  // Assert
  expect(find.text('Welcome'), findsOneWidget);
});
```

---

## Common Commands

```bash
# Run app in debug mode
flutter run

# Run on specific device
flutter run -d iPhone

# Build for production
flutter build ios --release
flutter build apk --release

# Run tests
flutter test

# Run tests with coverage
flutter test --coverage

# Generate code (Riverpod, JSON, etc.)
flutter pub run build_runner build

# Check for issues
flutter analyze

# Format code
dart format .

# Upgrade dependencies
flutter pub upgrade
```

---

## Dependencies (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.4.9
  riverpod_annotation: ^2.3.3
  go_router: ^13.0.0
  dio: ^5.4.0
  freezed_annotation: ^2.4.1
  json_annotation: ^4.8.1
  shared_preferences: ^2.2.2
  flutter_secure_storage: ^9.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1
  riverpod_generator: ^2.3.9
  build_runner: ^2.4.7
  freezed: ^2.4.5
  json_serializable: ^6.7.1
  mocktail: ^1.0.1
```

---

## Deployment Checklist

### iOS
- [ ] Update version in pubspec.yaml
- [ ] Configure signing in Xcode
- [ ] Update app icons
- [ ] Test on physical device
- [ ] Build with `flutter build ios --release`
- [ ] Submit to App Store Connect

### Android
- [ ] Update version in pubspec.yaml
- [ ] Configure signing in android/app/build.gradle
- [ ] Update app icons
- [ ] Build with `flutter build apk --release`
- [ ] Upload to Google Play Console
