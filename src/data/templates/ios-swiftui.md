# iOS SwiftUI 原生应用模板

## 技术栈

- **Swift**: 5.9+
- **SwiftUI**: iOS 15+
- **Combine**: 响应式编程
- **Swift Concurrency**: async/await
- **Core Data**: 本地持久化
- **URLSession**: 网络请求
- **XCTest**: 单元测试
- **Xcode**: 15+

## 项目结构

```
iOS-SwiftUI-Project/
├── App/
│   ├── MyApp.swift
│   ├── ContentView.swift
│   ├── Assets.xcassets/
│   │   ├── AppIcon.appiconset/
│   │   ├── AccentColor.colorset/
│   │   └── Images/
│   └── Info.plist
├── Models/
│   ├── User.swift
│   ├── Post.swift
│   └── APIResponse.swift
├── ViewModels/
│   ├── UserViewModel.swift
│   ├── PostViewModel.swift
│   └── HomeViewModel.swift
├── Views/
│   ├── Home/
│   │   ├── HomeView.swift
│   │   ├── HomeHeaderView.swift
│   │   └── HomeListView.swift
│   ├── Detail/
│   │   ├── DetailView.swift
│   │   └── DetailRowView.swift
│   ├── Components/
│   │   ├── LoadingView.swift
│   │   ├── ErrorView.swift
│   │   └── EmptyStateView.swift
│   └── Modifiers/
│       ├── CardModifier.swift
│       └── ShadowModifier.swift
├── Services/
│   ├── APIClient.swift
│   ├── NetworkError.swift
│   └── Endpoints.swift
├── Repositories/
│   ├── UserRepository.swift
│   └── PostRepository.swift
├── Coordinators/
│   └── AppCoordinator.swift
├── Extensions/
│   ├── Color+Extensions.swift
│   ├── View+Extensions.swift
│   ├── String+Extensions.swift
│   └── Date+Extensions.swift
├── Utilities/
│   ├── Constants.swift
│   ├── Helpers.swift
│   └── Logger.swift
├── Resources/
│   ├── Localizable.strings
│   ├── Colors.xcassets/
│   └── Fonts/
├── CoreData/
│   ├── DataModel.xcdatamodeld
│   └── Persistence.swift
├── Tests/
│   ├── ModelTests/
│   ├── ViewModelTests/
│   └── ServiceTests/
├── UITests/
│   └── AppUITests.swift
├── .swiftlint.yml
├── Podfile (如果使用 CocoaPods)
└── Package.swift (如果使用 SPM)
```

## 代码模式

### App 入口

```swift
// App/MyApp.swift
import SwiftUI

@main
struct MyApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var coordinator = AppCoordinator()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .environmentObject(coordinator)
                .onAppear {
                    setupAppearance()
                }
        }
    }
    
    private func setupAppearance() {
        // 配置全局外观
        UINavigationBar.appearance().tintColor = UIColor(Color.accentColor)
        UITableView.appearance().backgroundColor = .clear
    }
}

// 应用状态管理
class AppState: ObservableObject {
    @Published var isLoggedIn: Bool = false
    @Published var user: User?
    @Published var theme: AppTheme = .light
    
    func logout() {
        isLoggedIn = false
        user = nil
    }
}
```

### MVVM 架构

