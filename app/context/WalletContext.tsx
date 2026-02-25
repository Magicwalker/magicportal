"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";

// Network Configurations
export const NETWORKS = {
  SONIC: {
    chainId: "0x92", // 146
    chainName: "Sonic Network",
    nativeCurrency: { name: "Sonic", symbol: "S", decimals: 18 },
    rpcUrls: ["https://rpc.soniclabs.com"],
    blockExplorerUrls: ["https://explorer.soniclabs.com"],
  },
  AVAX: {
    chainId: "0xa86a", // 43114
    chainName: "Avalanche C-Chain",
    nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
    rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
    blockExplorerUrls: ["https://snowtrace.io"],
  }
};

interface WalletContextType {
  account: string | null;
  balance: string | null;
  chainId: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (targetChainId: string) => Promise<void>;
  currentNetwork: typeof NETWORKS.SONIC | typeof NETWORKS.AVAX | null;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);

  useEffect(() => {
    checkIfWalletIsConnected();
    
    if (typeof window !== "undefined" && (window as any).ethereum) {
      (window as any).ethereum.on('chainChanged', (newChainId: string) => {
        setChainId(newChainId);
        window.location.reload();
      });
      
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
          setBalance(null);
        }
      });
    }
  }, []);

  // Fetch balance whenever account or chainId changes
  useEffect(() => {
    if (account) {
      fetchBalance(account);
    } else {
      setBalance(null);
    }
  }, [account, chainId]);

  const fetchBalance = async (address: string) => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const balanceBigInt = await provider.getBalance(address);
        const balanceFormatted = ethers.formatEther(balanceBigInt);
        const formatted = parseFloat(balanceFormatted).toFixed(4);
        setBalance(formatted);
      } catch (err) {
        console.error("Error fetching balance:", err);
      }
    }
  };

  const checkIfWalletIsConnected = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.listAccounts();
        const network = await provider.getNetwork();
        setChainId("0x" + network.chainId.toString(16));
        
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
        }
      } catch (err) {
        console.error("Error checking wallet connection:", err);
      }
    }
  };

  const switchNetwork = async (targetChainId: string) => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: targetChainId }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          const targetNetwork = Object.values(NETWORKS).find(n => n.chainId === targetChainId);
          if (targetNetwork) {
            try {
              await (window as any).ethereum.request({
                method: "wallet_addEthereumChain",
                params: [targetNetwork],
              });
            } catch (addError) {
              console.error("Error adding network:", addError);
              setError("Failed to add network.");
            }
          }
        } else {
          console.error("Error switching network:", switchError);
          setError("Failed to switch network.");
        }
      }
    }
  };

  const connectWallet = async () => {
    setError(null);
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        
        const network = await provider.getNetwork();
        const currentChainId = "0x" + network.chainId.toString(16);
        
        // Default to Sonic if not on a supported chain
        if (currentChainId !== NETWORKS.SONIC.chainId && currentChainId !== NETWORKS.AVAX.chainId) {
            await switchNetwork(NETWORKS.SONIC.chainId);
        }
        
      } catch (err: any) {
        console.error("Error connecting wallet:", err);
        setError("Failed to connect wallet. Please try again.");
      }
    } else {
      setError("Please install MetaMask or Rabby Wallet!");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBalance(null);
  };

  const currentNetwork = 
    chainId === NETWORKS.SONIC.chainId ? NETWORKS.SONIC :
    chainId === NETWORKS.AVAX.chainId ? NETWORKS.AVAX : null;

  return (
    <WalletContext.Provider
      value={{
        account,
        balance,
        chainId,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        currentNetwork,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
