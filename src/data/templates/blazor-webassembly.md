# Blazor WebAssembly 开发模板

## 项目概述

Blazor WebAssembly 是微软推出的单页应用框架，允许开发者使用 C# 和 .NET 构建交互式客户端 Web 应用。它在浏览器中通过 WebAssembly 运行 .NET 代码，提供真正的客户端执行能力，无需 JavaScript。

## 技术栈

- **框架**: Blazor WebAssembly (.NET 8+)
- **语言**: C# 12
- **运行时**: .NET WebAssembly
- **UI 组件**: MudBlazor / Radzen / Ant Design Blazor
- **状态管理**: Blazor State / Fluxor
- **HTTP 客户端**: HttpClient / Refit
- **认证**: ASP.NET Core Identity / Auth0
- **构建**: .NET CLI / MSBuild

## 项目结构

```
BlazorApp/
├── src/
│   ├── Client/                      # Blazor WebAssembly 客户端
│   │   ├── wwwroot/
│   │   │   ├── index.html
│   │   │   ├── css/
│   │   │   │   ├── app.css
│   │   │   │   └── bootstrap/
│   │   │   └── js/
│   │   ├── Pages/
│   │   │   ├── Index.razor
│   │   │   ├── Counter.razor
│   │   │   └── FetchData.razor
│   │   ├── Shared/
│   │   │   ├── MainLayout.razor
│   │   │   ├── NavMenu.razor
│   │   │   └── SurveyPrompt.razor
│   │   ├── Components/
│   │   │   ├── UserCard.razor
│   │   │   └── DataTable.razor
│   │   ├── Services/
│   │   │   ├── IUserService.cs
│   │   │   ├── UserService.cs
│   │   │   └── AppState.cs
│   │   ├── ViewModels/
│   │   │   ├── UserViewModel.cs
│   │   │   └── ProductViewModel.cs
│   │   ├── Models/
│   │   │   ├── User.cs
│   │   │   └── Product.cs
│   │   ├── HttpClients/
│   │   │   └── ApiClient.cs
│   │   ├── Extensions/
│   │   │   └── ServiceCollectionExtensions.cs
│   │   ├── Program.cs
│   │   ├── _Imports.razor
│   │   └── App.razor
│   │
│   ├── Server/                      # ASP.NET Core API 服务器（可选）
│   │   ├── Controllers/
│   │   │   ├── UserController.cs
│   │   │   └── ProductController.cs
│   │   ├── Data/
│   │   │   └── AppDbContext.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   │
│   └── Shared/                      # 共享代码
│       ├── DTOs/
│       │   ├── UserDto.cs
│       │   └── ProductDto.cs
│       └── Interfaces/
│           └── IUserService.cs
│
├── Tests/
│   ├── Client.Tests/
│   │   ├── Services/
│   │   │   └── UserServiceTests.cs
│   │   └── Components/
│   │       └── CounterTests.cs
│   └── Server.Tests/
│       └── Controllers/
│           └── UserControllerTests.cs
│
├── BlazorApp.sln
└── README.md
```

## 核心代码模式

### 1. 组件基础

```csharp
// src/Client/Pages/Counter.razor
@page "/counter"
@inject ILogger<Counter> Logger

<PageTitle>Counter</PageTitle>

<h1>Counter</h1>

<p role="status">Current count: @currentCount</p>

<button class="btn btn-primary" @onclick="IncrementCount">
    Click me
</button>

<button class="btn btn-secondary" @onclick="ResetCount">
    Reset
</button>

@if (showMessage)
{
    <div class="alert alert-success mt-3" role="alert">
        Congratulations! You've reached 10!
    </div>
}

@code {
    private int currentCount = 0;
    private bool showMessage = false;

    private void IncrementCount()
    {
        currentCount++;
        Logger.LogInformation("Counter incremented to {Count}", currentCount);

        if (currentCount >= 10 && !showMessage)
        {
            showMessage = true;
            Logger.LogInformation("Achievement unlocked: Reached 10!");
        }
    }

    private void ResetCount()
    {
        currentCount = 0;
        showMessage = false;
        Logger.LogInformation("Counter reset");
    }
}
```

