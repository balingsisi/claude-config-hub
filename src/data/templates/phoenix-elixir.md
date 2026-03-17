# Phoenix (Elixir) 全栈开发模板

## 技术栈

- **Phoenix 1.7+**: Elixir Web 框架
- **Elixir 1.16+**: 函数式编程语言
- **Ecto**: 数据库 ORM
- **PostgreSQL**: 关系型数据库
- **Phoenix LiveView**: 实时交互界面
- **Phoenix PubSub**: 实时消息
- **Oban**: 后台任务队列
- **Guardian**: JWT 认证
- **Absinthe**: GraphQL API

## 项目结构

```
phoenix_app/
├── config/
│   ├── config.exs
│   ├── dev.exs
│   ├── prod.exs
│   ├── runtime.exs
│   └── test.exs
├── lib/
│   ├── phoenix_app/
│   │   ├── application.ex
│   │   ├── repo.ex
│   │   ├── accounts/
│   │   │   ├── accounts.ex
│   │   │   ├── user.ex
│   │   │   └── session.ex
│   │   ├── blog/
│   │   │   ├── blog.ex
│   │   │   ├── post.ex
│   │   │   └── comment.ex
│   │   ├── notifications/
│   │   │   └── notification_service.ex
│   │   └── workers/
│   │       └── email_worker.ex
│   └── phoenix_app_web/
│       ├── endpoint.ex
│       ├── router.ex
│       ├── controllers/
│       │   ├── page_controller.ex
│       │   ├── api/
│       │   │   └── post_controller.ex
│       │   └── user_session_controller.ex
│       ├── live/
│       │   ├── post_live/
│       │   │   ├── index.ex
│       │   │   ├── show.ex
│       │   │   └── form_component.ex
│       │   └── components/
│       │       ├── core_components.ex
│       │       └── layout.ex
│       ├── views/
│       │   ├── error_helpers.ex
│       │   └── api_view.ex
│       ├── channels/
│       │   └── room_channel.ex
│       └── plugs/
│           └── auth_plug.ex
├── priv/
│   ├── repo/
│   │   ├── migrations/
│   │   └── seeds.exs
│   └── static/
├── test/
│   ├── phoenix_app/
│   │   └── blog_test.exs
│   ├── phoenix_app_web/
│   │   └── controllers/
│   └── test_helper.exs
├── assets/
│   ├── css/
│   │   └── app.css
│   └── js/
│       └── app.js
├── mix.exs
└── Dockerfile
```

## 代码模式

### 应用入口

```elixir
# lib/phoenix_app/application.ex
defmodule PhoenixApp.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      PhoenixApp.Repo,
      {Phoenix.PubSub, name: PhoenixApp.PubSub},
      {Oban, oban_config()},
      PhoenixAppWeb.Endpoint,
      {Phoenix.LiveView.Socket, []}
    ]

    opts = [strategy: :one_for_one, name: PhoenixApp.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    PhoenixAppWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  defp oban_config do
    Application.fetch_env!(:phoenix_app, Oban)
  end
end
```

### 路由配置

```elixir
# lib/phoenix_app_web/router.ex
defmodule PhoenixAppWeb.Router do
  use PhoenixAppWeb, :router

  import PhoenixAppWeb.UserAuth

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {PhoenixAppWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug :fetch_current_user
  end

  pipeline :api do
    plug :accepts, ["json"]
    plug :fetch_api_user
  end

  # 公开路由
  scope "/", PhoenixAppWeb do
    pipe_through :browser

    get "/", PageController, :home
    live "/posts", PostLive.Index, :index
    live "/posts/:id", PostLive.Show, :show
  end

  # 认证路由
  scope "/", PhoenixAppWeb do
    pipe_through [:browser, :require_authenticated_user]

    live "/posts/new", PostLive.Index, :new
    live "/posts/:id/edit", PostLive.Index, :edit

    live_session :settings do
      live "/settings", UserSettingsLive
    end
  end

  # API 路由
  scope "/api", PhoenixAppWeb.Api do
    pipe_through :api

    post "/login", SessionController, :create
    post "/register", RegistrationController, :create

    # 需要 JWT 认证
    scope "/v1" do
      pipe_through :require_api_auth

      resources "/posts", PostController, except: [:new, :edit]
      resources "/users", UserController, only: [:show, :update]
    end
  end

  # GraphQL
  scope "/api" do
    pipe_through :api

    forward "/graphql", Absinthe.Plug, schema: PhoenixAppWeb.Schema

    if Mix.env() == :dev do
      forward "/graphiql", Absinthe.Plug.GraphiQL, schema: PhoenixAppWeb.Schema
    end
  end
end
```

