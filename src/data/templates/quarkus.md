# Quarkus 云原生 Java 框架模板

## 技术栈

- **Quarkus**: 3.x
- **Java**: 17+
- **Maven/Gradle**: 构建工具
- **Hibernate ORM**: JPA 实现
- **Panache**: 简化数据访问
- **RESTEasy Reactive**: REST API
- **SmallRye**: MicroProfile 实现
- **GraalVM**: 原生编译
- **JUnit 5**: 测试框架

## 项目结构

```
quarkus-project/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           ├── Main.java
│   │   │           ├── config/
│   │   │           │   ├── CorsConfig.java
│   │   │           │   └── SecurityConfig.java
│   │   │           ├── controller/
│   │   │           │   ├── UserController.java
│   │   │           │   ├── PostController.java
│   │   │           │   └── HealthController.java
│   │   │           ├── service/
│   │   │           │   ├── UserService.java
│   │   │           │   ├── PostService.java
│   │   │           │   └── EmailService.java
│   │   │           ├── repository/
│   │   │           │   ├── UserRepository.java
│   │   │           │   └── PostRepository.java
│   │   │           ├── entity/
│   │   │           │   ├── User.java
│   │   │           │   ├── Post.java
│   │   │           │   └── BaseEntity.java
│   │   │           ├── dto/
│   │   │           │   ├── UserDTO.java
│   │   │           │   ├── PostDTO.java
│   │   │           │   ├── ApiResponse.java
│   │   │           │   └── PageResponse.java
│   │   │           ├── mapper/
│   │   │           │   ├── UserMapper.java
│   │   │           │   └── PostMapper.java
│   │   │           ├── exception/
│   │   │           │   ├── GlobalExceptionHandler.java
│   │   │           │   ├── ResourceNotFoundException.java
│   │   │           │   └── BusinessException.java
│   │   │           ├── security/
│   │   │           │   ├── JwtAuthenticator.java
│   │   │           │   └── RolesAllowed.java
│   │   │           ├── client/
│   │   │           │   └── ExternalApiClient.java
│   │   │           ├── scheduler/
│   │   │           │   └── ScheduledTasks.java
│   │   │           └── util/
│   │   │               ├── Constants.java
│   │   │               └── Helpers.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── application-dev.properties
│   │       ├── application-prod.properties
│   │       ├── application-test.properties
│   │       ├── import.sql
│   │       └── META-INF/
│   │           └── resources/
│   │               └── index.html
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   ├── controller/
│                   │   ├── UserControllerTest.java
│                   │   └── PostControllerTest.java
│                   ├── service/
│                   │   ├── UserServiceTest.java
│                   │   └── PostServiceTest.java
│                   └── integration/
│                       └── UserIntegrationTest.java
├── docker/
│   ├── Dockerfile.jvm
│   ├── Dockerfile.native
│   └── Dockerfile.native-micro
├── .mvn/
│   └── wrapper/
├── pom.xml
├── build.gradle (如果使用 Gradle)
├── settings.gradle
└── README.md
```

## 代码模式

### 应用入口

```java
// src/main/java/com/example/Main.java
package com.example;

import io.quarkus.runtime.Quarkus;
import io.quarkus.runtime.annotations.QuarkusMain;

@QuarkusMain
public class Main {
    public static void main(String... args) {
        Quarkus.run(args);
    }
}
```

### 实体类

```java
// src/main/java/com/example/entity/BaseEntity.java
package com.example.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@MappedSuperclass
public abstract class BaseEntity extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    public LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;
    
    @Version
    public Long version;
}

// src/main/java/com/example/entity/User.java
package com.example.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
public class User extends BaseEntity {
    
    @NotBlank
    @Column(unique = true, nullable = false)
    public String username;
    
    @Email
    @NotBlank
    @Column(unique = true, nullable = false)
    public String email;
    
    @NotBlank
    public String password;
    
    @Enumerated(EnumType.STRING)
    public UserRole role = UserRole.USER;
    
    public boolean active = true;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<Post> posts = new ArrayList<>();
    
    public enum UserRole {
        ADMIN, USER
    }
    
    // Panache 实体方法
    public static User findByUsername(String username) {
        return find("username", username).firstResult();
    }
    
    public static User findByEmail(String email) {
        return find("email", email).firstResult();
    }
    
    public static long countActiveUsers() {
        return count("active", true);
    }
}

// src/main/java/com/example/entity/Post.java
package com.example.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "posts")
public class Post extends BaseEntity {
    
    @NotBlank
    @Size(max = 200)
    public String title;
    
    @NotBlank
    @Column(columnDefinition = "TEXT")
    public String content;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    public User user;
    
    public boolean published = false;
    
    public int viewCount = 0;
    
    // Panache 查询方法
    public static List<Post> findPublished(int page, int size) {
        return find("published", true)
                .page(page, size)
                .list();
    }
    
    public static long countPublished() {
        return count("published", true);
    }
}
```