### 2. 数据绑定与表单

```csharp
// src/Client/Pages/UserForm.razor
@page "/user-form"
@inject IUserService UserService
@inject NavigationManager Navigation

<PageTitle>User Registration</PageTitle>

<h1>User Registration</h1>

<EditForm Model="@userModel" OnValidSubmit="HandleValidSubmit" Context="formContext">
    <DataAnnotationsValidator />
    <ValidationSummary />

    <div class="form-group mb-3">
        <label for="name">Name</label>
        <InputText id="name" @bind-Value="userModel.Name" class="form-control" />
        <ValidationMessage For="@(() => userModel.Name)" />
    </div>

    <div class="form-group mb-3">
        <label for="email">Email</label>
        <InputText id="email" @bind-Value="userModel.Email" class="form-control" type="email" />
        <ValidationMessage For="@(() => userModel.Email)" />
    </div>

    <div class="form-group mb-3">
        <label for="age">Age</label>
        <InputNumber id="age" @bind-Value="userModel.Age" class="form-control" />
        <ValidationMessage For="@(() => userModel.Age)" />
    </div>

    <div class="form-group mb-3">
        <label for="role">Role</label>
        <InputSelect id="role" @bind-Value="userModel.Role" class="form-control">
            <option value="">Select a role</option>
            @foreach (var role in availableRoles)
            {
                <option value="@role">@role</option>
            }
        </InputSelect>
        <ValidationMessage For="@(() => userModel.Role)" />
    </div>

    <div class="form-check mb-3">
        <InputCheckbox id="terms" @bind-Value="userModel.AcceptTerms" class="form-check-input" />
        <label class="form-check-label" for="terms">Accept Terms and Conditions</label>
        <ValidationMessage For="@(() => userModel.AcceptTerms)" />
    </div>

    <button type="submit" class="btn btn-primary" disabled="@isSubmitting">
        @if (isSubmitting)
        {
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span>Submitting...</span>
        }
        else
        {
            <span>Submit</span>
        }
    </button>
</EditForm>

@if (errorMessage != null)
{
    <div class="alert alert-danger mt-3">@errorMessage</div>
}

@code {
    private UserModel userModel = new();
    private bool isSubmitting = false;
    private string? errorMessage;
    private readonly string[] availableRoles = { "Admin", "User", "Guest" };

    protected override void OnInitialized()
    {
        // 初始化表单
        userModel = new UserModel
        {
            Name = "",
            Email = "",
            Age = 18,
            Role = "User",
            AcceptTerms = false
        };
    }

    private async Task HandleValidSubmit()
    {
        isSubmitting = true;
        errorMessage = null;

        try
        {
            await UserService.CreateUserAsync(userModel);
            Navigation.NavigateTo("/users");
        }
        catch (Exception ex)
        {
            errorMessage = $"Failed to create user: {ex.Message}";
        }
        finally
        {
            isSubmitting = false;
        }
    }
}

// src/Client/Models/UserModel.cs
using System.ComponentModel.DataAnnotations;

public class UserModel
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 100 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email address")]
    public string Email { get; set; } = string.Empty;

    [Range(18, 120, ErrorMessage = "Age must be between 18 and 120")]
    public int Age { get; set; }

    [Required(ErrorMessage = "Role is required")]
    public string Role { get; set; } = string.Empty;

    [Range(typeof(bool), "true", "true", ErrorMessage = "You must accept the terms")]
    public bool AcceptTerms { get; set; }
}
```

### 3. 依赖注入与服务

