# ASP.NET Core 企业级 API 开发模板

## 技术栈

- **ASP.NET Core 8**: Web 框架
- **C# 12 / .NET 8**: 编程语言和运行时
- **Entity Framework Core**: ORM
- **PostgreSQL / SQL Server**: 数据库
- **MediatR**: CQRS 模式
- **FluentValidation**: 请求验证
- **AutoMapper**: 对象映射
- **Serilog**: 日志
- **Identity / JWT**: 认证授权
- **xUnit**: 单元测试

## 项目结构

```
aspnetcore-api/
├── src/
│   ├── Api/
│   │   ├── Controllers/
│   │   │   ├── UsersController.cs
│   │   │   ├── PostsController.cs
│   │   │   └── AuthController.cs
│   │   ├── Middleware/
│   │   │   ├── ExceptionMiddleware.cs
│   │   │   └── RateLimitingMiddleware.cs
│   │   ├── Filters/
│   │   │   └── ValidationFilter.cs
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   └── Api.csproj
│   ├── Application/
│   │   ├── Commands/
│   │   │   ├── CreatePostCommand.cs
│   │   │   └── UpdatePostCommand.cs
│   │   ├── Queries/
│   │   │   ├── GetPostQuery.cs
│   │   │   └── GetPostsQuery.cs
│   │   ├── DTOs/
│   │   │   ├── PostDto.cs
│   │   │   └── UserDto.cs
│   │   ├── Interfaces/
│   │   │   └── IPostService.cs
│   │   ├── Services/
│   │   │   └── PostService.cs
│   │   ├── Mappings/
│   │   │   └── MappingProfile.cs
│   │   ├── Validators/
│   │   │   └── CreatePostValidator.cs
│   │   └── Application.csproj
│   ├── Domain/
│   │   ├── Entities/
│   │   │   ├── User.cs
│   │   │   ├── Post.cs
│   │   │   └── Comment.cs
│   │   ├── Events/
│   │   │   └── PostCreatedEvent.cs
│   │   ├── ValueObjects/
│   │   │   └── Email.cs
│   │   ├── Exceptions/
│   │   │   └── DomainException.cs
│   │   └── Domain.csproj
│   └── Infrastructure/
│       ├── Data/
│       │   ├── ApplicationDbContext.cs
│       │   └── Configurations/
│       │       └── PostConfiguration.cs
│       ├── Repositories/
│       │   ├── PostRepository.cs
│       │   └── UnitOfWork.cs
│       ├── Services/
│       │   ├── EmailService.cs
│       │   └── CacheService.cs
│       ├── Identity/
│       │   └── IdentityService.cs
│       └── Infrastructure.csproj
├── tests/
│   ├── Application.Tests/
│   │   └── Commands/
│   │       └── CreatePostCommandTests.cs
│   └── Api.Tests/
│       └── Controllers/
│           └── PostsControllerTests.cs
├── Dockerfile
├── docker-compose.yml
└── aspnetcore-api.sln
```

## 代码模式

### 应用入口

```csharp
// src/Api/Program.cs
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Api.Middleware;
using Application;
using Infrastructure;
using Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Serilog 配置
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.Seq(builder.Configuration["Seq:ServerUrl"]!)
    .CreateLogger();

builder.Host.UseSerilog();

// 服务注册
builder.Services
    .AddApplication()
    .AddInfrastructure(builder.Configuration);

// 数据库
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        b => b.MigrationsAssembly("Infrastructure")
    ));

// 认证
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SecretKey"]!)
            )
        };
    });

// 授权
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdminRole", policy => policy.RequireRole("Admin"));
    options.AddPolicy("RequireModeratorRole", policy => 
        policy.RequireRole("Admin", "Moderator"));
});

// 控制器
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidationFilter>();
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "ASP.NET Core API", 
        Version = "v1" 
    });
    
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// 健康检查
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!)
    .AddRedis(builder.Configuration["Redis:ConnectionString"]!);

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin", policy =>
    {
        policy.WithOrigins(builder.Configuration["AllowedOrigins"]!.Split(","))
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 缓存
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration["Redis:ConnectionString"];
});

var app = builder.Build();

// 数据库迁移
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.Migrate();
}

// 中间件管道
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();

app.UseHttpsRedirection();
app.UseCors("AllowSpecificOrigin");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

// 测试可见性
public partial class Program { }
```

### 领域实体

```csharp
// src/Domain/Entities/Entity.cs
namespace Domain.Entities;

public abstract class Entity
{
    public Guid Id { get; protected set; }
    public DateTime CreatedAt { get; protected set; }
    public DateTime? UpdatedAt { get; protected set; }
}

// src/Domain/Entities/User.cs
namespace Domain.Entities;

public class User : Entity
{
    public string Email { get; private set; } = null!;
    public string Name { get; private set; } = null!;
    public string PasswordHash { get; private set; } = null!;
    public string Role { get; private set; } = "User";
    public bool IsActive { get; private set; } = true;
    public DateTime? LastLoginAt { get; private set; }

    // 导航属性
    public ICollection<Post> Posts { get; private set; } = new List<Post>();
    public ICollection<Comment> Comments { get; private set; } = new List<Comment>();

    // 私有构造函数 (EF Core)
    private User() { }

    // 工厂方法
    public static User Create(string email, string name, string passwordHash, string role = "User")
    {
        return new User
        {
            Id = Guid.NewGuid(),
            Email = email.ToLowerInvariant(),
            Name = name,
            PasswordHash = passwordHash,
            Role = role,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
    }

    public void UpdateProfile(string name)
    {
        Name = name;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateLastLogin()
    {
        LastLoginAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }
}
```

```csharp
// src/Domain/Entities/Post.cs
namespace Domain.Entities;

public class Post : Entity
{
    public string Title { get; private set; } = null!;
    public string Slug { get; private set; } = null!;
    public string Content { get; private set; } = null!;
    public PostStatus Status { get; private set; } = PostStatus.Draft;
    public int ViewCount { get; private set; } = 0;
    public DateTime? PublishedAt { get; private set; }
    
    public Guid AuthorId { get; private set; }
    public User Author { get; private set; } = null!;

    public ICollection<Comment> Comments { get; private set; } = new List<Comment>();
    public ICollection<Tag> Tags { get; private set; } = new List<Tag>();

    private Post() { }

    public static Post Create(string title, string content, Guid authorId)
    {
        var slug = GenerateSlug(title);
        
        return new Post
        {
            Id = Guid.NewGuid(),
            Title = title,
            Slug = slug,
            Content = content,
            AuthorId = authorId,
            Status = PostStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(string title, string content)
    {
        Title = title;
        Content = content;
        Slug = GenerateSlug(title);
        UpdatedAt = DateTime.UtcNow;
    }

    public void Publish()
    {
        if (Status == PostStatus.Published) return;
        
        Status = PostStatus.Published;
        PublishedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Archive()
    {
        Status = PostStatus.Archived;
        UpdatedAt = DateTime.UtcNow;
    }

    public void IncrementViewCount()
    {
        ViewCount++;
    }

    private static string GenerateSlug(string title)
    {
        return title.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("[^a-z0-9-]", "")
            .Substring(0, Math.Min(title.Length, 100));
    }
}

public enum PostStatus
{
    Draft = 0,
    Published = 1,
    Archived = 2
}
```

### CQRS 命令和查询

```csharp
// src/Application/Commands/CreatePostCommand.cs
using MediatR;
using Domain.Entities;

namespace Application.Commands;

public record CreatePostCommand(
    string Title,
    string Content,
    Guid AuthorId
) : IRequest<PostDto>;

public class CreatePostCommandHandler : IRequestHandler<CreatePostCommand, PostDto>
{
    private readonly IPostRepository _postRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CreatePostCommandHandler(
        IPostRepository postRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _postRepository = postRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PostDto> Handle(CreatePostCommand request, CancellationToken cancellationToken)
    {
        var post = Post.Create(request.Title, request.Content, request.AuthorId);
        
        await _postRepository.AddAsync(post, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        
        return _mapper.Map<PostDto>(post);
    }
}
```

```csharp
// src/Application/Queries/GetPostsQuery.cs
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Queries;

public record GetPostsQuery(
    int Page = 1,
    int PageSize = 10,
    string? SearchTerm = null,
    PostStatus? Status = null
) : IRequest<PaginatedResult<PostDto>>;

public class GetPostsQueryHandler : IRequestHandler<GetPostsQuery, PaginatedResult<PostDto>>
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetPostsQueryHandler(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<PaginatedResult<PostDto>> Handle(GetPostsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Posts
            .Include(p => p.Author)
            .AsQueryable();

        // 过滤
        if (request.Status.HasValue)
        {
            query = query.Where(p => p.Status == request.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            query = query.Where(p => 
                p.Title.Contains(request.SearchTerm) || 
                p.Content.Contains(request.SearchTerm));
        }

        // 计数
        var totalCount = await query.CountAsync(cancellationToken);

        // 分页
        var posts = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return new PaginatedResult<PostDto>
        {
            Items = _mapper.Map<List<PostDto>>(posts),
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize)
        };
    }
}
```

### 控制器

```csharp
// src/Api/Controllers/PostsController.cs
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Application.Commands;
using Application.Queries;
using Application.DTOs;

namespace Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class PostsController : ControllerBase
{
    private readonly IMediator _mediator;

    public PostsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResult<PostDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPosts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] PostStatus? status = null)
    {
        var query = new GetPostsQuery(page, pageSize, searchTerm, status);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PostDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPost(Guid id)
    {
        var query = new GetPostQuery(id);
        var result = await _mediator.Send(query);
        
        if (result == null)
            return NotFound();
            
        return Ok(result);
    }

    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(PostDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePost([FromBody] CreatePostRequest request)
    {
        var userId = GetCurrentUserId();
        var command = new CreatePostCommand(request.Title, request.Content, userId);
        var result = await _mediator.Send(command);
        
        return CreatedAtAction(nameof(GetPost), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(PostDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdatePost(Guid id, [FromBody] UpdatePostRequest request)
    {
        var userId = GetCurrentUserId();
        var command = new UpdatePostCommand(id, request.Title, request.Content, userId);
        
        try
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (NotFoundException)
        {
            return NotFound();
        }
        catch (ForbiddenException)
        {
            return Forbid();
        }
    }

    [HttpPost("{id:guid}/publish")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> PublishPost(Guid id)
    {
        var command = new PublishPostCommand(id, GetCurrentUserId());
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePost(Guid id)
    {
        var command = new DeletePostCommand(id, GetCurrentUserId());
        await _mediator.Send(command);
        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        return Guid.Parse(userIdClaim!);
    }
}
```

### FluentValidation

```csharp
// src/Application/Validators/CreatePostValidator.cs
using FluentValidation;

namespace Application.Validators;

public class CreatePostValidator : AbstractValidator<CreatePostCommand>
{
    public CreatePostValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("标题不能为空")
            .MinimumLength(5).WithMessage("标题至少5个字符")
            .MaximumLength(200).WithMessage("标题最多200个字符");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("内容不能为空")
            .MinimumLength(10).WithMessage("内容至少10个字符");

        RuleFor(x => x.AuthorId)
            .NotEmpty().WithMessage("作者ID不能为空");
    }
}

// src/Application/Validators/UpdatePostValidator.cs
public class UpdatePostValidator : AbstractValidator<UpdatePostCommand>
{
    public UpdatePostValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("标题不能为空")
            .MinimumLength(5).WithMessage("标题至少5个字符")
            .MaximumLength(200).WithMessage("标题最多200个字符");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("内容不能为空");
    }
}
```

