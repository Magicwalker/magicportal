import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

// Sonic RPC URL
const RPC_URL = "https://rpc.soniclabs.com";

// Minimal ABI to get tokenURI
const ERC721_ABI = [
  "function tokenURI(uint256 tokenId) view returns (string)"
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
  
  if (!ETHERSCAN_API_KEY) {
     return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
  }

  try {
    // 1. Fetch Transfer History
    const etherscanUrl = `https://api.etherscan.io/v2/api?chainid=146&module=account&action=tokennfttx&address=${address}&apikey=${ETHERSCAN_API_KEY}&sort=asc&offset=1000`;
    
    const response = await fetch(etherscanUrl);
    const data = await response.json();

    if (data.status === "1" && data.result) {
      // 2. Calculate Ownership
      const ownedTokens = new Set<string>();
      const tokenMetadata = new Map<string, any>();
      const userAddress = address.toLowerCase();

      data.result.forEach((tx: any) => {
         const key = `${tx.contractAddress}-${tx.tokenID}`;
         const from = tx.from.toLowerCase();
         const to = tx.to.toLowerCase();

         if (!tokenMetadata.has(key)) {
            tokenMetadata.set(key, {
                contractAddress: tx.contractAddress,
                tokenId: tx.tokenID,
                name: tx.tokenName || `NFT #${tx.tokenID}`,
                symbol: tx.tokenSymbol,
            });
         }

         if (to === userAddress) {
             ownedTokens.add(key);
         } else if (from === userAddress) {
             ownedTokens.delete(key);
         }
      });

      // 3. Prepare List of Owned NFTs
      let nfts = Array.from(ownedTokens).map(key => {
          const meta = tokenMetadata.get(key);
          return {
              id: key,
              tokenId: meta.tokenId,
              contractAddress: meta.contractAddress,
              name: meta.name,
              description: meta.symbol ? `Symbol: ${meta.symbol}` : "No description",
              image: null, // To be fetched
              type: "ERC-721"
          };
      });

      // 4. Fetch Metadata (Image) for each NFT
      // We limit to first 20 to avoid timeout/rate-limits in this demo
      const nftsToFetch = nfts.slice(0, 20); 
      
      const provider = new ethers.JsonRpcProvider(RPC_URL);

      const nftsWithImages = await Promise.all(nftsToFetch.map(async (nft) => {
        try {
          const contract = new ethers.Contract(nft.contractAddress, ERC721_ABI, provider);
          let tokenUri = await contract.tokenURI(nft.tokenId);

          // Handle IPFS URLs
          if (tokenUri.startsWith("ipfs://")) {
            tokenUri = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/");
          }

          // Fetch the Metadata JSON
          // Handle data URIs (base64 json)
          let metadata;
          if (tokenUri.startsWith("data:application/json;base64,")) {
             const base64 = tokenUri.split(",")[1];
             const jsonString = Buffer.from(base64, 'base64').toString('utf-8');
             metadata = JSON.parse(jsonString);
          } else {
             // Fetch from URL
             const metaResponse = await fetch(tokenUri);
             metadata = await metaResponse.json();
          }

          if (metadata && metadata.image) {
             let imageUrl = metadata.image;
             if (imageUrl.startsWith("ipfs://")) {
                imageUrl = imageUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
             }
             return { ...nft, image: imageUrl, name: metadata.name || nft.name, description: metadata.description || nft.description };
          }
          
          return nft;

        } catch (err) {
          console.error(`Failed to fetch metadata for ${nft.id}:`, err);
          return nft;
        }
      }));

      // Combine fetched results with the rest (which won't have images yet)
      const finalNfts = [...nftsWithImages, ...nfts.slice(20)];

      return NextResponse.json({ nfts: finalNfts });

    } else {
        return NextResponse.json({ nfts: [], message: `API Error: ${data.message}` });
    }

  } catch (error) {
    console.error("API failed:", error);
    return NextResponse.json({ 
      nfts: [], 
      message: "Failed to fetch data."
    });
  }
}
