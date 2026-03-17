# Oclif CLI Template

## Project Overview

Build professional command-line interfaces with Oclif - Heroku's CLI framework. Create powerful CLIs with auto-generated help, argument parsing, and plugin architecture.

## Tech Stack

- **Framework**: Oclif 4
- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Build**: tsup
- **Testing**: Mocha / Jest

## Project Structure

```
my-cli/
├── src/
│   ├── commands/
│   │   ├── hello.ts          # Basic command
│   │   ├── user/
│   │   │   ├── create.ts     # Nested command: user:create
│   │   │   └── list.ts
│   │   └── config.ts
│   ├── hooks/
│   │   ├── init.ts           # Run on startup
│   │   └── prerun.ts         # Before command
│   ├── lib/
│   │   ├── api.ts            # API client
│   │   └── config.ts         # Config management
│   └── index.ts              # Main entry
├── bin/
│   ├── run.js                # Dev runner
│   └── dev.js                # Dev mode
├── test/
│   ├── commands/
│   │   └── hello.test.ts
│   └── tsconfig.json
├── package.json
├── tsconfig.json
└── .mocharc.json
```

## Key Patterns

### 1. Basic Command

```typescript
// src/commands/hello.ts
import { Command, Flags } from '@oclif/core';

export default class Hello extends Command {
  static description = 'Say hello to someone';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --name John',
    '<%= config.bin %> <%= command.id %> -n Jane -f',
  ];

  static flags = {
    name: Flags.string({
      char: 'n',
      description: 'name to say hello to',
      default: 'World',
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'force greeting',
    }),
  };

  static args = {
    person: Args.string({
      description: 'Person to greet',
      required: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Hello);
    
    const name = args.person || flags.name;
    
    if (flags.force) {
      this.log(`Forcefully saying hello to ${name}!`);
    } else {
      this.log(`hello ${name}`);
    }
  }
}
```

### 2. Command with API Integration

```typescript
// src/commands/user/list.ts
import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import { cli } from 'cli-ux';
import { APIClient } from '../../lib/api';

export default class UserList extends Command {
  static description = 'List all users';

  static flags = {
    page: Flags.integer({
      char: 'p',
      description: 'Page number',
      default: 1,
    }),
    limit: Flags.integer({
      char: 'l',
      description: 'Items per page',
      default: 20,
    }),
    json: Flags.boolean({
      description: 'Output as JSON',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(UserList);
    const api = new APIClient(this.config);

    try {
      cli.action.start('Fetching users');
      const { users, total } = await api.getUsers(flags.page, flags.limit);
      cli.action.stop();

      if (flags.json) {
        console.log(JSON.stringify(users, null, 2));
        return;
      }

      cli.table(users, {
        id: { header: 'ID' },
        name: { header: 'Name' },
        email: { header: 'Email' },
        createdAt: {
          header: 'Created',
          get: (row) => new Date(row.createdAt).toLocaleDateString(),
        },
      }, {
        printLine: this.log,
      });

      this.log(`\nShowing ${users.length} of ${total} users`);
    } catch (error: any) {
      this.error(error.message);
    }
  }
}
```

### 3. Interactive Command