### 数据库 Schema

```elixir
# lib/phoenix_app/accounts/user.ex
defmodule PhoenixApp.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :email, :string
    field :password, :string, virtual: true, redact: true
    field :hashed_password, :string, redact: true
    field :name, :string
    field :role, Ecto.Enum, values: [:user, :moderator, :admin], default: :user
    field :confirmed_at, :utc_datetime

    has_many :posts, PhoenixApp.Blog.Post
    has_many :comments, PhoenixApp.Blog.Comment

    timestamps(type: :utc_datetime)
  end

  @doc false
  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :password, :name])
    |> validate_email()
    |> validate_password()
  end

  defp validate_email(changeset) do
    changeset
    |> validate_required([:email])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "邮箱格式不正确")
    |> validate_length(:email, max: 160)
    |> unsafe_validate_unique(:email, PhoenixApp.Repo)
    |> unique_constraint(:email)
  end

  defp validate_password(changeset) do
    changeset
    |> validate_required([:password])
    |> validate_length(:password, min: 8, max: 72)
    |> validate_confirmation(:password, message: "密码不匹配")
  end

  @doc """
  验证邮箱确认
  """
  def confirm_changeset(user) do
    change(user, confirmed_at: DateTime.utc_now(:second))
  end

  @doc """
  更新密码
  """
  def password_changeset(user, attrs) do
    user
    |> cast(attrs, [:password])
    |> validate_confirmation(:password, message: "密码不匹配")
    |> validate_password()
    |> put_change(:hashed_password, Bcrypt.hash_pwd_salt(attrs[:password]))
  end
end
```

```elixir
# lib/phoenix_app/blog/post.ex
defmodule PhoenixApp.Blog.Post do
  use Ecto.Schema
  import Ecto.Changeset

  schema "posts" do
    field :title, :string
    field :slug, :string
    field :content, :string
    field :status, Ecto.Enum, values: [:draft, :published, :archived], default: :draft
    field :view_count, :integer, default: 0
    field :published_at, :utc_datetime

    belongs_to :author, PhoenixApp.Accounts.User, foreign_key: :user_id
    has_many :comments, PhoenixApp.Blog.Comment

    many_to_many :tags, PhoenixApp.Blog.Tag, join_through: "post_tags"

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(post, attrs) do
    post
    |> cast(attrs, [:title, :content, :status, :user_id])
    |> validate_required([:title, :content, :user_id])
    |> validate_length(:title, min: 5, max: 200)
    |> generate_slug()
    |> unique_constraint(:slug)
    |> maybe_set_published_at()
  end

  defp generate_slug(changeset) do
    case fetch_change(changeset, :title) do
      {:ok, title} ->
        slug = title
               |> String.downcase()
               |> String.replace(~r/[^\w\s-]/, "")
               |> String.replace(~r/\s+/, "-")
               |> String.slice(0, 100)

        put_change(changeset, :slug, slug)
      :error ->
        changeset
    end
  end

  defp maybe_set_published_at(changeset) do
    case fetch_change(changeset, :status) do
      {:ok, :published} ->
        if get_field(changeset, :published_at) do
          changeset
        else
          put_change(changeset, :published_at, DateTime.utc_now(:second))
        end
      _ ->
        changeset
    end
  end
end
```

### 上下文 (Context)