### Repository 层

```java
// src/main/java/com/example/repository/UserRepository.java
package com.example.repository;

import com.example.entity.User;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

@ApplicationScoped
public class UserRepository implements PanacheRepository<User> {
    
    public Optional<User> findByUsername(String username) {
        return find("username", username).firstResultOptional();
    }
    
    public Optional<User> findByEmail(String email) {
        return find("email", email).firstResultOptional();
    }
    
    public long countActiveUsers() {
        return count("active = ?1", true);
    }
    
    public void deactivateUser(Long id) {
        update("active = false where id = ?1", id);
    }
}

// src/main/java/com/example/repository/PostRepository.java
package com.example.repository;

import com.example.entity.Post;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class PostRepository implements PanacheRepository<Post> {
    
    public List<Post> findPublished(Page page) {
        return find("published", true)
                .page(page)
                .list();
    }
    
    public List<Post> findByUserId(Long userId, Page page) {
        return find("user.id", userId)
                .page(page)
                .list();
    }
    
    public long countByUserId(Long userId) {
        return count("user.id", userId);
    }
    
    public void incrementViewCount(Long id) {
        update("viewCount = viewCount + 1 where id = ?1", id);
    }
}
```

### Service 层

```java
// src/main/java/com/example/service/UserService.java
package com.example.service;

import com.example.dto.UserDTO;
import com.example.entity.User;
import com.example.exception.BusinessException;
import com.example.exception.ResourceNotFoundException;
import com.example.mapper.UserMapper;
import com.example.repository.UserRepository;
import io.quarkus.panache.common.Page;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class UserService {
    
    @Inject
    UserRepository userRepository;
    
    @Inject
    UserMapper userMapper;
    
    @ConfigProperty(name = "app.pagination.default-page-size")
    int defaultPageSize;
    
    public List<UserDTO> findAll(int page, int size) {
        return userRepository.findAll()
                .page(Page.of(page, size))
                .stream()
                .map(userMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    public UserDTO findById(Long id) {
        User user = userRepository.findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return userMapper.toDTO(user);
    }
    
    @Transactional
    public UserDTO create(@Valid UserDTO userDTO) {
        // 检查用户名和邮箱是否已存在
        if (userRepository.findByUsername(userDTO.username).isPresent()) {
            throw new BusinessException("Username already exists");
        }
        
        if (userRepository.findByEmail(userDTO.email).isPresent()) {
            throw new BusinessException("Email already exists");
        }
        
        User user = userMapper.toEntity(userDTO);
        user.password = hashPassword(userDTO.password);
        userRepository.persist(user);
        
        return userMapper.toDTO(user);
    }
    
    @Transactional
    public UserDTO update(Long id, @Valid UserDTO userDTO) {
        User user = userRepository.findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        userMapper.updateEntity(user, userDTO);
        userRepository.persist(user);
        
        return userMapper.toDTO(user);
    }
    
    @Transactional
    public void delete(Long id) {
        User user = userRepository.findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        userRepository.delete(user);
    }
    
    // 异步版本（使用 Mutiny）
    public Uni<UserDTO> findByIdAsync(Long id) {
        return Uni.createFrom().item(() -> findById(id));
    }
    
    private String hashPassword(String password) {
        // 使用 BCrypt 或其他哈希算法
        return BCrypt.hashpw(password, BCrypt.gensalt());
    }
}
```

### Controller 层

