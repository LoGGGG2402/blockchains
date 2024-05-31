const {hre: HardhatRuntimeEnvironment} = require("hardhat");
const fs = require("fs");
const {ethers} = require("hardhat");

async function main() {
    let [deployer] = await hre.ethers.getSigners()
    console.log("Deploying contracts with the account:", deployer.address)
    const Auction = await hre.ethers.getContractFactory("NFTAuction")
    const auction = await Auction.deploy(deployer.address)

    const AuctionToken = await hre.ethers.getContractFactory("NFTAuctionToken")
    const auctionToken = await AuctionToken.deploy(deployer.address)

    // const Token = await hre.ethers.getContractFactory("Token")
    // const token = await Token.deploy(deployer.address)

    // deploy OnePieceNFT contract
    const OP_NFT = await hre.ethers.getContractFactory("OnePieceNFT")
    const op_nft = await OP_NFT.deploy(deployer.address)

    console.log("OnePieceNFT deployed to:", op_nft.target)
    console.log("NFTAuction deployed to:", auction.target)
    console.log("NFTAuctionToken deployed to:", auctionToken.target)
    // console.log("Token deployed to:", token.target)

    saveFrontendFiles("OnePieceNFT", op_nft.target)
    saveFrontendFiles("NFTAuction", auction.target)
    saveFrontendFiles("NFTAuctionToken", auctionToken.target)
}

// function to save addresses and ABIs to frontend
function saveFrontendFiles(contractName, address) {
    const contractsDir = "/Users/phanphanhailong/IdeaProjects/blockchains/front-end/src/assets/contracts"
    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir)
    }
    fs.writeFileSync(
        contractsDir + "/" + contractName + ".json",
        JSON.stringify({
            address: address,
            abi: hre.artifacts.readArtifactSync(contractName).abi,
        })
    )
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })