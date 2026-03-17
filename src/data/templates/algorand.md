# Algorand Blockchain Development - Project Context

## Build & Test Commands
- `algod` - Start local Algorand node
- `goal` - Algorand CLI for node operations
- `sandbox` - Local development environment
- `npm test` - Run smart contract tests
- `npm run build` - Build TEAL contracts
- `pipenv install` - Install Python SDK dependencies

## Code Style & Conventions
- Python (Algorand Python SDK) or TypeScript/JavaScript (AlgoSDK)
- Use PyTeal or TEAL for smart contracts
- Clear state schema definitions with explicit types
- Comprehensive error handling for blockchain transactions
- Atomic transaction groups for complex operations
- Gas optimization through efficient TEAL code

## Architecture & Structure
```
project/
├── contracts/        # Smart contract source code
│   ├── teal/        # TEAL assembly files
│   ├── pyteal/      # PyTeal contract definitions
│   └── build/       # Compiled TEAL bytecode
├── tests/           # Contract tests
├── scripts/         # Deployment and interaction scripts
├── assets/          # ASA (Algorand Standard Assets) metadata
├── client/          # Frontend client code
└── lib/             # Utility libraries
```

## Key Libraries & Tools
- `algosdk` - Official Algorand SDK (JS/Python/Go/Java)
- `pyteal` - Python framework for TEAL contracts
- `beaker` - High-level smart contract framework
- `sandbox` - Local development environment
- `goal` - Command-line tool for node operations
- `indexer` - Blockchain data querying
- `algod` - Algorand daemon (node software)

## Best Practices
- Use Atomic Transaction Groups for multi-step operations
- Implement rekeying carefully with proper authorization
- Store minimal data on-chain (use IPFS for large data)
- Use Global and Local State efficiently
- Optimize TEAL bytecode for lower transaction fees
- Test thoroughly on TestNet before MainNet deployment
- Implement proper key management (never hardcode mnemonics)
- Use Logic Signatures for delegated signatures

## Common Patterns

### ASA (Algorand Standard Asset) Creation
```python
from algosdk.future.transaction import AssetConfigTxn

txn = AssetConfigTxn(
    sender=creator_address,
    sp=params,
    total=1000000,  # Total supply
    decimals=0,
    default_frozen=False,
    unit_name="TOKEN",
    asset_name="My Token",
    manager=manager_address,
    reserve=reserve_address,
    freeze=freeze_address,
    clawback=clawback_address,
    url="https://example.com/metadata.json",
    metadata_hash=metadata_hash
)
```

### Smart Contract with PyTeal
```python
from pyteal import *

class Counter(Contract):
    class GlobalState:
        count = GlobalStateValue(
            Uint64,
            default=Int(0),
            descr="Global counter value"
        )

    @create
    def create(self):
        return self.initialize_global_state()

    @call
    def increment(self):
        return Seq([
            self.global_state.count.set(
                self.global_state.count.get() + Int(1)
            ),
            Approve()
        ])

    @call
    def decrement(self):
        return Seq([
            If(self.global_state.count.get() > Int(0))
            .Then(self.global_state.count.set(
                self.global_state.count.get() - Int(1)
            )),
            Approve()
        ])
```

### Atomic Transaction Group
```python
from algosdk.future.transaction import (
    PaymentTxn,
    ApplicationCallTxn,
    calculate_group_id
)

# Group transactions atomically
txn1 = PaymentTxn(sender, params, receiver, amount)
txn2 = ApplicationCallTxn(sender, params, app_id, app_args)

# Assign group ID
gid = calculate_group_id([txn1, txn2])
txn1.group = gid
txn2.group = gid

# Sign and submit
signed_group = [txn1.sign(private_key), txn2.sign(private_key)]
txid = client.send_transactions(signed_group)
```

## State Management
- **Global State**: Application-wide storage (up to 64 key-value pairs)
- **Local State**: Per-account storage (up to 16 key-value pairs per account)
- **Boxes**: Larger data storage (up to 32KB per box)
- Use state schemas to declare storage requirements upfront

## Transaction Types
- **Payment**: Simple value transfer
- **Asset Transfer**: Transfer ASAs
- **Asset Config**: Create or modify ASA
- **Asset Freeze**: Freeze/unfreeze ASA holdings
- **Application Call**: Interact with smart contracts
- **Key Registration**: Participate in consensus

## Security Considerations
- Validate all inputs in smart contracts
- Check transaction sender in contract logic
- Use rekeying judiciously (can be dangerous)
- Implement access control with proper checks
- Test edge cases (integer overflow, empty states)
- Audit contracts before MainNet deployment
- Never expose private keys or mnemonics

## Testing Strategy
- Use `sandbox` for local testing
- Test with Algorand TestNet
- Write unit tests for contract logic
- Test atomic transaction groups
- Verify state changes after transactions
- Test error conditions and edge cases
- Benchmark transaction costs

## Deployment Workflow
1. Compile TEAL contracts
2. Deploy to TestNet
3. Create application (smart contract)
4. Opt-in accounts to application
5. Fund application account with ALGO
6. Test thoroughly on TestNet
7. Deploy to MainNet
8. Verify deployment and functionality
