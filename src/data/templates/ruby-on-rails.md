# Ruby on Rails 全栈开发模板

## 技术栈

- **Ruby on Rails 7/8**: 全栈 Web 框架
- **Ruby 3.2+**: 编程语言
- **PostgreSQL**: 关系型数据库
- **Hotwire (Turbo + Stimulus)**: 前端交互
- **Redis**: 缓存和后台任务
- **Sidekiq**: 后台任务处理
- **Devise**: 用户认证
- **Pundit**: 权限管理
- **RSpec**: 测试框架

## 项目结构

```
rails-app/
├── app/
│   ├── controllers/
│   │   ├── application_controller.rb
│   │   ├── users_controller.rb
│   │   ├── posts_controller.rb
│   │   └── api/
│   │       └── v1/
│   │           └── base_controller.rb
│   ├── models/
│   │   ├── application_record.rb
│   │   ├── user.rb
│   │   └── post.rb
│   ├── views/
│   │   ├── layouts/
│   │   │   └── application.html.erb
│   │   ├── posts/
│   │   │   ├── index.html.erb
│   │   │   ├── show.html.erb
│   │   │   └── _post.html.erb
│   │   └── shared/
│   │       ├── _navbar.html.erb
│   │       └── _flash.html.erb
│   ├── services/
│   │   └── post_service.rb
│   ├── policies/
│   │   └── post_policy.rb
│   ├── serializers/
│   │   └── post_serializer.rb
│   ├── jobs/
│   │   └── post_notification_job.rb
│   ├── mailers/
│   │   └── user_mailer.rb
│   ├── helpers/
│   │   └── application_helper.rb
│   ├── javascript/
│   │   ├── controllers/
│   │   │   ├── application.js
│   │   │   └── hello_controller.js
│   │   └── application.js
│   └── assets/
│       ├── stylesheets/
│       │   └── application.tailwind.css
│       └── images/
├── config/
│   ├── environments/
│   ├── initializers/
│   ├── locales/
│   ├── application.rb
│   ├── database.yml
│   ├── routes.rb
│   └── puma.rb
├── db/
│   ├── migrate/
│   ├── schema.rb
│   └── seeds.rb
├── lib/
│   └── tasks/
├── public/
├── spec/
│   ├── models/
│   ├── controllers/
│   ├── requests/
│   ├── factories/
│   └── rails_helper.rb
├── Gemfile
├── Gemfile.lock
├── Rakefile
└── config.ru
```

## 代码模式

### 应用入口

```ruby
# config/application.rb
require_relative "boot"

require "rails/all"

Bundler.require(*Rails.groups)

module MyApp
  class Application < Rails::Application
    # 初始化默认值
    config.load_defaults 7.2

    # 时区设置
    config.time_zone = "Asia/Shanghai"
    config.active_record.default_timezone = :local

    # 国际化
    config.i18n.default_locale = :zh-CN
    config.i18n.available_locales = [:en, :"zh-CN"]

    # 自动加载 lib 目录
    config.autoload_paths << Rails.root.join("lib")

    # 后台任务队列
    config.active_job.queue_adapter = :sidekiq

    # 安全配置
    config.force_ssl = true
    config.ssl_options = { redirect: { exclude: ->(request) { request.path =~ /health/ } } }
  end
end
```

### 路由配置

```ruby
# config/routes.rb
Rails.application.routes.draw do
  # 健康检查
  get "health", to: "health#show"

  # Devise 认证
  devise_for :users, controllers: {
    sessions: "users/sessions",
    registrations: "users/registrations"
  }

  # 资源路由
  resources :posts, except: [:new, :edit] do
    member do
      post :publish
      post :archive
    end

    collection do
      get :search
      get :drafts
    end

    resources :comments, only: [:create, :destroy]
  end

  # 命名空间
  namespace :admin do
    resources :users
    resources :posts, only: [:index, :destroy]
  end

  # API 路由
  namespace :api do
    namespace :v1 do
      resources :posts, only: [:index, :show, :create]
      resources :users, only: [:show]
    end
  end

  # 根路由
  root "posts#index"
end
```

### 模型

```ruby
# app/models/user.rb
class User < ApplicationRecord
  # Devise 模块
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :confirmable, :trackable

  # 关联
  has_many :posts, dependent: :destroy
  has_many :comments, dependent: :destroy

  # 验证
  validates :name, presence: true, length: { maximum: 50 }
  validates :bio, length: { maximum: 500 }

  # 枚举
  enum role: { user: 0, moderator: 1, admin: 2 }

  # 作用域
  scope :active, -> { where(active: true) }
  scope :admins, -> { where(role: :admin) }

  # 回调
  before_create :set_default_role

  # 方法
  def full_name
    "#{first_name} #{last_name}".strip
  end

  def admin?
    role == "admin"
  end

  private

  def set_default_role
    self.role ||= :user
  end
end
```

```ruby
# app/models/post.rb
class Post < ApplicationRecord
  # 关联
  belongs_to :author, class_name: "User", foreign_key: :user_id
  has_many :comments, dependent: :destroy
  has_many :tags, through: :post_tags
  has_one_attached :cover_image

  # 验证
  validates :title, presence: true, length: { maximum: 200 }
  validates :content, presence: true
  validates :slug, uniqueness: true, format: { with: /\A[a-z0-9-]+\z/ }

  # 枚举
  enum status: { draft: 0, published: 1, archived: 2 }

  # 作用域
  scope :recent, -> { order(created_at: :desc) }
  scope :published, -> { where(status: :published) }
  scope :by_tag, ->(tag) { joins(:tags).where(tags: { name: tag }) }

  # 搜索
  include PgSearch::Model
  pg_search_scope :search_full_text,
    against: [:title, :content],
    using: {
      tsearch: { prefix: true }
    }

  # 回调
  before_validation :generate_slug, on: :create

  # 友好 ID
  extend FriendlyId
  friendly_id :title, use: :slugged

  # 方法
  def publish!
    update!(status: :published, published_at: Time.current)
  end

  def author_name
    author&.name || "匿名"
  end

  private

  def generate_slug
    self.slug ||= title.to_s.parameterize
  end
end
```

### 控制器

```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  # 安全
  protect_from_forgery with: :exception

  # 认证
  before_action :authenticate_user!
  before_action :configure_permitted_parameters, if: :devise_controller?

  # Pundit 授权
  include Pundit::Authorization
  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  helper_method :current_user, :user_signed_in?

  private

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name, :bio, :avatar])
  end

  def user_not_authorized
    flash[:alert] = "您没有权限执行此操作"
    redirect_back(fallback_location: root_path)
  end

  def after_sign_in_path_for(resource)
    stored_location_for(resource) || dashboard_path
  end
end
```

```ruby
# app/controllers/posts_controller.rb
class PostsController < ApplicationController
  before_action :set_post, only: [:show, :edit, :update, :destroy, :publish]
  before_action :authorize_post, only: [:edit, :update, :destroy]

  # GET /posts
  def index
    @posts = Post.published
                 .includes(:author, :tags)
                 .page(params[:page])
                 .per(12)

    # 搜索
    if params[:q].present?
      @posts = @posts.search_full_text(params[:q])
    end

    # 标签过滤
    if params[:tag].present?
      @posts = @posts.by_tag(params[:tag])
    end
  end

  # GET /posts/:id
  def show
    @comment = Comment.new
    @comments = @post.comments.includes(:user).order(created_at: :desc)
  end

  # GET /posts/new
  def new
    @post = Post.new
  end

  # POST /posts
  def create
    @post = current_user.posts.build(post_params)

    if @post.save
      redirect_to @post, notice: "文章创建成功"
    else
      render :new, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /posts/:id
  def update
    if @post.update(post_params)
      redirect_to @post, notice: "文章更新成功"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  # DELETE /posts/:id
  def destroy
    @post.destroy
    redirect_to posts_url, notice: "文章已删除"
  end

  # POST /posts/:id/publish
  def publish
    if @post.publish!
      PostNotificationJob.perform_later(@post.id)
      redirect_to @post, notice: "文章已发布"
    else
      redirect_to @post, alert: "发布失败"
    end
  end

  private

  def set_post
    @post = Post.find_by!(slug: params[:id])
  end

  def post_params
    params.require(:post).permit(:title, :content, :status, :cover_image, tag_ids: [])
  end

  def authorize_post
    authorize @post
  end
end
```