### 中间件

```csharp
// src/Api/Middleware/ExceptionMiddleware.cs
using System.Net;
using System.Text.Json;
using Domain.Exceptions;

namespace Api.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(
        RequestDelegate next,
        ILogger<ExceptionMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        _logger.LogError(exception, "发生未处理异常: {Message}", exception.Message);

        var response = context.Response;
        response.ContentType = "application/json";

        var errorResponse = new ErrorResponse();

        switch (exception)
        {
            case DomainException:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse.Message = exception.Message;
                break;

            case NotFoundException:
                response.StatusCode = (int)HttpStatusCode.NotFound;
                errorResponse.Message = exception.Message;
                break;

            case ForbiddenException:
                response.StatusCode = (int)HttpStatusCode.Forbidden;
                errorResponse.Message = exception.Message;
                break;

            case ValidationException validationEx:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse.Message = "验证失败";
                errorResponse.Errors = validationEx.Errors;
                break;

            default:
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                errorResponse.Message = _env.IsDevelopment() 
                    ? exception.Message 
                    : "服务器内部错误";
                break;
        }

        errorResponse.StatusCode = response.StatusCode;

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        await response.WriteAsync(JsonSerializer.Serialize(errorResponse, options));
    }
}

public class ErrorResponse
{
    public int StatusCode { get; set; }
    public string Message { get; set; } = null!;
    public IDictionary<string, string[]>? Errors { get; set; }
}
```

### 数据库配置

```csharp
// src/Infrastructure/Data/ApplicationDbContext.cs
using Microsoft.EntityFrameworkCore;
using Domain.Entities;

namespace Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Tag> Tags => Set<Tag>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        
        // 全局查询过滤器
        modelBuilder.Entity<Post>()
            .HasQueryFilter(p => !p.IsDeleted);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // 自动更新时间戳
        foreach (var entry in ChangeTracker.Entries<Entity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Property(nameof(Entity.CreatedAt)).CurrentValue = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Property(nameof(Entity.UpdatedAt)).CurrentValue = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}

// src/Infrastructure/Data/Configurations/PostConfiguration.cs
public class PostConfiguration : IEntityTypeConfiguration<Post>
{
    public void Configure(EntityTypeBuilder<Post> builder)
    {
        builder.ToTable("posts");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Slug)
            .IsRequired()
            .HasMaxLength(200);

        builder.HasIndex(p => p.Slug)
            .IsUnique();

        builder.Property(p => p.Content)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(p => p.Status)
            .HasConversion<string>()
            .HasDefaultValue(PostStatus.Draft);

        builder.HasOne(p => p.Author)
            .WithMany(u => u.Posts)
            .HasForeignKey(p => p.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        // 全文搜索索引 (PostgreSQL)
        builder.HasIndex(p => new { p.Title, p.Content })
            .HasMethod("gin")
            .HasOperators("tsvector_ops");
    }
}
```

### 仓储模式

```csharp
// src/Infrastructure/Repositories/IPostRepository.cs
using Domain.Entities;

namespace Infrastructure.Repositories;

public interface IPostRepository
{
    Task<Post?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Post?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<IEnumerable<Post>> GetPublishedAsync(int page, int pageSize, CancellationToken cancellationToken = default);
    Task AddAsync(Post post, CancellationToken cancellationToken = default);
    void Update(Post post);
    void Delete(Post post);
}

// src/Infrastructure/Repositories/PostRepository.cs
public class PostRepository : IPostRepository
{
    private readonly ApplicationDbContext _context;

    public PostRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Post?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Posts
            .Include(p => p.Author)
            .Include(p => p.Tags)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<Post?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        return await _context.Posts
            .Include(p => p.Author)
            .FirstOrDefaultAsync(p => p.Slug == slug, cancellationToken);
    }

    public async Task<IEnumerable<Post>> GetPublishedAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        return await _context.Posts
            .Include(p => p.Author)
            .Where(p => p.Status == PostStatus.Published)
            .OrderByDescending(p => p.PublishedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Post post, CancellationToken cancellationToken = default)
    {
        await _context.Posts.AddAsync(post, cancellationToken);
    }

    public void Update(Post post)
    {
        _context.Posts.Update(post);
    }

    public void Delete(Post post)
    {
        _context.Posts.Remove(post);
    }
}

// src/Infrastructure/Repositories/UnitOfWork.cs
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
}
```

