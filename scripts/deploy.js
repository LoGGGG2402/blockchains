const fs = require("fs");
const {ethers, artifacts} = require("hardhat");

async function main() {
    let [deployer] = await ethers.getSigners()
    console.log("Deploying contracts with the account:", deployer.address)
    const Auction = await ethers.getContractFactory("NFTAuction")
    const auction = await Auction.deploy()
    
    const AuctionToken = await ethers.getContractFactory("NFTAuctionToken")
    const auctionToken = await AuctionToken.deploy()
    
    const Token = await ethers.getContractFactory("Token")
    const token = await Token.deploy(deployer.address)
    
    const OP_NFT = await ethers.getContractFactory("OnePieceNFT")
    const op_nft = await OP_NFT.deploy()
    
    console.log("OnePieceNFT deployed to:", op_nft.target)
    console.log("NFTAuction deployed to:", auction.target)
    console.log("NFTAuctionToken deployed to:", auctionToken.target)
    console.log("Token deployed to:", token.target)
    
    saveFrontendFiles("OnePieceNFT", op_nft.target)
    saveFrontendFiles("NFTAuction", auction.target)
    saveFrontendFiles("NFTAuctionToken", auctionToken.target)
    saveFrontendFiles("Token", token.target)

    const NFTMarket = await ethers.getContractFactory("NFTMarket")
    const nftMarket = await NFTMarket.deploy()

    console.log("NFTMarket deployed to:", nftMarket.target)
    saveFrontendFiles("NFTMarket", nftMarket.target)
}

// function to save addresses and ABIs to frontend
function saveFrontendFiles(contractName, address) {
    const contractsDir = "C:\\Users\\Nitro 5\\Code\\blockchains\\front-end\\src\\assets\\contracts"
    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir)
    }
    fs.writeFileSync(
        contractsDir + "/" + contractName + ".json",
        JSON.stringify({
            address: address,
            abi: artifacts.readArtifactSync(contractName).abi,
        })
    )
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })