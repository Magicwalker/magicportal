"use client";

import Image from "next/image";
import { useWallet } from "./context/WalletContext";
import Link from "next/link";

export default function Home() {
  const { account } = useWallet();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 sm:items-start">

        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Magic Portal
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Welcome to the Magic Portal. Use the sidebar to navigate your collection and view market prices.
          </p>
          
          {!account && (
             <p className="text-sm text-zinc-500">
               &larr; Connect your wallet in the sidebar to get started.
             </p>
          )}
        </div>

      </main>
    </div>
  );
}
