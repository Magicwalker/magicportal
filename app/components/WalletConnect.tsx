"use client";

import Image from "next/image";
import { useWallet } from "../context/WalletContext";

export default function WalletConnect() {
  const { 
    account, 
    connectWallet, 
    disconnectWallet, 
    switchNetwork, 
    error
  } = useWallet();

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {!account ? (
        <button
          onClick={connectWallet}
          className="rounded-full bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 font-semibold"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">

                 <div className="mr-2 relative w-6 h-6" title="Connected to Sonic Network">
                    <Image 
                      src="/s.png" 
                      alt="Sonic Network" 
                      fill
                      className="object-contain"
                    />
                 </div>

              
              <p className="text-sm font-mono bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-lg">
                {formatAddress(account)}
              </p>
          </div>
          <button
            onClick={disconnectWallet}
            className="text-xs text-red-500 hover:text-red-600 underline"
          >
            Disconnect
          </button>
        </div>
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
