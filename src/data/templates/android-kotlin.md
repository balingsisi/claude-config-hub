# Android Kotlin 开发模板

## 技术栈

- **语言**: Kotlin 1.9+
- **UI 框架**: Jetpack Compose / XML Views
- **架构**: MVVM + Clean Architecture
- **依赖注入**: Hilt / Koin
- **网络**: Retrofit + OkHttp
- **本地存储**: Room Database / DataStore
- **异步**: Coroutines + Flow
- **导航**: Navigation Compose / Jetpack Navigation
- **图片加载**: Coil / Glide
- **测试**: JUnit, Espresso, Mockk

## 项目结构

```
app/
├── src/
│   ├── main/
│   │   ├── java/com/example/app/
│   │   │   ├── di/              # 依赖注入模块
│   │   │   ├── data/            # 数据层
│   │   │   │   ├── remote/      # 远程数据源
│   │   │   │   ├── local/       # 本地数据源
│   │   │   │   ├── repository/  # 仓库实现
│   │   │   │   └── model/       # 数据模型
│   │   │   ├── domain/          # 业务逻辑层
│   │   │   │   ├── model/       # 领域模型
│   │   │   │   ├── repository/  # 仓库接口
│   │   │   │   └── usecase/     # 用例
│   │   │   ├── presentation/    # 表现层
│   │   │   │   ├── ui/          # UI 组件
│   │   │   │   ├── viewmodel/   # ViewModel
│   │   │   │   └── navigation/  # 导航
│   │   │   ├── MainActivity.kt
│   │   │   └── App.kt
│   │   ├── res/                 # 资源文件
│   │   │   ├── drawable/
│   │   │   ├── layout/
│   │   │   ├── values/
│   │   │   └── mipmap/
│   │   └── AndroidManifest.xml
│   ├── test/                    # 单元测试
│   └── androidTest/             # 仪器测试
├── build.gradle.kts (Module)
└── proguard-rules.pro

gradle/
├── libs.versions.toml           # 版本目录
build.gradle.kts (Project)
settings.gradle.kts
```

## 代码模式

### 1. ViewModel 模式

```kotlin
@HiltViewModel
class UserViewModel @Inject constructor(
    private val getUserUseCase: GetUserUseCase,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<UserUiState>(UserUiState.Loading)
    val uiState: StateFlow<UserUiState> = _uiState.asStateFlow()
    
    init {
        loadUser()
    }
    
    fun loadUser(userId: String? = savedStateHandle["userId"]) {
        viewModelScope.launch {
            getUserUseCase(userId)
                .onStart { _uiState.value = UserUiState.Loading }
                .catch { e -> _uiState.value = UserUiState.Error(e.message ?: "Unknown error") }
                .collect { user -> _uiState.value = UserUiState.Success(user) }
        }
    }
}

sealed interface UserUiState {
    object Loading : UserUiState
    data class Success(val user: User) : UserUiState
    data class Error(val message: String) : UserUiState
}
```

### 2. Repository 模式

```kotlin
class UserRepositoryImpl @Inject constructor(
    private val remoteDataSource: UserRemoteDataSource,
    private val localDataSource: UserLocalDataSource
) : UserRepository {
    
    override fun getUser(id: String): Flow<Result<User>> = flow {
        // 尝试从本地获取
        val localUser = localDataSource.getUser(id)
        if (localUser != null) {
            emit(Result.success(localUser))
        }
        
        // 从远程获取并更新本地
        val remoteUser = remoteDataSource.getUser(id)
        localDataSource.saveUser(remoteUser)
        emit(Result.success(remoteUser))
    }.catch { e ->
        emit(Result.failure(e))
    }
}
```

### 3. Compose UI 模式

```kotlin
@Composable
fun UserScreen(
    viewModel: UserViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("User Profile") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        when (val state = uiState) {
            is UserUiState.Loading -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            is UserUiState.Success -> {
                UserContent(
                    user = state.user,
                    modifier = Modifier.padding(padding)
                )
            }
            is UserUiState.Error -> {
                ErrorView(
                    message = state.message,
                    onRetry = { viewModel.loadUser() },
                    modifier = Modifier.padding(padding)
                )
            }
        }
    }
}

@Composable
fun UserContent(
    user: User,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        AsyncImage(
            model = user.avatarUrl,
            contentDescription = "User avatar",
            modifier = Modifier
                .size(120.dp)
                .clip(CircleShape),
            contentScale = ContentScale.Crop
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = user.name,
            style = MaterialTheme.typography.headlineMedium
        )
        
        Text(
            text = user.email,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
```

### 4. Use Case 模式

```kotlin
class GetUserUseCase @Inject constructor(
    private val userRepository: UserRepository
) {
    operator fun invoke(userId: String?): Flow<User> {
        return userRepository.getUser(requireNotNull(userId))
    }
}
```

### 5. Room Database

```kotlin
@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val name: String,
    val email: String,
    val avatarUrl: String?,
    val updatedAt: Long = System.currentTimeMillis()
)

@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE id = :id")
    suspend fun getUser(id: String): UserEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveUser(user: UserEntity)
    
    @Query("DELETE FROM users WHERE id = :id")
    suspend fun deleteUser(id: String)
}

@Database(entities = [UserEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}
```

### 6. Retrofit API

