# Avalonia UI 跨平台桌面应用模板

## 项目概述

Avalonia UI 是一个强大的跨平台 XAML 框架，用于构建 .NET 桌面应用程序。它类似于 WPF（Windows Presentation Foundation），但可以在 Windows、macOS、Linux、iOS、Android 和 WebAssembly 上运行。Avalonia 提供了现代化的 UI 组件、MVVM 支持和灵活的样式系统。

## 技术栈

- **框架**: Avalonia UI 11.x
- **语言**: C# 12 / XAML
- **运行时**: .NET 8+
- **架构模式**: MVVM (ReactiveUI / CommunityToolkit.Mvvm)
- **依赖注入**: Microsoft.Extensions.DependencyInjection
- **数据库**: SQLite / Entity Framework Core
- **主题**: Fluent / Simple / Custom
- **图标**: Fluent Icons / Material Icons

## 项目结构

```
AvaloniaApp/
├── src/
│   ├── AvaloniaApp.Desktop/          # 主桌面项目
│   │   ├── Views/
│   │   │   ├── MainWindow.axaml
│   │   │   ├── MainWindow.axaml.cs
│   │   │   ├── Pages/
│   │   │   │   ├── HomePage.axaml
│   │   │   │   ├── HomePage.axaml.cs
│   │   │   │   ├── SettingsPage.axaml
│   │   │   │   └── UsersPage.axaml
│   │   │   └── Controls/
│   │   │       ├── UserCard.axaml
│   │   │       └── NavBar.axaml
│   │   ├── ViewModels/
│   │   │   ├── MainWindowViewModel.cs
│   │   │   ├── HomeViewModel.cs
│   │   │   ├── SettingsViewModel.cs
│   │   │   └── UsersViewModel.cs
│   │   ├── Models/
│   │   │   ├── User.cs
│   │   │   ├── Settings.cs
│   │   │   └── Theme.cs
│   │   ├── Services/
│   │   │   ├── IUserService.cs
│   │   │   ├── UserService.cs
│   │   │   ├── IThemeService.cs
│   │   │   ├── ThemeService.cs
│   │   │   └── DatabaseService.cs
│   │   ├── Converters/
│   │   │   ├── BoolToVisibilityConverter.cs
│   │   │   └── StringToColorConverter.cs
│   │   ├── Helpers/
│   │   │   └── WindowHelper.cs
│   │   ├── Assets/
│   │   │   ├── Fonts/
│   │   │   └── Images/
│   │   ├── App.axaml
│   │   ├── App.axaml.cs
│   │   ├── Program.cs
│   │   └── AvaloniaApp.Desktop.csproj
│   │
│   ├── AvaloniaApp.Core/             # 核心业务逻辑
│   │   ├── Interfaces/
│   │   │   ├── IRepository.cs
│   │   │   └── IDataService.cs
│   │   ├── Models/
│   │   │   └── BaseEntity.cs
│   │   ├── Services/
│   │   │   └── DataService.cs
│   │   └── AvaloniaApp.Core.csproj
│   │
│   └── AvaloniaApp.Tests/            # 测试项目
│       ├── ViewModels/
│       │   └── HomeViewModelTests.cs
│       ├── Services/
│       │   └── UserServiceTests.cs
│       └── AvaloniaApp.Tests.csproj
│
├── AvaloniaApp.sln
└── README.md
```

## 核心代码模式

### 1. 应用程序入口与依赖注入