```java
// src/main/java/com/example/controller/UserController.java
package com.example.controller;

import com.example.dto.ApiResponse;
import com.example.dto.PageResponse;
import com.example.dto.UserDTO;
import com.example.service.UserService;
import io.quarkus.panache.common.Page;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.net.URI;
import java.util.List;

@Path("/api/v1/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "User", description = "User management operations")
public class UserController {
    
    @Inject
    UserService userService;
    
    @GET
    @Operation(summary = "Get all users", description = "Returns a paginated list of users")
    public Response findAll(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {
        
        List<UserDTO> users = userService.findAll(page, size);
        long total = userService.count();
        
        PageResponse<UserDTO> response = new PageResponse<>(
                users,
                page,
                size,
                total,
                (int) Math.ceil((double) total / size)
        );
        
        return Response.ok(response).build();
    }
    
    @GET
    @Path("/{id}")
    @Operation(summary = "Get user by ID", description = "Returns a single user by ID")
    public Response findById(@PathParam("id") Long id) {
        UserDTO user = userService.findById(id);
        return Response.ok(ApiResponse.success(user)).build();
    }
    
    @POST
    @Operation(summary = "Create user", description = "Creates a new user")
    public Response create(@Valid UserDTO userDTO) {
        UserDTO created = userService.create(userDTO);
        return Response
                .created(URI.create("/api/v1/users/" + created.id))
                .entity(ApiResponse.success(created, "User created successfully"))
                .build();
    }
    
    @PUT
    @Path("/{id}")
    @Operation(summary = "Update user", description = "Updates an existing user")
    public Response update(@PathParam("id") Long id, @Valid UserDTO userDTO) {
        UserDTO updated = userService.update(id, userDTO);
        return Response.ok(ApiResponse.success(updated, "User updated successfully")).build();
    }
    
    @DELETE
    @Path("/{id}")
    @Operation(summary = "Delete user", description = "Deletes a user by ID")
    public Response delete(@PathParam("id") Long id) {
        userService.delete(id);
        return Response.noContent().build();
    }
    
    // 异步版本
    @GET
    @Path("/{id}/async")
    public Uni<Response> findByIdAsync(@PathParam("id") Long id) {
        return userService.findByIdAsync(id)
                .map(user -> Response.ok(ApiResponse.success(user)).build());
    }
}
```

### DTO 和 Mapper

```java
// src/main/java/com/example/dto/ApiResponse.java
package com.example.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    public boolean success;
    public String message;
    public T data;
    public Long timestamp;
    
    public ApiResponse(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.timestamp = System.currentTimeMillis();
    }
    
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, null, data);
    }
    
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, message, data);
    }
    
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}

// src/main/java/com/example/dto/PageResponse.java
package com.example.dto;

import java.util.List;

public class PageResponse<T> {
    public List<T> content;
    public int pageNumber;
    public int pageSize;
    public long totalElements;
    public int totalPages;
    
    public PageResponse(List<T> content, int pageNumber, int pageSize, long totalElements, int totalPages) {
        this.content = content;
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }
}

// src/main/java/com/example/mapper/UserMapper.java
package com.example.mapper;

import com.example.dto.UserDTO;
import com.example.entity.User;
import jakarta.enterprise.context.ApplicationScoped;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "cdi")
public interface UserMapper {
    
    @Mapping(target = "password", ignore = true)
    UserDTO toDTO(User user);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "posts", ignore = true)
    User toEntity(UserDTO dto);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "posts", ignore = true)
    void updateEntity(@MappingTarget User entity, UserDTO dto);
}
```

### 异常处理

```java
// src/main/java/com/example/exception/ResourceNotFoundException.java
package com.example.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}

// src/main/java/com/example/exception/BusinessException.java
package com.example.exception;

public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}

// src/main/java/com/example/exception/GlobalExceptionHandler.java
package com.example.exception;

import com.example.dto.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

import java.util.stream.Collectors;

@Provider
public class GlobalExceptionHandler implements ExceptionMapper<Exception> {
    
    private static final Logger LOG = Logger.getLogger(GlobalExceptionHandler.class);
    
    @Override
    public Response toResponse(Exception exception) {
        LOG.error("Exception occurred", exception);
        
        if (exception instanceof ResourceNotFoundException) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(ApiResponse.error(exception.getMessage()))
                    .build();
        }
        
        if (exception instanceof BusinessException) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(ApiResponse.error(exception.getMessage()))
                    .build();
        }
        
        if (exception instanceof ConstraintViolationException) {
            String message = ((ConstraintViolationException) exception)
                    .getConstraintViolations()
                    .stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .collect(Collectors.joining(", "));
            
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(ApiResponse.error("Validation failed: " + message))
                    .build();
        }
        
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(ApiResponse.error("An unexpected error occurred"))
                .build();
    }
}
```

