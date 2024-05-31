const { hre:HardhatRuntimeEnvironment } = require("hardhat");
const { expect } = require("chai");
const {time} = require("@nomicfoundation/hardhat-toolbox/network-helpers.js")
const {ethers} = require("ethers")


describe("NFTAuction", function () {

    async function main() {
        let [deployer, addr1, addr2, addr3, addr4] = await hre.ethers.getSigners()
        console.log("Deploying contracts with the account:", deployer.address)

        const Auction = await hre.ethers.getContractFactory("NFTAuction")
        const auction = await Auction.deploy(deployer.address)

        const AuctionToken = await hre.ethers.getContractFactory("NFTAuctionToken")
        const auctionToken = await AuctionToken.deploy(deployer.address)

        // console.log("OnGoingAuctionsPage.jsx deployed to:", auction.target)
        // console.log("AuctionToken deployed to:", auctionToken.target)

        const MyNFT = await hre.ethers.getContractFactory("OnePieceNFT")
        const myNFT = await MyNFT.deploy(deployer.address)

        const Token = await hre.ethers.getContractFactory("Token")
        const token = await Token.deploy(deployer.address)

        // console.log("MyNFT deployed to:", myNFT.target)
        // console.log("Token deployed to:", token.target)

        // console.log(await token.owner())


        await token.connect(deployer).mint(addr1.address, 1000)
        await token.connect(deployer).mint(addr2.address, 1000)
        await token.connect(deployer).mint(addr3.address, 1000)
        await token.connect(deployer).mint(addr4.address, 1000)

        // console.log("Minted 1000 tokens to:", addr1.address)
        // console.log("Minted 1000 tokens to:", addr2.address)
        // console.log("Minted 1000 tokens to:", addr3.address)
        // console.log("Minted 1000 tokens to:", addr4.address)

        await myNFT.connect(deployer).safeMint(addr1.address, "https://ipfs.io/ipfs/QmZ")
        await myNFT.connect(deployer).safeMint(addr2.address, "https://ipfs.io/ipfs/QmZ")
        await myNFT.connect(deployer).safeMint(addr3.address, "https://ipfs.io/ipfs/QmZ")
        await myNFT.connect(deployer).safeMint(addr4.address, "https://ipfs.io/ipfs/QmZ")

        await myNFT.connect(addr1).approve(auction.target, 0)
        await myNFT.connect(addr2).approve(auction.target, 1)
        await myNFT.connect(addr3).approve(auction.target, 2)
        await myNFT.connect(addr4).approve(auction.target, 3)

        // await auction.connect(addr1).createAuction(myNFT.address, 0, 100, 1000)


        // await myNFT.connect(addr1).approve(auctionToken.target, 0)
        // await myNFT.connect(addr2).approve(auctionToken.target, 1)
        // await myNFT.connect(addr3).approve(auctionToken.target, 2)
        // await myNFT.connect(addr4).approve(auctionToken.target, 3)
        //
        //
        // await token.connect(addr1).approve(auctionToken.target, 2000)
        // await token.connect(addr2).approve(auctionToken.target, 2000)
        // await token.connect(addr3).approve(auctionToken.target, 2000)
        // await token.connect(addr4).approve(auctionToken.target, 2000)

        return[deployer, addr1, addr2, addr3, addr4, auction, auctionToken, myNFT, token]

    }

    it("Should deploy contracts", async function () {
        await main()
    });

    it("Should mint tokens", async function () {
        let [deployer, addr1, addr2, addr3, addr4, auction, auctionToken, myNFT, token] = await main()
        expect(await token.balanceOf(addr1.address)).to.equal(1000)
        expect(await token.balanceOf(addr2.address)).to.equal(1000)
        expect(await token.balanceOf(addr3.address)).to.equal(1000)
        expect(await token.balanceOf(addr4.address)).to.equal(1000)
    });

    it("Should mint NFTs", async function () {
        let [deployer, addr1, addr2, addr3, addr4, auction, auctionToken, myNFT, token] = await main()
        expect(await myNFT.ownerOf(0)).to.equal(addr1.address)
        expect(await myNFT.ownerOf(1)).to.equal(addr2.address)
        expect(await myNFT.ownerOf(2)).to.equal(addr3.address)
        expect(await myNFT.ownerOf(3)).to.equal(addr4.address)
    });

    it("Should approve NFTs", async function () {
        let [deployer, addr1, addr2, addr3, addr4, auction, auctionToken, myNFT, token] = await main()
        expect(await myNFT.getApproved(0)).to.equal(auction.target)
        expect(await myNFT.getApproved(1)).to.equal(auction.target)
        expect(await myNFT.getApproved(2)).to.equal(auction.target)
        expect(await myNFT.getApproved(3)).to.equal(auction.target)
    });

    //     function createAuction(
    //         address nftContract,
    //         uint256 nftId,
    //         uint256 initialPrice,
    //         uint256 duration
    //     )

    //     struct OnGoingAuctionsPage.jsx {
    //         address auctioneer;
    //         IERC721 nftContract;
    //         uint256 nftId;
    //         uint256 initialPrice;
    //         uint256 endTime;
    //         bool ended;
    //         uint256 highestBid;
    //         uint256 winnerBid;
    //         address winner;
    //     }

    it("Can create an auction", async function () {
        let [deployer, addr1, addr2, addr3, addr4, auction, auctionToken, myNFT, token] = await main()
        await auction.connect(addr1).createAuction(myNFT.target, 0, 100, 1000)
        let auctionData = await auction.getAuctionDetails(1)

        expect(auctionData.auctioneer).to.equal(addr1.address)
        expect(auctionData.nftContract).to.equal(myNFT.target)
        expect(auctionData.nftId).to.equal(0)
        expect(auctionData.winnerBid).to.equal(100)
    });

    it("Can bid on an auction", async function () {
        let [deployer, addr1, addr2, addr3, addr4, auction, auctionToken, myNFT, token] = await main()
        await auction.connect(addr1).createAuction(myNFT.target, 0, 100, 1000)
        await auction.connect(addr2).placeBid(1, {value: 200})
        let auctionData = await auction.getAuctionDetails(1)
        expect(auctionData.winnerBid).to.equal(100)
    });

    it("Can end an auction", async function () {
        let [deployer, addr1, addr2, addr3, addr4, auction, auctionToken, myNFT, token] = await main()
        await auction.connect(addr1).createAuction(myNFT.target, 0, 100, 1000)
        await auction.connect(addr2).placeBid(1, {value: 200})
        let auctionData = await auction.getAuctionDetails(1)
        await time.increaseTo(auctionData.endTime)
        await auction.connect(addr1).endAuction(1)
        auctionData = await auction.getAuctionDetails(1)

        expect(auctionData.ended).to.equal(true)
    });

    it("Can cancel a bid", async function () {
        let [deployer, addr1, addr2, addr3, addr4, auction, auctionToken, myNFT, token] = await main()
        await auction.connect(addr1).createAuction(myNFT.target, 0, 100, 1000);
        await auction.connect(addr2).placeBid(1, { value: 200 });
        await auction.connect(addr3).placeBid(1, { value: 300 });
        await auction.connect(addr2).cancelBid(1);
        let auctionData = await auction.getAuctionDetails(1);
        expect(auctionData.winnerBid).to.equal(200);
        expect(await hre.ethers.provider.getBalance(addr2.address)).to.be.above(1000 - 200);  // Check that addr2's balance is refunded
    });

    it("Can cancel an auction", async function () {
        let [deployer, addr1, addr2, addr3, addr4, auction, auctionToken, myNFT, token] = await main()
        await auction.connect(addr1).createAuction(myNFT.target, 0, 100, 1000);
        await auction.connect(addr2).placeBid(1, { value: 200 });
        await auction.connect(addr1).cancelAuction(1);
        let auctionData = await auction.getAuctionDetails(1);
        expect(auctionData.ended).to.equal(true);
        expect(await myNFT.ownerOf(0)).to.equal(addr1.address); // Check that NFT is returned to owner
        expect(await hre.ethers.provider.getBalance(addr2.address)).to.be.above(1000 - 200);  // Check that addr2's balance is refunded
    });



    it("Winner just pays the second highest bid", async function () {
        let [deployer, addr1, addr2, addr3, addr4, auction, auctionToken, myNFT, token] = await main()
        let defaultBalance = await hre.ethers.provider.getBalance(addr3.address)

        await auction.connect(addr1).createAuction(myNFT.target, 0, ethers.parseEther("100"), 1000)

        await auction.connect(addr2).placeBid(1, {value: ethers.parseEther("250")})

        await auction.connect(addr3).placeBid(1, {value: ethers.parseEther("300")})

        // end auction
        let auctionData = await auction.getAuctionDetails(1)
        let endTime = auctionData.endTime
        await time.increaseTo(endTime)
        await auction.connect(addr1).endAuction(1)

        expect(await hre.ethers.provider.getBalance(addr3.address)).to.be.above(defaultBalance - ethers.parseEther("251"));  // Check that addr3's balance is refunded
    });

    it("Can withdraw a bid after auction ends", async function () {
        let [deployer, addr1, addr2, addr3, addr4, auction, auctionToken, myNFT, token] = await main()

        let defaultBalance = await hre.ethers.provider.getBalance(addr2.address)

        await auction.connect(addr1).createAuction(myNFT.target, 0, ethers.parseEther("100"), 1000)
        await auction.connect(addr2).placeBid(1, {value: ethers.parseEther("200")})

        await auction.connect(addr3).placeBid(1, {value: ethers.parseEther("300")})
        let auctionData = await auction.getAuctionDetails(1)
        let endTime = auctionData.endTime
        await time.increaseTo(endTime)
        await auction.connect(addr1).endAuction(1)

        await auction.connect(addr2).withdrawBid(1)
        expect(await hre.ethers.provider.getBalance(addr2.address)).to.be.above(defaultBalance - ethers.parseEther("1"));  // Check that addr2's balance is refunded
    });


});