```elixir
# lib/phoenix_app/blog/blog.ex
defmodule PhoenixApp.Blog do
  import Ecto.Query, warn: false
  alias PhoenixApp.Repo
  alias PhoenixApp.Blog.{Post, Comment, Tag}

  # ========== Posts ==========

  def list_posts(opts \\ []) do
    Post
    |> preload([:author, :tags])
    |> filter_by_status(opts[:status])
    |> search_by_keyword(opts[:q])
    |> filter_by_tag(opts[:tag])
    |> order_by([desc: :inserted_at])
    |> paginate(opts[:page], opts[:per_page])
    |> Repo.all()
  end

  def get_post!(id), do: Repo.get!(Post, id) |> Repo.preload([:author, :tags, :comments])
  def get_post_by_slug!(slug), do: Repo.get_by!(Post, slug: slug) |> Repo.preload([:author, :tags])

  def create_post(attrs \\ %{}) do
    %Post{}
    |> Post.changeset(attrs)
    |> Repo.insert()
  end

  def update_post(%Post{} = post, attrs) do
    post
    |> Post.changeset(attrs)
    |> Repo.update()
  end

  def delete_post(%Post{} = post) do
    Repo.delete(post)
  end

  def change_post(%Post{} = post, attrs \\ %{}) do
    Post.changeset(post, attrs)
  end

  def publish_post(%Post{} = post) do
    update_post(post, %{status: :published})
  end

  # ========== Comments ==========

  def create_comment(attrs) do
    %Comment{}
    |> Comment.changeset(attrs)
    |> Repo.insert()
    |> case do
      {:ok, comment} ->
        broadcast(comment.post_id, {:comment_created, comment})
        {:ok, comment}
      error ->
        error
    end
  end

  def delete_comment(%Comment{} = comment) do
    Repo.delete(comment)
  end

  # ========== 私有函数 ==========

  defp filter_by_status(query, nil), do: query
  defp filter_by_status(query, status), do: where(query, status: ^status)

  defp search_by_keyword(query, nil), do: query
  defp search_by_keyword(query, q) do
    where(query, [p], ilike(p.title, ^"%#{q}%") or ilike(p.content, ^"%#{q}%"))
  end

  defp filter_by_tag(query, nil), do: query
  defp filter_by_tag(query, tag_name) do
    from p in query,
      join: t in assoc(p, :tags),
      where: t.name == ^tag_name
  end

  defp paginate(query, nil, _per_page), do: query
  defp paginate(query, page, per_page) do
    offset = max((page - 1) * (per_page || 10), 0)
    limit = per_page || 10

    query
    |> limit(^limit)
    |> offset(^offset)
  end

  defp broadcast(post_id, message) do
    PhoenixAppWeb.Endpoint.broadcast("posts:#{post_id}", "update", message)
  end
end
```

### LiveView 组件

```elixir
# lib/phoenix_app_web/live/post_live/index.ex
defmodule PhoenixAppWeb.PostLive.Index do
  use PhoenixAppWeb, :live_view

  alias PhoenixApp.Blog
  alias PhoenixApp.Blog.Post

  @impl true
  def mount(_params, _session, socket) do
    {:ok, stream(socket, :posts, Blog.list_posts(status: :published))}
  end

  @impl true
  def handle_params(params, _url, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  end

  defp apply_action(socket, :edit, %{"id" => id}) do
    socket
    |> assign(:page_title, "编辑文章")
    |> assign(:post, Blog.get_post!(id))
  end

  defp apply_action(socket, :new, _params) do
    socket
    |> assign(:page_title, "新建文章")
    |> assign(:post, %Post{})
  end

  defp apply_action(socket, :index, _params) do
    socket
    |> assign(:page_title, "文章列表")
    |> assign(:post, nil)
  end

  @impl true
  def handle_info({PhoenixAppWeb.PostLive.FormComponent, {:saved, post}}, socket) do
    {:noreply, stream_insert(socket, :posts, post)}
  end

  @impl true
  def handle_event("delete", %{"id" => id}, socket) do
    post = Blog.get_post!(id)
    {:ok, _} = Blog.delete_post(post)

    {:noreply, stream_delete(socket, :posts, post)}
  end
end
```

```elixir
# lib/phoenix_app_web/live/post_live/show.ex
defmodule PhoenixAppWeb.PostLive.Show do
  use PhoenixAppWeb, :live_view

  alias PhoenixApp.Blog
  alias PhoenixApp.Blog.Comment

  @impl true
  def mount(_params, _session, socket) do
    {:ok, socket}
  end

  @impl true
  def handle_params(%{"id" => id}, _, socket) do
    post = Blog.get_post_by_slug!(id)

    {:noreply,
     socket
     |> assign(:page_title, post.title)
     |> assign(:post, post)
     |> assign(:comment, %Comment{post_id: post.id})}
  end

  @impl true
  def handle_event("create_comment", %{"comment" => comment_params}, socket) do
    case Blog.create_comment(Map.put(comment_params, "post_id", socket.assigns.post.id)) do
      {:ok, _comment} ->
        {:noreply,
         socket
         |> put_flash(:info, "评论发表成功")
         |> assign(:post, Blog.get_post!(socket.assigns.post.id))}

      {:error, changeset} ->
        {:noreply, assign(socket, :comment, changeset)}
    end
  end

  @impl true
  def handle_event("delete_comment", %{"id" => id}, socket) do
    comment = Blog.get_comment!(id)
    {:ok, _} = Blog.delete_comment(comment)

    {:noreply,
     socket
     |> put_flash(:info, "评论已删除")
     |> assign(:post, Blog.get_post!(socket.assigns.post.id))}
  end
end
```

