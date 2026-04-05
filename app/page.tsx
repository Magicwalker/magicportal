"use client";

import Image from "next/image";
import { useWallet } from "./context/WalletContext";
import Link from "next/link";

export default function Home() {
  const { account } = useWallet();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Magic Portal
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Connect your wallet to enter the portal.
          </p>
          
          <div className="flex flex-col gap-4 w-full sm:w-auto">
            {account && (
              <Link 
                href="/nfts"
                className="rounded-full bg-purple-600 px-8 py-4 text-white transition-colors hover:bg-purple-700 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center"
              >
                Enter Portal & View NFTs
              </Link>
            )}
            
            <Link 
              href="/prices"
              className="rounded-full bg-zinc-800 dark:bg-zinc-700 px-8 py-3 text-white transition-colors hover:bg-zinc-900 dark:hover:bg-zinc-600 font-semibold text-center border border-zinc-700 dark:border-zinc-600"
            >
              View Crypto Prices
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