### 视图

```erb
<!-- app/views/posts/index.html.erb -->
<div class="container mx-auto px-4">
  <h1 class="text-3xl font-bold mb-6">文章列表</h1>

  <!-- 搜索表单 -->
  <%= form_with url: posts_path, method: :get, local: true, class: "mb-6" do |f| %>
    <div class="flex gap-2">
      <%= f.text_field :q, value: params[:q], placeholder: "搜索文章...", class: "input input-bordered w-full" %>
      <%= f.submit "搜索", class: "btn btn-primary" %>
    </div>
  <% end %>

  <!-- 文章列表 -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="posts">
    <%= render @posts %>
  </div>

  <!-- 分页 -->
  <%= paginate @posts %>
</div>
```

```erb
<!-- app/views/posts/_post.html.erb -->
<div class="card bg-base-100 shadow-xl" id="<%= dom_id post %>">
  <% if post.cover_image.attached? %>
    <figure>
      <%= image_tag post.cover_image, class: "w-full h-48 object-cover" %>
    </figure>
  <% end %>

  <div class="card-body">
    <h2 class="card-title">
      <%= link_to post.title, post %>
    </h2>
    <p class="text-gray-600"><%= truncate(post.content, length: 150) %></p>

    <div class="card-actions justify-between items-center mt-4">
      <div class="text-sm text-gray-500">
        <%= post.author_name %> · <%= time_ago_in_words(post.created_at) %>前
      </div>
      <%= link_to "阅读更多", post, class: "btn btn-primary btn-sm" %>
    </div>
  </div>
</div>
```

### Stimulus 控制器

```javascript
// app/javascript/controllers/hello_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["output"]
  static values = { name: String }

  connect() {
    this.outputTarget.textContent = `Hello, ${this.nameValue}!`
  }
}
```

```javascript
// app/javascript/controllers/autosave_controller.js
import { Controller } from "@hotwired/stimulus"
import { debounce } from "lodash"

export default class extends Controller {
  static targets = ["form"]

  initialize() {
    this.save = debounce(this.save, 500).bind(this)
  }

  save() {
    this.formTarget.requestSubmit()
  }
}
```

### 后台任务

```ruby
# app/jobs/post_notification_job.rb
class PostNotificationJob < ApplicationJob
  queue_as :notifications

  def perform(post_id)
    post = Post.find(post_id)
    return unless post.published?

    # 发送通知给关注者
    post.author.followers.each do |follower|
      UserMailer.new_post_notification(follower, post).deliver_later
    end

    # 发送到社交平台
    SocialShareService.new(post).share_to_twitter
  rescue StandardError => e
    Rails.logger.error "Post notification failed: #{e.message}"
  end
end
```

### 邮件

```ruby
# app/mailers/user_mailer.rb
class UserMailer < ApplicationMailer
  default from: "noreply@example.com"

  def welcome_email(user)
    @user = user
    mail(to: @user.email, subject: "欢迎加入")
  end

  def new_post_notification(user, post)
    @user = user
    @post = post
    mail(to: @user.email, subject: "新文章发布: #{post.title}")
  end
end
```

### 策略

```ruby
# app/policies/post_policy.rb
class PostPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    record.published? || user&.admin? || record.author == user
  end

  def create?
    user.present?
  end

  def update?
    user&.admin? || record.author == user
  end

  def destroy?
    user&.admin? || record.author == user
  end

  def publish?
    user&.admin? || record.author == user
  end

  class Scope < Scope
    def resolve
      if user&.admin?
        scope.all
      else
        scope.where(status: :published).or(scope.where(user_id: user&.id))
      end
    end
  end
end
```

