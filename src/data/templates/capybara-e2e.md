# Capybara E2E Testing Template

## Tech Stack
- capybara v3.x
- Ruby 3.x
- RSpec

## Core Patterns

### Basic Feature Test
```ruby
require 'rails_helper'

RSpec.feature 'User authentication', type: :feature do
  scenario 'User signs in' do
    visit new_user_session_path
    fill_in 'Email', with: 'user@example.com'
    fill_in 'Password', with: 'password'
    click_button 'Sign in'

    expect(page).to have_content 'Signed in successfully'
  end
end
```

### Page Object Pattern
```ruby
# support/pages/sign_in_page.rb
class SignInPage
  include Capybara::DSL

  def visit_page
    visit new_user_session_path
  end

  def sign_in(email, password)
    fill_in 'Email', with: email
    fill_in 'Password', with: password
    click_button 'Sign in'
  end
end

# usage
sign_in_page = SignInPage.new
sign_in_page.visit_page
sign_in_page.sign_in('user@example.com', 'password')
```

### Waiting
```ruby
# Wait for element
expect(page).to have_selector('.loading', visible: false)
expect(page).to have_content('Data loaded')

# Custom wait
using_wait_time 10 do
  expect(page).to have_content('Async content')
end
```

### Screenshots
```ruby
# Automatic on failure
Capybara::Screenshot.autosave_on_failure = true

# Manual
save_screenshot('debug.png')
```

## Common Commands

```bash
bundle add capybara
bundle exec rspec
```

## Related Resources
- [Capybara Documentation](https://github.com/teamcapybara/capybara)