```elixir
# lib/phoenix_app_web/live/post_live/form_component.ex
defmodule PhoenixAppWeb.PostLive.FormComponent do
  use PhoenixAppWeb, :live_component

  alias PhoenixApp.Blog

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <.header>
        <%= @title %>
      </.header>

      <.simple_form
        for={@form}
        id="post-form"
        phx-target={@myself}
        phx-change="validate"
        phx-submit="save"
      >
        <.input field={@form[:title]} type="text" label="标题" />
        <.input field={@form[:content]} type="textarea" label="内容" rows="10" />
        <.input field={@form[:status]} type="select" options={[草稿: :draft, 发布: :published]} label="状态" />

        <:actions>
          <.button phx-disable-with="保存中...">保存</.button>
        </:actions>
      </.simple_form>
    </div>
    """
  end

  @impl true
  def update(%{post: post} = assigns, socket) do
    changeset = Blog.change_post(post)

    {:ok,
     socket
     |> assign(assigns)
     |> assign_form(changeset)}
  end

  @impl true
  def handle_event("validate", %{"post" => post_params}, socket) do
    changeset =
      socket.assigns.post
      |> Blog.change_post(post_params)
      |> Map.put(:action, :validate)

    {:noreply, assign_form(socket, changeset)}
  end

  @impl true
  def handle_event("save", %{"post" => post_params}, socket) do
    save_post(socket, socket.assigns.action, post_params)
  end

  defp save_post(socket, :edit, post_params) do
    case Blog.update_post(socket.assigns.post, post_params) do
      {:ok, post} ->
        send(self(), {__MODULE__, {:saved, post}})
        {:noreply, socket}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:noreply, assign_form(socket, changeset)}
    end
  end

  defp save_post(socket, :new, post_params) do
    post_params = Map.put(post_params, "user_id", socket.assigns.current_user.id)

    case Blog.create_post(post_params) do
      {:ok, post} ->
        send(self(), {__MODULE__, {:saved, post}})
        {:noreply, socket}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:noreply, assign_form(socket, changeset)}
    end
  end

  defp assign_form(socket, %Ecto.Changeset{} = changeset) do
    assign(socket, :form, to_form(changeset))
  end
end
```

### Channel (WebSocket)

```elixir
# lib/phoenix_app_web/channels/room_channel.ex
defmodule PhoenixAppWeb.RoomChannel do
  use PhoenixAppWeb, :channel

  @impl true
  def join("room:" <> room_id, _params, socket) do
    {:ok, socket}
  end

  @impl true
  def handle_in("new_msg", %{"body" => body}, socket) do
    broadcast!(socket, "new_msg", %{body: body})
    {:noreply, socket}
  end
end

# lib/phoenix_app_web/channels/post_channel.ex
defmodule PhoenixAppWeb.PostChannel do
  use PhoenixAppWeb, :channel

  @impl true
  def join("posts:" <> post_id, _params, socket) do
    {:ok, socket}
  end

  @impl true
  def handle_in("view", _params, socket) do
    "posts:" <> post_id = socket.topic
    PhoenixApp.Blog.increment_view_count(post_id)
    {:noreply, socket}
  end
end
```

### 后台任务 (Oban)

```elixir
# lib/phoenix_app/workers/email_worker.ex
defmodule PhoenixApp.Workers.EmailWorker do
  use Oban.Worker, queue: :mailers, max_attempts: 3

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"email" => email, "type" => "welcome"}}) do
    PhoenixApp.Mailer.send_welcome_email(email)
    :ok
  end

  def perform(%Oban.Job{args: %{"post_id" => post_id, "type" => "notification"}}) do
    post = PhoenixApp.Blog.get_post!(post_id)

    post.author.followers
    |> Enum.each(fn follower ->
      PhoenixApp.Mailer.send_new_post_notification(follower.email, post)
    end)

    :ok
  end
end

# 使用
PhoenixApp.Workers.EmailWorker.new(%{email: user.email, type: "welcome"})
|> Oban.insert()
```

### API Controller