```swift
// Models/Post.swift
import Foundation

struct Post: Identifiable, Codable {
    let id: Int
    let title: String
    let body: String
    let userId: Int
    let createdAt: Date
    var isLiked: Bool = false
    
    enum CodingKeys: String, CodingKey {
        case id, title, body, userId
        case createdAt = "created_at"
    }
}

// ViewModels/PostViewModel.swift
import SwiftUI
import Combine

@MainActor
class PostViewModel: ObservableObject {
    @Published var posts: [Post] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var hasMore: Bool = true
    
    private let repository: PostRepository
    private var currentPage = 1
    private var cancellables = Set<AnyCancellable>()
    
    init(repository: PostRepository = PostRepository()) {
        self.repository = repository
    }
    
    func loadPosts() async {
        guard !isLoading else { return }
        
        isLoading = true
        errorMessage = nil
        
        do {
            let newPosts = try await repository.fetchPosts(page: currentPage)
            posts.append(contentsOf: newPosts)
            hasMore = !newPosts.isEmpty
            currentPage += 1
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func refresh() async {
        currentPage = 1
        posts.removeAll()
        hasMore = true
        await loadPosts()
    }
    
    func toggleLike(for post: Post) {
        if let index = posts.firstIndex(where: { $0.id == post.id }) {
            posts[index].isLiked.toggle()
        }
    }
    
    func deletePost(at offsets: IndexSet) {
        posts.remove(atOffsets: offsets)
    }
}
```

### SwiftUI 视图

```swift
// Views/Home/HomeView.swift
import SwiftUI

struct HomeView: View {
    @StateObject private var viewModel = PostViewModel()
    @State private var showingCreatePost = false
    
    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading && viewModel.posts.isEmpty {
                    LoadingView()
                } else if viewModel.posts.isEmpty {
                    EmptyStateView(
                        message: "No posts yet",
                        action: { Task { await viewModel.loadPosts() } }
                    )
                } else {
                    postList
                }
            }
            .navigationTitle("Home")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingCreatePost = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .task {
                await viewModel.loadPosts()
            }
            .sheet(isPresented: $showingCreatePost) {
                CreatePostView()
            }
            .alert(
                "Error",
                isPresented: .init(
                    get: { viewModel.errorMessage != nil },
                    set: { _ in viewModel.errorMessage = nil }
                )
            ) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
        }
    }
    
    private var postList: some View {
        List {
            ForEach(viewModel.posts) { post in
                PostRowView(post: post)
                    .onTapGesture {
                        // 导航到详情
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                        deleteButton(for: post)
                        likeButton(for: post)
                    }
            }
            
            if viewModel.hasMore && !viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .task {
                        await viewModel.loadPosts()
                    }
            }
        }
        .listStyle(.plain)
    }
    
    private func deleteButton(for post: Post) -> some View {
        Button(role: .destructive) {
            viewModel.deletePost(at: IndexSet([viewModel.posts.firstIndex(of: post)!]))
        } label: {
            Label("Delete", systemImage: "trash")
        }
    }
    
    private func likeButton(for post: Post) -> some View {
        Button {
            viewModel.toggleLike(for: post)
        } label: {
            Label(
                post.isLiked ? "Unlike" : "Like",
                systemImage: post.isLiked ? "heart.fill" : "heart"
            )
        }
        .tint(.pink)
    }
}

// Views/Components/PostRowView.swift
struct PostRowView: View {
    let post: Post
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(post.title)
                .font(.headline)
                .lineLimit(2)
            
            Text(post.body)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .lineLimit(3)
            
            HStack {
                Label("\(post.userId)", systemImage: "person.circle")
                    .font(.caption)
                
                Spacer()
                
                if post.isLiked {
                    Image(systemName: "heart.fill")
                        .foregroundColor(.pink)
                }
            }
            .font(.caption)
        }
        .padding(.vertical, 8)
    }
}
```

### 网络请求