```typescript
// src/commands/user/create.ts
import { Command, Flags } from '@oclif/core';
import { cli } from 'cli-ux';
import chalk from 'chalk';
import * as inquirer from 'inquirer';

export default class UserCreate extends Command {
  static description = 'Create a new user';

  static flags = {
    name: Flags.string({
      char: 'n',
      description: 'User name',
    }),
    email: Flags.string({
      char: 'e',
      description: 'User email',
    }),
    role: Flags.string({
      char: 'r',
      description: 'User role',
      options: ['admin', 'user', 'guest'],
    }),
    interactive: Flags.boolean({
      char: 'i',
      description: 'Interactive mode',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(UserCreate);

    let { name, email, role } = flags;

    // Interactive mode
    if (flags.interactive || !name || !email) {
      const responses = await inquirer.prompt([
        {
          name: 'name',
          message: 'What is the user name?',
          type: 'input',
          default: name,
          validate: (input) => input.length > 0 || 'Name is required',
        },
        {
          name: 'email',
          message: 'What is the email?',
          type: 'input',
          default: email,
          validate: (input) => 
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input) || 'Invalid email',
        },
        {
          name: 'role',
          message: 'Select a role',
          type: 'list',
          choices: ['admin', 'user', 'guest'],
          default: role || 'user',
        },
      ]);

      name = responses.name;
      email = responses.email;
      role = responses.role;
    }

    // Confirm creation
    const confirmed = await cli.confirm(
      `Create user ${chalk.cyan(name)} (${email}) with role ${chalk.yellow(role!)}? [y/n]`
    );

    if (!confirmed) {
      this.log('Aborted');
      return;
    }

    // Create user
    cli.action.start('Creating user');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    cli.action.stop();

    this.log(chalk.green('✓ User created successfully'));
    this.log(`  ID: ${chalk.cyan(crypto.randomUUID())}`);
    this.log(`  Name: ${name}`);
    this.log(`  Email: ${email}`);
    this.log(`  Role: ${role}`);
  }
}
```

### 4. Configuration Management

```typescript
// src/lib/config.ts
import { Config } from '@oclif/core';
import * as fs from 'fs-extra';
import * as path from 'path';

interface AppConfig {
  apiToken?: string;
  apiUrl?: string;
  defaultOrg?: string;
}

export class ConfigManager {
  private configPath: string;

  constructor(private oclifConfig: Config) {
    this.configPath = path.join(this.oclifConfig.configDir, 'config.json');
  }

  async load(): Promise<AppConfig> {
    try {
      const config = await fs.readJson(this.configPath);
      return config;
    } catch {
      return {};
    }
  }

  async save(config: AppConfig): Promise<void> {
    await fs.ensureDir(path.dirname(this.configPath));
    await fs.writeJson(this.configPath, config, { spaces: 2 });
  }

  async get<K extends keyof AppConfig>(key: K): Promise<AppConfig[K] | undefined> {
    const config = await this.load();
    return config[key];
  }

  async set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): Promise<void> {
    const config = await this.load();
    config[key] = value;
    await this.save(config);
  }

  async clear(): Promise<void> {
    await fs.remove(this.configPath);
  }
}
```

### 5. Hooks

```typescript
// src/hooks/init.ts
import { Hook } from '@oclif/core';
import { checkForUpdate } from '../lib/updater';

const hook: Hook<'init'> = async function (options) {
  // Check for CLI updates
  if (process.env.NODE_ENV !== 'development') {
    const update = await checkForUpdate(options.config);
    if (update) {
      console.log(`\n  Update available: ${update.version}`);
      console.log(`  Run ${options.config.bin} update to install\n`);
    }
  }
};

export default hook;
```

```typescript
// src/hooks/prerun.ts
import { Hook } from '@oclif/core';
import { ConfigManager } from '../lib/config';

const hook: Hook<'prerun'> = async function (options) {
  // Skip auth check for certain commands
  const skipAuth = ['login', 'logout', 'help', 'version', 'update'];
  
  if (skipAuth.includes(options.Command.id || '')) {
    return;
  }

  // Check authentication
  const config = new ConfigManager(options.config);
  const token = await config.get('apiToken');

  if (!token) {
    console.error('Not logged in. Please run: ' + options.config.bin + ' login');
    process.exit(1);
  }
};

export default hook;
```

### 6. Plugin System

```typescript
// src/plugins/custom.ts
import { Command, Plugin } from '@oclif/core';

export class CustomPlugin extends Plugin {
  constructor(config: Config, base: string) {
    super(config, base);
  }

  async load(): Promise<void> {
    await super.load();
    // Load plugin commands
  }

  get commands(): Command.Class[] {
    return [
      // Custom commands
    ];
  }
}
```

