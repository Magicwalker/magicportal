"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";

// Sonic Network Configuration
const SONIC_CHAIN_ID = "0x92"; // 146 in hex
const SONIC_NETWORK_PARAMS = {
  chainId: SONIC_CHAIN_ID,
  chainName: "Sonic Network",
  nativeCurrency: {
    name: "Sonic",
    symbol: "S",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.soniclabs.com"],
  blockExplorerUrls: ["https://explorer.soniclabs.com"],
};

interface WalletContextType {
  account: string | null;
  chainId: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<void>;
  isWrongNetwork: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
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
        }
      });
    }
  }, []);

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

  const switchNetwork = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SONIC_CHAIN_ID }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await (window as any).ethereum.request({
              method: "wallet_addEthereumChain",
              params: [SONIC_NETWORK_PARAMS],
            });
          } catch (addError) {
            console.error("Error adding Sonic network:", addError);
            setError("Failed to add Sonic network.");
          }
        } else {
          console.error("Error switching network:", switchError);
          setError("Failed to switch to Sonic network.");
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
        
        if (currentChainId !== SONIC_CHAIN_ID) {
            await switchNetwork();
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
  };

  const isWrongNetwork = chainId !== null && chainId !== SONIC_CHAIN_ID;

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        isWrongNetwork,
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