```csharp
// src/AvaloniaApp.Desktop/Program.cs
using Avalonia;
using Avalonia.ReactiveUI;
using Microsoft.Extensions.DependencyInjection;

namespace AvaloniaApp.Desktop;

class Program
{
    // Avalonia 配置
    public static AppBuilder BuildAvaloniaApp()
        => AppBuilder.Configure<App>()
            .UsePlatformDetect()
            .WithInterFont()
            .LogToTrace()
            .UseReactiveUI();

    // 主入口点
    [STAThread]
    public static void Main(string[] args)
    {
        BuildAvaloniaApp()
            .StartWithClassicDesktopLifetime(args);
    }
}

// src/AvaloniaApp.Desktop/App.axaml.cs
using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using Microsoft.Extensions.DependencyInjection;
using AvaloniaApp.Desktop.Views;
using AvaloniaApp.Desktop.ViewModels;
using AvaloniaApp.Desktop.Services;

namespace AvaloniaApp.Desktop;

public class App : Application
{
    public IServiceProvider Services { get; private set; } = null!;

    public override void Initialize()
    {
        AvaloniaXamlLoader.Load(this);
    }

    public override void OnFrameworkInitializationCompleted()
    {
        // 配置依赖注入
        var services = new ServiceCollection();
        ConfigureServices(services);
        Services = services.BuildServiceProvider();

        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            desktop.MainWindow = Services.GetRequiredService<MainWindow>();
        }
        else if (ApplicationLifetime is ISingleViewApplicationLifetime singleView)
        {
            singleView.MainView = Services.GetRequiredService<MainView>();
        }

        base.OnFrameworkInitializationCompleted();
    }

    private void ConfigureServices(IServiceCollection services)
    {
        // Services
        services.AddSingleton<IUserService, UserService>();
        services.AddSingleton<IThemeService, ThemeService>();
        services.AddSingleton<DatabaseService>();

        // ViewModels
        services.AddTransient<MainWindowViewModel>();
        services.AddTransient<HomeViewModel>();
        services.AddTransient<UsersViewModel>();
        services.AddTransient<SettingsViewModel>();

        // Views
        services.AddTransient<MainWindow>();
        services.AddTransient<MainView>();
    }
}
```

### 2. MVVM 模式

```csharp
// src/AvaloniaApp.Desktop/ViewModels/ViewModelBase.cs
using ReactiveUI;
using System.Reactive;

namespace AvaloniaApp.Desktop.ViewModels;

public class ViewModelBase : ReactiveObject
{
    protected ViewModelBase()
    {
    }
}

// src/AvaloniaApp.Desktop/ViewModels/UsersViewModel.cs
using System.Collections.ObjectModel;
using System.Reactive;
using System.Reactive.Linq;
using ReactiveUI;
using AvaloniaApp.Desktop.Models;
using AvaloniaApp.Desktop.Services;

namespace AvaloniaApp.Desktop.ViewModels;

public class UsersViewModel : ViewModelBase
{
    private readonly IUserService _userService;
    private readonly IThemeService _themeService;
    
    private string _searchText = string.Empty;
    private bool _isLoading;
    private User? _selectedUser;

    public UsersViewModel(IUserService userService, IThemeService themeService)
    {
        _userService = userService;
        _themeService = themeService;

        // 命令
        LoadUsersCommand = ReactiveCommand.CreateFromTask(LoadUsersAsync);
        AddUserCommand = ReactiveCommand.CreateFromTask(AddUserAsync);
        DeleteUserCommand = ReactiveCommand.CreateFromTask<User>(DeleteUserAsync);
        SearchCommand = ReactiveCommand.CreateFromTask(SearchUsersAsync);

        // 搜索文本变化时自动搜索
        this.WhenAnyValue(x => x.SearchText)
            .Throttle(TimeSpan.FromMilliseconds(300))
            .DistinctUntilChanged()
            .Subscribe(_ => SearchCommand.Execute().Subscribe());

        // 初始加载
        LoadUsersCommand.Execute().Subscribe();
    }

    public ObservableCollection<User> Users { get; } = new();

    public string SearchText
    {
        get => _searchText;
        set => this.RaiseAndSetIfChanged(ref _searchText, value);
    }

    public bool IsLoading
    {
        get => _isLoading;
        set => this.RaiseAndSetIfChanged(ref _isLoading, value);
    }

    public User? SelectedUser
    {
        get => _selectedUser;
        set => this.RaiseAndSetIfChanged(ref _selectedUser, value);
    }

    public ReactiveCommand<Unit, Unit> LoadUsersCommand { get; }
    public ReactiveCommand<Unit, Unit> AddUserCommand { get; }
    public ReactiveCommand<User, Unit> DeleteUserCommand { get; }
    public ReactiveCommand<Unit, Unit> SearchCommand { get; }

    private async Task LoadUsersAsync()
    {
        IsLoading = true;
        try
        {
            var users = await _userService.GetUsersAsync();
            Users.Clear();
            foreach (var user in users)
            {
                Users.Add(user);
            }
        }
        finally
        {
            IsLoading = false;
        }
    }

    private async Task AddUserAsync()
    {
        var user = new User
        {
            Name = "New User",
            Email = "newuser@example.com",
            Role = "User",
            CreatedAt = DateTime.Now
        };

        await _userService.CreateUserAsync(user);
        Users.Add(user);
    }

    private async Task DeleteUserAsync(User user)
    {
        await _userService.DeleteUserAsync(user.Id);
        Users.Remove(user);
    }

    private async Task SearchUsersAsync()
    {
        if (string.IsNullOrWhiteSpace(SearchText))
        {
            await LoadUsersAsync();
            return;
        }

        IsLoading = true;
        try
        {
            var users = await _userService.SearchUsersAsync(SearchText);
            Users.Clear();
            foreach (var user in users)
            {
                Users.Add(user);
            }
        }
        finally
        {
            IsLoading = false;
        }
    }
}
```

