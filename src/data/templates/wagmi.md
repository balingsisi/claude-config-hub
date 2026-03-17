# Wagmi React Hooks for Ethereum 模板

## 技术栈

- **核心库**: Wagmi 2.x
- **React**: React 18+
- **类型**: TypeScript 5.x
- **构建工具**: Vite / Next.js
- **钱包连接**: RainbowKit / ConnectKit / Web3Modal
- **数据查询**: TanStack Query
- **测试**: Vitest + Testing Library

## 项目结构

```
my-wagmi-app/
├── src/
│   ├── components/          # React 组件
│   │   ├── ConnectWallet.tsx
│   │   ├── AccountInfo.tsx
│   │   ├── Balance.tsx
│   │   ├── TokenTransfer.tsx
│   │   ├── ContractInteraction.tsx
│   │   ├── NetworkSwitcher.tsx
│   │   └── TransactionHistory.tsx
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useContract.ts
│   │   ├── useTokenBalance.ts
│   │   └── useCustomSigner.ts
│   ├── lib/                 # 工具库
│   │   ├── wagmi.ts         # Wagmi 配置
│   │   ├── chains.ts        # 链配置
│   │   └── contracts.ts     # 合约 ABI
│   ├── pages/               # 页面（Next.js）
│   │   ├── _app.tsx
│   │   └── index.tsx
│   ├── types/               # TypeScript 类型
│   │   └── index.ts
│   ├── utils/               # 工具函数
│   │   ├── format.ts
│   │   └── validation.ts
│   └── App.tsx              # 主应用（Vite）
├── public/                  # 静态资源
├── .env                     # 环境变量
├── .env.example             # 环境变量示例
├── package.json
├── tsconfig.json
├── vite.config.ts           # Vite 配置
└── README.md
```

## 代码模式

### Wagmi 配置 (src/lib/wagmi.ts)

```typescript
// src/lib/wagmi.ts
import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, polygon, arbitrum, optimism } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID

export const config = createConfig({
  chains: [mainnet, sepolia, polygon, arbitrum, optimism],
  connectors: [
    injected(),
    walletConnect({ projectId }),
    coinbaseWallet({
      appName: 'My Wagmi App',
    }),
  ],
  transports: {
    [mainnet.id]: http(
      `https://eth-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    ),
    [sepolia.id]: http(
      `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    ),
    [polygon.id]: http(
      `https://polygon-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    ),
    [arbitrum.id]: http(
      `https://arb-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    ),
    [optimism.id]: http(
      `https://opt-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    ),
  },
})

// 类型推断
export type Config = typeof config
declare module 'wagmi' {
  export interface Register {
    config: Config
  }
}
```

### 钱包连接组件 (src/components/ConnectWallet.tsx)

```typescript
// src/components/ConnectWallet.tsx
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'

