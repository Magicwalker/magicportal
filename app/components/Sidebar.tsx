"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletConnect from "./WalletConnect";
import { useWallet, NETWORKS } from "../context/WalletContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { account, balance, currentNetwork, switchNetwork, chainId } = useWallet();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "My NFTs", path: "/nfts" },
    { name: "Crypto Prices", path: "/prices" },
  ];

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    switchNetwork(e.target.value);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col z-50 transition-transform duration-300">
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          Magic Portal
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`block px-4 py-3 rounded-xl transition-colors font-medium ${
                isActive
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-4">
        
        {/* Network Switcher */}
        <div>
          <label className="text-xs text-zinc-500 uppercase font-semibold mb-1 block">Network</label>
          <select 
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={chainId || ""}
            onChange={handleNetworkChange}
          >
            <option value={NETWORKS.SONIC.chainId}>Sonic Network</option>
            <option value={NETWORKS.AVAX.chainId}>Avalanche C-Chain</option>
            {!currentNetwork && chainId && (
               <option value={chainId}>Unknown Network</option>
            )}
          </select>
        </div>

        {/* Balance Display */}
        {account && (
          <div>
            <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Balance</p>
            <div className="flex items-center gap-2">
               <div className="w-6 h-6 relative flex items-center justify-center bg-black rounded-full text-white text-xs font-bold">
                  {currentNetwork?.nativeCurrency.symbol[0] || "?"}
               </div>
               <span className="text-lg font-bold text-black dark:text-white">
                 {balance || "0.00"} {currentNetwork?.nativeCurrency.symbol}
               </span>
            </div>
          </div>
        )}

        <WalletConnect />
      </div>
    </aside>
  );
}