### 3. XAML 视图

```xml
<!-- src/AvaloniaApp.Desktop/Views/MainWindow.axaml -->
<Window xmlns="https://github.com/avaloniaui"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:vm="using:AvaloniaApp.Desktop.ViewModels"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        mc:Ignorable="d" d:DesignWidth="1200" d:DesignHeight="800"
        x:Class="AvaloniaApp.Desktop.Views.MainWindow"
        x:DataType="vm:MainWindowViewModel"
        Icon="/Assets/avalonia-logo.ico"
        Title="AvaloniaApp"
        Width="1200" Height="800"
        MinWidth="800" MinHeight="600"
        ExtendClientAreaToDecorationsHint="True"
        TransparencyLevelHint="AcrylicBlur">

    <Design.DataContext>
        <vm:MainWindowViewModel/>
    </Design.DataContext>

    <Grid RowDefinitions="Auto,*">
        <!-- 标题栏 -->
        <Border Grid.Row="0" Background="{DynamicResource SystemControlBackgroundChromeMediumBrush}"
                Padding="16,8">
            <StackPanel Orientation="Horizontal" Spacing="16">
                <TextBlock Text="AvaloniaApp" FontWeight="Bold" FontSize="16" 
                          VerticalAlignment="Center"/>
                <TextBlock Text="{Binding CurrentPageTitle}" 
                          VerticalAlignment="Center"/>
            </StackPanel>
        </Border>

        <!-- 主内容区域 -->
        <Grid Grid.Row="1" ColumnDefinitions="200,*">
            <!-- 导航栏 -->
            <Border Grid.Column="0" Background="{DynamicResource SystemControlBackgroundChromeLowBrush}">
                <StackPanel Spacing="8" Margin="0,16">
                    <Button Content="Home" Command="{Binding NavigateCommand}" 
                            CommandParameter="home"
                            HorizontalAlignment="Stretch" HorizontalContentAlignment="Left"
                            Padding="16,8"/>
                    <Button Content="Users" Command="{Binding NavigateCommand}" 
                            CommandParameter="users"
                            HorizontalAlignment="Stretch" HorizontalContentAlignment="Left"
                            Padding="16,8"/>
                    <Button Content="Settings" Command="{Binding NavigateCommand}" 
                            CommandParameter="settings"
                            HorizontalAlignment="Stretch" HorizontalContentAlignment="Left"
                            Padding="16,8"/>
                </StackPanel>
            </Border>

            <!-- 内容区域 -->
            <ContentControl Grid.Column="1" Content="{Binding CurrentView}"/>
        </Grid>
    </Grid>
</Window>

<!-- src/AvaloniaApp.Desktop/Views/Pages/UsersPage.axaml -->
<UserControl xmlns="https://github.com/avaloniaui"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:vm="using:AvaloniaApp.Desktop.ViewModels"
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
             mc:Ignorable="d" d:DesignWidth="800" d:DesignHeight="600"
             x:Class="AvaloniaApp.Desktop.Views.UsersPage"
             x:DataType="vm:UsersViewModel">

    <Design.DataContext>
        <vm:UsersViewModel/>
    </Design.DataContext>

    <Grid RowDefinitions="Auto,*,Auto">
        <!-- 工具栏 -->
        <Border Grid.Row="0" Padding="16" Background="{DynamicResource SystemControlBackgroundChromeMediumBrush}">
            <Grid ColumnDefinitions="*,Auto">
                <!-- 搜索框 -->
                <TextBox Grid.Column="0" 
                         Text="{Binding SearchText}"
                         Watermark="Search users..."
                         Width="300" HorizontalAlignment="Left"/>

                <!-- 添加按钮 -->
                <Button Grid.Column="1" 
                        Content="Add User"
                        Command="{Binding AddUserCommand}"
                        Classes="primary"/>
            </Grid>
        </Border>

        <!-- 数据列表 -->
        <DataGrid Grid.Row="1"
                  ItemsSource="{Binding Users}"
                  SelectedItem="{Binding SelectedUser}"
                  IsReadOnly="True"
                  AutoGenerateColumns="False"
                  GridLinesVisibility="All"
                  IsLoading="{Binding IsLoading}">
            <DataGrid.Columns>
                <DataGridTextColumn Header="ID" Binding="{Binding Id}" Width="Auto"/>
                <DataGridTextColumn Header="Name" Binding="{Binding Name}" Width="*"/>
                <DataGridTextColumn Header="Email" Binding="{Binding Email}" Width="*"/>
                <DataGridTextColumn Header="Role" Binding="{Binding Role}" Width="Auto"/>
                <DataGridTextColumn Header="Created" Binding="{Binding CreatedAt, StringFormat='{}{0:MM/dd/yyyy}'}" 
                                   Width="Auto"/>
                <DataGridTemplateColumn Header="Actions" Width="Auto">
                    <DataGridTemplateColumn.CellTemplate>
                        <DataTemplate>
                            <StackPanel Orientation="Horizontal" Spacing="8">
                                <Button Content="Edit" Command="{Binding $parent[DataGrid].((vm:UsersViewModel)DataContext).EditCommand}"
                                       CommandParameter="{Binding}"
                                       Classes="small"/>
                                <Button Content="Delete" 
                                       Command="{Binding $parent[DataGrid].((vm:UsersViewModel)DataContext).DeleteUserCommand}"
                                       CommandParameter="{Binding}"
                                       Classes="danger small"/>
                            </StackPanel>
                        </DataTemplate>
                    </DataGridTemplateColumn.CellTemplate>
                </DataGridTemplateColumn>
            </DataGrid.Columns>
        </DataGrid>

        <!-- 状态栏 -->
        <Border Grid.Row="2" Padding="16,8" Background="{DynamicResource SystemControlBackgroundChromeLowBrush}">
            <TextBlock Text="{Binding Users.Count, StringFormat='{}{0} users'}"/>
        </Border>
    </Grid>
</UserControl>
```

