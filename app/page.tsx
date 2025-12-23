"use client";

import Image from "next/image";
import WalletConnect from "./components/WalletConnect";
import { useWallet } from "./context/WalletContext";
import Link from "next/link";

export default function Home() {
  const { account } = useWallet();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="absolute top-6 right-6 z-50">
        <WalletConnect />
      </div>
      
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Magic Portal
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Connect your wallet to enter the portal.
          </p>
          
          {account && (
            <Link 
              href="/nfts"
              className="mt-4 rounded-full bg-purple-600 px-8 py-4 text-white transition-colors hover:bg-purple-700 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Enter Portal & View NFTs
            </Link>
          )}
        </div>
        

      </main>
    </div>
  );
}
