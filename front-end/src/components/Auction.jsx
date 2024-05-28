import {useEffect, useState} from "react";
import {ethers} from "ethers";
import axios from "axios";

function Auction({auctionContract, auctionId, signer}) {
    const [nft, setNft] = useState({});
    const [auctioneer, setAuctioneer] = useState("");
    const [endTime, setEndTime] = useState(0);
    const [ended, setEnded] = useState(false);
    const [winnerBid, setWinnerBid] = useState(0);
    const [symbol, setSymbol] = useState("");
    const [myBalance, setMyBalance] = useState(0);
    
    const [nftContract, setNftContract] = useState(null);
    const [paymentContract, setPaymentContract] = useState(null);
    
    const [loading, setLoading] = useState(false);

    useEffect(async () => {
        setLoading(true)
        if (!window.ethereum) {
            alert("Please install MetaMask!");
            return;
        }
        
        // get auction data
        let provider = new ethers.providers.Web3Provider(window.ethereum);
        let auctionInfo = await auctionContract.getAuctionDetails(auctionId);
        console.log("Auction Info:", auctionInfo);
        let {auctioneer, nftContract, nftId, endTime, ended, winnerBid} = auctionInfo;
        setAuctioneer(auctioneer);
        setEndTime(endTime);
        setEnded(ended);
        

        // get NFT metadata
        let ERC721abi = [
            "function tokenURI(uint256 tokenId) view returns (string)",
            "function approve(address to, uint256 tokenId)",
            "function balanceOf(address owner) view returns (uint256)",
            "function ownerOf(uint256 tokenId) view returns (address)",
        ];

        const contract = new ethers.Contract(nftContract, ERC721abi, provider);
        console.log("Contract:", contract);
        setNftContract(contract);

        const uri = await contract.tokenURI(nftId);
        const response = await axios.get(uri);
        const nft = {
            name: response.data.name,
            description: response.data.description,
            image: response.data.image
        }

        setNft(nft);

        // if paymentToken is not set, return
        if (!auctionInfo.paymentToken) {
            let myBalance = await provider.getBalance(signer._address);
            setMyBalance(Number(ethers.utils.formatEther(myBalance)));
            setWinnerBid(Number(ethers.utils.formatEther(winnerBid)));
            setSymbol("ETH");
            setLoading(false);
            return;
        }
        let ERC20abi = [
            "function balanceOf(address owner) view returns (uint256)",
            "function transfer(address to, uint256 value) returns (bool)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function symbol() view returns (string)",
            "function decimals() view returns (uint8)"
        ];

        const tokenContract = new ethers.Contract(paymentToken, ERC20abi, provider);
        setPaymentContract(tokenContract)

        const symbol = await tokenContract.symbol();
        const decimals = await tokenContract.decimals();
        const myBalance = await tokenContract.balanceOf(signer._address);
        setMyBalance(Number(ethers.utils.formatUnits(myBalance, decimals)));

        // Convert winnerBid to correct amount
        setSymbol(symbol);
        setWinnerBid(Number(ethers.utils.formatUnits(winnerBid, decimals)));
        setLoading(false);
    }, [])



    return (
        <>
        </>
    )

}

export default Auction;