# Hardhat 以太坊智能合约开发模板

## 技术栈

- **核心框架**: Hardhat 2.x
- **智能合约语言**: Solidity ^0.8.x
- **测试框架**: Hardhat + Chai + ethers.js
- **部署**: Hardhat Ignition / scripts
- **网络**: Ethereum, Polygon, Arbitrum, Optimism
- **工具**: Hardhat Toolbox, TypeChain, Prettier

## 项目结构

```
my-hardhat-project/
├── contracts/              # 智能合约
│   ├── interfaces/         # 接口
│   │   └── IERC20.sol
│   ├── libraries/          # 库合约
│   │   └── SafeMath.sol
│   ├── mocks/              # Mock 合约（测试用）
│   │   └── MockERC20.sol
│   ├── utils/              # 工具合约
│   │   └── Address.sol
│   ├── tokens/             # 代币合约
│   │   ├── ERC20.sol
│   │   └── ERC721.sol
│   ├── DeFi/               # DeFi 协议
│   │   ├── DEX.sol
│   │   └── Lending.sol
│   ├── governance/         # 治理合约
│   │   └── Governor.sol
│   └── MyContract.sol      # 主合约
├── scripts/                # 部署脚本
│   ├── deploy.js
│   ├── upgrade.js
│   └── interact.js
├── test/                   # 测试文件
│   ├── unit/               # 单元测试
│   │   └── MyContract.js
│   ├── integration/        # 集成测试
│   │   └── full-flow.js
│   └── utils/              # 测试工具
│       └── helpers.js
├── ignition/               # Hardhat Ignition 模块
│   └── modules/
│       └── MyContract.js
├── typechain-types/        # TypeScript 类型（自动生成）
├── .env                    # 环境变量
├── .env.example            # 环境变量示例
├── hardhat.config.js       # Hardhat 配置
├── package.json
└── README.md
```

## 代码模式

### Hardhat 配置 (hardhat.config.js)

```javascript
require('@nomicfoundation/hardhat-toolbox')
require('@nomicfoundation/hardhat-ignition')
require('@nomicfoundation/hardhat-ethers')
require('@typechain/hardhat')
require('hardhat-gas-reporter')
require('solidity-coverage')
require('hardhat-deploy')
require('dotenv').config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true
          }
        }
      },
      evmVersion: 'paris'
    }
  },
  
  // 网络配置
  networks: {
    // 本地网络
    hardhat: {
      chainId: 31337,
      forking: {
        enabled: process.env.FORKING === 'true',
        url: process.env.MAINNET_RPC_URL || '',
        blockNumber: 18000000
      },
      mining: {
        auto: true,
        interval: 0
      }
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337
    },
    
    // 测试网
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || '',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: 'auto',
      gasMultiplier: 1.2
    },
    goerli: {
      url: process.env.GOERLI_RPC_URL || '',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 5
    },
    
    // 主网
    mainnet: {
      url: process.env.MAINNET_RPC_URL || '',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1,
      gasPrice: 'auto',
      gasMultiplier: 1.1
    },
    
    // Layer 2
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL || '',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 42161
    },
    optimism: {
      url: process.env.OPTIMISM_RPC_URL || '',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 10
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || '',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 137
    },
    polygonMumbai: {
      url: process.env.MUMBAI_RPC_URL || '',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001
    }
  },
  
  // Gas 报告
  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    gasPrice: 20,
    outputFile: 'gas-report.txt',
    noColors: true
  },
  
  // 代码覆盖率
  coverage: {
    skipFiles: ['contracts/mocks/', 'contracts/interfaces/']
  },
  
  // Etherscan 验证
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      sepolia: process.env.ETHERSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
      arbitrumOne: process.env.ARBISCAN_API_KEY,
      optimisticEthereum: process.env.OPTIMISTIC_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY
    }
  },
  
  // TypeChain 配置
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6',
    alwaysGenerateOverloads: false,
    externalArtifacts: ['externalArtifacts/*.json'],
    dontOverrideCompile: false
  },
  
  // Hardhat Ignition
  ignition: {
    maxFeeBumps: 5
  },
  
  // 预编译合约
  preprocess: {
    eachLine: (hre) => ({
      transform: (line) => {
        if (line.includes('// SPDX-License-Identifier: MIT')) {
          return line + ' // Modified by hardhat'
        }
        return line
      }
    })
  },
  
  // 路径配置
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
    ignition: './ignition'
  },
  
  // Mocha 配置
  mocha: {
    timeout: 40000,
    reporter: 'spec'
  }
}
```