### 4. 服务层

```csharp
// src/AvaloniaApp.Desktop/Services/IUserService.cs
using AvaloniaApp.Desktop.Models;

namespace AvaloniaApp.Desktop.Services;

public interface IUserService
{
    Task<List<User>> GetUsersAsync();
    Task<User?> GetUserByIdAsync(int id);
    Task<User> CreateUserAsync(User user);
    Task<User> UpdateUserAsync(User user);
    Task DeleteUserAsync(int id);
    Task<List<User>> SearchUsersAsync(string query);
}

// src/AvaloniaApp.Desktop/Services/UserService.cs
using System.Net.Http.Json;
using System.Text.Json;
using AvaloniaApp.Desktop.Models;

namespace AvaloniaApp.Desktop.Services;

public class UserService : IUserService
{
    private readonly HttpClient _httpClient;
    private readonly JsonSerializerOptions _jsonOptions;

    public UserService()
    {
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri("https://api.example.com/")
        };

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    public async Task<List<User>> GetUsersAsync()
    {
        var response = await _httpClient.GetAsync("api/users");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<User>>(_jsonOptions) 
            ?? new List<User>();
    }

    public async Task<User?> GetUserByIdAsync(int id)
    {
        var response = await _httpClient.GetAsync($"api/users/{id}");
        
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            return null;

        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<User>(_jsonOptions);
    }

    public async Task<User> CreateUserAsync(User user)
    {
        var response = await _httpClient.PostAsJsonAsync("api/users", user);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<User>(_jsonOptions) 
            ?? throw new InvalidOperationException("Failed to create user");
    }

    public async Task<User> UpdateUserAsync(User user)
    {
        var response = await _httpClient.PutAsJsonAsync($"api/users/{user.Id}", user);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<User>(_jsonOptions) 
            ?? throw new InvalidOperationException("Failed to update user");
    }

    public async Task DeleteUserAsync(int id)
    {
        var response = await _httpClient.DeleteAsync($"api/users/{id}");
        response.EnsureSuccessStatusCode();
    }

    public async Task<List<User>> SearchUsersAsync(string query)
    {
        var response = await _httpClient.GetAsync($"api/users/search?q={Uri.EscapeDataString(query)}");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<User>>(_jsonOptions) 
            ?? new List<User>();
    }
}

// src/AvaloniaApp.Desktop/Services/ThemeService.cs
using Avalonia;
using Avalonia.Styling;

namespace AvaloniaApp.Desktop.Services;

public interface IThemeService
{
    void SetTheme(ThemeVariant theme);
    ThemeVariant GetCurrentTheme();
    void ToggleTheme();
}

public class ThemeService : IThemeService
{
    private ThemeVariant _currentTheme = ThemeVariant.Light;

    public void SetTheme(ThemeVariant theme)
    {
        _currentTheme = theme;
        Application.Current!.RequestedThemeVariant = theme;
    }

    public ThemeVariant GetCurrentTheme()
    {
        return _currentTheme;
    }

    public void ToggleTheme()
    {
        var newTheme = _currentTheme == ThemeVariant.Light 
            ? ThemeVariant.Dark 
            : ThemeVariant.Light;
        SetTheme(newTheme);
    }
}
```

