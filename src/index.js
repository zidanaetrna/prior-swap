const { ethers } = require("ethers");
require("dotenv").config();

// Config
const RPC_URL = "https://sepolia.base.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = "0x0f1DADEcc263eB79AE3e4db0d57c49a8b6178B0B";
const PRIOR_TOKEN = "0xc19Ec2EEBB009b2422514C51F9118026f1cD89ba";

// ERC20 ABI
const ERC20_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function balanceOf(address account) public view returns (uint256)",
    "function allowance(address owner, address spender) public view returns (uint256)"
];

// Minimal ABI 
const SWAP_ABI = [
    "function swap(uint256 amount) external" 
];


const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);


const priorContract = new ethers.Contract(PRIOR_TOKEN, ERC20_ABI, wallet);
const swapInterface = new ethers.Interface(SWAP_ABI);

async function checkBalanceAndAllowance(amount) {
    const balance = await priorContract.balanceOf(wallet.address);
    const allowance = await priorContract.allowance(wallet.address, CONTRACT_ADDRESS);
    const amountWei = ethers.parseEther(amount.toString());
    
    console.log(`Balance: ${ethers.formatEther(balance)} PRIOR`);
    console.log(`Allowance: ${ethers.formatEther(allowance)} PRIOR`);
    console.log(`Requested amount: ${amount} PRIOR (${ethers.formatEther(amountWei)} wei)`);
    return {
        hasEnoughBalance: balance >= amountWei,
        needsApproval: allowance < amountWei
    };
}

async function approveToken(amount) {
    try {
        const tx = await priorContract.approve(
            CONTRACT_ADDRESS,
            ethers.parseEther(amount.toString())
        );
        console.log("Approval transaction sent:", tx.hash);
        await tx.wait();
        console.log("Approval successful");
        return true;
    } catch (error) {
        console.error("Approval failed:", error.message);
        return false;
    }
}

async function singleSwap(amount, tokenToSwapTo) {
    try {
        const check = await checkBalanceAndAllowance(amount);
        if (!check.hasEnoughBalance) {
            console.log("Insufficient balance for swap");
            return false;
        }

        if (check.needsApproval) {
            const approved = await approveToken(amount);
            if (!approved) return false;
        }

        const encodedData = swapInterface.encodeFunctionData("swap", [ethers.parseEther(amount)]);
        const data = "0xf3b68002" + encodedData.slice(10);
        console.log(`Swapping ${amount} PRIOR to ${tokenToSwapTo}`);
        console.log("Swap call data:", data);

        const tx = await wallet.sendTransaction({
            to: CONTRACT_ADDRESS,
            data: data,
            gasLimit: 200000
        });
        
        console.log("Swap transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Swap completed successfully");
        console.log("Transaction receipt:", receipt);
        return true;
    } catch (error) {
        console.error("Swap failed:", error.message);
        if (error.data) console.error("Revert data:", error.data);
        return false;
    }
}

async function automaticSwap(amount, tokenToSwapTo) {
    try {
        while (true) { // Infinite loop until break
            const balance = await priorContract.balanceOf(wallet.address);
            const remaining = ethers.formatEther(balance);
            
            if (parseFloat(remaining) < parseFloat(amount)) {
                console.log("Insufficient balance to continue automatic swaps");
                break;
            }

            const success = await singleSwap(amount, tokenToSwapTo);
            if (!success) {
                console.log("Swap failed, stopping automatic swap");
                break;
            }
            console.log("Remaining balance:", remaining);
        }
        console.log("Automatic swapping completed");
    } catch (error) {
        console.error("Automatic swap failed:", error.message);
    }
}

async function automaticSwapDaily(amount, tokenToSwapTo) {
    try {
        const swapsPerDay = 27; 
        const delayMs = 13 * 60 * 1000; 
        
        for (let swapCount = 0; swapCount < swapsPerDay; swapCount++) {
            const balance = await priorContract.balanceOf(wallet.address);
            if (parseFloat(ethers.formatEther(balance)) < parseFloat(amount)) {
                console.log("Insufficient balance to continue daily swaps");
                break;
            }

            const success = await singleSwap(amount, tokenToSwapTo);
            if (!success) {
                console.log("Swap failed, stopping daily swap");
                break;
            }
            
            console.log(`Swap ${swapCount + 1} of ${swapsPerDay} completed`);
            
            if (swapCount < swapsPerDay - 1) {
                console.log(`Waiting 13 minutes for next swap...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        console.log("Daily swap sequence completed (finished in ~5.85 hours)");
    } catch (error) {
        console.error("Daily swap failed:", error.message);
    }
}

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

function displayInterface() {
    console.log("================ Prior Testnet Auto-bot ==========================");
    console.log("");
    console.log("..%%%%...%%%%%%..%%%%%%..%%%%%...%%..%%...%%%%..");
    console.log(".%%..%%..%%........%%....%%..%%..%%%.%%..%%..%%.");
    console.log(".%%%%%%..%%%%......%%....%%%%%...%%.%%%..%%%%%%.");
    console.log(".%%..%%..%%........%%....%%..%%..%%..%%..%%..%%.");
    console.log(".%%..%%..%%%%%%....%%....%%..%%..%%..%%..%%..%%.");
    console.log("................................................");
    console.log("");
    console.log("choose what you want to do:");
    console.log("");
    console.log("[1]   Swap");
    console.log("[2]   Automatic Swap (Spam)");
    console.log("[3]   Automatic Swap daily (27 times in 24 hours)");
    console.log("");
    console.log("================= Created by: aetrna ==========================");
    console.log("");
    promptChoice();
}

function promptChoice() {
    readline.question("Enter your choice (1-3): ", (choice) => {
        choice = choice.trim();
        
        if (!["1", "2", "3"].includes(choice)) {
            console.log("Invalid choice. Please enter 1, 2, or 3");
            promptChoice();
            return;
        }
        promptToken(choice);
    });
}

function promptToken(choice) {
    readline.question("Enter token to swap to (USDT or USDC): ", (token) => {
        token = token.trim().toUpperCase();
        
        if (token !== "USDT" && token !== "USDC") {
            console.log("Invalid token. Please enter USDT or USDC");
            promptToken(choice);
            return;
        }
        promptAmount(choice, token);
    });
}

function promptAmount(choice, tokenToSwapTo) {
    readline.question("Enter amount (e.g., '1.0'): ", async (amount) => {
        amount = amount.trim();
        
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            console.log("Error: Amount must be a valid positive number");
            promptAmount(choice, tokenToSwapTo);
            return;
        }

        switch(choice) {
            case "1":
                await singleSwap(amount, tokenToSwapTo);
                break;
            case "2":
                await automaticSwap(amount, tokenToSwapTo);
                break;
            case "3":
                await automaticSwapDaily(amount, tokenToSwapTo);
                break;
        }
        readline.close();
    });
}

displayInterface();