```kotlin
interface UserApi {
    @GET("users/{id}")
    suspend fun getUser(@Path("id") id: String): UserResponse
    
    @GET("users")
    suspend fun getUsers(@Query("page") page: Int): UsersResponse
    
    @POST("users")
    suspend fun createUser(@Body request: CreateUserRequest): UserResponse
}

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(LoggingInterceptor())
            .addInterceptor(AuthInterceptor())
            .connectTimeout(30, TimeUnit.SECONDS)
            .build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl("https://api.example.com/")
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    
    @Provides
    @Singleton
    fun provideUserApi(retrofit: Retrofit): UserApi {
        return retrofit.create(UserApi::class.java)
    }
}
```

## 最佳实践

### 1. 状态管理
- 使用 `StateFlow` 或 `Compose State` 管理 UI 状态
- 使用 `sealed class/interface` 表示不同的 UI 状态
- 避免在 Composable 中进行业务逻辑

### 2. 生命周期感知
- 使用 `collectAsStateWithLifecycle()` 收集 Flow
- 使用 `Lifecycle-aware coroutines`
- 正确处理配置更改

### 3. 依赖注入
- 使用 Hilt 进行依赖注入
- 使用 `@HiltViewModel` 注入 ViewModel
- 使用 `@Qualifier` 区分相同类型的依赖

### 4. 导航
- 使用 Navigation Compose 进行导航
- 使用 `NavGraph` 组织导航结构
- 使用 `SavedStateHandle` 传递参数

### 5. 错误处理
- 使用 `Result` 封装操作结果
- 实现全局错误处理
- 提供友好的错误提示

### 6. 性能优化
- 使用 `LaunchedEffect` 处理副作用
- 使用 `remember` 和 `derivedStateOf` 优化重组
- 使用 `LazyColumn` 替代 `Column` + `Modifier.verticalScroll`

### 7. 测试
- 为 ViewModel 编写单元测试
- 为 Repository 编写集成测试
- 为 UI 编写仪器测试

## 常用命令

### Gradle 构建

```bash
# 清理构建
./gradlew clean

# 构建 Debug APK
./gradlew assembleDebug

# 构建 Release APK
./gradlew assembleRelease

# 构建 Bundle (AAB)
./gradlew bundleRelease

# 运行单元测试
./gradlew test

# 运行仪器测试
./gradlew connectedAndroidTest

# 代码检查
./gradlew lint

# 生成覆盖率报告
./gradlew jacocoTestReport
```

### ADB 命令

```bash
# 安装 APK
adb install app-debug.apk

# 卸载应用
adb uninstall com.example.app

# 查看日志
adb logcat

# 过滤日志
adb logcat | grep "MyApp"

# 清除应用数据
adb shell pm clear com.example.app

# 截屏
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png

# 录屏
adb shell screenrecord /sdcard/demo.mp4

# 查看连接的设备
adb devices

# 进入设备 Shell
adb shell
```

### Android Studio

```
# 快捷键
Ctrl+Shift+A: 查找操作
Ctrl+N: 查找类
Ctrl+Shift+N: 查找文件
Alt+Enter: 快速修复
Ctrl+Alt+L: 格式化代码
Ctrl+Alt+O: 优化导入
```

## 部署配置

### build.gradle.kts (Module)

```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.example.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.example.app"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        create("release") {
            storeFile = file("keystore/release.keystore")
            storePassword = System.getenv("KEYSTORE_PASSWORD")
            keyAlias = "release"
            keyPassword = System.getenv("KEY_PASSWORD")
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
            isMinifyEnabled = false
        }
        
        release {
            isDebuggable = false
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Compose
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.navigation.compose)

    // Hilt
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.androidx.hilt.navigation.compose)

    // Network
    implementation(libs.retrofit)
    implementation(libs.retrofit.gson)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)

    // Database
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    // Image Loading
    implementation(libs.coil.compose)

    // DataStore
    implementation(libs.androidx.datastore.preferences)

    // Testing
    testImplementation(libs.junit)
    testImplementation(libs.mockk)
    testImplementation(libs.kotlinx.coroutines.test)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)
}
```

### ProGuard 规则

```proguard
# Retrofit
-keepattributes Signature
-keepattributes *Annotation*
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# Gson
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}

# Data Models
-keep class com.example.app.data.model.** { *; }
-keep class com.example.app.domain.model.** { *; }
```

### CI/CD (GitHub Actions)

```yaml
name: Android CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle
      
      - name: Grant execute permission for gradlew
        run: chmod +x gradlew
      
      - name: Build with Gradle
        run: ./gradlew build
      
      - name: Run unit tests
        run: ./gradlew test
      
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: app-debug
          path: app/build/outputs/apk/debug/app-debug.apk
      
      - name: Upload test reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-reports
          path: app/build/reports/

  release:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle
      
      - name: Decode Keystore
        env:
          ENCODED_KEYSTORE: ${{ secrets.KEYSTORE_BASE64 }}
        run: |
          echo $ENCODED_KEYSTORE | base64 -d > app/keystore/release.keystore
      
      - name: Build Release APK
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: ./gradlew assembleRelease
      
      - name: Upload Release APK
        uses: actions/upload-artifact@v4
        with:
          name: app-release
          path: app/build/outputs/apk/release/app-release.apk
```

### Google Play 发布

```bash
# 构建 AAB
./gradlew bundleRelease

# 上传到 Google Play Console
# 或使用 fastlane:
fastlane supply --aab app/build/outputs/bundle/release/app-release.aab

# 分阶段发布
# 1. 内部测试 -> 2. 封闭测试 -> 3. 开放测试 -> 4. 正式发布
```