### 5. 数据库集成（SQLite + EF Core）

```csharp
// src/AvaloniaApp.Core/Models/BaseEntity.cs
namespace AvaloniaApp.Core.Models;

public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; }
}

// src/AvaloniaApp.Desktop/Models/User.cs
using AvaloniaApp.Core.Models;

namespace AvaloniaApp.Desktop.Models;

public class User : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "User";
    public bool IsActive { get; set; } = true;
}

// src/AvaloniaApp.Desktop/Services/DatabaseService.cs
using Microsoft.EntityFrameworkCore;
using AvaloniaApp.Desktop.Models;

namespace AvaloniaApp.Desktop.Services;

public class DatabaseService : DbContext
{
    public DbSet<User> Users { get; set; }

    public string DbPath { get; }

    public DatabaseService()
    {
        var folder = Environment.SpecialFolder.LocalApplicationData;
        var path = Environment.GetFolderPath(folder);
        DbPath = Path.Join(path, "avaloniaapp.db");
    }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options.UseSqlite($"Data Source={DbPath}");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 配置实体
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.HasIndex(e => e.Email).IsUnique();
        });
    }

    // 初始化数据库
    public void Initialize()
    {
        Database.EnsureCreated();
        
        // 添加种子数据
        if (!Users.Any())
        {
            Users.AddRange(
                new User { Name = "John Doe", Email = "john@example.com", Role = "Admin" },
                new User { Name = "Jane Smith", Email = "jane@example.com", Role = "User" }
            );
            SaveChanges();
        }
    }
}

// 在 App.axaml.cs 中注册
services.AddSingleton<DatabaseService>(sp => 
{
    var db = new DatabaseService();
    db.Initialize();
    return db;
});
```

