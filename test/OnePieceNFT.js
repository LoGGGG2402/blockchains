const {hre: HardhatRuntimeEnvironment} = require("hardhat");
const {expect} = require("chai");

describe("OnePieceNFT", function () {
    it('should deploy NFT Contract', async () => {
        const [deployer, addr1, addr2, addr3, addr4] = await hre.ethers.getSigners();
        const OP_NFT = await hre.ethers.getContractFactory("OnePieceNFT");
        const op_nft = await OP_NFT.deploy(deployer.address);

        let nft_id = await op_nft.connect(addr1).mint("https://ipfs.io/ipfs/QmZ")

        let owner = await op_nft.ownerOf(0)

        let tokenURI = await op_nft.tokenURI(0)

        expect(owner).to.equal(addr1.address)
    });
})