```csharp
// src/Client/Services/IUserService.cs
public interface IUserService
{
    Task<List<User>> GetUsersAsync();
    Task<User?> GetUserByIdAsync(int id);
    Task<User> CreateUserAsync(UserModel model);
    Task<User> UpdateUserAsync(int id, UserModel model);
    Task DeleteUserAsync(int id);
}

// src/Client/Services/UserService.cs
using System.Net.Http.Json;
using System.Text.Json;

public class UserService : IUserService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<UserService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public UserService(HttpClient httpClient, ILogger<UserService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    public async Task<List<User>> GetUsersAsync()
    {
        try
        {
            var users = await _httpClient.GetFromJsonAsync<List<User>>(
                "api/users",
                _jsonOptions
            );
            return users ?? new List<User>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch users");
            throw;
        }
    }

    public async Task<User?> GetUserByIdAsync(int id)
    {
        try
        {
            var response = await _httpClient.GetAsync($"api/users/{id}");
            
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<User>(_jsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch user with ID {UserId}", id);
            throw;
        }
    }

    public async Task<User> CreateUserAsync(UserModel model)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("api/users", model);
            response.EnsureSuccessStatusCode();
            
            var user = await response.Content.ReadFromJsonAsync<User>(_jsonOptions);
            return user ?? throw new InvalidOperationException("Failed to deserialize user");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create user");
            throw;
        }
    }

    public async Task<User> UpdateUserAsync(int id, UserModel model)
    {
        try
        {
            var response = await _httpClient.PutAsJsonAsync($"api/users/{id}", model);
            response.EnsureSuccessStatusCode();
            
            var user = await response.Content.ReadFromJsonAsync<User>(_jsonOptions);
            return user ?? throw new InvalidOperationException("Failed to deserialize user");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update user with ID {UserId}", id);
            throw;
        }
    }

    public async Task DeleteUserAsync(int id)
    {
        try
        {
            var response = await _httpClient.DeleteAsync($"api/users/{id}");
            response.EnsureSuccessStatusCode();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete user with ID {UserId}", id);
            throw;
        }
    }
}

// src/Client/Program.cs - 注册服务
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using BlazorApp.Client.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// HTTP 客户端
builder.Services.AddScoped(sp => new HttpClient
{
    BaseAddress = new Uri(builder.HostEnvironment.BaseAddress)
});

// 注册服务
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProductService, ProductService>();

// 状态管理
builder.Services.AddScoped<AppState>();

// 认证
builder.Services.AddAuthorizationCore();
builder.Services.AddCascadingAuthenticationState();

await builder.Build().RunAsync();
```

### 4. 路由与导航

```csharp
// src/Client/Pages/UserDetail.razor
@page "/users/{UserId:int}"
@page "/users/{UserId:int}/details"
@inject IUserService UserService
@inject NavigationManager Navigation
@implements IDisposable

<PageTitle>User Details - @user?.Name</PageTitle>

@if (user == null)
{
    <p><em>Loading...</em></p>
}
else
{
    <div class="card">
        <div class="card-header">
            <h3>@user.Name</h3>
            <span class="badge badge-@GetRoleBadgeClass(user.Role)">@user.Role</span>
        </div>
        <div class="card-body">
            <dl class="row">
                <dt class="col-sm-3">ID</dt>
                <dd class="col-sm-9">@user.Id</dd>

                <dt class="col-sm-3">Email</dt>
                <dd class="col-sm-9">@user.Email</dd>

                <dt class="col-sm-3">Age</dt>
                <dd class="col-sm-9">@user.Age</dd>

                <dt class="col-sm-3">Created</dt>
                <dd class="col-sm-9">@user.CreatedAt.ToString("MMM dd, yyyy")</dd>
            </dl>
        </div>
        <div class="card-footer">
            <button class="btn btn-secondary" @onclick="GoBack">Back</button>
            <button class="btn btn-primary" @onclick="EditUser">Edit</button>
            <button class="btn btn-danger" @onclick="DeleteUser">Delete</button>
        </div>
    </div>
}

@code {
    [Parameter]
    public int UserId { get; set; }

    private User? user;
    private CancellationTokenSource? cts;

    protected override async Task OnInitializedAsync()
    {
        cts = new CancellationTokenSource();
        await LoadUserAsync(cts.Token);
    }

    protected override async Task OnParametersSetAsync()
    {
        await LoadUserAsync(cts?.Token ?? CancellationToken.None);
    }

    private async Task LoadUserAsync(CancellationToken cancellationToken)
    {
        try
        {
            user = await UserService.GetUserByIdAsync(UserId);
        }
        catch (Exception ex)
        {
            // 处理错误
            Console.WriteLine($"Error loading user: {ex.Message}");
        }
    }

    private void GoBack()
    {
        Navigation.NavigateTo("/users");
    }

    private void EditUser()
    {
        Navigation.NavigateTo($"/users/{UserId}/edit");
    }

    private async Task DeleteUser()
    {
        if (user == null) return;

        var confirmed = await JsRuntime.InvokeAsync<bool>(
            "confirm",
            $"Are you sure you want to delete {user.Name}?"
        );

        if (confirmed)
        {
            await UserService.DeleteUserAsync(UserId);
            Navigation.NavigateTo("/users");
        }
    }

    private string GetRoleBadgeClass(string role) => role.ToLower() switch
    {
        "admin" => "primary",
        "user" => "success",
        "guest" => "secondary",
        _ => "info"
    };

    public void Dispose()
    {
        cts?.Cancel();
        cts?.Dispose();
    }
}

// 导航拦截
@inject NavigationManager Navigation

@code {
    protected override void OnInitialized()
    {
        Navigation.LocationChanged += OnLocationChanged;
    }

    private void OnLocationChanged(object? sender, LocationChangedEventArgs e)
    {
        // 处理路由变化
        StateHasChanged();
    }

    public void Dispose()
    {
        Navigation.LocationChanged -= OnLocationChanged;
    }
}
```