```swift
// Services/APIClient.swift
import Foundation

protocol APIClientProtocol {
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T
}

class APIClient: APIClientProtocol {
    private let session: URLSession
    private let decoder: JSONDecoder
    
    init(session: URLSession = .shared, decoder: JSONDecoder = JSONDecoder()) {
        self.session = session
        self.decoder = decoder
        
        // 配置解码器
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
        self.decoder.dateDecodingStrategy = .iso8601
    }
    
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
        let request = try buildRequest(for: endpoint)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            do {
                return try decoder.decode(T.self, from: data)
            } catch {
                throw NetworkError.decodingError(error)
            }
        case 401:
            throw NetworkError.unauthorized
        case 404:
            throw NetworkError.notFound
        case 500...599:
            throw NetworkError.serverError(httpResponse.statusCode)
        default:
            throw NetworkError.unknown
        }
    }
    
    private func buildRequest(for endpoint: Endpoint) throws -> URLRequest {
        var components = URLComponents(url: endpoint.baseURL.appendingPathComponent(endpoint.path), resolvingAgainstBaseURL: true)!
        
        if let parameters = endpoint.parameters {
            components.queryItems = parameters.map { URLQueryItem(name: $0.key, value: "\($0.value)") }
        }
        
        var request = URLRequest(url: components.url!)
        request.httpMethod = endpoint.method.rawValue
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let body = endpoint.body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        
        return request
    }
}

// Services/Endpoints.swift
enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

struct Endpoint {
    let baseURL: URL
    let path: String
    let method: HTTPMethod
    let parameters: [String: Any]?
    let body: [String: Any]?
    
    init(
        baseURL: URL = URL(string: "https://api.example.com")!,
        path: String,
        method: HTTPMethod = .get,
        parameters: [String: Any]? = nil,
        body: [String: Any]? = nil
    ) {
        self.baseURL = baseURL
        self.path = path
        self.method = method
        self.parameters = parameters
        self.body = body
    }
}

// Services/NetworkError.swift
enum NetworkError: Error, LocalizedError {
    case invalidResponse
    case unauthorized
    case notFound
    case serverError(Int)
    case decodingError(Error)
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from server"
        case .unauthorized:
            return "Unauthorized access"
        case .notFound:
            return "Resource not found"
        case .serverError(let code):
            return "Server error with code: \(code)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .unknown:
            return "An unknown error occurred"
        }
    }
}
```

### 数据持久化

```swift
// CoreData/Persistence.swift
import CoreData

struct PersistenceController {
    static let shared = PersistenceController()
    
    let container: NSPersistentContainer
    
    init(inMemory: Bool = false) {
        container = NSPersistentContainer(name: "DataModel")
        
        if inMemory {
            container.persistentStoreDescriptions.first?.url = URL(fileURLWithPath: "/dev/null")
        }
        
        container.loadPersistentStores { description, error in
            if let error = error as NSError? {
                fatalError("Unresolved error \(error), \(error.userInfo)")
            }
        }
        
        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
    }
    
    func save() {
        let context = container.viewContext
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                let error = error as NSError
                fatalError("Unresolved error \(error), \(error.userInfo)")
            }
        }
    }
}

// Repositories/UserRepository.swift
import CoreData

class UserRepository {
    private let context: NSManagedObjectContext
    
    init(context: NSManagedObjectContext = PersistenceController.shared.container.viewContext) {
        self.context = context
    }
    
    func fetchUsers() async throws -> [User] {
        let request: NSFetchRequest<UserEntity> = UserEntity.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \UserEntity.name, ascending: true)]
        
        let entities = try context.fetch(request)
        return entities.map { $0.toModel() }
    }
    
    func saveUser(_ user: User) async throws {
        let entity = UserEntity(context: context)
        entity.from = user
        try context.save()
    }
    
    func deleteUser(_ user: User) async throws {
        let request: NSFetchRequest<UserEntity> = UserEntity.fetchRequest()
        request.predicate = NSPredicate(format: "id == %d", user.id)
        
        guard let entity = try context.fetch(request).first else {
            throw RepositoryError.notFound
        }
        
        context.delete(entity)
        try context.save()
    }
}
```

## 最佳实践

### 1. 状态管理

```swift
// 使用 @StateObject 管理视图模型
struct UserView: View {
    @StateObject private var viewModel = UserViewModel()
    
    var body: some View {
        // ...
    }
}

// 使用 @EnvironmentObject 共享状态
@main
struct MyApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}

// 在子视图中访问
struct ProfileView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        Text("Hello, \(appState.user?.name ?? "Guest")")
    }
}

// 使用 @AppStorage 持久化简单值
struct SettingsView: View {
    @AppStorage("isDarkMode") private var isDarkMode = false
    
    var body: some View {
        Toggle("Dark Mode", isOn: $isDarkMode)
    }
}
```