### 6. 自定义控件

```xml
<!-- src/AvaloniaApp.Desktop/Views/Controls/UserCard.axaml -->
<UserControl xmlns="https://github.com/avaloniaui"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:vm="using:AvaloniaApp.Desktop.ViewModels"
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
             mc:Ignorable="d" d:DesignWidth="300" d:DesignHeight="200"
             x:Class="AvaloniaApp.Desktop.Views.Controls.UserCard"
             x:DataType="vm:UserCardViewModel">

    <Design.DataContext>
        <vm:UserCardViewModel/>
    </Design.DataContext>

    <Border Background="{DynamicResource SystemControlBackgroundChromeMediumBrush}"
            BorderBrush="{DynamicResource SystemControlForegroundBaseMediumBrush}"
            BorderThickness="1"
            CornerRadius="8"
            Padding="16">
        <Grid RowDefinitions="Auto,*,Auto">
            <!-- 头像和姓名 -->
            <StackPanel Grid.Row="0" Orientation="Horizontal" Spacing="12">
                <Border Width="48" Height="48" CornerRadius="24"
                       Background="{DynamicResource SystemAccentColor}">
                    <TextBlock Text="{Binding Initials}"
                              FontSize="20"
                              FontWeight="Bold"
                              Foreground="White"
                              HorizontalAlignment="Center"
                              VerticalAlignment="Center"/>
                </Border>
                
                <StackPanel VerticalAlignment="Center">
                    <TextBlock Text="{Binding Name}" 
                              FontWeight="Bold" 
                              FontSize="16"/>
                    <TextBlock Text="{Binding Email}" 
                              Foreground="{DynamicResource SystemControlForegroundBaseMediumBrush}"
                              FontSize="12"/>
                </StackPanel>
            </StackPanel>

            <!-- 角色 -->
            <Border Grid.Row="1"
                   Background="{DynamicResource SystemAccentColorDark1}"
                   CornerRadius="4"
                   Padding="8,4"
                   HorizontalAlignment="Left"
                   VerticalAlignment="Center">
                <TextBlock Text="{Binding Role}" 
                          Foreground="White"
                          FontSize="12"/>
            </Border>

            <!-- 操作按钮 -->
            <StackPanel Grid.Row="2" 
                       Orientation="Horizontal" 
                       Spacing="8"
                       HorizontalAlignment="Right">
                <Button Content="Edit" 
                       Command="{Binding EditCommand}"
                       Classes="small primary"/>
                <Button Content="Delete" 
                       Command="{Binding DeleteCommand}"
                       Classes="small danger"/>
            </StackPanel>
        </Grid>
    </Border>
</UserControl>
```

```csharp
// src/AvaloniaApp.Desktop/Views/Controls/UserCard.axaml.cs
using Avalonia.Controls;
using Avalonia.Markup.Xaml;

namespace AvaloniaApp.Desktop.Views.Controls;

public partial class UserCard : UserControl
{
    public UserCard()
    {
        InitializeComponent();
    }

    private void InitializeComponent()
    {
        AvaloniaXamlLoader.Load(this);
    }
}
```

## 最佳实践

### 1. 样式与主题