### API 序列化

```ruby
# app/serializers/post_serializer.rb
class PostSerializer < ActiveModel::Serializer
  attributes :id, :title, :slug, :content, :status, :created_at, :updated_at

  belongs_to :author, serializer: UserSerializer
  has_many :tags

  def created_at
    object.created_at.iso8601
  end
end
```

### 测试

```ruby
# spec/models/post_spec.rb
require 'rails_helper'

RSpec.describe Post, type: :model do
  let(:user) { create(:user) }
  let(:post) { build(:post, author: user) }

  describe "关联" do
    it { should belong_to(:author).class_name("User") }
    it { should have_many(:comments).dependent(:destroy) }
  end

  describe "验证" do
    it { should validate_presence_of(:title) }
    it { should validate_presence_of(:content) }
    it { should validate_length_of(:title).is_at_most(200) }
  end

  describe "作用域" do
    it "返回已发布的文章" do
      published = create(:post, status: :published, author: user)
      draft = create(:post, status: :draft, author: user)

      expect(Post.published).to include(published)
      expect(Post.published).not_to include(draft)
    end
  end

  describe "#publish!" do
    it "将状态更改为已发布" do
      post.save!
      post.publish!
      expect(post.status).to eq("published")
      expect(post.published_at).to be_present
    end
  end
end
```

```ruby
# spec/controllers/posts_controller_spec.rb
require 'rails_helper'

RSpec.describe PostsController, type: :controller do
  let(:user) { create(:user) }
  let(:post) { create(:post, author: user) }

  before { sign_in user }

  describe "GET #index" do
    it "返回成功响应" do
      get :index
      expect(response).to be_successful
    end
  end

  describe "POST #create" do
    context "使用有效参数" do
      it "创建新文章" do
        expect {
          post :create, params: { post: attributes_for(:post) }
        }.to change(Post, :count).by(1)
      end
    end
  end
end
```

## 最佳实践

### 1. 服务对象

```ruby
# app/services/post_service.rb
class PostService
  def initialize(post)
    @post = post
  end

  def publish_and_notify
    ActiveRecord::Base.transaction do
      @post.publish!
      notify_followers
      share_to_social
    end
  end

  private

  def notify_followers
    @post.author.followers.find_each do |follower|
      UserMailer.new_post_notification(follower, @post).deliver_later
    end
  end

  def share_to_social
    SocialShareJob.perform_later(@post.id)
  end
end

# 使用
PostService.new(post).publish_and_notify
```

### 2. 关注点 (Concerns)

```ruby
# app/models/concerns/searchable.rb
module Searchable
  extend ActiveSupport::Concern

  included do
    include PgSearch::Model

    pg_search_scope :search_by_full_text,
      against: searchable_columns,
      using: { tsearch: { prefix: true } }
  end

  class_methods do
    def searchable_columns
      []
    end
  end
end

# 使用
class Post < ApplicationRecord
  include Searchable

  def self.searchable_columns
    [:title, :content]
  end
end
```

### 3. 表单对象

```ruby
# app/forms/post_form.rb
class PostForm
  include ActiveModel::Model
  include ActiveModel::Attributes

  attribute :title, :string
  attribute :content, :string
  attribute :tag_names, :string
  attribute :cover_image

  validates :title, presence: true, length: { maximum: 200 }
  validates :content, presence: true

  def save
    return false unless valid?

    ActiveRecord::Base.transaction do
      post.update!(title: title, content: content)
      post.cover_image.attach(cover_image) if cover_image
      update_tags
    end
    true
  rescue ActiveRecord::RecordInvalid
    false
  end

  private

  def update_tags
    tags = tag_names.split(",").map(&:strip).map do |name|
      Tag.find_or_create_by(name: name)
    end
    post.tags = tags
  end
end
```

### 4. 缓存策略