### 2. 导航管理

```swift
// 使用 NavigationStack (iOS 16+)
struct ContentView: View {
    @State private var path = NavigationPath()
    
    var body: some View {
        NavigationStack(path: $path) {
            HomeView()
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .detail(let id):
                        DetailView(id: id)
                    case .profile(let user):
                        ProfileView(user: user)
                    }
                }
        }
    }
}

enum Route: Hashable {
    case detail(id: Int)
    case profile(user: User)
}

// 编程式导航
Button("Go to Detail") {
    path.append(Route.detail(id: 123))
}

// 返回根视图
Button("Go to Root") {
    path.removeLast(path.count)
}
```

### 3. 异步图片加载

```swift
import SwiftUI

struct AsyncImageView: View {
    let url: URL?
    let placeholder: Image
    
    var body: some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case .empty:
                placeholder
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            case .success(let image):
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            case .failure:
                Image(systemName: "photo")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .foregroundColor(.gray)
            @unknown default:
                EmptyView()
            }
        }
    }
}

// 带缓存的图片加载
class ImageLoader: ObservableObject {
    @Published var image: Image?
    private static var cache = NSCache<NSString, UIImage>()
    
    func load(from url: URL) {
        let key = url.absoluteString as NSString
        
        if let cachedImage = Self.cache.object(forKey: key) {
            self.image = Image(uiImage: cachedImage)
            return
        }
        
        Task {
            if let (data, _) = try? await URLSession.shared.data(from: url),
               let uiImage = UIImage(data: data) {
                Self.cache.setObject(uiImage, forKey: key)
                await MainActor.run {
                    self.image = Image(uiImage: uiImage)
                }
            }
        }
    }
}
```

### 4. 错误处理

```swift
// 全局错误处理
enum AppError: Error {
    case network(NetworkError)
    case database(Error)
    case validation(String)
    case unknown
    
    var localizedDescription: String {
        switch self {
        case .network(let error):
            return error.errorDescription ?? "Network error"
        case .database(let error):
            return "Database error: \(error.localizedDescription)"
        case .validation(let message):
            return message
        case .unknown:
            return "An unknown error occurred"
        }
    }
}

// Result 类型
func fetchUser(id: Int) async -> Result<User, AppError> {
    do {
        let user = try await apiClient.request(.user(id: id))
        return .success(user)
    } catch let error as NetworkError {
        return .failure(.network(error))
    } catch {
        return .failure(.unknown)
    }
}

// 使用示例
let result = await fetchUser(id: 123)
switch result {
case .success(let user):
    print("User: \(user.name)")
case .failure(let error):
    print("Error: \(error.localizedDescription)")
}
```

### 5. 表单处理

```swift
struct CreatePostView: View {
    @State private var title = ""
    @State private var body = ""
    @State private var category = ""
    @Environment(\.dismiss) private var dismiss
    
    private var isValid: Bool {
        !title.isEmpty && !body.isEmpty && !category.isEmpty
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Post Details")) {
                    TextField("Title", text: $title)
                        .textContentType(.name)
                    
                    TextEditor(text: $body)
                        .frame(height: 150)
                    
                    Picker("Category", selection: $category) {
                        Text("Select category").tag("")
                        ForEach(Category.allCases, id: \.self) { category in
                            Text(category.rawValue).tag(category.rawValue)
                        }
                    }
                }
            }
            .navigationTitle("New Post")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        createPost()
                    }
                    .disabled(!isValid)
                }
            }
        }
    }
    
    private func createPost() {
        // 创建文章逻辑
        dismiss()
    }
}
```

### 6. 主题管理