```json
// package.json (plugin)
{
  "name": "my-cli-plugin-custom",
  "version": "1.0.0",
  "oclif": {
    "commands": "./lib/commands",
    "bin": "my-cli",
    "devPlugins": ["@oclif/plugin-help"]
  },
  "dependencies": {
    "@oclif/core": "^4.0.0"
  }
}
```

## Configuration

### package.json

```json
{
  "name": "my-cli",
  "version": "1.0.0",
  "description": "My awesome CLI",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "my-cli": "./bin/run.js"
  },
  "scripts": {
    "build": "tsup",
    "dev": "./bin/dev.js",
    "lint": "eslint src test",
    "test": "mocha --forbid-only test/**/*.test.ts",
    "postpack": "shx rm -f oclif.manifest.json",
    "prepack": "tsup && oclif manifest && oclif readme",
    "version": "oclif readme && git add README.md"
  },
  "dependencies": {
    "@oclif/core": "^4.0.0",
    "@oclif/plugin-help": "^6.0.0",
    "@oclif/plugin-plugins": "^5.0.0",
    "@oclif/plugin-update": "^4.0.0",
    "@oclif/plugin-version": "^2.0.0",
    "@oclif/plugin-warn-if-update-available": "^3.0.0",
    "chalk": "^5.3.0",
    "cli-ux": "^6.2.0",
    "fs-extra": "^11.2.0",
    "inquirer": "^9.2.0"
  },
  "devDependencies": {
    "@oclif/test": "^4.0.0",
    "@types/chai": "^4.3.0",
    "@types/fs-extra": "^11.0.0",
    "@types/inquirer": "^9.0.0",
    "@types/mocha": "^10.0.0",
    "@types/node": "^20.0.0",
    "chai": "^4.3.0",
    "eslint": "^8.57.0",
    "mocha": "^10.4.0",
    "shx": "^0.3.0",
    "tsup": "^8.0.0",
    "typescript": "^5.4.0"
  },
  "oclif": {
    "bin": "my-cli",
    "dirname": "my-cli",
    "commands": "./dist/commands",
    "plugins": [
      "@oclif/plugin-help",
      "@oclif/plugin-plugins",
      "@oclif/plugin-update",
      "@oclif/plugin-version",
      "@oclif/plugin-warn-if-update-available"
    ],
    "topicSeparator": " ",
    "topics": {
      "user": {
        "description": "Manage users"
      },
      "config": {
        "description": "CLI configuration"
      }
    },
    "update": {
      "s3": {
        "bucket": "my-cli-updates"
      }
    }
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "files": [
    "/bin",
    "/dist",
    "/oclif.manifest.json"
  ]
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Development

### Setup

```bash
# Create new CLI project
npx oclif generate my-cli

# Or with specific options
npx oclif generate my-cli --yes

# Install dependencies
cd my-cli
npm install

# Run in development
./bin/dev.js hello

# Build
npm run build

# Run built version
./bin/run hello
```

### Generate Commands

```bash
# Generate new command
npx oclif generate command user:create

# Generate hook
npx oclif generate hook init

# Generate plugin
npx oclif generate plugin my-plugin
```

## Testing

```typescript
// test/commands/hello.test.ts
import { expect, test } from '@oclif/test';

describe('hello', () => {
  test
    .stdout()
    .command(['hello'])
    .it('runs hello', (ctx) => {
      expect(ctx.stdout).to.contain('hello World');
    });

  test
    .stdout()
    .command(['hello', '--name', 'John'])
    .it('runs hello --name John', (ctx) => {
      expect(ctx.stdout).to.contain('hello John');
    });

  test
    .stdout()
    .command(['hello', 'Jane'])
    .it('runs hello Jane', (ctx) => {
      expect(ctx.stdout).to.contain('hello Jane');
    });

  test
    .stdout()
    .stderr()
    .command(['hello', '--invalid'])
    .exit(2)
    .it('shows error on invalid flag', (ctx) => {
      expect(ctx.stderr).to.contain('Unexpected argument');
    });
});
```

### Mock API

```typescript
// test/helpers/mock-api.ts
import nock from 'nock';