### 智能合约示例 (contracts/)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IMyContract.sol";

/**
 * @title MyToken
 * @author Your Name
 * @notice ERC20 token with additional features
 * @dev Implements ERC20, ERC20Burnable, ERC20Permit, and Ownable
 */
contract MyToken is 
    ERC20, 
    ERC20Burnable, 
    ERC20Permit, 
    Ownable,
    IMyContract,
    ReentrancyGuard 
{
    // 状态变量
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18;
    uint256 public mintPrice = 0.001 ether;
    
    mapping(address => bool) public isWhitelisted;
    mapping(address => uint256) public userBalances;
    
    // 事件
    event Minted(address indexed to, uint256 amount);
    event PriceUpdated(uint256 newPrice);
    event Whitelisted(address indexed account, bool status);
    
    // 错误
    error MaxSupplyExceeded(uint256 requested, uint256 available);
    error InsufficientPayment(uint256 required, uint256 provided);
    error NotWhitelisted(address account);
    error TransferFailed();
    
    // 修饰符
    modifier onlyWhitelisted() {
        if (!isWhitelisted[msg.sender]) {
            revert NotWhitelisted(msg.sender);
        }
        _;
    }
    
    /**
     * @notice Constructor
     * @param initialOwner Initial owner address
     */
    constructor(address initialOwner) 
        ERC20("MyToken", "MTK") 
        ERC20Permit("MyToken") 
        Ownable(initialOwner)
    {
        _mint(initialOwner, 100_000 * 10**decimals());
    }
    
    /**
     * @notice Mint tokens by paying ETH
     * @param amount Amount of tokens to mint
     */
    function mint(uint256 amount) external payable nonReentrant {
        if (totalSupply() + amount > MAX_SUPPLY) {
            revert MaxSupplyExceeded(amount, MAX_SUPPLY - totalSupply());
        }
        
        uint256 requiredPayment = amount * mintPrice / 10**decimals();
        if (msg.value < requiredPayment) {
            revert InsufficientPayment(requiredPayment, msg.value);
        }
        
        _mint(msg.sender, amount);
        
        emit Minted(msg.sender, amount);
        
        // 退还多余 ETH
        if (msg.value > requiredPayment) {
            (bool success, ) = msg.sender.call{value: msg.value - requiredPayment}("");
            if (!success) revert TransferFailed();
        }
    }
    
    /**
     * @notice Update mint price (only owner)
     * @param newPrice New price per token
     */
    function updateMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
        emit PriceUpdated(newPrice);
    }
    
    /**
     * @notice Set whitelist status
     * @param account Address to whitelist
     * @param status Whitelist status
     */
    function setWhitelist(address account, bool status) external onlyOwner {
        isWhitelisted[account] = status;
        emit Whitelisted(account, status);
    }
    
    /**
     * @notice Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        if (!success) revert TransferFailed();
    }
    
    /**
     * @notice Get contract balance
     * @return Contract's ETH balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Override decimals
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
    
    // 接收 ETH
    receive() external payable {}
    fallback() external payable {}
}
```

### 接口示例 (contracts/interfaces/IMyContract.sol)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IMyContract
 * @notice Interface for MyContract
 */
interface IMyContract {
    function mint(uint256 amount) external payable;
    function updateMintPrice(uint256 newPrice) external;
    function setWhitelist(address account, bool status) external;
    function withdraw() external;
    function getBalance() external view returns (uint256);
    