### 配置文件

```properties
# src/main/resources/application.properties
# 应用配置
quarkus.application.name=my-quarkus-app
quarkus.application.version=1.0.0

# HTTP 配置
quarkus.http.port=8080
quarkus.http.root-path=/
quarkus.http.cors=true
quarkus.http.cors.origins=http://localhost:3000

# 数据源配置
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=postgres
quarkus.datasource.password=postgres
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/mydb
quarkus.datasource.jdbc.max-size=20
quarkus.datasource.jdbc.min-size=5

# Hibernate 配置
quarkus.hibernate-orm.database.generation=update
quarkus.hibernate-orm.log.sql=true
quarkus.hibernate-orm.statistics=true

# JWT 配置
mp.jwt.verify.publickey.location=publicKey.pem
mp.jwt.verify.issuer=https://example.com
quarkus.native.resources.includes=publicKey.pem

# OpenAPI 配置
quarkus.swagger-ui.always-include=true
quarkus.swagger-ui.path=/swagger-ui
mp.openapi.extensions.smallrye.info.title=My Quarkus API
mp.openapi.extensions.smallrye.info.version=1.0.0
mp.openapi.extensions.smallrye.info.description=Quarkus REST API

# 健康检查
quarkus.smallrye-health.root-path=/health
quarkus.smallrye-health.liveness-path=/health/live
quarkus.smallrye-health.readiness-path=/health/ready

# 分页配置
app.pagination.default-page-size=20
app.pagination.max-page-size=100

# 日志配置
quarkus.log.level=INFO
quarkus.log.console.enable=true
quarkus.log.console.level=DEBUG
quarkus.log.file.enable=true
quarkus.log.file.path=logs/application.log
quarkus.log.file.level=INFO
```

## 最佳实践

### 1. 响应式编程

```java
// 使用 Mutiny 进行响应式编程
@Path("/reactive")
public class ReactiveController {
    
    @Inject
    UserService userService;
    
    @GET
    @Path("/{id}")
    public Uni<UserDTO> getUser(@PathParam("id") Long id) {
        return Uni.createFrom().item(() -> userService.findById(id));
    }
    
    @GET
    public Multi<UserDTO> getAllUsers() {
        return Multi.createFrom().items(userService.findAll(0, 100).stream());
    }
    
    // 链式异步操作
    @POST
    public Uni<Response> createUser(UserDTO userDTO) {
        return Uni.createFrom().item(() -> userService.create(userDTO))
                .map(user -> Response.created(URI.create("/users/" + user.id)).build())
                .onFailure().recoverWithItem(error -> Response.serverError().build());
    }
}
```

### 2. 依赖注入

```java
// 使用 CDI 注解
@ApplicationScoped  // 单例，应用生命周期
public class UserService { }

@RequestScoped  // 每个请求一个实例
public class RequestService { }

@Dependent  // 依赖注入的默认作用域
public class HelperService { }

@Singleton  // EJB 单例
public class CacheService { }

// 使用 @Inject 注入
@Inject
UserService userService;

// 使用构造函数注入
public class UserController {
    private final UserService userService;
    
    @Inject
    public UserController(UserService userService) {
        this.userService = userService;
    }
}
```

### 3. 配置注入

```java
// 使用 @ConfigProperty 注入配置
@ApplicationScoped
public class ConfigService {
    
    @ConfigProperty(name = "app.name")
    String appName;
    
    @ConfigProperty(name = "app.timeout", defaultValue = "30")
    int timeout;
    
    @ConfigProperty(name = "app.features")
    List<String> features;
    
    @ConfigProperty(name = "app.enabled")
    Optional<Boolean> enabled;
}

// 使用配置类
@ConfigMapping(prefix = "app")
public interface AppConfig {
    String name();
    int timeout();
    List<String> features();
    Optional<Boolean> enabled();
}
```

### 4. 缓存

```java
// 使用 Quarkus Cache
@ApplicationScoped
public class UserService {
    
    @CacheResult(cacheName = "users")
    public UserDTO findById(Long id) {
        // 查询数据库
        return userMapper.toDTO(userRepository.findById(id));
    }
    
    @CacheInvalidate(cacheName = "users")
    public void update(Long id, UserDTO userDTO) {
        // 更新用户，缓存自动失效
    }
    
    @CacheInvalidateAll(cacheName = "users")
    public void clearCache() {
        // 清除所有缓存
    }
}
```