```xml
<!-- App.axaml -->
<Application xmlns="https://github.com/avaloniaui"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             x:Class="AvaloniaApp.Desktop.App">
    <Application.Styles>
        <FluentTheme>
            <FluentTheme.Palettes>
                <ColorPaletteResources x:Key="Light"
                                      Accent="#FF0078D7"
                                      AltHigh="#FFFFFFFF"
                                      AltLow="#FFFFFFFF"/>
                <ColorPaletteResources x:Key="Dark"
                                      Accent="#FF0078D7"
                                      AltHigh="#FF202020"
                                      AltLow="#FF202020"/>
            </FluentTheme.Palettes>
        </FluentTheme>

        <!-- 自定义按钮样式 -->
        <Style Selector="Button.primary">
            <Setter Property="Background" Value="{DynamicResource SystemAccentColor}"/>
            <Setter Property="Foreground" Value="White"/>
            <Setter Property="CornerRadius" Value="4"/>
        </Style>

        <Style Selector="Button.danger">
            <Setter Property="Background" Value="#FFDC3545"/>
            <Setter Property="Foreground" Value="White"/>
            <Setter Property="CornerRadius" Value="4"/>
        </Style>

        <Style Selector="Button.small">
            <Setter Property="Padding" Value="8,4"/>
            <Setter Property="FontSize" Value="12"/>
        </Style>
    </Application.Styles>
</Application>
```

### 2. 响应式布局

```xml
<Grid>
    <Grid.ColumnDefinitions>
        <ColumnDefinition Width="Auto"/>
        <ColumnDefinition Width="*"/>
        <ColumnDefinition Width="Auto"/>
    </Grid.ColumnDefinitions>

    <!-- 使用 * 和 Auto 实现自适应布局 -->
    <Border Grid.Column="0" Width="200" Background="LightGray">
        <TextBlock Text="Sidebar"/>
    </Border>

    <ContentControl Grid.Column="1" Content="{Binding MainContent}"/>

    <Border Grid.Column="2" Width="250" Background="LightGray">
        <TextBlock Text="Right Panel"/>
    </Border>
</Grid>

<!-- 响应式设计 -->
<UserControl xmlns:i="clr-namespace:Avalonia.Xaml.Interactivity;assembly=Avalonia.Xaml.Interactivity">
    <i:Interaction.Behaviors>
        <i:BehaviorCollection>
            <!-- 在小屏幕上隐藏侧边栏 -->
            <visual:ResponsiveBehavior Breakpoint="800">
                <visual:ResponsiveBehavior.Setters>
                    <Setter Target="Sidebar.IsVisible" Value="False"/>
                </visual:ResponsiveBehavior.Setters>
            </visual:ResponsiveBehavior>
        </i:BehaviorCollection>
    </i:Interaction.Behaviors>
</UserControl>
```

### 3. 测试

```csharp
// Tests/AvaloniaApp.Tests/ViewModels/UsersViewModelTests.cs
using Xunit;
using Moq;
using AvaloniaApp.Desktop.ViewModels;
using AvaloniaApp.Desktop.Services;
using AvaloniaApp.Desktop.Models;

public class UsersViewModelTests
{
    private readonly Mock<IUserService> _userServiceMock;
    private readonly Mock<IThemeService> _themeServiceMock;
    private readonly UsersViewModel _viewModel;

    public UsersViewModelTests()
    {
        _userServiceMock = new Mock<IUserService>();
        _themeServiceMock = new Mock<IThemeService>();
        _viewModel = new UsersViewModel(_userServiceMock.Object, _themeServiceMock.Object);
    }

    [Fact]
    public async Task LoadUsersAsync_ShouldPopulateUsers()
    {
        // Arrange
        var users = new List<User>
        {
            new User { Id = 1, Name = "John Doe", Email = "john@example.com" },
            new User { Id = 2, Name = "Jane Smith", Email = "jane@example.com" }
        };

        _userServiceMock.Setup(x => x.GetUsersAsync())
            .ReturnsAsync(users);

        // Act
        await _viewModel.LoadUsersCommand.Execute();

        // Assert
        Assert.Equal(2, _viewModel.Users.Count);
        Assert.Equal("John Doe", _viewModel.Users[0].Name);
    }

    [Fact]
    public async Task DeleteUserAsync_ShouldRemoveUserFromCollection()
    {
        // Arrange
        var user = new User { Id = 1, Name = "John Doe", Email = "john@example.com" };
        _viewModel.Users.Add(user);

        _userServiceMock.Setup(x => x.DeleteUserAsync(user.Id))
            .Returns(Task.CompletedTask);

        // Act
        await _viewModel.DeleteUserCommand.Execute(user);

        // Assert
        Assert.Empty(_viewModel.Users);
    }

    [Fact]
    public async Task SearchUsersAsync_ShouldFilterUsers()
    {
        // Arrange
        var users = new List<User>
        {
            new User { Id = 1, Name = "John Doe", Email = "john@example.com" }
        };

        _userServiceMock.Setup(x => x.SearchUsersAsync("john"))
            .ReturnsAsync(users);

        // Act
        _viewModel.SearchText = "john";
        await Task.Delay(500); // Wait for debounce

        // Assert
        Assert.Single(_viewModel.Users);
        Assert.Contains(_viewModel.Users, u => u.Name == "John Doe");
    }
}
```

