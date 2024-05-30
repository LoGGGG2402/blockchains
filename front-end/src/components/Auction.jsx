import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";

function Auction({ auctionContract, auctionId, signer }) {
    const [nft, setNft] = useState({});
    const [auctioneer, setAuctioneer] = useState("");
    const [endTime, setEndTime] = useState(0);
    const [ended, setEnded] = useState(false);
    const [winnerBid, setWinnerBid] = useState(0);
    const [symbol, setSymbol] = useState("");
    const [myBalance, setMyBalance] = useState(0);

    // const [nftContract, setNftContract] = useState(null);
    const [paymentContract, setPaymentContract] = useState(null);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAuctionDetails = async () => {
            setLoading(true);
            if (!window.ethereum) {
                alert("Please install MetaMask!");
                return;
            }

            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const auctionInfo = await auctionContract.getAuctionDetails(auctionId);
                console.log("Auction Info:", auctionInfo);
                const { auctioneer, nftContract, nftId, endTime, ended, winnerBid, paymentToken } = auctionInfo;
                setAuctioneer(auctioneer);
                setEndTime(endTime);
                setEnded(ended);

                const ERC721abi = [
                    "function tokenURI(uint256 tokenId) view returns (string)",
                    "function approve(address to, uint256 tokenId)",
                    "function balanceOf(address owner) view returns (uint256)",
                    "function ownerOf(uint256 tokenId) view returns (address)",
                ];

                const contract = new ethers.Contract(nftContract, ERC721abi, provider);
                setNftContract(contract);

                const uri = await contract.tokenURI(nftId);
                const response = await axios.get(uri);
                const nft = {
                    name: response.data.name,
                    description: response.data.description,
                    image: response.data.image,
                };

                setNft(nft);

                if (!paymentToken) {
                    const myBalance = await provider.getBalance(signer._address);
                    setMyBalance(Number(ethers.utils.formatEther(myBalance)));
                    setWinnerBid(Number(ethers.utils.formatEther(winnerBid)));
                    setSymbol("ETH");
                } else {
                    const ERC20abi = [
                        "function balanceOf(address owner) view returns (uint256)",
                        "function transfer(address to, uint256 value) returns (bool)",
                        "function approve(address spender, uint256 amount) returns (bool)",
                        "function allowance(address owner, address spender) view returns (uint256)",
                        "function symbol() view returns (string)",
                        "function decimals() view returns (uint8)",
                    ];

                    const tokenContract = new ethers.Contract(paymentToken, ERC20abi, provider);
                    setPaymentContract(tokenContract);

                    const symbol = await tokenContract.symbol();
                    const decimals = await tokenContract.decimals();
                    const myBalance = await tokenContract.balanceOf(signer._address);
                    setMyBalance(Number(ethers.utils.formatUnits(myBalance, decimals)));

                    setSymbol(symbol);
                    setWinnerBid(Number(ethers.utils.formatUnits(winnerBid, decimals)));
                }
            } catch (error) {
                console.error("Error fetching auction details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAuctionDetails();
    }, [auctionContract, auctionId, signer]);

    const placeBid = async () => {
        if (!window.ethereum) {
            alert("Please install MetaMask!");
            return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contractWithSigner = auctionContract.connect(signer);

        try {
            setLoading(true);
            let tx;
            if (paymentContract) {
                // If payment by ERC20 token
                const bidAmount = prompt("Enter your bid amount (in tokens):");
                if (bidAmount) {
                    const amountInWei = ethers.utils.parseUnits(bidAmount, await paymentContract.decimals());
                    const allowance = await paymentContract.allowance(signer._address, auctionContract.address);
                    if (allowance.lt(amountInWei)) {
                        const approveTx = await paymentContract.approve(auctionContract.address, amountInWei);
                        await approveTx.wait();
                    }
                    tx = await contractWithSigner.placeBid(auctionId, amountInWei);
                }
            } else {
                // If payment by ETH
                const bidAmount = prompt("Enter your bid amount (in ETH):");
                if (bidAmount) {
                    const amountInWei = ethers.utils.parseEther(bidAmount);
                    tx = await contractWithSigner.placeBid(auctionId, { value: amountInWei });
                }
            }
            if (tx) {
                await tx.wait();
                alert("Bid placed successfully!");
            }
        } catch (error) {
            console.error("Error placing bid:", error);
            alert("Failed to place bid.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {loading ? (
                <div className="flex justify-center items-center h-screen">
                    <div className="loader"></div>
                </div>
            ) : (
                <div className="max-w-sm rounded overflow-hidden shadow-lg m-4 bg-white">
                    <img className="w-full h-48 object-cover" src={nft.image} alt={nft.name} />
                    <div className="px-6 py-4">
                        <div className="font-bold text-xl mb-2">{nft.name}</div>
                        <p className="text-gray-700 text-base">{nft.description}</p>
                    </div>
                    <div className="px-6 pt-4 pb-2">
                        <span className="block bg-green-200 rounded-full px-3 py-1 text-sm font-semibold text-green-700 mr-2 mb-2">
                            Auctioneer: {auctioneer}
                        </span>
                        <span className="block bg-green-200 rounded-full px-3 py-1 text-sm font-semibold text-green-700 mr-2 mb-2">
                            End Time: {new Date(endTime * 1000).toLocaleString()}
                        </span>
                        <span className="block bg-green-200 rounded-full px-3 py-1 text-sm font-semibold text-green-700 mr-2 mb-2">
                            Ended: {ended ? "Yes" : "No"}
                        </span>
                        <span className="block bg-green-200 rounded-full px-3 py-1 text-sm font-semibold text-green-700 mr-2 mb-2">
                            Winner Bid: {winnerBid} {symbol}
                        </span>
                        <span className="block bg-green-200 rounded-full px-3 py-1 text-sm font-semibold text-green-700 mr-2 mb-2">
                            My Balance: {myBalance} {symbol}
                        </span>
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            onClick={placeBid}
                        >
                            Place Bid
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default Auction;