### 5. 定时任务

```java
@ApplicationScoped
public class ScheduledTasks {
    
    private static final Logger LOG = Logger.getLogger(ScheduledTasks.class);
    
    // 每 5 分钟执行
    @Scheduled(every = "5m")
    public void cleanupExpiredSessions() {
        LOG.info("Cleaning up expired sessions");
        // 清理逻辑
    }
    
    // 每天凌晨 2 点执行
    @Scheduled(cron = "0 0 2 * * ?")
    public void dailyBackup() {
        LOG.info("Starting daily backup");
        // 备份逻辑
    }
    
    // 使用配置的定时表达式
    @Scheduled(cron = "{app.backup.schedule}")
    public void configurableTask() {
        // 可配置的定时任务
    }
}
```

### 6. 事件驱动

```java
// 定义事件
public class UserCreatedEvent {
    public final User user;
    
    public UserCreatedEvent(User user) {
        this.user = user;
    }
}

// 发送事件
@Inject
Event<UserCreatedEvent> userCreatedEvent;

public void createUser(UserDTO userDTO) {
    User user = userService.create(userDTO);
    userCreatedEvent.fire(new UserCreatedEvent(user));
}

// 监听事件
public class UserEventListener {
    
    @Inject
    EmailService emailService;
    
    void onUserCreated(@Observes UserCreatedEvent event) {
        emailService.sendWelcomeEmail(event.user);
    }
    
    // 异步监听
    void onUserCreatedAsync(@ObservesAsync UserCreatedEvent event) {
        // 异步处理
    }
}
```

### 7. 健康检查

```java
@ApplicationScoped
public class DatabaseHealthCheck implements HealthCheck {
    
    @Inject
    DataSource dataSource;
    
    @Override
    public HealthCheckResponse call() {
        try (Connection connection = dataSource.getConnection()) {
            boolean healthy = connection.isValid(5);
            return HealthCheckResponse.named("Database connection")
                    .status(healthy)
                    .withData("database", "PostgreSQL")
                    .build();
        } catch (SQLException e) {
            return HealthCheckResponse.named("Database connection")
                    .down()
                    .withData("error", e.getMessage())
                    .build();
        }
    }
}

// 自定义指标
@ApplicationScoped
public class MetricsService {
    
    @Inject
    MeterRegistry registry;
    
    public void recordRequest(String endpoint) {
        registry.counter("api.requests", "endpoint", endpoint).increment();
    }
    
    public void recordDuration(String operation, long duration) {
        registry.timer("operation.duration", "name", operation)
                .record(duration, TimeUnit.MILLISECONDS);
    }
}
```

### 8. REST Client

```java
// 定义 REST Client
@RegisterRestClient(configKey = "external-api")
public interface ExternalApiClient {
    
    @GET
    @Path("/users/{id}")
    Uni<UserDTO> getUser(@PathParam("id") Long id);
    
    @POST
    @Path("/users")
    Uni<UserDTO> createUser(@Valid UserDTO userDTO);
    
    @GET
    @Path("/users")
    Uni<List<UserDTO>> getUsers(@QueryParam("page") int page);
}

// 配置
external-api/mp-rest/url=https://api.example.com
external-api/mp-rest/connectTimeout=5000
external-api/mp-rest/readTimeout=10000

// 使用
@Inject
@RestClient
ExternalApiClient externalApiClient;

public Uni<UserDTO> getUserFromExternalApi(Long id) {
    return externalApiClient.getUser(id);
}
```

### 9. 测试

```java
@QuarkusTest
public class UserControllerTest {
    
    @Test
    public void testGetAllUsers() {
        given()
            .when().get("/api/v1/users")
            .then()
                .statusCode(200)
                .body("success", is(true))
                .body("data.content.size()", greaterThan(0));
    }
    
    @Test
    public void testCreateUser() {
        UserDTO userDTO = new UserDTO();
        userDTO.username = "testuser";
        userDTO.email = "test@example.com";
        userDTO.password = "password123";
        
        given()
            .contentType(ContentType.JSON)
            .body(userDTO)
            .when().post("/api/v1/users")
            .then()
                .statusCode(201)
                .body("success", is(true))
                .body("data.username", is("testuser"));
    }
    
    @Test
    public void testGetUserById() {
        given()
            .pathParam("id", 1)
            .when().get("/api/v1/users/{id}")
            .then()
                .statusCode(200)
                .body("success", is(true))
                .body("data.id", is(1));
    }
    
    @Test
    @TestTransaction
    public void testWithTransaction() {
        // 测试事务行为
        User user = new User();
        user.username = "test";
        user.persist();
        
        assertNotNull(user.id);
    }
}
```