### 测试

```csharp
// tests/Application.Tests/Commands/CreatePostCommandTests.cs
using Xunit;
using Moq;
using Application.Commands;
using Domain.Entities;

namespace Application.Tests.Commands;

public class CreatePostCommandTests
{
    private readonly Mock<IPostRepository> _postRepositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IMapper> _mapperMock;

    public CreatePostCommandTests()
    {
        _postRepositoryMock = new Mock<IPostRepository>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();
    }

    [Fact]
    public async Task Handle_ValidCommand_ReturnsPostDto()
    {
        // Arrange
        var command = new CreatePostCommand(
            "Test Title",
            "Test Content",
            Guid.NewGuid()
        );

        var handler = new CreatePostCommandHandler(
            _postRepositoryMock.Object,
            _unitOfWorkMock.Object,
            _mapperMock.Object
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        _postRepositoryMock.Verify(r => r.AddAsync(It.IsAny<Post>(), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
```

```csharp
// tests/Api.Tests/Controllers/PostsControllerTests.cs
using Xunit;
using Moq;
using MediatR;
using Api.Controllers;
using Application.Commands;
using Application.Queries;
using Microsoft.AspNetCore.Mvc;

namespace Api.Tests.Controllers;

public class PostsControllerTests
{
    private readonly Mock<IMediator> _mediatorMock;
    private readonly PostsController _controller;

    public PostsControllerTests()
    {
        _mediatorMock = new Mock<IMediator>();
        _controller = new PostsController(_mediatorMock.Object);
    }

    [Fact]
    public async Task GetPosts_ReturnsOkResult()
    {
        // Arrange
        var expectedResult = new PaginatedResult<PostDto>
        {
            Items = new List<PostDto>(),
            TotalCount = 0
        };

        _mediatorMock
            .Setup(m => m.Send(It.IsAny<GetPostsQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.GetPosts();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(expectedResult, okResult.Value);
    }
}
```

## 最佳实践

### 1. 依赖注入

```csharp
// src/Application/DependencyInjection.cs
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // MediatR
        services.AddMediatR(cfg => 
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

        // AutoMapper
        services.AddAutoMapper(typeof(DependencyInjection).Assembly);

        // Validators
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        // FluentValidation 行为
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        return services;
    }
}

// 验证行为
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any())
            return await next();

        var context = new ValidationContext<TRequest>(request);

        var failures = _validators
            .Select(v => v.Validate(context))
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Count != 0)
            throw new ValidationException(failures);

        return await next();
    }
}
```

### 2. 规格模式

```csharp
// src/Infrastructure/Specifications/ISpecification.cs
public interface ISpecification<T>
{
    Expression<Func<T, bool>> Criteria { get; }
    List<Expression<Func<T, object>>> Includes { get; }
    Expression<Func<T, object>>? OrderBy { get; }
    Expression<Func<T, object>>? OrderByDescending { get; }
    int? Skip { get; }
    int? Take { get; }
}

// 使用
public class PublishedPostsSpecification : ISpecification<Post>
{
    public Expression<Func<Post, bool>> Criteria => 
        p => p.Status == PostStatus.Published && p.PublishedAt <= DateTime.UtcNow;
    
    public List<Expression<Func<Post, object>>> Includes => 
        new() { p => p.Author, p => p.Tags };
    
    public Expression<Func<Post, object>>? OrderByDescending => 
        p => p.PublishedAt;
}
```

