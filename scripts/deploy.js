import hre from "hardhat"
import {ethers} from "ethers";
import fs from "fs"

async function main() {
    let [deployer, addr1, addr2, addr3, addr4] = await hre.ethers.getSigners()
    console.log("Deploying contracts with the account:", deployer.address)

    const Auction = await hre.ethers.getContractFactory("NFTAuction")
    const auction = await Auction.deploy(deployer.address)

    const AuctionToken = await hre.ethers.getContractFactory("NFTAuctionToken")
    const auctionToken = await AuctionToken.deploy(deployer.address)

    const Token = await hre.ethers.getContractFactory("Token")
    const token = await Token.deploy(deployer.address)

    await token.connect(deployer).mint(addr1.address, ethers.parseEther("1000"))
    await token.connect(deployer).mint(addr2.address, ethers.parseEther("1000"))
    await token.connect(deployer).mint(addr3.address, ethers.parseEther("1000"))
    await token.connect(deployer).mint(addr4.address, ethers.parseEther("1000"))


    await token.connect(addr1).approve(auctionToken.target, ethers.parseEther("2000"))
    await token.connect(addr2).approve(auctionToken.target, ethers.parseEther("2000"))
    await token.connect(addr3).approve(auctionToken.target, ethers.parseEther("2000"))
    await token.connect(addr4).approve(auctionToken.target, ethers.parseEther("2000"))


    // deploy OnePieceNFT contract
    const OP_NFT = await hre.ethers.getContractFactory("OnePieceNFT")
    const op_nft = await OP_NFT.deploy(deployer.address)

    console.log("OnePieceNFT deployed to:", op_nft.target)
    console.log("NFTAuction deployed to:", auction.target)
    console.log("NFTAuctionToken deployed to:", auctionToken.target)
    console.log("Token deployed to:", token.target)

    saveFrontendFiles("OnePieceNFT", op_nft.target)
    saveFrontendFiles("NFTAuction", auction.target)
    saveFrontendFiles("NFTAuctionToken", auctionToken.target)
    // saveFrontendFiles("Token", token.target)
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