```swift
// 主题定义
enum AppTheme: String {
    case light, dark, system
    
    var colorScheme: ColorScheme? {
        switch self {
        case .light:
            return .light
        case .dark:
            return .dark
        case .system:
            return nil
        }
    }
}

// 颜色扩展
extension Color {
    static let theme = ColorTheme()
}

struct ColorTheme {
    let primary = Color("Primary")
    let secondary = Color("Secondary")
    let background = Color("Background")
    let text = Color("Text")
    let accent = Color("Accent")
}

// 应用主题
@main
struct MyApp: App {
    @AppStorage("appTheme") private var appTheme = AppTheme.system
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(appTheme.colorScheme)
        }
    }
}

// 使用主题颜色
Text("Hello")
    .foregroundColor(.theme.text)
```

### 7. 动画效果

```swift
struct AnimatedCardView: View {
    @State private var isExpanded = false
    
    var body: some View {
        VStack {
            Text("Title")
                .font(.headline)
            
            if isExpanded {
                Text("Additional content")
                    .transition(.asymmetric(
                        insertion: .move(edge: .top).combined(with: .opacity),
                        removal: .opacity
                    ))
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: isExpanded ? 10 : 5)
        .scaleEffect(isExpanded ? 1.05 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isExpanded)
        .onTapGesture {
            isExpanded.toggle()
        }
    }
}

// 自定义转场
extension AnyTransition {
    static var slideAndFade: AnyTransition {
        .asymmetric(
            insertion: .move(edge: .trailing).combined(with: .opacity),
            removal: .move(edge: .leading).combined(with: .opacity)
        )
    }
}
```

### 8. 单元测试

```swift
// Tests/ViewModelTests/PostViewModelTests.swift
import XCTest
@testable import MyApp

@MainActor
class PostViewModelTests: XCTestCase {
    var sut: PostViewModel!
    var mockRepository: MockPostRepository!
    
    override func setUp() {
        super.setUp()
        mockRepository = MockPostRepository()
        sut = PostViewModel(repository: mockRepository)
    }
    
    override func tearDown() {
        sut = nil
        mockRepository = nil
        super.tearDown()
    }
    
    func testLoadPostsSuccess() async {
        // Given
        mockRepository.postsToReturn = [
            Post(id: 1, title: "Test", body: "Body", userId: 1, createdAt: Date())
        ]
        
        // When
        await sut.loadPosts()
        
        // Then
        XCTAssertFalse(sut.isLoading)
        XCTAssertEqual(sut.posts.count, 1)
        XCTAssertNil(sut.errorMessage)
    }
    
    func testLoadPostsFailure() async {
        // Given
        mockRepository.errorToThrow = NetworkError.serverError(500)
        
        // When
        await sut.loadPosts()
        
        // Then
        XCTAssertFalse(sut.isLoading)
        XCTAssertTrue(sut.posts.isEmpty)
        XCTAssertNotNil(sut.errorMessage)
    }
    
    func testToggleLike() {
        // Given
        let post = Post(id: 1, title: "Test", body: "Body", userId: 1, createdAt: Date())
        sut.posts = [post]
        
        // When
        sut.toggleLike(for: post)
        
        // Then
        XCTAssertTrue(sut.posts[0].isLiked)
    }
}

// Mock Repository
class MockPostRepository: PostRepository {
    var postsToReturn: [Post] = []
    var errorToThrow: Error?
    
    override func fetchPosts(page: Int) async throws -> [Post] {
        if let error = errorToThrow {
            throw error
        }
        return postsToReturn
    }
}
```

## 常用命令

### Xcode 命令

```bash
# 打开项目
open MyApp.xcodeproj

# 打开工作空间
open MyApp.xcworkspace

# 构建项目
xcodebuild -project MyApp.xcodeproj -scheme MyApp -configuration Debug build

# 运行测试
xcodebuild test -project MyApp.xcodeproj -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 15'

# 清理构建
xcodebuild clean -project MyApp.xcodeproj -scheme MyApp

# 归档
xcodebuild -project MyApp.xcodeproj -scheme MyApp -configuration Release archive -archivePath build/MyApp.xcarchive

# 导出 IPA
xcodebuild -exportArchive -archivePath build/MyApp.xcarchive -exportPath build/ -exportOptionsPlist ExportOptions.plist
```

