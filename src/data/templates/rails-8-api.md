# Rails 8 API Template

## Tech Stack
- rails v8.x
- Ruby 3.3+
- PostgreSQL
- Redis

## Core Patterns

### API Controller
```ruby
# app/controllers/api/v1/users_controller.rb
class Api::V1::UsersController < ApplicationController
  before_action :set_user, only: [:show, :update, :destroy]

  def index
    @users = User.page(params[:page]).per(20)
    render json: UserSerializer.new(@users).serializable_hash
  end

  def create
    @user = User.new(user_params)
    if @user.save
      render json: UserSerializer.new(@user), status: :created
    else
      render json: { errors: @user.errors }, status: :unprocessable_entity
    end
  end

  private

  def set_user
    @user = User.find(params[:id])
  end

  def user_params
    params.require(:user).permit(:email, :name, :password)
  end
end
```

### JWT Authentication
```ruby
# lib/json_web_token.rb
class JsonWebToken
  SECRET_KEY = Rails.application.secret_key_base

  def self.encode(payload, exp = 24.hours.from_now)
    payload[:exp] = exp.to_i
    JWT.encode(payload, SECRET_KEY)
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY)[0]
    HashWithIndifferentAccess.new(decoded)
  rescue JWT::DecodeError
    nil
  end
end
```

### Serializer
```ruby
# app/serializers/user_serializer.rb
class UserSerializer
  include JSONAPI::Serializer

  attributes :id, :email, :name, :created_at

  has_many :posts
end
```

## Common Commands

```bash
rails new my_api --api --database=postgresql
rails generate scaffold User email name
rails db:migrate
rails server
```

## Related Resources
- [Rails API Documentation](https://api.rubyonrails.org/)
