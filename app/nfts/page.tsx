"use client";

import { useWallet } from "../context/WalletContext";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

export default function NFTPage() {
  const { account } = useWallet();
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Bulk Transfer State
  const [selectedNfts, setSelectedNfts] = useState<Set<string>>(new Set());
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState<string | null>(null);

  // View Modal State
  const [viewNft, setViewNft] = useState<any | null>(null);

  useEffect(() => {
    async function fetchNFTs() {
      if (!account) {
        setNfts([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/nfts?address=${account}`);
        if (!response.ok) {
          throw new Error("Failed to fetch NFTs");
        }
        const data = await response.json();
        setNfts(data.nfts);
      } catch (err) {
        console.error("Error fetching NFTs:", err);
        setError("Failed to load NFTs. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchNFTs();
  }, [account]);

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedNfts);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedNfts(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedNfts.size === nfts.length) {
      setSelectedNfts(new Set());
    } else {
      const allIds = new Set(nfts.map(nft => nft.id));
      setSelectedNfts(allIds);
    }
  };

  const handleBulkTransfer = async () => {
    if (!account || !recipientAddress || selectedNfts.size === 0) return;
    
    if (!ethers.isAddress(recipientAddress)) {
      alert("Invalid recipient address");
      return;
    }

    setIsTransferring(true);
    setTransferStatus("Initializing transfer...");

    try {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        
        const selectedList = nfts.filter(nft => selectedNfts.has(nft.id));
        let successCount = 0;

        for (let i = 0; i < selectedList.length; i++) {
          const nft = selectedList[i];
          setTransferStatus(`Transferring ${i + 1} of ${selectedList.length}: ${nft.name}...`);
          
          try {
            const contract = new ethers.Contract(
              nft.contractAddress,
              ["function safeTransferFrom(address from, address to, uint256 tokenId)"],
              signer
            );

            const tx = await contract.safeTransferFrom(account, recipientAddress, nft.tokenId);
            await tx.wait();
            successCount++;
          } catch (err) {
            console.error(`Failed to transfer ${nft.name}:`, err);
            // Continue with others even if one fails
          }
        }

        setTransferStatus(`Transfer complete! Successfully sent ${successCount} NFTs.`);
        
        // Refresh list after delay
        setTimeout(() => {
          setTransferStatus(null);
          setIsTransferring(false);
          setSelectedNfts(new Set());
          // Trigger re-fetch logic here if needed, or just reload page
          window.location.reload();
        }, 2000);

      }
    } catch (err) {
      console.error("Bulk transfer failed:", err);
      setTransferStatus("Transfer failed. Check console for details.");
      setIsTransferring(false);
    }
  };

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-black dark:text-white">NFTs</h1>
            </div>
            
            {/* Bulk Transfer Controls */}
            {account && nfts.length > 0 && (
              <div className="flex flex-col gap-2 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Recipient Address (0x...)" 
                    className="border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm w-64 bg-transparent text-black dark:text-white"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    disabled={isTransferring}
                  />
                  <button
                    onClick={handleBulkTransfer}
                    disabled={selectedNfts.size === 0 || !recipientAddress || isTransferring}
                    className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors ${
                      selectedNfts.size === 0 || !recipientAddress || isTransferring
                        ? "bg-zinc-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isTransferring ? "Sending..." : `Transfer (${selectedNfts.size})`}
                  </button>
                </div>
                {transferStatus && (
                  <p className="text-xs text-blue-500 font-mono">{transferStatus}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                   <button 
                     onClick={handleSelectAll}
                     className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 underline"
                   >
                     {selectedNfts.size === nfts.length ? "Deselect All" : "Select All"}
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {!account ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-4">
              Please connect your wallet in the sidebar to view your NFTs.
            </p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
           <div className="flex justify-center py-20 text-red-500">
             {error}
           </div>
        ) : nfts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-4">
              No NFTs found for this wallet on Sonic Network.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {nfts.map((nft) => {
              const isSelected = selectedNfts.has(nft.id);
              return (
                <div
                  key={nft.id}
                  className={`relative bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-lg border transition-all ${
                    isSelected 
                      ? "border-blue-500 ring-2 ring-blue-500 transform scale-105" 
                      : "border-zinc-200 dark:border-zinc-800 hover:scale-105"
                  }`}
                >
                  {/* Checkbox Overlay - Click to Select */}
                  <div 
                    className="absolute top-0 left-0 w-full h-full z-10 cursor-pointer"
                    onClick={() => !isTransferring && toggleSelection(nft.id)}
                  >
                    <div className="absolute top-2 left-2">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                        isSelected ? "bg-blue-500 border-blue-500" : "bg-white/80 border-zinc-400"
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>



                  <div className="relative h-48 w-full bg-black flex items-center justify-center">
                    {nft.image ? (
                      <Image
                        src={nft.image}
                        alt={nft.name}
                        fill
                        className="object-contain"
                        unoptimized={nft.image.startsWith('data:')} 
                      />
                    ) : (
                      <div className="text-zinc-500 text-xs">No Image</div>
                    )}
                  </div>
                  <div className="p-3 flex-grow">
                    <h3 className="text-sm font-bold text-black dark:text-white truncate" title={nft.name}>{nft.name}</h3>
                    <p className="text-[10px] text-zinc-400 font-mono mt-1 truncate" title={nft.contractAddress}>
                      {nft.contractAddress}
                    </p>
                    <span>{nft.tokenId}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
}
