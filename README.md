# 🚀 BNB Sniper Bot

A sophisticated cryptocurrency trading bot designed for automated token sniping and MEV (Maximal Extractable Value) strategies on the BNB Smart Chain (BSC).

## Contact

[Solove](https://t.me/Solove_77)

## ⚠️ Disclaimer

This bot implements MEV strategies including front-running tactics. Use at your own risk. The authors are not responsible for any financial losses. Always test thoroughly on testnets before using on mainnet.

## 🎯 Features

- **Automated Token Sniping**: Execute buy orders instantly when new tokens are detected
- **MEV Strategy**: Front-running and back-running capabilities
- **Take Profit Automation**: Automated selling with configurable slippage protection
- **Gas Optimization**: Dynamic gas pricing for transaction priority
- **Admin Panel**: Complete management interface for configuration
- **Real-time Monitoring**: Block height, price, and transaction monitoring
- **Retry Logic**: 3-attempt retry system for failed transactions
- **Pair Filtering**: Advanced liquidity-based token pair filtering

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Express API   │    │   MongoDB       │
│   (Admin Panel) │◄──►│   Server        │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   BSC Network   │
                       │   (Web3.js)     │
                       └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- BSC RPC endpoint
- Private keys for trading wallets

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bnbSniperBot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://your-mongodb-connection-string
   
   # BSC Network
   POLYGON_RPC_URL=https://bsc-dataseed.binance.org/
   QUICKNODE_WS_URL=wss://your-quicknode-ws-url
   
   # Trading Configuration
   PRIVATE_KEY=your-private-key
   WALLET_ADDRESS=your-wallet-address
   ROUTER_ADDRESS=0x10ED43C718714eb63d5aA57B78B54704E256024E
   WETH_ADDRESS=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
   USDT_ADDRESS=0x55d398326f99059fF775485246999027B3197955
   
   # Trading Parameters
   MIN_TRADE_AMOUNT=0.1
   MIN_TARGET_AMOUNT=100
   SLIPPAGE_BPS=100
   
   # JWT Secrets
   JWT_SECRET=your-jwt-secret-key
   
   # External APIs
   POL_PRICE_API=https://api.coingecko.com/api/v3/simple/price?ids=polygon&vs_currencies=usd
   SUBGRAPH_URL=https://gateway.thegraph.com/api/your-api-key/subgraphs/id/your-subgraph-id
   ```

4. **Start the application**
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

#### User Registration
```http
POST /api/signup
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}
```

#### User Login
```http
POST /api/login
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}
```

#### Admin Registration
```http
POST /admin/signup
Content-Type: application/json

{
  "username": "admin-username",
  "password": "admin-password"
}
```

### Trading Endpoints

#### Run Bot (Protected)
```http
POST /api/runBot
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "privatekey": "0x...",
  "gasGiven": "5"
}
```

#### Get Market Data
```http
GET /api/getData?type=blockheight
GET /api/getData?type=pendingTx
GET /api/getData?type=polPrice
```

### Admin Endpoints

#### Store Private Keys
```http
POST /admin/storePrivateKeys
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "privateKeys": ["0x...", "0x...", "0x..."]
}
```

#### Update Configuration
```http
POST /admin/updateConfig
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "tokenAddress": ["0x...", "0x..."],
  "purchaseAmount": 250
}
```

#### Run Simulation
```http
POST /admin/runSimulation
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "privatekey": "0x..."
}
```

#### Filter Pairs
```http
POST /admin/filteredPairs
Content-Type: application/json

{
  "first": 100,
  "skip": 0,
  "minLiquidity": 10000,
  "maxLiquidity": 100000
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `POLYGON_RPC_URL` | BSC RPC endpoint | Yes |
| `PRIVATE_KEY` | Default private key for trading | Yes |
| `ROUTER_ADDRESS` | DEX router contract address | Yes |
| `WETH_ADDRESS` | WBNB token address | Yes |
| `MIN_TRADE_AMOUNT` | Minimum trade amount in BNB | No |
| `SLIPPAGE_BPS` | Slippage tolerance in basis points | No |

### Admin Configuration

The bot uses an admin configuration system to manage:
- Target token addresses
- Purchase amounts
- Current trading index
- Private key rotation

## 🔄 Automated Systems

### Cron Jobs

1. **Automated Sell Bot** (`automatedSellBot.js`)
   - Runs every 30 seconds
   - Processes pending transactions
   - Executes automated selling

2. **Market Data Collector** (`marketDataCollector.js`)
   - Runs every 20 seconds
   - Collects block height data
   - Monitors POL price
   - Tracks pending transactions

### Retry Logic

The bot implements a robust retry system:
- 3 attempts for failed transactions
- Dynamic gas price adjustment
- Slippage protection
- Error logging and monitoring

## 📊 Database Models

### Core Models

- **User**: User authentication and management
- **Admin**: Admin user management
- **adminConfig**: Trading configuration
- **targetedAccount**: Private key management
- **targetedTransaction**: Transaction tracking
- **BlockHeight**: Block height monitoring
- **PolPrice**: Price data collection
- **PendingTx**: Pending transaction monitoring

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Private key encryption
- Input validation and sanitization
- Rate limiting (recommended to implement)

## 🚨 Risk Management

- **Slippage Protection**: Configurable slippage tolerance
- **Gas Limits**: Prevents excessive gas consumption
- **Balance Checks**: Validates wallet balances before trading
- **Error Handling**: Comprehensive error catching and logging
- **Transaction Timeouts**: Prevents hanging transactions

## 📈 Monitoring

The bot provides real-time monitoring of:
- Block height changes
- Token prices
- Pending transaction counts
- Trading performance
- Error rates

## 🔧 Development

### Project Structure

```
bnbSniperBot/
├── config/                 # Configuration files
├── controllers/            # Business logic
├── models/                 # Database schemas
├── routes/                 # API routes
├── utils/                  # Utility functions
├── automatedSellBot.js     # Automated selling
├── marketDataCollector.js  # Data collection
├── tokenPairFilter.js      # Pair filtering
└── server.js               # Main application
```

### Adding New Features

1. Create new routes in `routes/`
2. Add business logic in `controllers/`
3. Update database models if needed
4. Test thoroughly on testnet

## 🐛 Troubleshooting

### Common Issues

1. **Transaction Failures**
   - Check gas prices
   - Verify wallet balances
   - Ensure token approvals

2. **Database Connection Issues**
   - Verify MongoDB URI
   - Check network connectivity
   - Validate credentials

3. **Web3 Connection Problems**
   - Verify RPC endpoint
   - Check network status
   - Validate contract addresses

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=true
NODE_ENV=development
```

## 📝 License

This project is for educational purposes only. Use at your own risk.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**⚠️ Warning**: This bot involves high-risk trading strategies. Always test on testnets first and never invest more than you can afford to lose.