### CocoaPods

```bash
# 安装依赖
pod install

# 更新依赖
pod update

# 检查更新
pod outdated

# 查看依赖树
pod ipc podfile Podfile
```

### Swift Package Manager

```bash
# 重置包缓存
swift package reset

# 更新依赖
swift package update

# 解析依赖
swift package resolve

# 生成 Xcode 项目
swift package generate-xcodeproj
```

### SwiftLint

```bash
# 运行 SwiftLint
swiftlint

# 自动修正
swiftlint --fix

# 查看规则
swiftlint rules
```

### 其他命令

```bash
# 格式化代码
swiftformat .

# 查看模拟器列表
xcrun simctl list devices

# 启动模拟器
xcrun simctl boot "iPhone 15"

# 安装应用
xcrun simctl install booted MyApp.app

# 查看日志
xcrun simctl spawn booted log stream --predicate 'process == "MyApp"'
```

## 部署配置

### App Store 发布

```bash
# 1. 配置发布信息
# Info.plist
<key>CFBundleVersion</key>
<string>1</string>
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>

# 2. 创建归档
xcodebuild -project MyApp.xcodeproj \
  -scheme MyApp \
  -configuration Release \
  -archivePath build/MyApp.xcarchive \
  archive

# 3. 导出 IPA
xcodebuild -exportArchive \
  -archivePath build/MyApp.xcarchive \
  -exportPath build/ \
  -exportOptionsPlist ExportOptions.plist

# 4. 上传到 App Store Connect
xcrun altool --upload-app \
  -f build/MyApp.ipa \
  -u your@email.com \
  -p your-app-specific-password
```

### ExportOptions.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>destination</key>
    <string>export</string>
</dict>
</plist>
```

### CI/CD 配置

```yaml
# .github/workflows/ios.yml
name: iOS CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Select Xcode version
        run: sudo xcode-select -s /Applications/Xcode_15.0.app
        
      - name: Cache CocoaPods
        uses: actions/cache@v3
        with:
          path: Pods
          key: ${{ runner.os }}-pods-${{ hashFiles('**/Podfile.lock') }}
          
      - name: Install dependencies
        run: pod install
        
      - name: Build
        run: |
          xcodebuild -workspace MyApp.xcworkspace \
            -scheme MyApp \
            -sdk iphonesimulator \
            -destination 'platform=iOS Simulator,name=iPhone 15,OS=latest' \
            build
            
      - name: Run tests
        run: |
          xcodebuild test -workspace MyApp.xcworkspace \
            -scheme MyApp \
            -sdk iphonesimulator \
            -destination 'platform=iOS Simulator,name=iPhone 15,OS=latest' \
            -enableCodeCoverage YES
            
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
```

### 环境配置

```swift
// 配置管理
enum Environment {
    case development
    case staging
    case production
    
    var baseURL: String {
        switch self {
        case .development:
            return "http://localhost:8080/api"
        case .staging:
            return "https://staging-api.example.com"
        case .production:
            return "https://api.example.com"
        }
    }
    
    var apiKey: String {
        switch self {
        case .development:
            return "dev_key"
        case .staging:
            return "staging_key"
        case .production:
            return "prod_key"
        }
    }
}

// 使用 Xcconfig 文件
// Development.xcconfig
API_BASE_URL = http://localhost:8080/api
API_KEY = dev_key

// Production.xcconfig
API_BASE_URL = https://api.example.com
API_KEY = prod_key

// 在代码中使用
let apiBaseURL = Bundle.main.infoDictionary?["API_BASE_URL"] as? String ?? ""
```

### 性能监控

```swift
import os.signpost

class PerformanceTracker {
    static let shared = PerformanceTracker()
    private let log = OSLog(subsystem: "com.myapp", category: "Performance")
    
    func beginInterval(_ name: StaticString, id: OSSignpostID = .init(log: OSLog.disabled)) {
        os_signpost(.begin, log: log, name: name, signpostID: id)
    }
    