## 常用命令

### 开发命令

```bash
# 开发模式（热重载）
./mvnw quarkus:dev

# 指定端口
./mvnw quarkus:dev -Dquarkus.http.port=8081

# 启用调试
./mvnw quarkus:dev -Ddebug=5005

# 远程开发模式
./mvnw quarkus:remote-dev -Dquarkus.live-reload.password=secret
```

### 构建命令

```bash
# JVM 模式构建
./mvnw clean package

# 跳过测试
./mvnw clean package -DskipTests

# 原生镜像构建
./mvnw clean package -Pnative

# 原生镜像（容器）
./mvnw clean package -Pnative -Dquarkus.native.container-build=true

# 生成原生可执行文件
./mvnw clean package -Pnative -Dquarkus.native.container-build=true \
  -Dquarkus.native.builder-image=quay.io/quarkus/ubi-quarkus-native-image:22.3-java17
```

### 测试命令

```bash
# 运行所有测试
./mvnw test

# 运行单个测试类
./mvnw test -Dtest=UserControllerTest

# 运行单个测试方法
./mvnw test -Dtest=UserControllerTest#testGetAllUsers

# 运行集成测试
./mvnw verify -Pnative
```

### Docker 命令

```bash
# 构建 Docker 镜像（JVM）
./mvnw clean package -Dquarkus.container-image.build=true

# 构建原生 Docker 镜像
./mvnw clean package -Pnative -Dquarkus.container-image.build=true

# 推送镜像
./mvnw clean package -Dquarkus.container-image.push=true

# 指定镜像名称
./mvnw clean package -Dquarkus.container-image.name=myorg/myapp:1.0
```

### 其他命令

```bash
# 查看依赖树
./mvnw dependency:tree

# 更新依赖
./mvnw versions:display-dependency-updates

# 格式化代码
./mvnw spotless:apply

# 检查代码风格
./mvnw checkstyle:check

# 生成 OpenAPI 文档
./mvnw quarkus:generate-openapi-doc
```

## 部署配置

### Docker 配置

```dockerfile
# docker/Dockerfile.jvm
FROM registry.access.redhat.com/ubi8/openjdk-17:1.14

ENV LANGUAGE='en_US:en'

COPY target/quarkus-app/lib/ /deployments/lib/
COPY target/quarkus-app/*.jar /deployments/
COPY target/quarkus-app/app/ /deployments/app/
COPY target/quarkus-app/quarkus/ /deployments/quarkus/

EXPOSE 8080
USER 185
ENV JAVA_OPTS="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"
ENV JAVA_APP_JAR="/deployments/quarkus-run.jar"

ENTRYPOINT [ "/opt/jboss/container/java/run/run-java.sh" ]
```

```dockerfile
# docker/Dockerfile.native
FROM quay.io/quarkus/quarkus-micro-image:2.0

WORKDIR /work/
COPY target/*-runner /work/application

RUN chmod 775 /work
EXPOSE 8080

CMD ["./application", "-Dquarkus.http.host=0.0.0.0"]
```

### Kubernetes 部署

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: quarkus-app
  labels:
    app: quarkus-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: quarkus-app
  template:
    metadata:
      labels:
        app: quarkus-app
    spec:
      containers:
      - name: quarkus-app
        image: myorg/quarkus-app:1.0
        ports:
        - containerPort: 8080
        env:
        - name: QUARKUS_DATASOURCE_JDBC_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: QUARKUS_DATASOURCE_USERNAME
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: username
        - name: QUARKUS_DATASOURCE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: quarkus-app-service
spec:
  selector:
    app: quarkus-app
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
```

### OpenShift 部署

```yaml
# openshift/deployment.yaml
apiVersion: apps.openshift.io/v1
kind: DeploymentConfig
metadata:
  name: quarkus-app