    event Minted(address indexed to, uint256 amount);
    event PriceUpdated(uint256 newPrice);
    event Whitelisted(address indexed account, bool status);
}
```

### 部署脚本 (scripts/deploy.js)

```javascript
// scripts/deploy.js
const hre = require('hardhat')

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  
  console.log('Deploying contracts with account:', deployer.address)
  console.log('Account balance:', (await hre.ethers.provider.getBalance(deployer.address)).toString())
  
  // 部署 MyToken
  const MyToken = await hre.ethers.getContractFactory('MyToken')
  const myToken = await MyToken.deploy(deployer.address)
  await myToken.waitForDeployment()
  
  const tokenAddress = await myToken.getAddress()
  console.log('MyToken deployed to:', tokenAddress)
  
  // 验证合约（非本地网络）
  if (hre.network.name !== 'hardhat' && hre.network.name !== 'localhost') {
    console.log('Waiting for block confirmations...')
    await myToken.deploymentTransaction().wait(6)
    
    await hre.run('verify:verify', {
      address: tokenAddress,
      constructorArguments: [deployer.address]
    })
  }
  
  console.log('Deployment complete!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
```

### Hardhat Ignition 部署模块 (ignition/modules/MyContract.js)

```javascript
// ignition/modules/MyContract.js
const { buildModule } = require('@nomicfoundation/hardhat-ignition/modules')

module.exports = buildModule('MyContractModule', (m) => {
  const owner = m.getAccount(0)
  
  const myToken = m.contract('MyToken', [owner])
  
  // 初始化调用
  m.call(myToken, 'setWhitelist', [owner, true])
  
  return { myToken }
})
```

### 测试文件 (test/unit/MyContract.js)

```javascript
// test/unit/MyContract.js
const { expect } = require('chai')
const { ethers } = require('hardhat')
const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers')

describe('MyToken', function () {
  // Fixture for reusable test setup
  async function deployMyTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners()
    
    const MyToken = await ethers.getContractFactory('MyToken')
    const myToken = await MyToken.deploy(owner.address)
    await myToken.waitForDeployment()
    
    return { myToken, owner, addr1, addr2 }
  }
  
  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      const { myToken, owner } = await loadFixture(deployMyTokenFixture)
      
      expect(await myToken.owner()).to.equal(owner.address)
    })
    
    it('Should assign the total supply of tokens to the owner', async function () {
      const { myToken, owner } = await loadFixture(deployMyTokenFixture)
      
      const ownerBalance = await myToken.balanceOf(owner.address)
      expect(await myToken.totalSupply()).to.equal(ownerBalance)
    })
    
    it('Should have correct name and symbol', async function () {
      const { myToken } = await loadFixture(deployMyTokenFixture)
      
      expect(await myToken.name()).to.equal('MyToken')
      expect(await myToken.symbol()).to.equal('MTK')
    })
  })
  
  describe('Transactions', function () {
    it('Should transfer tokens between accounts', async function () {
      const { myToken, owner, addr1 } = await loadFixture(deployMyTokenFixture)
      
      // Transfer 50 tokens from owner to addr1
      await expect(myToken.transfer(addr1.address, 50))
        .to.changeTokenBalances(myToken, [owner, addr1], [-50, 50])
    })
    
    it('Should emit Transfer event', async function () {
      const { myToken, owner, addr1 } = await loadFixture(deployMyTokenFixture)
      
      await expect(myToken.transfer(addr1.address, 50))
        .to.emit(myToken, 'Transfer')
        .withArgs(owner.address, addr1.address, 50)
    })
    
    it('Should fail if sender doesn\'t have enough tokens', async function () {
      const { myToken, owner, addr1 } = await loadFixture(deployMyTokenFixture)
      
      const initialOwnerBalance = await myToken.balanceOf(owner.address)
      
      await expect(
        myToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance')
      
      expect(await myToken.balanceOf(owner.address)).to.equal(initialOwnerBalance)
    })
  })
  
  describe('Minting', function () {
    it('Should mint tokens when paying ETH', async function () {
      const { myToken, owner } = await loadFixture(deployMyTokenFixture)
      
      const mintAmount = ethers.parseUnits('100', 18)
      const mintPrice = await myToken.mintPrice()
      const requiredPayment = (mintAmount * mintPrice) / ethers.parseUnits('1', 18)
      
      await expect(
        myToken.mint(mintAmount, { value: requiredPayment })
      ).to.changeTokenBalance(myToken, owner, mintAmount)
    })
    
    it('Should revert if insufficient payment', async function () {
      const { myToken, addr1 } = await loadFixture(deployMyTokenFixture)
      
      const mintAmount = ethers.parseUnits('100', 18)
      
      await expect(
        myToken.connect(addr1).mint(mintAmount, { value: 0 })
      ).to.be.revertedWithCustomError(myToken, 'InsufficientPayment')
    })
    
    it('Should revert if max supply exceeded', async function () {
      const { myToken, owner } = await loadFixture(deployMyTokenFixture)
      
      const maxSupply = await myToken.MAX_SUPPLY()
      const currentSupply = await myToken.totalSupply()
      const mintAmount = maxSupply - currentSupply + 1n
      
      const mintPrice = await myToken.mintPrice()
      const requiredPayment = (mintAmount * mintPrice) / ethers.parseUnits('1', 18)
      
      await expect(
        myToken.mint(mintAmount, { value: requiredPayment })
      ).to.be.revertedWithCustomError(myToken, 'MaxSupplyExceeded')
    })
  })
  
  describe('Whitelist', function () {
    it('Should set whitelist correctly', async function () {
      const { myToken, owner, addr1 } = await loadFixture(deployMyTokenFixture)
      
      await expect(myToken.setWhitelist(addr1.address, true))
        .to.emit(myToken, 'Whitelisted')
        .withArgs(addr1.address, true)
      
      expect(await myToken.isWhitelisted(addr1.address)).to.be.true
    })
    
    it('Should only allow owner to set whitelist', async function () {
      const { myToken, addr1, addr2 } = await loadFixture(deployMyTokenFixture)
      
      await expect(
        myToken.connect(addr1).setWhitelist(addr2.address, true)
      ).to.be.revertedWithCustomError(myToken, 'OwnableUnauthorizedAccount')
    })
  })
  
  describe('Gas Usage', function () {
    it('Should report gas usage for transfer', async function () {
      const { myToken, owner, addr1 } = await loadFixture(deployMyTokenFixture)
      
      const tx = await myToken.transfer(addr1.address, 50)
      const receipt = await tx.wait()
      
      console.log(`Transfer gas used: ${receipt.gasUsed.toString()}`)
      
      expect(receipt.gasUsed).to.be.lessThan(100000)
    })
  })
})
```

### 升级合约 (scripts/upgrade.js)

```javascript
// scripts/upgrade.js
const hre = require('hardhat')

