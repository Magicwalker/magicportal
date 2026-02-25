import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

// Sonic RPC URL
const RPC_URL = "https://rpc.soniclabs.com";

// ABI to get tokenURI and positions (for Uniswap V3 style NFTs)
const NFT_ABI = [
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
  "function ownerOf(uint256 tokenId) view returns (address)"
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
    const etherscanUrl = `https://api.etherscan.io/v2/api?chainid=146&module=account&action=tokennfttx&address=${address}&apikey=${ETHERSCAN_API_KEY}&sort=asc&offset=10000`;
    
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
         } 
         if (from === userAddress) {
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
              type: "ERC-721",
              status: "Unknown" // Active or Closed
          };
      });

      // 4. Fetch Metadata (Image) & Position Status for each NFT
      const nftsToFetch = nfts.slice(0, 20); 
      
      const provider = new ethers.JsonRpcProvider(RPC_URL);

      const nftsWithData = await Promise.all(nftsToFetch.map(async (nft) => {
        try {
          const contract = new ethers.Contract(nft.contractAddress, NFT_ABI, provider);
          
          // Double Check Ownership
          try {
             const owner = await contract.ownerOf(nft.tokenId);
             if (owner.toLowerCase() !== userAddress) {
                return null; 
             }
          } catch (e) {
             // Ignore owner check failure
          }

          // Fetch Token URI
          let tokenUri = "";
          try {
             tokenUri = await contract.tokenURI(nft.tokenId);
          } catch (e) {
             // console.log(`No tokenURI for ${nft.id}`);
          }

          // Fetch Position Data (Liquidity)
          let status = "Unknown";
          try {
             // Debug Log: Attempting to fetch positions
             // console.log(`Fetching positions for ${nft.contractAddress} token ${nft.tokenId}`);
             
             const positionData = await contract.positions(nft.tokenId);
             
             // Debug Log: Success
             // console.log(`Position Data for ${nft.tokenId}:`, positionData);

             if (positionData && positionData.liquidity !== undefined) {
                status = positionData.liquidity > BigInt(0) ? "Active" : "Closed";
             }
          } catch (e: any) {
             // Detailed Error Logging
             console.error(`Error fetching positions for NFT ${nft.tokenId} at ${nft.contractAddress}:`);
             // Check if it's a revert (likely not a Position Manager contract)
             if (e.code === 'CALL_EXCEPTION') {
                 // console.log("Contract does not support positions() - likely standard NFT");
                 status = "Standard";
             } else {
                 console.error(e.message || e);
                 status = "Error";
             }
          }

          // Handle IPFS URLs
          if (tokenUri.startsWith("ipfs://")) {
            tokenUri = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/");
          }

          // Fetch the Metadata JSON
          let metadata: any = {};
          if (tokenUri) {
              if (tokenUri.startsWith("data:application/json;base64,")) {
                 const base64 = tokenUri.split(",")[1];
                 const jsonString = Buffer.from(base64, 'base64').toString('utf-8');
                 metadata = JSON.parse(jsonString);
              } else if (tokenUri.startsWith("http")) {
                 const metaResponse = await fetch(tokenUri);
                 metadata = await metaResponse.json();
              }
          }

          let imageUrl = null;
          if (metadata && metadata.image) {
             imageUrl = metadata.image;
             if (imageUrl.startsWith("ipfs://")) {
                imageUrl = imageUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
             }
          }
          
          return { 
              ...nft, 
              image: imageUrl, 
              name: metadata.name || nft.name, 
              description: metadata.description || nft.description,
              status: status
          };

        } catch (err) {
          console.error(`Failed to fetch data for ${nft.id}:`, err);
          return nft;
        }
      }));

      const validNfts = nftsWithData.filter(n => n !== null);
      const finalNfts = [...validNfts, ...nfts.slice(20)];

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