### 3. 后台任务

```csharp
// src/Infrastructure/BackgroundJobs/EmailJob.cs
using Hangfire;

public class EmailJob
{
    private readonly IEmailService _emailService;
    private readonly ILogger<EmailJob> _logger;

    public EmailJob(IEmailService emailService, ILogger<EmailJob> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    public async Task SendWelcomeEmail(Guid userId)
    {
        _logger.LogInformation("发送欢迎邮件给用户: {UserId}", userId);
        await _emailService.SendWelcomeEmailAsync(userId);
    }
}

// 注册
builder.Services.AddHangfire(config => config
    .UsePostgreSqlStorage(builder.Configuration.GetConnectionString("Hangfire")));

// 使用
BackgroundJob.Schedule<EmailJob>(x => x.SendWelcomeEmail(userId), TimeSpan.FromMinutes(5));
```

## 常用命令

### 开发

```bash
# 创建新项目
dotnet new webapi -n MyApi
dotnet new sln -n MyApi
dotnet sln add src/Api/Api.csproj

# 添加引用
dotnet add src/Api/Api.csproj reference src/Application/Application.csproj
dotnet add package MediatR
dotnet add package Microsoft.EntityFrameworkCore.Design

# 数据库迁移
dotnet ef migrations add InitialCreate --project src/Infrastructure --startup-project src/Api
dotnet ef database update
dotnet ef migrations remove

# 运行
dotnet run --project src/Api
dotnet watch --project src/Api

# 测试
dotnet test
dotnet test --filter "FullyQualifiedName~CreatePost"
```

### 构建

```bash
# 构建发布
dotnet build
dotnet publish -c Release -o ./publish

# Docker 构建
docker build -t myapi:latest .
docker run -p 5000:80 myapi:latest
```

## 部署配置

### Dockerfile

```dockerfile
# 构建阶段
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY src/Api/Api.csproj src/Api/
COPY src/Application/Application.csproj src/Application/
COPY src/Domain/Domain.csproj src/Domain/
COPY src/Infrastructure/Infrastructure.csproj src/Infrastructure/

RUN dotnet restore src/Api/Api.csproj

COPY . .

WORKDIR /src/src/Api
RUN dotnet publish -c Release -o /app/publish --no-restore

# 运行阶段
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

RUN adduser --disabled-password --gecos '' appuser

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

USER appuser
EXPOSE 5000

ENTRYPOINT ["dotnet", "Api.dll"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Host=db;Database=aspnetcore;Username=postgres;Password=password
      - Jwt__SecretKey=your-secret-key-at-least-32-characters
      - Redis__ConnectionString=redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: aspnetcore
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### appsettings.Production.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "Serilog": {
    "WriteTo": [
      { "Name": "Console" },
      {
        "Name": "Seq",
        "Args": { "serverUrl": "http://seq:5341" }
      }
    ]
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=db;Database=aspnetcore;Username=postgres;Password=password"
  },
  "Jwt": {
    "Issuer": "myapi",
    "Audience": "myapi-clients",
    "SecretKey": "${JWT_SECRET_KEY}",
    "ExpirationMinutes": 60
  },
  "Redis": {
    "ConnectionString": "redis:6379"
  },
  "AllowedOrigins": "https://example.com"
}
```

### Kubernetes 部署

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aspnetcore-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: aspnetcore-api
  template:
    metadata:
      labels:
        app: aspnetcore-api
    spec:
      containers:
      - name: api
        image: myregistry/aspnetcore-api:latest
        ports:
        - containerPort: 5000
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        - name: ConnectionStrings__DefaultConnection
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: connection-string
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: aspnetcore-api
spec:
  selector:
    app: aspnetcore-api
  ports:
  - port: 80
    targetPort: 5000
  type: LoadBalancer
```