async function main() {
  const proxyAddress = '0x...' // 代理合约地址
  
  const MyTokenV2 = await hre.ethers.getContractFactory('MyTokenV2')
  
  console.log('Upgrading MyToken...')
  
  const upgraded = await hre.upgrades.upgradeProxy(proxyAddress, MyTokenV2)
  
  console.log('MyToken upgraded to:', await upgraded.getAddress())
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
```

## 最佳实践

### 1. 安全实践

```solidity
// 使用 ReentrancyGuard
contract MyContract is ReentrancyGuard {
    function withdraw() external nonReentrant {
        // ...
    }
}

// 使用 Checks-Effects-Interactions 模式
function withdraw() external {
    // Checks
    uint256 amount = balances[msg.sender];
    require(amount > 0, "Insufficient balance");
    
    // Effects
    balances[msg.sender] = 0;
    
    // Interactions
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
}

// 使用 SafeMath (Solidity < 0.8.0)
using SafeMath for uint256;

// 验证输入
function transfer(address to, uint256 amount) external {
    require(to != address(0), "Invalid address");
    require(amount > 0, "Invalid amount");
    // ...
}
```

### 2. Gas 优化

```solidity
// 使用 calldata 而不是 memory (外部函数)
function processArray(uint256[] calldata arr) external pure returns (uint256) {
    uint256 sum = 0;
    for (uint256 i = 0; i < arr.length; i++) {
        sum += arr[i];
    }
    return sum;
}

// 使用 unchecked (Solidity 0.8.0+)
for (uint256 i = 0; i < arr.length;) {
    // ...
    unchecked { i++; }
}

// 打包状态变量
contract Optimized {
    uint128 a; // 16 bytes
    uint128 b; // 16 bytes
    uint256 c; // 32 bytes
    // Total: 64 bytes (2 slots)
}

// 使用 constant 和 immutable
uint256 public constant DECIMALS = 18;
uint256 public immutable INITIAL_SUPPLY;

// 使用映射而不是数组 (查找)
mapping(address => bool) public isWhitelisted;
```

### 3. 代码组织

```solidity
// 使用库合约
library Math {
    function sqrt(uint256 x) internal pure returns (uint256) {
        // ...
    }
}

contract MyContract {
    using Math for uint256;
    
    function calculate(uint256 x) external pure returns (uint256) {
        return x.sqrt();
    }
}

// 使用接口
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

// 模块化设计
contract Token is ERC20, Ownable {
    // Token 逻辑
}

contract Vesting is Ownable {
    // Vesting 逻辑
}
```

### 4. 测试策略

```javascript
// 单元测试
describe('Unit tests', function () {
  it('Should work correctly', async function () {
    // 测试单个函数
  })
})

// 集成测试
describe('Integration tests', function () {
  it('Should interact with multiple contracts', async function () {
    // 测试多个合约交互
  })
})

// Fork 测试
describe('Fork tests', function () {
  it('Should work with mainnet state', async function () {
    // 使用 mainnet fork
  })
})

// 压力测试
describe('Stress tests', function () {
  it('Should handle many users', async function () {
    // 测试大量用户
  })
})
```

### 5. 升级策略

```solidity
// 使用代理模式
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract MyContractV1 is Initializable, UUPSUpgradeable {
    function initialize() public initializer {
        // 初始化逻辑
    }
    
    function _authorizeUpgrade(address) internal override onlyOwner {}
}

// V2 版本
contract MyContractV2 is MyContractV1 {
    // 新功能
}
```

### 6. 文档和注释

```solidity
/**
 * @title MyContract
 * @author Your Name
 * @notice This contract does X, Y, and Z
 * @dev Implements the following features:
 * - Feature 1
 * - Feature 2
 */
contract MyContract {
    /**
     * @notice Calculate the square root of a number
     * @dev Uses the Babylonian method for approximation
     * @param x The number to calculate the square root of
     * @return y The square root of x
     */
    function sqrt(uint256 x) external pure returns (uint256 y) {
        // ...
    }
}
```

## 常用命令

### 开发命令

```bash
# 初始化项目
npx hardhat init

# 编译合约
npx hardhat compile

# 清除缓存和构建
npx hardhat clean

# 运行测试
npx hardhat test

# 运行特定测试
npx hardhat test test/unit/MyContract.js

# 详细输出
npx hardhat test --verbose

# Gas 报告
REPORT_GAS=true npx hardhat test
```

### 网络命令

```bash
# 启动本地节点
npx hardhat node

# 连接到特定网络
npx hardhat console --network sepolia

# 部署到本地
npx hardhat run scripts/deploy.js

# 部署到测试网
npx hardhat run scripts/deploy.js --network sepolia

# 使用 Ignition 部署
npx hardhat ignition deploy ignition/modules/MyContract.js --network sepolia
```

### 验证命令

```bash
# 验证合约
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# 验证代理
npx hardhat verify --network sepolia <PROXY_ADDRESS>

# 验证并指定合约
npx hardhat verify --network sepolia <ADDRESS> --contract contracts/MyContract.sol:MyContract
```

### 工具命令

```bash
# 生成 TypeChain 类型
npx hardhat typechain

# 运行覆盖率测试
npx hardhat coverage

# 检查合约大小
npx hardhat size-contracts

# Gas 快照
npx hardhat gas-reporter

# Fork mainnet
npx hardhat node --fork <MAINNET_RPC_URL>
```

### 调试命令

```bash
# 调试交易
npx hardhat tx <TX_HASH>

# 检查存储槽
npx hardhat storage-layout

# 生成 ABI
npx hardhat export-abi

# 检查字节码
npx hardhat compile --show-stack-traces
```

## 部署配置

### 环境变量 (.env)

```bash
# 私钥（不要提交到 Git！）
PRIVATE_KEY=your_private_key_here

# RPC URLs
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
GOERLI_RPC_URL=https://eth-goerli.g.alchemy.com/v2/YOUR_KEY

# API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key

# Gas 报告
REPORT_GAS=true

# Forking
FORKING=false
```

### CI/CD 配置

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Compile contracts
        run: npx hardhat compile
      
      - name: Run tests
        run: npx hardhat test
      
      - name: Generate coverage
        run: npx hardhat coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### 部署脚本

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Compile contracts
        run: npx hardhat compile
      
      - name: Deploy to Sepolia
        run: npx hardhat run scripts/deploy.js --network sepolia
        env:
          PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}
          SEPOLIA_RPC_URL: ${{ secrets.SEPOLIA_RPC_URL }}
      
      - name: Verify on Etherscan
        run: npx hardhat verify --network sepolia ${{ steps.deploy.outputs.address }}
        env:
          ETHERSCAN_API_KEY: ${{ secrets.ETHERSCAN_API_KEY }}
```

### 监控脚本

```javascript
// scripts/monitor.js
const hre = require('hardhat')

async function main() {
  const contractAddress = '0x...'
  const myToken = await hre.ethers.getContractAt('MyToken', contractAddress)
  
  // 监听事件
  myToken.on('Transfer', (from, to, value, event) => {
    console.log(`Transfer: ${from} -> ${to}: ${value}`)
  })
  
  myToken.on('Minted', (to, amount, event) => {
    console.log(`Minted: ${to} received ${amount}`)
  })
  
  console.log('Monitoring events...')
}

main()
```

## 进阶功能

### 升级模式

```javascript
// scripts/deploy-upgradeable.js
const hre = require('hardhat')

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  
  const MyToken = await hre.ethers.getContractFactory('MyToken')
  
  console.log('Deploying proxy...')
  
  const proxy = await hre.upgrades.deployProxy(MyToken, [deployer.address], {
    initializer: 'initialize'
  })
  
  await proxy.waitForDeployment()
  
  console.log('Proxy deployed to:', await proxy.getAddress())
  console.log('Implementation at:', await hre.upgrades.erc1967.getImplementationAddress(await proxy.getAddress()))
}
```

### 多签名钱包

```solidity
// contracts/MultiSigWallet.sol
pragma solidity ^0.8.24;

contract MultiSigWallet {
    uint256 public required;
    address[] public owners;
    mapping(address => bool) public isOwner;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
    }
    
    Transaction[] public transactions;
    
    event Submission(uint256 indexed txId);
    event Confirmation(address indexed owner, uint256 indexed txId);
    event Execution(uint256 indexed txId);
    
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }
    
    modifier txExists(uint256 txId) {
        require(txId < transactions.length, "Transaction does not exist");
        _;
    }
    
    modifier notExecuted(uint256 txId) {
        require(!transactions[txId].executed, "Transaction already executed");
        _;
    }
    
    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0, "Owners required");
        require(_required > 0 && _required <= _owners.length, "Invalid required");
        
        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");
            
            isOwner[owner] = true;
            owners.push(owner);
        }
        
        required = _required;
    }
    
    function submit(address to, uint256 value, bytes calldata data) external onlyOwner {
        transactions.push(Transaction({
            to: to,
            value: value,
            data: data,
            executed: false
        }));
        
        emit Submission(transactions.length - 1);
    }
    
    function confirm(uint256 txId) external onlyOwner txExists(txId) notExecuted(txId) {
        confirmations[txId][msg.sender] = true;
        emit Confirmation(msg.sender, txId);
        
        if (isConfirmed(txId)) {
            execute(txId);
        }
    }
    
    function execute(uint256 txId) internal txExists(txId) notExecuted(txId) {
        require(isConfirmed(txId), "Not confirmed");
        
        Transaction storage txn = transactions[txId];
        txn.executed = true;
        
        (bool success, ) = txn.to.call{value: txn.value}(txn.data);
        require(success, "Transaction failed");
        
        emit Execution(txId);
    }
    
    function isConfirmed(uint256 txId) public view returns (bool) {
        uint256 count = 0;
        for (uint256 i = 0; i < owners.length; i++) {
            if (confirmations[txId][owners[i]]) {
                count++;
            }
        }
        return count >= required;
    }
}
```

### Oracle 集成

```solidity
// contracts/PriceOracle.sol
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceOracle {
    AggregatorV3Interface internal priceFeed;
    
    constructor(address _priceFeed) {
        priceFeed = AggregatorV3Interface(_priceFeed);
    }
    
    function getLatestPrice() public view returns (int256) {
        (
            uint80 roundID,
            int256 price,
            uint256 startedAt,
            uint256 timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        
        return price;
    }
    
    function getDecimals() public view returns (uint8) {
        return priceFeed.decimals();
    }
}
```

## 工具集成

### Slither 静态分析

```bash
# 安装 Slither
pip install slither-analyzer

# 运行分析
slither .

# 生成报告
slither . --print human-summary
```

### Mythril 安全分析

```bash
# 安装 Mythril
pip install mythril

# 运行分析
myth analyze contracts/MyContract.sol

# 指定 Solidity 版本
myth analyze contracts/MyContract.sol --solv 0.8.24
```

### Echidna 模糊测试

```yaml
# echidna.yaml
testMode: assertion
testLimit: 50000
deployer: "0x00a329c0648769a73afac7f9381e08fb43dbea70"
```

```solidity
// contracts/EchidnaTest.sol
pragma solidity ^0.8.24;

contract EchidnaTest {
    bool private pass = true;
    
    function setPass(bool _pass) public {
        pass = _pass;
    }
    
    function echidna_pass() public view returns (bool) {
        return pass;
    }
}
```

```bash
# 运行 Echidna
echidna contracts/EchidnaTest.sol --contract EchidnaTest --config echidna.yaml
```

### Tenderly 调试

```javascript
// hardhat.config.js
{
  tenderly: {
    project: 'your-project',
    username: 'your-username'
  }
}
```

```bash
# 上传到 Tenderly
npx hardhat tenderly:push <CONTRACT_ADDRESS>
```

## 故障排查

### 常见问题

1. **编译错误**
   ```bash
   # 清除缓存
   npx hardhat clean
   rm -rf artifacts cache
   
   # 检查 Solidity 版本
   npx hardhat compile --show-stack-traces
   ```

2. **测试失败**
   ```bash
   # 详细输出
   npx hardhat test --verbose
   
   # 运行单个测试
   npx hardhat test test/unit/MyContract.js --grep "should transfer"
   ```

3. **Gas 估算失败**
   ```bash
   # 手动指定 gas limit
   await myToken.mint(amount, { gasLimit: 100000 })
   ```

4. **网络连接问题**
   ```bash
   # 检查 RPC URL
   curl -X POST -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
     $RPC_URL
   ```

5. **验证失败**
   ```bash
   # 手动验证
   npx hardhat verify --network sepolia <ADDRESS> --contract contracts/MyContract.sol:MyContract
   ```

### 调试技巧

```javascript
// 使用 console.log
import "hardhat/console.sol";

contract MyContract {
    function test() public {
        console.log("Value:", value);
    }
}

// 使用 Hardhat 网络堆栈跟踪
try {
    await myToken.transfer(addr1.address, amount)
} catch (error) {
    console.error(error)
}

// 使用 ethers.js 调试
const tx = await myToken.transfer(addr1.address, amount)
const receipt = await tx.wait()
console.log('Events:', receipt.events)
```

### 性能优化

```javascript
// 使用 Promise.all 并行执行
const [balance1, balance2] = await Promise.all([
    token.balanceOf(addr1.address),
    token.balanceOf(addr2.address)
])

// 使用批量请求
const multicall = await ethers.getContractAt('Multicall', MULTICALL_ADDRESS)
const results = await multicall.aggregate(calls)

// 缓存部署
const { deploy } = deployments
await deploy('MyContract', {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true
})
```
