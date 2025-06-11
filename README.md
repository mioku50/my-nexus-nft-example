# Nexus NFT Platform

A modern, full-stack dApp for deploying and managing NFT collections on the Nexus blockchain. Built with Next.js 13+ (App Router), TypeScript, Hardhat, and ethers.js v6.

## Key Features

### Smart Contract
- **ERC-721 Compliance**: Full implementation of the ERC-721 standard
- **Metadata Management**: 
  - Dynamic base URI updates
  - Metadata freezing capability for immutability
  - OpenSea-compatible metadata format
- **Batch Updates**: Support for ERC-4906 metadata update notifications
- **Gas Optimization**: Optimized deployment and minting costs
- **Access Control**: Owner-based permissions using OpenZeppelin's Ownable

### Frontend
- **Modern Stack**:
  - Next.js 13+ with App Router
  - TypeScript for type safety
  - Tailwind CSS for styling
  - ethers.js v6 for blockchain interactions
- **Wallet Integration**:
  - MetaMask support
  - Network switching/adding
  - Transaction status tracking
- **Image Management**:
  - Drag-and-drop upload
  - Firebase Storage integration
  - Fallback to generated SVG images
- **Collection Management**:
  - One-click NFT collection deployment
  - Automatic symbol generation from collection name
  - Batch minting capability
  - NFT transfer functionality

### API Layer
- **Metadata API**:
  - OpenSea-compatible metadata endpoint
  - Dynamic SVG generation for NFTs without images
  - Caching headers for performance
- **Image Handling**:
  - Secure image upload to Firebase Storage
  - Collection-based image organization
  - Automatic image resizing and optimization

## Project Structure

```
nexus-nft/
├── contracts/               # Smart contract development
│   ├── contracts/          # Solidity contract files
│   │   ├── scripts/            # Deployment scripts
│   │   ├── test/              # Contract test files
│   │   └── hardhat.config.ts  # Hardhat configuration
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── app/           # Next.js 13+ App Router pages
│   │   │   ├── api/       # API routes for metadata and uploads
│   │   │   ├── components/# Reusable React components
│   │   │   ├── config/    # Configuration and constants
│   │   │   └── types/     # TypeScript type definitions
│   │   └── config/        # Frontend configuration
│   └── public/            # Static assets
```

## Technical Details

### Smart Contract Architecture

The `SimpleNFT` contract (`contracts/contracts/SimpleNFT.sol`) is designed with several key features:

1. **Metadata Management**:
   - Base URI can be updated by the owner
   - Metadata can be frozen to ensure immutability
   - Implements ERC-4906 for metadata update notifications

2. **Minting Logic**:
   - Sequential token ID assignment
   - Public minting capability
   - Gas-optimized mint function

3. **Security Features**:
   - Owner-controlled administrative functions
   - Reentrancy protection
   - Safe math operations

### Frontend Architecture

1. **Page Components**:
   - `page.tsx`: Main deployment interface
   - `collection/[address]/page.tsx`: Collection management interface

2. **State Management**:
   - React hooks for local state
   - Ethereum wallet state synchronization
   - Real-time network status tracking

3. **API Integration**:
   - RESTful endpoints for metadata
   - Firebase Storage integration
   - Error handling and status reporting

### API Endpoints

1. **Metadata API** (`/api/metadata/[tokenId]`):
   - Returns OpenSea-compatible metadata
   - Supports both uploaded and generated images
   - Includes token attributes and collection info

2. **Image API** (`/api/image/[tokenId]`):
   - Generates SVG images for tokens
   - Deterministic design based on token ID
   - Fallback for tokens without uploaded images

3. **Upload API** (`/api/upload`):
   - Handles collection image uploads
   - Firebase Storage integration
   - Security validations and error handling

## Setup Guide

### Prerequisites

- Node.js 16+
- npm or yarn
- MetaMask browser extension
- Firebase account (for image storage)

### Installation
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
source ~/.nvm/nvm.sh
nvm install --lts
nvm use --lts
npm --version
source /root/.bashrc
export PATH="$HOME/.local/bin:$PATH"

1. Clone the repository:
```bash
git clone https://github.com/mioku50/my-nexus-nft-example.git
cd my-nexus-nft-example
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install contract dependencies
cd ../contracts
npm install
```

3. Configure environment variables:

Frontend (`frontend/.env.local`):
```
# API and Website URLs
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WEBSITE_URL=http://localhost:3000

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Contracts (`contracts/.env`):
```
PRIVATE_KEY=your_private_key
NEXUS_RPC_URL=https://rpc.nexus.xyz/http
```

### Development Workflow

1. Start the frontend development server:
```bash
cd frontend
npm run dev
```

2. Compile and deploy contracts:
```bash
cd contracts
npm run compile
npm run deploy
```

3. Run tests:
```bash
# Contract tests
cd contracts
npm run test

# Frontend tests (when implemented)
cd frontend
npm run test
```

## Advanced Usage

### Custom Collection Deployment

The platform supports custom collection deployment with:
- Custom collection names
- Automatic symbol generation
- Optional collection images
- Configurable metadata

### Metadata Customization

You can customize the metadata format by modifying:
1. The metadata API route (`frontend/src/app/api/metadata/[tokenId]/route.ts`)
2. The image generation logic (`frontend/src/app/api/image/[tokenId]/route.ts`)

### Firebase Integration

The project uses Firebase for image storage:
1. Create a Firebase project
2. Enable Storage
3. Configure security rules
4. Update environment variables

## Security Considerations

1. **Smart Contract**:
   - Access control for administrative functions
   - Metadata freezing capability
   - Input validation
   - Gas optimization

2. **Frontend**:
   - Environment variable protection
   - API route validation
   - File upload restrictions
   - Network security checks

3. **API**:
   - Rate limiting (to be implemented)
   - File type validation
   - Size restrictions
   - CORS configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenZeppelin for secure contract implementations
- Next.js team for the framework
- ethers.js team for the Ethereum library
- Nexus team for the blockchain infrastructure