## 常用命令

```bash
# 创建项目
dotnet new avalonia.app -o MyApp
dotnet new avalonia.mvvm -o MyMvvmApp

# 运行
dotnet run
dotnet run --framework net8.0

# 构建
dotnet build
dotnet build -c Release
dotnet publish -c Release -r win-x64 --self-contained

# 添加包
dotnet add package Avalonia.Desktop
dotnet add package Avalonia.ReactiveUI
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Newtonsoft.Json

# 测试
dotnet test
dotnet test --filter "FullyQualifiedName~UsersViewModelTests"

# 发布（跨平台）
dotnet publish -c Release -r win-x64   # Windows
dotnet publish -c Release -r osx-x64   # macOS
dotnet publish -c Release -r linux-x64 # Linux
```

## 部署配置

### csproj 配置

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <BuiltInComInteropSupport>true</BuiltInComInteropSupport>
    <ApplicationManifest>app.manifest</ApplicationManifest>
    <AvaloniaUseCompiledBindingsByDefault>true</AvaloniaUseCompiledBindingsByDefault>
  </PropertyGroup>

  <ItemGroup>
    <AvaloniaResource Include="Assets\**" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="Avalonia" Version="11.0.0" />
    <PackageReference Include="Avalonia.Desktop" Version="11.0.0" />
    <PackageReference Include="Avalonia.Themes.Fluent" Version="11.0.0" />
    <PackageReference Include="Avalonia.ReactiveUI" Version="11.0.0" />
    <PackageReference Include="Microsoft.Extensions.DependencyInjection" Version="8.0.0" />
  </ItemGroup>
</Project>
```

### Docker (Linux 部署)

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 复制项目文件
COPY ["AvaloniaApp.Desktop/AvaloniaApp.Desktop.csproj", "AvaloniaApp.Desktop/"]
RUN dotnet restore "AvaloniaApp.Desktop/AvaloniaApp.Desktop.csproj"

# 构建
COPY . .
WORKDIR "/src/AvaloniaApp.Desktop"
RUN dotnet build "AvaloniaApp.Desktop.csproj" -c Release -o /app/build

# 发布
FROM build AS publish
RUN dotnet publish "AvaloniaApp.Desktop.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 运行
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AvaloniaApp.Desktop.dll"]
```

## 扩展资源

- [Avalonia UI 官方文档](https://docs.avaloniaui.net/)
- [Avalonia GitHub](https://github.com/AvaloniaUI/Avalonia)
- [Avalonia 示例](https://github.com/AvaloniaUI/Avalonia.Samples)
- [Avalonia XAML 编辑器](https://marketplace.visualstudio.com/items?itemName=AvaloniaTeam.AvaloniaforVisualStudio)
- [Awesome Avalonia](https://github.com/AvaloniaCommunity/awesome-avalonia)
