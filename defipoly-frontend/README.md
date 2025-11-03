# Defipoly Frontend

Next.js web application for the Defipoly game.

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env.local` and configure:
```bash
cp .env.example .env.local
```

Required environment variables:
```env
# Backend API URL
NEXT_PUBLIC_PROFILE_API_URL=http://localhost:3005

# Solana Configuration
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_PROGRAM_ID=your_program_id_here
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── contexts/         # React contexts (wallet, notifications, etc.)
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
└── utils/           # Utility functions and helpers
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Wallet**: Solana Wallet Adapter
- **State Management**: React Context API
- **Language**: TypeScript

## 🔗 Backend Integration

The frontend connects to the backend API on port 3005. Make sure the backend is running before starting the frontend:

```bash
cd ../defipoly-backend
npm start
```

## 📝 Key Features

- Wallet connection and management
- Real-time game board display
- Property buying/selling interface
- Player profiles and statistics
- Live feed of game events
- Rewards claiming system
- Cooldown tracking

## 🚀 Deployment

### Vercel Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables
4. Deploy

### Environment Variables for Production

```env
NEXT_PUBLIC_PROFILE_API_URL=https://your-backend-api.com
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_PROGRAM_ID=your_mainnet_program_id
```

## 🐛 Troubleshooting

### Common Issues

1. **Wallet not connecting**
   - Check that you have a Solana wallet extension installed
   - Ensure you're on the correct network (mainnet/devnet)

2. **API calls failing**
   - Verify the backend is running on port 3005
   - Check NEXT_PUBLIC_PROFILE_API_URL in .env.local

3. **Build errors**
   - Clear .next folder: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Tailwind CSS](https://tailwindcss.com/docs)