export function ConnectWallet() {
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { open } = useWeb3Modal()
  const { data: balance } = useBalance({
    address,
  })

  if (!isConnected) {
    return (
      <button
        onClick={() => open()}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Connect Wallet
      </button>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="px-4 py-2 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">Connected to {chain?.name}</p>
          <p className="font-mono text-sm">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>
        
        <button
          onClick={() => open()}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          Change
        </button>
        
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Disconnect
        </button>
      </div>
      
      {balance && (
        <div className="px-4 py-2 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Balance</p>
          <p className="font-mono">
            {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
          </p>
        </div>
      )}
    </div>
  )
}
```

### 账户信息组件 (src/components/AccountInfo.tsx)

```typescript
// src/components/AccountInfo.tsx
import { useAccount, useBalance, useEnsName, useEnsAvatar } from 'wagmi'

export function AccountInfo() {
  const { address, isConnected, chain } = useAccount()
  
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
    watch: true, // 实时更新
  })
  
  const { data: ensName } = useEnsName({
    address,
    chainId: 1,
  })
  
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName,
    chainId: 1,
  })

  if (!isConnected) {
    return <p className="text-gray-500">Not connected</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {ensAvatar && (
          <img
            src={ensAvatar}
            alt="ENS Avatar"
            className="w-12 h-12 rounded-full"
          />
        )}
        <div>
          {ensName && (
            <p className="font-semibold text-lg">{ensName}</p>
          )}
          <p className="font-mono text-sm text-gray-600">
            {address?.slice(0, 10)}...{address?.slice(-8)}
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Network:</span>
          <span className="font-semibold">{chain?.name}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Balance:</span>
          <span className="font-mono">
            {balanceLoading ? (
              <span className="text-gray-400">Loading...</span>
            ) : (
              `${parseFloat(balance?.formatted || '0').toFixed(4)} ${balance?.symbol}`
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
```

### 代币转账组件 (src/components/TokenTransfer.tsx)

```typescript
// src/components/TokenTransfer.tsx
import { useState } from 'react'
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { ERC20_ABI } from '../lib/contracts'

interface TokenTransferProps {
  tokenAddress: `0x${string}`
  tokenSymbol: string
  tokenDecimals: number
}

export function TokenTransfer({
  tokenAddress,
  tokenSymbol,
  tokenDecimals,
}: TokenTransferProps) {
  const { address } = useAccount()
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  
  const { data: balance } = useBalance({
    address,
    token: tokenAddress,
  })
  
  const { writeContract, data: hash, isPending } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })
  
  const handleTransfer = () => {
    if (!to || !amount) return
    
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [to, parseUnits(amount, tokenDecimals)],
    })
  }
  
  const maxAmount = balance
    ? formatUnits(balance.value, tokenDecimals)
    : '0'
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Recipient Address
        </label>
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="0x..."
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setAmount(maxAmount)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            Max
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Balance: {parseFloat(maxAmount).toFixed(4)} {tokenSymbol}
        </p>
      </div>
      
      <button
        onClick={handleTransfer}
        disabled={isPending || isConfirming || !to || !amount}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
      >
        {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : `Transfer ${tokenSymbol}`}
      </button>
      
      {hash && (
        <div className="p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">Transaction Hash:</p>
          <a
            href={`https://etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-mono text-sm break-all"
          >
            {hash}
          </a>
          
          {isSuccess && (
            <p className="mt-2 text-green-600 font-semibold">✓ Transfer successful!</p>
          )}
        </div>
      )}
    </div>
  )
}
```

### 合约交互组件 (src/components/ContractInteraction.tsx)

```typescript
// src/components/ContractInteraction.tsx
import { useState } from 'react'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { MY_CONTRACT_ABI } from '../lib/contracts'

const CONTRACT_ADDRESS = '0x...' as `0x${string}`

export function ContractInteraction() {
  const { address, isConnected } = useAccount()
  const [mintAmount, setMintAmount] = useState('')
  
  // 读取合约数据
  const { data: totalSupply, refetch: refetchSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MY_CONTRACT_ABI,
    functionName: 'totalSupply',
  })
  
  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MY_CONTRACT_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address,
    },
  })
  
  const { data: mintPrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MY_CONTRACT_ABI,
    functionName: 'mintPrice',
  })
  
  // 写入合约
  const { writeContract, data: hash, isPending } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })
  
  const handleMint = () => {
    if (!mintAmount || !mintPrice) return
    
    const amount = parseUnits(mintAmount, 18)
    const value = (amount * (mintPrice as bigint)) / parseUnits('1', 18)
    
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: MY_CONTRACT_ABI,
      functionName: 'mint',
      args: [amount],
      value,
    })
  }
  
  const handleSetWhitelist = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: MY_CONTRACT_ABI,
      functionName: 'setWhitelist',
      args: [address, true],
    })
  }
  
  if (!isConnected) {
    return <p className="text-gray-500">Please connect your wallet</p>
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Supply</p>
          <p className="font-mono text-lg">
            {totalSupply ? formatUnits(totalSupply as bigint, 18) : '0'}
          </p>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Your Balance</p>
          <p className="font-mono text-lg">
            {balance ? formatUnits(balance as bigint, 18) : '0'}
          </p>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Mint Price</p>
        <p className="font-mono text-lg">
          {mintPrice ? `${formatUnits(mintPrice as bigint, 18)} ETH` : '0 ETH'}
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mint Amount
          </label>
          <input
            type="text"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            placeholder="0.0"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          onClick={handleMint}
          disabled={isPending || isConfirming || !mintAmount}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Mint'}
        </button>
        
        <button
          onClick={handleSetWhitelist}
          disabled={isPending}
          className="w-full px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          Add to Whitelist
        </button>
      </div>
      
      {hash && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">Transaction Hash:</p>
          <a
            href={`https://etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-mono text-sm break-all"
          >
            {hash}
          </a>
          
          {isSuccess && (
            <>
              <p className="mt-2 text-green-600 font-semibold">✓ Transaction successful!</p>
              <button
                onClick={() => refetchSupply()}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh Data
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

### 网络切换组件 (src/components/NetworkSwitcher.tsx)

```typescript
// src/components/NetworkSwitcher.tsx
import { useAccount, useSwitchChain, useChainId } from 'wagmi'
import { mainnet, sepolia, polygon, arbitrum, optimism } from 'wagmi/chains'

const chains = [
  { id: mainnet.id, name: 'Ethereum', color: 'bg-blue-500' },
  { id: sepolia.id, name: 'Sepolia', color: 'bg-yellow-500' },
  { id: polygon.id, name: 'Polygon', color: 'bg-purple-500' },
  { id: arbitrum.id, name: 'Arbitrum', color: 'bg-cyan-500' },
  { id: optimism.id, name: 'Optimism', color: 'bg-red-500' },
]

export function NetworkSwitcher() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()
  
  if (!isConnected) {
    return null
  }
  
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Switch Network</p>
      <div className="grid grid-cols-2 gap-2">
        {chains.map((chain) => {
          const isCurrent = chainId === chain.id
          
          return (
            <button
              key={chain.id}
              onClick={() => switchChain({ chainId: chain.id })}
              disabled={isCurrent || isPending}
              className={`
                px-4 py-2 rounded-lg flex items-center gap-2 transition
                ${isCurrent
                  ? 'bg-gray-100 cursor-not-allowed'
                  : 'bg-white border hover:bg-gray-50'
                }
              `}
            >
              <div className={`w-3 h-3 rounded-full ${chain.color}`} />
              <span className="text-sm">{chain.name}</span>
              {isCurrent && <span className="text-xs text-gray-500">(Current)</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

### 交易历史组件 (src/components/TransactionHistory.tsx)

```typescript
// src/components/TransactionHistory.tsx
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  timestamp: number
  status: 'success' | 'failed' | 'pending'
}

export function TransactionHistory() {
  const { address } = useAccount()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  
  // 从 Etherscan API 获取交易历史
  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions', address],
    queryFn: async () => {
      if (!address) return []
      
      const response = await fetch(
        `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${import.meta.env.VITE_ETHERSCAN_API_KEY}`
      )
      
      const result = await response.json()
      
      return result.result.slice(0, 10).map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: (parseInt(tx.value) / 1e18).toFixed(4),
        timestamp: parseInt(tx.timeStamp),
        status: tx.isError === '0' ? 'success' : 'failed',
      }))
    },
    enabled: !!address,
  })
  
  useEffect(() => {
    if (data) {
      setTransactions(data)
    }
  }, [data])
  
  if (!address) {
    return null
  }
  
  if (isLoading) {
    return <p className="text-gray-500">Loading transactions...</p>
  }
  
  if (error) {
    return <p className="text-red-500">Error loading transactions</p>
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Recent Transactions</h3>
      
      <div className="space-y-2">
        {transactions.map((tx) => (
          <div
            key={tx.hash}
            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <div className="flex justify-between items-start mb-2">
              <a
                href={`https://etherscan.io/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-mono text-sm"
              >
                {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
              </a>
              
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  tx.status === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {tx.status}
              </span>
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">From:</span>{' '}
                <span className="font-mono">
                  {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
                </span>
              </p>
              <p>
                <span className="font-medium">To:</span>{' '}
                <span className="font-mono">
                  {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                </span>
              </p>
              <p>
                <span className="font-medium">Value:</span> {tx.value} ETH
              </p>
              <p>
                <span className="font-medium">Time:</span>{' '}
                {new Date(tx.timestamp * 1000).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 自定义 Hook (src/hooks/useContract.ts)

```typescript
// src/hooks/useContract.ts
import { useReadContract, useWriteContract } from 'wagmi'
import { useMemo } from 'react'

export function useContract(
  address: `0x${string}`,
  abi: any[],
  functionName: string,
  args?: any[]
) {
  const read = useReadContract({
    address,
    abi,
    functionName,
    args,
  })
  
  const { writeContract, ...write } = useWriteContract()
  
  const writeFunc = useMemo(() => {
    return (writeArgs?: any[], overrides?: any) => {
      writeContract({
        address,
        abi,
        functionName,
        args: writeArgs,
        ...overrides,
      })
    }
  }, [address, abi, functionName, writeContract])
  
  return {
    read,
    write: writeFunc,
    writeState: write,
  }
}

// 使用示例
// const contract = useContract(ADDRESS, ABI, 'balanceOf', [address])
// const balance = contract.read.data
// contract.write([to, amount])
```

### 合约 ABI (src/lib/contracts.ts)

```typescript
// src/lib/contracts.ts
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: 'remaining', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
] as const

export const MY_CONTRACT_ABI = [
  {
    inputs: [{ name: 'initialOwner', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'mintPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'mint',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'status', type: 'bool' },
    ],
    name: 'setWhitelist',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
```

### 主应用 (src/App.tsx)

```typescript
// src/App.tsx
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './lib/wagmi'
import { ConnectWallet } from './components/ConnectWallet'
import { AccountInfo } from './components/AccountInfo'
import { NetworkSwitcher } from './components/NetworkSwitcher'
import { ContractInteraction } from './components/ContractInteraction'
import { TransactionHistory } from './components/TransactionHistory'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Wagmi DApp
              </h1>
              <p className="text-gray-600">
                React Hooks for Ethereum
              </p>
            </header>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <ConnectWallet />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Account</h2>
                <AccountInfo />
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Network</h2>
                <NetworkSwitcher />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Contract Interaction</h2>
              <ContractInteraction />
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <TransactionHistory />
            </div>
          </div>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
```

## 最佳实践

### 1. 状态管理

```typescript
// 使用 React Query 管理服务端状态
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useTokenPrice(tokenAddress: string) {
  return useQuery({
    queryKey: ['tokenPrice', tokenAddress],
    queryFn: async () => {
      const response = await fetch(`/api/price/${tokenAddress}`)
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 分钟
    refetchInterval: 1000 * 60, // 每分钟刷新
  })
}
```

### 2. 错误处理

```typescript
// 统一错误处理
import { useAccount, useWriteContract } from 'wagmi'

export function useContractWithError() {
  const { writeContract, error, isError } = useWriteContract()
  
  const handleWrite = async (...args: any[]) => {
    try {
      writeContract(...args)
    } catch (err) {
      console.error('Contract error:', err)
      // 显示用户友好的错误信息
      throw new Error('Transaction failed. Please try again.')
    }
  }
  
  return {
    writeContract: handleWrite,
    error,
    isError,
  }
}
```

### 3. Gas 估算

```typescript
// Gas 估算
import { useEstimateGas, useGasPrice } from 'wagmi'

export function useGasEstimation() {
  const { data: gasPrice } = useGasPrice()
  
  const estimateGas = async (config: any) => {
    const { data: estimated } = await useEstimateGas(config)
    
    // 增加 20% 缓冲
    return (estimated * 120n) / 100n
  }
  
  return {
    gasPrice,
    estimateGas,
  }
}
```

### 4. 类型安全

```typescript
// 使用 TypeScript 增强类型安全
import { Address, Hash } from 'viem'

interface Transaction {
  hash: Hash
  from: Address
  to: Address
  value: bigint
}

// 合约函数类型
type ContractFunction = {
  name: string
  inputs: { name: string; type: string }[]
  outputs: { name: string; type: string }[]
}
```

### 5. 性能优化

```typescript
// 使用 useMemo 和 useCallback
import { useMemo, useCallback } from 'react'

export function useOptimizedContract() {
  const { data } = useReadContract({
    // ...
  })
  
  const processedData = useMemo(() => {
    if (!data) return null
    // 复杂计算
    return formatData(data)
  }, [data])
  
  const execute = useCallback(async () => {
    // ...
  }, [/* deps */])
  
  return { processedData, execute }
}
```

### 6. 测试

```typescript
// __tests__/useBalance.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useBalance } from 'wagmi'
import { wrapper } from './test-utils'

describe('useBalance', () => {
  it('should fetch balance', async () => {
    const { result } = renderHook(() => useBalance({ address: '0x...' }), {
      wrapper,
    })
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    
    expect(result.current.data).toBeDefined()
  })
})
```

## 常用命令

### 开发命令

```bash
# 安装依赖
npm install wagmi viem @tanstack/react-query

# 安装钱包连接器
npm install @web3modal/wagmi
# 或
npm install @rainbow-me/rainbowkit

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 测试命令

```bash
# 运行测试
npm test

# 运行测试（监听模式）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 代码质量

```bash
# 代码格式化
npm run format

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

## 部署配置

### Vite 配置 (vite.config.ts)

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Polyfills for browser
      stream: 'stream-browserify',
      crypto: 'crypto-browserify',
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          wagmi: ['wagmi'],
          viem: ['viem'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
})
```

### Next.js 配置 (next.config.js)

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      dns: false,
      child_process: false,
      tls: false,
    }
    return config
  },
}

module.exports = nextConfig
```

### 环境变量 (.env.example)

```bash
# WalletConnect
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id

# Alchemy
VITE_ALCHEMY_API_KEY=your_api_key

# Etherscan
VITE_ETHERSCAN_API_KEY=your_api_key

# Environment
VITE_NETWORK=mainnet
```

### Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Vercel 部署

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_WALLET_CONNECT_PROJECT_ID": "@wallet_connect_project_id",
    "VITE_ALCHEMY_API_KEY": "@alchemy_api_key"
  }
}
```

## 进阶功能

### 签名和验证

```typescript
// 签名消息
import { useSignMessage, useVerifyMessage } from 'wagmi'

export function SignMessage() {
  const [message, setMessage] = useState('')
  
  const { signMessage, data: signature, isPending } = useSignMessage()
  
  const { data: isValid } = useVerifyMessage({
    message,
    signature,
  })
  
  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message to sign"
      />
      
      <button
        onClick={() => signMessage({ message })}
        disabled={isPending}
      >
        {isPending ? 'Signing...' : 'Sign Message'}
      </button>
      
      {signature && (
        <div>
          <p>Signature: {signature}</p>
          <p>Valid: {isValid ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  )
}
```

### 交易模拟

```typescript
// 模拟交易
import { useSimulateContract } from 'wagmi'

export function useSimulateTransfer() {
  const { data, error, isLoading } = useSimulateContract({
    address: TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [recipient, amount],
  })
  
  return {
    result: data?.result,
    error,
    isLoading,
  }
}
```

### 批量请求

```typescript
// 批量读取合约数据
import { useReadContracts } from 'wagmi'

export function useBatchTokenInfo(tokenAddresses: `0x${string}`[]) {
  const contracts = tokenAddresses.flatMap((address) => [
    {
      address,
      abi: ERC20_ABI,
      functionName: 'name',
    },
    {
      address,
      abi: ERC20_ABI,
      functionName: 'symbol',
    },
    {
      address,
      abi: ERC20_ABI,
      functionName: 'decimals',
    },
  ])
  
  const { data, isLoading } = useReadContracts({
    contracts,
  })
  
  // 处理结果
  return tokenAddresses.map((address, i) => ({
    address,
    name: data?.[i * 3]?.result,
    symbol: data?.[i * 3 + 1]?.result,
    decimals: data?.[i * 3 + 2]?.result,
  }))
}
```

## 工具集成

### Web3Modal

```typescript
// src/lib/web3modal.ts
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { config } from './wagmi'

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#3b82f6',
  },
})
```

### RainbowKit

```typescript
// src/lib/rainbowkit.ts
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'

export const rainbowConfig = getDefaultConfig({
  appName: 'My DApp',
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
  chains: [mainnet, polygon, arbitrum, optimism],
  ssr: false,
})
```

### React Query DevTools

```typescript
// src/App.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        {/* App content */}
      </WagmiProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

## 故障排查

### 常见问题

1. **钱包连接失败**
   ```typescript
   // 检查配置
   console.log('Wagmi config:', config)
   console.log('Connectors:', config.connectors)
   ```

2. **交易失败**
   ```typescript
   // 错误处理
   const { writeContract, error } = useWriteContract()
   
   if (error) {
     console.error('Transaction error:', error)
   }
   ```

3. **网络切换问题**
   ```typescript
   // 检查当前网络
   const { chain } = useAccount()
   console.log('Current chain:', chain)
   ```

4. **Gas 估算失败**
   ```typescript
   // 使用 simulateContract
   const { data, error } = useSimulateContract({
     // config
   })
   
   if (error) {
     console.error('Simulation failed:', error)
   }
   ```

5. **类型错误**
   ```bash
   # 重新生成类型
   npm run type-check
   ```

### 调试技巧

```typescript
// 使用 console.log 调试
useEffect(() => {
  console.log('Account changed:', address)
  console.log('Chain changed:', chain)
}, [address, chain])

// 使用 React DevTools
import { DevTools } from 'jotai-devtools'

<DevTools />
```