```elixir
# lib/phoenix_app_web/controllers/api/post_controller.ex
defmodule PhoenixAppWeb.Api.PostController do
  use PhoenixAppWeb, :controller

  alias PhoenixApp.Blog

  def index(conn, params) do
    posts = Blog.list_posts(
      status: :published,
      q: params["q"],
      page: params["page"],
      per_page: params["per_page"]
    )

    render(conn, :index, posts: posts)
  end

  def show(conn, %{"id" => slug}) do
    post = Blog.get_post_by_slug!(slug)
    render(conn, :show, post: post)
  end

  def create(conn, %{"post" => post_params}) do
    post_params = Map.put(post_params, "user_id", conn.assigns.current_user.id)

    case Blog.create_post(post_params) do
      {:ok, post} ->
        conn
        |> put_status(:created)
        |> render(:show, post: post)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def update(conn, %{"id" => id, "post" => post_params}) do
    post = Blog.get_post!(id)

    if post.user_id == conn.assigns.current_user.id do
      case Blog.update_post(post, post_params) do
        {:ok, post} ->
          render(conn, :show, post: post)

        {:error, changeset} ->
          conn
          |> put_status(:unprocessable_entity)
          |> render(:error, changeset: changeset)
      end
    else
      conn
      |> put_status(:forbidden)
      |> json(%{error: "无权限"})
    end
  end
end
```

### 认证 Plug

```elixir
# lib/phoenix_app_web/plugs/auth_plug.ex
defmodule PhoenixAppWeb.Plugs.AuthPlug do
  import Plug.Conn
  import Phoenix.Controller

  alias PhoenixApp.Accounts
  alias Guardian.Plug

  def init(opts), do: opts

  def call(conn, _opts) do
    case Plug.current_resource(conn) do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "未授权"})
        |> halt()

      user ->
        assign(conn, :current_user, user)
    end
  end
end
```

### 测试

```elixir
# test/phoenix_app/blog_test.exs
defmodule PhoenixApp.BlogTest do
  use PhoenixApp.DataCase

  alias PhoenixApp.Blog

  describe "posts" do
    alias PhoenixApp.Blog.Post

    import PhoenixApp.AccountsFixtures
    import PhoenixApp.BlogFixtures

    test "list_posts/1 返回所有已发布文章" do
      user = user_fixture()
      post = post_fixture(user_id: user.id, status: :published)

      assert Blog.list_posts(status: :published) == [post]
    end

    test "create_post/1 创建有效文章" do
      user = user_fixture()

      attrs = %{
        title: "测试文章",
        content: "这是测试内容",
        status: :draft,
        user_id: user.id
      }

      assert {:ok, %Post{} = post} = Blog.create_post(attrs)
      assert post.title == "测试文章"
      assert post.status == :draft
    end

    test "create_post/1 无效数据返回错误" do
      assert {:error, %Ecto.Changeset{}} = Blog.create_post(%{})
    end
  end
end
```

## 最佳实践

### 1. 上下文模式

```elixir
# 将相关功能组织在上下文中
defmodule PhoenixApp.Accounts do
  # 所有用户相关操作
  def register_user(attrs)
  def authenticate_user(email, password)
  def update_user(user, attrs)
end

defmodule PhoenixApp.Blog do
  # 所有博客相关操作
  def create_post(attrs)
  def publish_post(post)
  def add_comment(post, attrs)
end

# 使用
{:ok, user} = PhoenixApp.Accounts.register_user(attrs)
{:ok, post} = PhoenixApp.Blog.create_post(post_attrs)
```

### 2. Ecto 查询组合

```elixir
defmodule PhoenixApp.Blog.Post do
  import Ecto.Query

  def with_author(query) do
    from p in query, preload: [:author]
  end

  def published(query) do
    from p in query, where: p.status == :published
  end

  def recent(query, limit \\ 10) do
    from p in query,
      order_by: [desc: p.inserted_at],
      limit: ^limit
  end
end

# 使用
Post |> Post.published() |> Post.with_author() |> Post.recent(5)
```

### 3. 幂等任务

```elixir
# 使用 unique_period 防止重复
defmodule PhoenixApp.Workers.EmailWorker do
  use Oban.Worker,
    queue: :mailers,
    unique: [period: 60, keys: [:email, :type]]

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"email" => email, "type" => "welcome"}}) do
    # 60秒内同一邮箱的欢迎邮件只发送一次
    :ok
  end
end
```

### 4. Telemetry 监控

```elixir
# lib/phoenix_app/application.ex
defmodule PhoenixApp.Application do
  def start(_type, _args) do
    OpentelemetryPhoenix.setup()
    OpentelemetryEcto.setup([:phoenix_app, :repo])

    # ...
  end
end
```

