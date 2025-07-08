# SteamPipe Backend Service

Backend service for the SteamPipe CS:GO skin trading platform. Handles Steam API integration, trade verification, and Solana blockchain interactions.

## Features

- 🔐 **Steam API Integration**: Verify item ownership and manage trade offers
- ⛓️ **Solana Integration**: Interact with the escrow smart contract
- 🔄 **Trade Monitoring**: Automatic trade status monitoring and completion
- 🛡️ **Security**: Rate limiting, input validation, and secure key management
- 📊 **Admin Panel**: Trade monitoring and manual intervention capabilities

## Architecture

```
Frontend (React/Next.js)
    ↓
Backend API Server (Node.js/Express)
    ↓
Steam Web API ← → Solana Blockchain
```

## Setup

### Prerequisites

- Node.js 16+
- Steam Web API Key
- Solana CLI tools
- Redis (optional, for production)

### Installation

1. **Clone and install dependencies**:
```bash
cd backend
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Generate backend keypair**:
```bash
# Generate new keypair
solana-keygen new --outfile backend-keypair.json

# Convert to array format for .env
cat backend-keypair.json
# Copy the array to BACKEND_PRIVATE_KEY in .env
```

4. **Get Steam API Key**:
   - Visit: https://steamcommunity.com/dev/apikey
   - Add the key to `STEAM_API_KEY` in .env

### Development

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

## API Endpoints

### Public Endpoints

- `GET /health` - Health check
- `POST /api/verify-item` - Verify Steam item ownership
- `POST /api/initiate-trade` - Start trade process
- `GET /api/trade/:tradeId` - Get trade status
- `GET /api/steam/inventory/:steamId` - Get Steam inventory

### Admin Endpoints

- `GET /api/admin/trades` - List all trades
- `POST /api/admin/verify-trade` - Manual trade verification
- `POST /api/admin/complete-trade` - Manual trade completion

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `STEAM_API_KEY` | Steam Web API key | Yes |
| `SOLANA_RPC_URL` | Solana RPC endpoint | Yes |
| `PROGRAM_ID` | Solana program ID | Yes |
| `BACKEND_PRIVATE_KEY` | Backend authority keypair | Yes |
| `PORT` | Server port | No (default: 3001) |
| `NODE_ENV` | Environment | No (default: development) |

### Steam API Setup

1. **Get API Key**: Visit [Steam Web API](https://steamcommunity.com/dev/apikey)
2. **Domain**: Use your domain or `localhost` for development
3. **Rate Limits**: Steam API has rate limits (100,000 calls/day)

### Solana Setup

1. **Network**: Start with Devnet for testing
2. **Program Deployment**: Deploy your Anchor program first
3. **Authority Keys**: Backend needs authority to verify trades

## Trade Flow

### 1. Item Verification
```javascript
POST /api/verify-item
{
  "steamId": "76561198123456789",
  "itemId": "123456789"
}
```

### 2. Trade Initiation
```javascript
POST /api/initiate-trade
{
  "tradeId": 1,
  "escrowAccount": "ABC123...",
  "sellerSteamId": "76561198123456789",
  "buyerSteamId": "76561198987654321",
  "buyerTradeToken": "ABC123",
  "itemId": "123456789",
  "itemAssetId": "987654321",
  "amount": 1000000
}
```

### 3. Automatic Processing
- Backend verifies item ownership
- Updates Solana contract state
- Sends Steam trade offer
- Monitors trade completion
- Releases funds when trade completes

## Security

### Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Rotate Steam API keys regularly
3. **Rate Limiting**: Implemented for all endpoints
4. **Input Validation**: All inputs are validated
5. **Error Handling**: Secure error messages

### Production Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Database**: Use PostgreSQL instead of in-memory storage
3. **Monitoring**: Add Sentry/DataDog for error tracking
4. **Logging**: Structured logging with Winston
5. **Load Balancing**: Use PM2 or similar for clustering

## Monitoring

### Health Checks
```bash
curl http://localhost:3001/health
```

### Trade Status
```bash
curl http://localhost:3001/api/trade/123
```

### Admin Dashboard
```bash
curl http://localhost:3001/api/admin/trades
```

## Error Handling

The API returns standardized error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Common error codes:
- `400` - Bad Request (missing/invalid parameters)
- `404` - Not Found (trade/item not found)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
# Test with real Steam API (requires valid API key)
npm run test:integration
```

### Manual Testing
```bash
# Test item verification
curl -X POST http://localhost:3001/api/verify-item \
  -H "Content-Type: application/json" \
  -d '{"steamId":"76561198123456789","itemId":"123456789"}'
```

## Deployment

### Development
```bash
npm run dev
```

### Production with PM2
```bash
npm install -g pm2
npm run deploy
```

### Docker
```bash
docker build -t steampipe-backend .
docker run -p 3001:3001 --env-file .env steampipe-backend
```

## Troubleshooting

### Common Issues

1. **Steam API Errors**:
   - Check API key validity
   - Verify rate limits
   - Ensure correct Steam ID format

2. **Solana Connection Issues**:
   - Check RPC URL
   - Verify network (devnet/mainnet)
   - Confirm program deployment

3. **Trade Failures**:
   - Check escrow account exists
   - Verify backend authority
   - Monitor Solana transaction logs

### Debug Mode
```bash
DEBUG=steampipe:* npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