spec:
  replicas: 3
  selector:
    app: quarkus-app
  template:
    metadata:
      labels:
        app: quarkus-app
    spec:
      containers:
      - name: quarkus-app
        image: myorg/quarkus-app:1.0
        ports:
        - containerPort: 8080
        env:
        - name: QUARKUS_PROFILE
          value: prod
  triggers:
  - type: ConfigChange
  - imageChangeParams:
      automatic: true
      containerNames:
      - quarkus-app
      from:
        kind: ImageStreamTag
        name: quarkus-app:latest
    type: ImageChange
```

### CI/CD 配置

```yaml
# .github/workflows/ci.yml
name: Quarkus CI/CD

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
          cache: maven
      
      - name: Build with Maven
        run: ./mvnw clean package
        
      - name: Run tests
        run: ./mvnw test
        
      - name: Build Docker image
        run: ./mvnw package -Dquarkus.container-image.build=true
        env:
          QUARKUS_CONTAINER_IMAGE_USERNAME: ${{ secrets.DOCKER_USERNAME }}
          QUARKUS_CONTAINER_IMAGE_PASSWORD: ${{ secrets.DOCKER_PASSWORD }}
  
  native-build:
    runs-on: ubuntu-latest
    needs: build
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up GraalVM
        uses: graalvm/setup-graalvm@v1
        with:
          java-version: '17'
          distribution: 'graalvm'
          components: 'native-image'
      
      - name: Build native image
        run: ./mvnw package -Pnative
        
      - name: Build native Docker image
        run: ./mvnw package -Pnative -Dquarkus.container-image.build=true
```

### 监控和日志

```java
// 自定义指标
@ApplicationScoped
public class CustomMetrics {
    
    @Inject
    MeterRegistry registry;
    
    @PostConstruct
    void init() {
        // 注册自定义指标
        registry.gauge("jvm.memory.used", 
            Tags.of("area", "heap"), 
            Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory());
    }
    
    public void recordBusinessMetric(String operation, long duration) {
        registry.timer("business.operation", "name", operation)
                .record(duration, TimeUnit.MILLISECONDS);
    }
}
```

```properties
# OpenTelemetry 配置
quarkus.application.name=my-quarkus-app
quarkus.opentelemetry.enabled=true
quarkus.opentelemetry.tracer.exporter.otlp.endpoint=http://localhost:4317
quarkus.opentelemetry.tracer.sampler=on
quarkus.opentelemetry.tracer.sampler.ratio=1.0

# 日志配置
quarkus.log.console.json=true
quarkus.log.console.json.format=true
quarkus.log.file.json=true
```

### 安全配置

```java
// JWT 认证
@ApplicationScoped
public class JwtAuthenticator {
    
    @Inject
    JsonWebToken jwt;
    
    @Inject
    TokenService tokenService;
    
    public String generateToken(User user) {
        return Jwt.issuer("https://example.com")
                .upn(user.email)
                .groups(Set.of(user.role.name()))
                .claim("userId", user.id)
                .expiresAt(System.currentTimeMillis() + 3600000) // 1小时
                .sign();
    }
    
    public boolean validateToken(String token) {
        try {
            Jwt.verify(token, tokenService.getPublicKey());
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

// 角色控制
@Path("/api/v1/admin")
@RolesAllowed("ADMIN")
public class AdminController {
    
    @GET
    public Response adminOnly() {
        return Response.ok("Admin access").build();
    }
}
```

### 性能优化

```properties
# 数据库连接池优化
quarkus.datasource.jdbc.max-size=20
quarkus.datasource.jdbc.min-size=5
quarkus.datasource.jdbc.acquisition-timeout=10s
quarkus.datasource.jdbc.idle-removal-interval=300

# Hibernate 二级缓存
quarkus.hibernate-orm.second-level-caching-enabled=true
quarkus.hibernate-orm.cache."user".expiration.max-idle=PT10M
quarkus.hibernate-orm.cache."post".expiration.max-idle=PT5M

# 响应式优化
quarkus.vertx.event-loops-pool-size=10
quarkus.vertx.max-event-loop-execute-time=2000

# 原生镜像优化
quarkus.native.enable-http-url-handler=true
quarkus.native.resources.includes=publicKey.pem,application.properties
quarkus.native.additional-build-args=--allow-incomplete-classpath
```