### 5. JavaScript 互操作

```csharp
// src/Client/Services/JsInterop.cs
using Microsoft.JSInterop;

public class JsInterop : IAsyncDisposable
{
    private readonly Lazy<Task<IJSObjectReference>> moduleTask;

    public JsInterop(IJSRuntime jsRuntime)
    {
        moduleTask = new(() => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import", "./js/interop.js").AsTask());
    }

    public async ValueTask<string> Prompt(string message)
    {
        var module = await moduleTask.Value;
        return await module.InvokeAsync<string>("showPrompt", message);
    }

    public async ValueTask SaveAsFile(string filename, byte[] data)
    {
        var module = await moduleTask.Value;
        await module.InvokeVoidAsync("saveAsFile", filename, data);
    }

    public async ValueTask<Dimensions> GetWindowDimensions()
    {
        var module = await moduleTask.Value;
        return await module.InvokeAsync<Dimensions>("getWindowDimensions");
    }

    public async ValueTask DisposeAsync()
    {
        if (moduleTask.IsValueCreated)
        {
            var module = await moduleTask.Value;
            await module.DisposeAsync();
        }
    }
}

public record Dimensions(int Width, int Height);

// wwwroot/js/interop.js
export function showPrompt(message) {
    return prompt(message, 'Type here');
}

export function saveAsFile(filename, bytesBase64) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = 'data:application/octet-stream;base64,' + bytesBase64;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function getWindowDimensions() {
    return {
        width: window.innerWidth,
        height: window.innerHeight
    };
}

// 使用示例
@inject JsInterop JsInterop

<button @onclick="TriggerPrompt">Prompt</button>

@code {
    private async Task TriggerPrompt()
    {
        var result = await JsInterop.Prompt("Enter your name:");
        Console.WriteLine($"User entered: {result}");
    }
}
```

### 6. 状态管理

```csharp
// src/Client/Services/AppState.cs
using System.Collections.ObjectModel;

public class AppState
{
    private readonly List<User> _users = new();
    private User? _currentUser;

    public ReadOnlyCollection<User> Users => _users.AsReadOnly();
    public User? CurrentUser => _currentUser;

    public event Action? OnChange;

    public void SetUsers(List<User> users)
    {
        _users.Clear();
        _users.AddRange(users);
        NotifyStateChanged();
    }

    public void AddUser(User user)
    {
        _users.Add(user);
        NotifyStateChanged();
    }

    public void UpdateUser(User user)
    {
        var index = _users.FindIndex(u => u.Id == user.Id);
        if (index != -1)
        {
            _users[index] = user;
            NotifyStateChanged();
        }
    }

    public void RemoveUser(int userId)
    {
        var user = _users.Find(u => u.Id == userId);
        if (user != null)
        {
            _users.Remove(user);
            NotifyStateChanged();
        }
    }

    public void SetCurrentUser(User? user)
    {
        _currentUser = user;
        NotifyStateChanged();
    }

    private void NotifyStateChanged() => OnChange?.Invoke();
}

// 在组件中使用状态管理
@inject AppState AppState
@implements IDisposable

<h2>Users (@AppState.Users.Count)</h2>

<ul>
    @foreach (var user in AppState.Users)
    {
        <li>@user.Name - @user.Email</li>
    }
</ul>

@code {
    protected override void OnInitialized()
    {
        AppState.OnChange += StateHasChanged;
    }

    public void Dispose()
    {
        AppState.OnChange -= StateHasChanged;
    }
}
```