```ruby
# 俄罗斯套娃缓存
<% cache [@post, @post.comments.maximum(:updated_at)] do %>
  <% @comments.each do |comment| %>
    <% cache comment do %>
      <%= render comment %>
    <% end %>
  <% end %>
<% end %>

# 模型缓存
class Post < ApplicationRecord
  def self.cached_featured
    Rails.cache.fetch([self, "featured"], expires_in: 1.hour) do
      where(featured: true).limit(5).to_a
    end
  end
end
```

## 常用命令

### 开发

```bash
# 创建新项目
rails new myapp -d postgresql --css tailwind

# 生成资源
rails generate scaffold Post title:string content:text
rails generate model Comment content:text post:references
rails generate controller Api::V1::Posts

# 数据库操作
rails db:create
rails db:migrate
rails db:seed
rails db:reset

# 控制台
rails console
rails console --sandbox

# 服务器
rails server
rails server -e production -p 3001

# 测试
rails test
rspec
rspec spec/models/post_spec.rb
```

### 调试

```bash
# 查看路由
rails routes
rails routes | grep posts

# 数据库迁移
rails db:migrate:status
rails db:rollback
rails db:migrate:redo

# 清理日志
rails log:clear

# 资产预编译
rails assets:precompile
rails assets:clobber
```

## 部署配置

### Gemfile 关键依赖

```ruby
# Gemfile
gem "rails", "~> 7.2"
gem "pg"
gem "puma"
gem "bootsnap", require: false
gem "devise"
gem "pundit"
gem "sidekiq"
gem "redis"
gem "friendly_id"
gem "kaminari"
gem "image_processing"

group :development, :test do
  gem "rspec-rails"
  gem "factory_bot_rails"
  gem "faker"
  gem "byebug"
end

group :development do
  gem "annotate"
  gem "better_errors"
  gem "bullet"
  gem "letter_opener"
end

group :production do
  gem "sentry-ruby"
  gem "sentry-rails"
end
```

### Dockerfile

```dockerfile
FROM ruby:3.3-alpine

RUN apk add --no-cache build-base postgresql-dev nodejs yarn tzdata git

WORKDIR /app

COPY Gemfile Gemfile.lock ./
RUN bundle config set --local deployment true && \
    bundle config set --local without development test && \
    bundle install --jobs 4

COPY . .

RUN RAILS_ENV=production bundle exec rails assets:precompile

EXPOSE 3000

CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - RAILS_ENV=production
      - DATABASE_URL=postgres://postgres:password@db:5432/myapp_production
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY_BASE=your-secret-key-base
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  sidekiq:
    build: .
    command: bundle exec sidekiq
    environment:
      - RAILS_ENV=production
      - DATABASE_URL=postgres://postgres:password@db:5432/myapp_production
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
  redis_data:
```

### Puma 配置

```ruby
# config/puma.rb
max_threads_count = ENV.fetch("RAILS_MAX_THREADS") { 5 }
min_threads_count = ENV.fetch("RAILS_MIN_THREADS") { max_threads_count }
threads min_threads_count, max_threads_count

port ENV.fetch("PORT") { 3000 }
environment ENV.fetch("RAILS_ENV") { "development" }

if ENV["RAILS_ENV"] == "production"
  app_dir = File.expand_path("../..", __FILE__)
  shared_dir = "#{app_dir}/shared"
  
  bind "unix://#{shared_dir}/sockets/puma.sock"
  
  stdout_redirect "#{shared_dir}/log/puma.stdout.log",
                  "#{shared_dir}/log/puma.stderr.log",
                  true
  
  pidfile "#{shared_dir}/pids/puma.pid"
  state_path "#{shared_dir}/pids/puma.state"
  
  activate_control_app
end

workers ENV.fetch("WEB_CONCURRENCY") { 2 }
preload_app!
```

### 环境变量

```env
# .env.example
RAILS_ENV=production
SECRET_KEY_BASE=your-secret-key-base
DATABASE_URL=postgres://user:password@localhost:5432/myapp
REDIS_URL=redis://localhost:6379/0
SMTP_ADDRESS=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```
