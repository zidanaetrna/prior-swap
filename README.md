# Prior Testnet Auto-bot

A Node.js script for automating token swaps on the Base Sepolia testnet using ethers.js v6. This bot interacts with a specific contract to swap PRIOR tokens to either USDT or USDC.

## Features

- **Single Swap**: Perform a one-time swap of PRIOR tokens to USDT or USDC.
- **Automatic Swap (Spam)**: Continuously spam swap transactions as fast as possible until the balance runs out.
- **Daily Swap**: Execute 27 swaps evenly distributed over 24 hours (approximately every 53 minutes).

## Prerequisites

- **Node.js**: v18.19.1 or compatible
- **npm**: Package manager for installing dependencies
- **Base Sepolia Testnet Access**: A wallet with PRIOR tokens and ETH for gas fees
- **MetaMask** (optional): For obtaining testnet ETH and tokens

## Installation

1. **Clone or Download**:
   - Clone this repository or download the script files.

2. **Install Dependencies**:
   ```bash
   npm install ethers dotenv
   ```
3. **Set Up Environment**:
Create a .env file in the project root with your private key:
plaintext
PRIVATE_KEY=your_private_key_here

4.**Usage**:
Run the Script:
```bash
node index.js
```
Follow Prompts:
Choice (1-3):
1: Single Swap
2: Automatic Swap (Spam)
3: Automatic Swap daily (27 times in 24 hours)
Token: Enter USDT or USDC
Amount: Enter the amount of PRIOR tokens to swap (e.g., 0.01)

## Configuration
**RPC_URL**: https://sepolia.base.org (Base Sepolia testnet)
**CONTRACT_ADDRESS**: 0x0f1DADEcc263eB79AE3e4db0d57c49a8b6178B0B
**PRIOR_TOKEN**: 0xc19Ec2EEBB009b2422514C51F9118026f1cD89ba
**Swap Function Selector**: 0xf3b68002 (takes a uint256 amount parameter)

## Notes
The swap function (0xf3b68002) is assumed to handle token selection internally. If it requires a token address parameter, modify the singleSwap function accordingly.
Gas limit is set to 200,000; adjust if needed based on transaction requirements.
For testing Option 3, you can reduce the delay (e.g., to 10 seconds) by editing delayMs in automaticSwapDaily.

## License
This project is licensed under the MIT License. See the LICENSE (./LICENSE) file for details.
Author
Created by: aetrna
Disclaimer
This is for educational and testnet purposes only. Use at your own risk, especially with real funds or mainnet deployments.

### `LICENSE` (MIT License)