export function mockAPI() {
  return nock('https://api.example.com')
    .get('/users')
    .reply(200, {
      users: [
        { id: '1', name: 'John', email: 'john@example.com' },
        { id: '2', name: 'Jane', email: 'jane@example.com' },
      ],
      total: 2,
    });
}

// test/commands/user/list.test.ts
import { expect, test } from '@oclif/test';
import { mockAPI } from '../../helpers/mock-api';

describe('user:list', () => {
  test
    .stdout()
    .do(() => mockAPI())
    .command(['user:list'])
    .it('lists users', (ctx) => {
      expect(ctx.stdout).to.contain('John');
      expect(ctx.stdout).to.contain('john@example.com');
    });
});
```

## Deployment

### Build

```bash
# Build for current platform
npm run build

# Generate manifest
npx oclif manifest

# Pack
npm pack
```

### Multi-platform Build

```bash
# Install oclif pack CLI
npm install -g @oclif/plugin-pack

# Build for all platforms
npx oclif pack

# Build for specific platform
npx oclif pack:macos
npx oclif pack:win
npx oclif pack:deb
npx oclif pack:rpm
```

### NPM Publishing

```bash
# Login to npm
npm login

# Publish
npm publish

# Users install globally
npm install -g my-cli
```

### Auto-Update

```typescript
// Configure in package.json
{
  "oclif": {
    "update": {
      "s3": {
        "bucket": "my-cli-updates",
        "xz": true
      },
      "node": {
        "version": "18.17.0"
      }
    }
  }
}
```

```bash
# Upload to S3
npx oclif upload

# Users update
my-cli update
```

## Best Practices

### 1. Error Handling

```typescript
import { Command } from '@oclif/core';

export default class MyCommand extends Command {
  async run() {
    try {
      // Command logic
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        this.error('Cannot connect to API. Is it running?');
      }
      
      if (error.response?.status === 401) {
        this.error('Not authenticated. Run: ' + this.config.bin + ' login');
      }
      
      this.error(error.message);
    }
  }
}
```

### 2. Progress Indicators

```typescript
import { cli } from 'cli-ux';

// Spinner
cli.action.start('Processing');
await longRunningTask();
cli.action.stop('Done');

// Progress bar
cli.progress.start(100, 0);
for (let i = 0; i < 100; i++) {
  await processItem(i);
  cli.progress.update(i + 1);
}
cli.progress.stop();
```

### 3. Color Output

```typescript
import chalk from 'chalk';

this.log(chalk.green('✓ Success'));
this.log(chalk.yellow('⚠ Warning'));
this.log(chalk.red('✗ Error'));
this.log(chalk.cyan('Info'));
this.log(chalk.gray('Muted text'));
```

### 4. Subcommands

```typescript
// src/commands/user/index.ts
import { Command } from '@oclif/core';

export default class User extends Command {
  static description = 'Manage users';
  static examples = [
    '<%= config.bin %> <%= command.id %> list',
    '<%= config.bin %> <%= command.id %> create',
    '<%= config.bin %> <%= command.id %> delete',
  ];

  async run() {
    const { args, flags } = await this.parse(User);
    this.log('Run --help for available subcommands');
  }
}
```

### 5. Environment Variables

```typescript
// Use .env files
import * as dotenv from 'dotenv';

export default class MyCommand extends Command {
  async init() {
    dotenv.config();
    await super.init();
  }

  async run() {
    const apiUrl = process.env.API_URL || 'https://api.default.com';
    // ...
  }
}
```

## Resources

- [Oclif Documentation](https://oclif.io/)
- [Oclif GitHub](https://github.com/oclif/oclif)
- [CLI UX Guide](https://oclif.io/docs/ux_guidelines)
- [Examples](https://github.com/oclif/oclif/tree/main/examples)