## 常用命令

### 开发

```bash
# 创建新项目
mix phx.new myapp --database postgres

# 创建资源
mix phx.gen.html Blog Post posts title:string content:text
mix phx.gen.live Blog Post posts title:string content:text
mix phx.gen.json Blog Post posts title:string content:text

# 数据库操作
mix ecto.create
mix ecto.migrate
mix ecto.reset
mix ecto.gen.migration add_tags_to_posts

# 服务器
mix phx.server
iex -S mix phx.server

# 交互
iex -S mix

# 测试
mix test
mix test --trace
mix test test/phoenix_app/blog_test.exs
```

### 调试

```bash
# 编译
mix compile
mix compile --warnings-as-errors

# 格式化
mix format
mix format --check-formatted

# 依赖
mix deps.get
mix deps.update --all
mix deps.clean --unused

# 发布
mix release
_build/prod/rel/phoenix_app/bin/phoenix_app start
```

## 部署配置

### mix.exs

```elixir
defmodule PhoenixApp.MixProject do
  use Mix.Project

  def project do
    [
      app: :phoenix_app,
      version: "0.1.0",
      elixir: "~> 1.16",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps()
    ]
  end

  def application do
    [
      mod: {PhoenixApp.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp deps do
    [
      {:phoenix, "~> 1.7"},
      {:phoenix_ecto, "~> 4.4"},
      {:ecto_sql, "~> 3.10"},
      {:postgrex, ">= 0.0.0"},
      {:phoenix_live_view, "~> 0.20"},
      {:phoenix_live_dashboard, "~> 0.8"},
      {:esbuild, "~> 0.8", runtime: Mix.env() == :dev},
      {:tailwind, "~> 0.2", runtime: Mix.env() == :dev},
      {:oban, "~> 2.17"},
      {:guardian, "~> 2.3"},
      {:bcrypt_elixir, "~> 3.0"},
      {:absinthe, "~> 1.7"},
      {:absinthe_plug, "~> 1.5"},
      {:telemetry_metrics, "~> 1.0"},
      {:telemetry_poller, "~> 1.0"},
      {:jason, "~> 1.4"},
      {:plug_cowboy, "~> 2.6"}
    ]
  end

  defp aliases do
    [
      setup: ["deps.get", "ecto.setup", "assets.setup", "assets.build"],
      "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"],
      "assets.setup": ["tailwind.install --if-missing", "esbuild.install --if-missing"],
      "assets.build": ["tailwind default", "esbuild default"],
      "assets.deploy": ["tailwind default --minify", "esbuild default --minify", "phx.digest"]
    ]
  end
end
```

### Dockerfile

```dockerfile
# 构建阶段
FROM elixir:1.16-alpine AS build

RUN apk add --no-cache build-base git

WORKDIR /app

RUN mix local.hex --force && \
    mix local.rebar --force

ENV MIX_ENV=prod

COPY mix.exs mix.lock ./
RUN mix deps.get --only prod

COPY config config
COPY lib lib
COPY priv priv

RUN mix release

# 运行阶段
FROM alpine:3.19

RUN apk add --no-cache openssl ncurses-libs

WORKDIR /app

COPY --from=build /app/_build/prod/rel/phoenix_app ./

ENV HOME=/app

CMD ["bin/phoenix_app", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "4000:4000"
    environment:
      - SECRET_KEY_BASE=your-secret-key-base
      - DATABASE_URL=ecto://postgres:password@db:5432/phoenix_app_prod
      - PHX_HOST=localhost
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: phoenix_app_prod
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

### 运行时配置

```elixir
# config/runtime.exs
import Config

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      """

  config :phoenix_app, PhoenixApp.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    ssl: true

  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      """

  config :phoenix_app, PhoenixAppWeb.Endpoint,
    http: [
      ip: {0, 0, 0, 0, 0, 0, 0, 0},
      port: String.to_integer(System.get_env("PORT") || "4000")
    ],
    secret_key_base: secret_key_base,
    server: true

  config :phoenix_app, PhoenixAppWeb.Endpoint,
    url: [host: System.get_env("PHX_HOST") || "localhost", port: 443, scheme: "https"]
end
```

### 环境变量

```env
# .env.example
DATABASE_URL=ecto://postgres:password@localhost:5432/phoenix_app_dev
SECRET_KEY_BASE=your-secret-key-base-at-least-64-characters
PHX_HOST=localhost
PORT=4000
REDIS_URL=redis://localhost:6379/0