## 最佳实践

### 1. 性能优化

```csharp
// 使用 Virtualize 处理大数据列表
<Virtualize Items="@largeData" Context="item" OverscanCount="10">
    <div class="item">
        @item.Name
    </div>
</Virtualize>

@code {
    private List<Item> largeData = Enumerable.Range(1, 10000)
        .Select(i => new Item { Id = i, Name = $"Item {i}" })
        .ToList();
}

// 延迟加载程序集
@code {
    [Inject] private LazyAssemblyLoader AssemblyLoader { get; set; } = default!;

    private bool _isLoaded = false;

    protected override async Task OnInitializedAsync()
    {
        await AssemblyLoader.LoadAssembliesAsync(new[] { "LargeAssembly.dll" });
        _isLoaded = true;
    }
}

// 使用 should-render 优化渲染
@code {
    private int _currentCount = 0;
    private int _renderCount = 0;

    protected override bool ShouldRender()
    {
        // 只在计数变化时渲染
        return _currentCount > 0;
    }

    protected override void OnAfterRender(bool firstRender)
    {
        _renderCount++;
        Console.WriteLine($"Rendered {_renderCount} times");
    }
}
```

### 2. 错误处理

```csharp
// 全局错误边界
// App.razor
<ErrorBoundary>
    <ChildContent>
        <Router AppAssembly="@typeof(App).Assembly">
            <Found Context="routeData">
                <RouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)" />
                <FocusOnNavigate RouteData="@routeData" Selector="h1" />
            </Found>
            <NotFound>
                <PageTitle>Not found</PageTitle>
                <LayoutView Layout="@typeof(MainLayout)">
                    <p role="alert">Sorry, there's nothing at this address.</p>
                </LayoutView>
            </NotFound>
        </Router>
    </ChildContent>
    <ErrorContent Context="exception">
        <p class="error">An error occurred: @exception.Message</p>
    </ErrorContent>
</ErrorBoundary>

// 组件级错误处理
@inject ILogger<Component> Logger

@code {
    private string? errorMessage;

    protected override async Task OnInitializedAsync()
    {
        try
        {
            await LoadDataAsync();
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to load data");
            errorMessage = $"Error: {ex.Message}";
        }
    }
}
```

### 3. 测试

```csharp
// Tests/Client.Tests/Components/CounterTests.cs
using Bunit;
using Xunit;

public class CounterTests : TestContext
{
    [Fact]
    public void Counter_StartsAtZero()
    {
        // Arrange
        var cut = RenderComponent<Counter>();

        // Assert
        cut.Find("p").MarkupMatches("<p role=\"status\">Current count: 0</p>");
    }

    [Fact]
    public void Counter_IncrementsOnClick()
    {
        // Arrange
        var cut = RenderComponent<Counter>();
        var button = cut.Find("button.btn-primary");

        // Act
        button.Click();

        // Assert
        cut.Find("p").MarkupMatches("<p role=\"status\">Current count: 1</p>");
    }

    [Fact]
    public void Counter_ResetsOnResetButtonClick()
    {
        // Arrange
        var cut = RenderComponent<Counter>();
        var incrementButton = cut.Find("button.btn-primary");
        var resetButton = cut.Find("button.btn-secondary");

        // Act
        incrementButton.Click();
        incrementButton.Click();
        resetButton.Click();

        // Assert
        cut.Find("p").MarkupMatches("<p role=\"status\">Current count: 0</p>");
    }
}

// Tests/Client.Tests/Services/UserServiceTests.cs
using Moq;
using Xunit;
using System.Net;
using System.Net.Http.Json;

public class UserServiceTests
{
    private readonly Mock<HttpMessageHandler> _httpMessageHandlerMock;
    private readonly HttpClient _httpClient;
    private readonly Mock<ILogger<UserService>> _loggerMock;
    private readonly UserService _userService;

    public UserServiceTests()
    {
        _httpMessageHandlerMock = new Mock<HttpMessageHandler>();
        _httpClient = new HttpClient(_httpMessageHandlerMock.Object)
        {
            BaseAddress = new Uri("http://localhost")
        };
        _loggerMock = new Mock<ILogger<UserService>>();
        _userService = new UserService(_httpClient, _loggerMock.Object);
    }

    [Fact]
    public async Task GetUsersAsync_ReturnsUsers()
    {
        // Arrange
        var expectedUsers = new List<User>
        {
            new User { Id = 1, Name = "John Doe", Email = "john@example.com" }
        };

        _httpMessageHandlerMock
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>()
            )
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = JsonContent.Create(expectedUsers)
            });

        // Act
        var users = await _userService.GetUsersAsync();

        // Assert
        Assert.Single(users);
        Assert.Equal("John Doe", users[0].Name);
    }
}
```

