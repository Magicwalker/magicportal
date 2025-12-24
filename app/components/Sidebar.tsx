"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "../context/WalletContext";
import Image from "next/image";

export default function Sidebar() {
  const pathname = usePathname();
  const { 
    account, 
    balance, 
    connectWallet, 
    disconnectWallet, 
    switchNetwork, 
    isWrongNetwork 
  } = useWallet();

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const navItems = [
    { name: "Home", href: "/", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { name: "NFTs", href: "/nfts", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )}
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-zinc-900 text-white border-r border-zinc-800 flex flex-col z-50">
      {/* Logo Area */}
      <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center font-bold text-xl">
          M
        </div>
        <span className="font-bold text-lg tracking-tight">Magic Portal</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive 
                  ? "bg-purple-600 text-white font-medium" 
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Wallet Section */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        {!account ? (
          <button
            onClick={connectWallet}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Connect Wallet
          </button>
        ) : (
          <div className="space-y-3">
            {/* Network Status */}
            {isWrongNetwork ? (
              <button
                onClick={switchNetwork}
                className="w-full py-2 px-3 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-lg text-sm font-medium hover:bg-yellow-500/20 transition-colors"
              >
                Wrong Network
              </button>
            ) : (
              <div className="flex items-center gap-2 px-2">
                <div className="relative w-5 h-5">
                   <Image 
                      src="/s.png" 
                      alt="Sonic" 
                      fill
                      className="object-contain"
                    />
                </div>
                <span className="text-sm font-medium text-green-400">Sonic Network</span>
              </div>
            )}

            {/* Account Info */}
            <div className="bg-zinc-800 rounded-xl p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-zinc-500 font-medium uppercase">Address</span>
                <button 
                  onClick={disconnectWallet}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Disconnect
                </button>
              </div>
              <div className="font-mono text-sm truncate mb-3">
                {formatAddress(account)}
              </div>
              
              <div className="pt-2 border-t border-zinc-700">
                <span className="text-xs text-zinc-500 font-medium uppercase">Balance</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-white">
                    {balance || "0.0000"}
                  </span>
                  <span className="text-sm text-zinc-400">S</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