    func endInterval(_ name: StaticString, id: OSSignpostID = .init(log: OSLog.disabled)) {
        os_signpost(.end, log: log, name: name, signpostID: id)
    }
}

// 使用示例
func fetchPosts() async throws -> [Post] {
    let signpostID = OSSignpostID(log: PerformanceTracker.shared.log)
    PerformanceTracker.shared.beginInterval("FetchPosts", id: signpostID)
    
    defer {
        PerformanceTracker.shared.endInterval("FetchPosts", id: signpostID)
    }
    
    return try await apiClient.request(.posts)
}
```

### 日志系统

```swift
import os.log

enum LogLevel: String {
    case debug = "DEBUG"
    case info = "INFO"
    case warning = "WARNING"
    case error = "ERROR"
}

struct Logger {
    private static let subsystem = Bundle.main.bundleIdentifier ?? "MyApp"
    
    static func log(
        _ message: String,
        level: LogLevel = .info,
        category: String = "General",
        file: String = #file,
        function: String = #function,
        line: Int = #line
    ) {
        let logger = Logger(subsystem: subsystem, category: category)
        
        #if DEBUG
        print("[\(level.rawValue)] [\(category)] \(message) - \(file):\(line) \(function)")
        #endif
        
        switch level {
        case .debug:
            logger.debug("\(message)")
        case .info:
            logger.info("\(message)")
        case .warning:
            logger.warning("\(message)")
        case .error:
            logger.error("\(message)")
        }
    }
}

// 使用示例
Logger.log("User logged in", level: .info, category: "Authentication")
Logger.log("Failed to fetch posts: \(error)", level: .error, category: "Network")
```

### 推送通知

```swift
import UserNotifications

class NotificationManager {
    static let shared = NotificationManager()
    
    func requestAuthorization() async throws -> Bool {
        let center = UNUserNotificationCenter.current()
        return try await center.requestAuthorization(options: [.alert, .sound, .badge])
    }
    
    func scheduleNotification(
        title: String,
        body: String,
        at date: Date,
        identifier: String
    ) async throws {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: date.timeIntervalSinceNow,
            repeats: false
        )
        
        let request = UNNotificationRequest(
            identifier: identifier,
            content: content,
            trigger: trigger
        )
        
        try await UNUserNotificationCenter.current().add(request)
    }
    
    func cancelNotification(identifier: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [identifier])
    }
}
```

### 深度链接

```swift
// 处理 URL Scheme
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    handleDeepLink(url)
                }
        }
    }
    
    private func handleDeepLink(_ url: URL) {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: true) else {
            return
        }
        
        // myapp://post/123
        if components.host == "post",
           let postIdString = components.path.components(separatedBy: "/").last,
           let postId = Int(postIdString) {
            // 导航到文章详情
            NotificationCenter.default.post(
                name: .showPostDetail,
                object: nil,
                userInfo: ["postId": postId]
            )
        }
    }
}

// 通用链接 (Universal Links)
// apple-app-site-association
{
    "applinks": {
        "details": [
            {
                "appIDs": ["TEAM_ID.com.myapp"],
                "components": [
                    {
                        "/": "/post/*",
                        "comment": "Matches any post detail page"
                    }
                ]
            }
        ]
    }
}
```

### Widget 支持

```swift
import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), title: "Loading...", body: "...")
    }
    
    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
        let entry = SimpleEntry(date: Date(), title: "Today", body: "Your daily summary")
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        let currentDate = Date()
        let entry = SimpleEntry(
            date: currentDate,
            title: "Today",
            body: "5 new posts"
        )
        
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let title: String
    let body: String
}

struct MyAppWidgetEntryView: View {
    var entry: Provider.Entry
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(entry.title)
                .font(.headline)
            Text(entry.body)
                .font(.caption)
        }
        .padding()
    }
}

@main
struct MyAppWidget: Widget {
    let kind: String = "MyAppWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            MyAppWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("My Widget")
        .description("This is my widget.")
    }
}
```