## 常用命令

```bash
# 创建项目
dotnet new blazorwasm -o MyBlazorApp
dotnet new blazorwasm --hosted -o MyHostedApp  # 包含 ASP.NET Core 后端

# 运行
dotnet run
dotnet watch run  # 热重载

# 构建
dotnet build
dotnet build -c Release
dotnet publish -c Release -o publish

# 测试
dotnet test
dotnet test --filter "FullyQualifiedName~UserServiceTests"

# 添加包
dotnet add package MudBlazor
dotnet add package Blazored.LocalStorage
dotnet add package Refit.HttpClientFactory

# 工具
dotnet tool install -g dotnet-ef
dotnet ef migrations add InitialCreate
dotnet ef database update
```

## 部署配置

### Docker

```dockerfile
# 构建阶段
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 复制项目文件
COPY ["BlazorApp/BlazorApp.csproj", "BlazorApp/"]
RUN dotnet restore "BlazorApp/BlazorApp.csproj"

# 构建应用
COPY . .
WORKDIR "/src/BlazorApp"
RUN dotnet build "BlazorApp.csproj" -c Release -o /app/build

# 发布阶段
FROM build AS publish
RUN dotnet publish "BlazorApp.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 运行阶段（使用 Nginx）
FROM nginx:alpine AS final
WORKDIR /usr/share/nginx/html
COPY --from=publish /app/publish/wwwroot .
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### nginx.conf

```nginx
events { }

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # 压缩
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

        # 静态文件缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|wasm|dll)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Blazor 路由
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API 代理（如果需要）
        location /api/ {
            proxy_pass http://api-server:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
    }
}
```

### Azure 部署

```bash
# 发布到 Azure Static Web Apps
dotnet publish -c Release -o bin/Release/net8.0/publish

# 或使用 Azure CLI
az staticwebapp create \
    --name MyBlazorApp \
    --resource-group MyResourceGroup \
    --source . \
    --location eastus \
    --branch main \
    --app-location "src/Client" \
    --api-location "" \
    --output-location "wwwroot"
```

### GitHub Actions

```yaml
name: Deploy Blazor App

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: 8.0.x

      - name: Restore dependencies
        run: dotnet restore

      - name: Build
        run: dotnet build --configuration Release --no-restore

      - name: Publish
        run: dotnet publish src/Client/BlazorApp.csproj -c Release -o publish

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./publish/wwwroot
```

## 扩展资源

- [Blazor 官方文档](https://docs.microsoft.com/aspnet/core/blazor/)
- [Blazor WebAssembly 教程](https://dotnet.microsoft.com/learn/aspnet/blazor-tutorial/intro)
- [Blazor 组件库](https://blazor.net/components/)
- [MudBlazor](https://mudblazor.com/)
- [Blazor 示例](https://github.com/dotnet/blazor-samples)
- [Awesome Blazor](https://github.com/AdrienTorris/awesome-blazor)
