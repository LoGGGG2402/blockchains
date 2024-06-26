import {useEffect, useState} from "react";
import {ethers} from "ethers";
import axios from "axios";
import Sweet from "sweetalert2";

function Auction({auctionContract, auctionId, signer}) {
    const [nft, setNft] = useState({});
    const [auctioneer, setAuctioneer] = useState("");
    const [endTime, setEndTime] = useState(0);
    const [ended, setEnded] = useState(false);
    const [winnerBid, setWinnerBid] = useState("");
    const [myBid, setMyBid] = useState(null);
    const [symbol, setSymbol] = useState("");
    const [isWinner, setIsWinner] = useState(false);

    const [paymentContract, setPaymentContract] = useState(null);

    const [loading, setLoading] = useState(false);
    const [waitingTx, setWaitingTx] = useState(false);

    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchAuctionDetails = async () => {
            setLoading(true);
            if (!window.ethereum) {
                await Sweet.fire({
                    icon: "error",
                    title: "Please install MetaMask!",
                });
                return;
            }

            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const auctionInfo = await auctionContract.getAuctionDetails(auctionId);
                const {auctioneer, nftContract, nftId, endTime, ended, winnerBid, tokenPayment} = auctionInfo;
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

                const uri = await contract.tokenURI(nftId);
                const response = await axios.get(uri);
                const nft = {
                    tokenId: nftId.toNumber(),
                    address: nftContract,
                    name: response.data.name,
                    description: response.data.description,
                    image: response.data.image,
                };

                if (signer) {
                    const myBid = await auctionContract.connect(signer).getBidPrice(auctionId);
                    if (myBid.gt(0)) {
                        setMyBid(ethers.utils.formatEther(myBid));
                    }
                    const winner = await auctionContract.connect(signer).isWinner(auctionId);
                    if (winner) {
                        setIsWinner(true);
                    }
                }

                setNft(nft);
                if (!tokenPayment) {
                    setWinnerBid(ethers.utils.formatEther(winnerBid));
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

                    const tokenContract = new ethers.Contract(tokenPayment, ERC20abi, provider);
                    setPaymentContract(tokenContract);

                    const symbol = await tokenContract.symbol();
                    const decimals = await tokenContract.decimals();

                    setSymbol(symbol);
                    setWinnerBid(ethers.utils.formatUnits(winnerBid, decimals));
                }
            } catch (error) {
                await Sweet.fire({
                    icon: "error",
                    title: "Error fetching auction details!",
                    html: JSON.stringify(error.reason || error.message || error),
                });
            } finally {
                setLoading(false);
            }
        };

        fetchAuctionDetails().then()
    }, [auctionContract, auctionId, signer, success]);

    const placeBid = async () => {
        if (!window.ethereum) {
            await Sweet.fire({
                icon: "error",
                title: "Please install MetaMask!",
            });
            return;
        }
        const contractWithSigner = auctionContract.connect(signer);
        setWaitingTx(true)

        try {
            let tx;
            if (paymentContract) {
                // If payment by ERC20 token
                const bidAmount = prompt("Enter your bid amount (in tokens):");
                if (bidAmount) {
                    const amountInWei = ethers.utils.parseUnits(bidAmount, await paymentContract.decimals());
                    const allowance = await paymentContract.allowance(signer._address, auctionContract.address);
                    if (allowance.lt(amountInWei)) {
                        const approveTx = await paymentContract.connect(signer).approve(auctionContract.address, amountInWei);
                        await approveTx.wait();
                    }
                    tx = await contractWithSigner.placeBid(auctionId, amountInWei);
                }
            } else {
                // If payment by ETH
                const bidAmount = prompt("Enter your bid amount (in ETH):");
                if (bidAmount) {
                    const amountInWei = ethers.utils.parseEther(bidAmount);
                    tx = await contractWithSigner.placeBid(auctionId, {value: amountInWei});
                }
            }
            if (tx) {
                await tx.wait();
                setSuccess(!success);
                await Sweet.fire({
                    icon: "success",
                    title: "Bid placed successfully!",
                });
            }
        } catch (error) {
            await Sweet.fire({
                icon: "error",
                title: "Failed to place bid.",
                html: JSON.stringify(error.reason || error.message || error),
            });
        } finally {
            setWaitingTx(false);
        }
    };
    const cancelBid = async () => {
        if (!window.ethereum) {
            await Sweet.fire({
                icon: "error",
                title: "Please install MetaMask!",
            });
            return;
        }
        setWaitingTx(true)
        try {
            const tx = await auctionContract.connect(signer).cancelBid(auctionId);
            await tx.wait();
            setSuccess(!success)
            await Sweet.fire({
                icon: "success",
                title: "Bid cancelled successfully!",
            });
        } catch (error) {
            await Sweet.fire({
                icon: "error",
                title: "Failed to cancel bid.",
                html: JSON.stringify(error.reason || error.message || error),
            });
        } finally {
            setWaitingTx(false);
        }
    }

    const withdraw = async () => {
        if (!window.ethereum) {
            await Sweet.fire({
                icon: "error",
                title: "Please install MetaMask!",
            });
            return;
        }
        setWaitingTx(true)
        try {
            const tx = await auctionContract.connect(signer).withdrawBid(auctionId);
            await tx.wait();
            setSuccess(!success)
            await Sweet.fire({
                icon: "success",
                title: "Withdrawn successfully!",
            });
        } catch (error) {
            await Sweet.fire({
                icon: "error",
                title: "Failed to withdraw.",
                html: JSON.stringify(error.reason || error.message || error),
            });
        } finally {
            setWaitingTx(false);
        }
    }
    const endAuction = async () => {
        if (!window.ethereum) {
            await Sweet.fire({
                icon: "error",
                title: "Please install MetaMask!",
            });
            return;
        }
        setWaitingTx(true)
        try {
            const tx = await auctionContract.connect(signer).endAuction(auctionId);
            await tx.wait();
            setSuccess(!success)
            await Sweet.fire({
                icon: "success",
                title: "Auction ended successfully!",
            });
        } catch (error) {
            await Sweet.fire({
                icon: "error",
                title: "Failed to end auction.",
                html: JSON.stringify(error.reason || error.message || error),
            });
        }
        finally {
            setWaitingTx(false);
        }
    }

    const claimNFT = async (tokenId, address) => {
        setWaitingTx(true)
        let nfts = localStorage.getItem("nfts") ? JSON.parse(localStorage.getItem("nfts")) : [];
        // check if nft is already claimed by nftId and address
        if (nfts.find(nft => nft.tokenId.valueOf() === tokenId.valueOf() && nft.address === address && nft.owner === signer._address)) {
            await Sweet.fire({
                icon: "error",
                title: "NFT already claimed!",
            });
            setWaitingTx(false)
            return;
        }
        if (!window.ethereum) {
            await Sweet.fire("Please install MetaMask!", "", "error");
            return;
        }
        let provider = new ethers.providers.Web3Provider(window.ethereum);
        let ERC721abi = [
            "function tokenURI(uint256 tokenId) view returns (string)",
            "function approve(address to, uint256 tokenId)",
            "function balanceOf(address owner) view returns (uint256)",
            "function ownerOf(uint256 tokenId) view returns (address)",
        ];



        try {
            const contract = new ethers.Contract(address, ERC721abi, provider);
            const uri = await contract.tokenURI(tokenId);
            const owner = await contract.ownerOf(tokenId);
            if (owner !== signer._address) {
                await Sweet.fire({
                    icon: "error",
                    title: "You are not the owner of this NFT!",
                });
                setWaitingTx(false);
                return;
            }
            const nft = {
                tokenId: tokenId,
                address: address,
                uri: uri,
                owner: owner,
            }
            nfts.push(nft);
            localStorage.setItem("nfts", JSON.stringify(nfts));
            await Sweet.fire({
                icon: "success",
                title: "NFT claimed successfully!",
            });
        } catch (error) {
            await Sweet.fire({
                icon: "error",
                title: "Failed to claim NFT.",
                html: JSON.stringify(error.reason || error.message || error),
            });
        } finally {
            setWaitingTx(false);
        }
    }

    return (
        <div className={"m-4"}>
            {loading ? (
                <div className="justify-center items-center flex h-96">
                <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-gray-900"></div>
                </div>
            ) : (
                <div className={waitingTx ? "blur-sm pointer-events-none" : ""}>
                    <>
                        <div className="max-w-xs rounded overflow-hidden shadow-md bg-white mx-auto">
                            <img className="w-full h-48 object-cover" src={nft.image} alt={nft.name} />
                            <div className="px-4">
                                <div className="font-bold text-lg mb-1 text-gray-800 text-center">{nft.name}</div>
                                <p className="text-gray-700 text-sm">Description: {nft.description}</p>
                            </div>
                            <div className="px-4 py-3 bg-white rounded-b-lg">
                                <div className="flex flex-wrap justify-center">
                                    <span className="block rounded-full px-2 py-1 text-xs font-semibold text-green-700 mr-1 mb-1">
                                        Auctioneer: {auctioneer}
                                    </span>
                                    <span className="block rounded-full px-2 py-1 text-xs font-semibold text-green-700 mr-1 mb-1">
                                        End Time: {new Date(endTime * 1000).toLocaleString()}
                                    </span>
                                    <span className="block rounded-full px-2 py-1 text-xs font-semibold text-green-700 mr-1 mb-1">
                                        Ended: {ended ? "Yes" : "No"}
                                    </span>
                                    <span className="block rounded-full px-2 py-1 text-xs font-semibold text-green-700 mr-1 mb-1">
                                        Winner Bid: {winnerBid} {symbol}
                                    </span>
                                    {myBid && (
                                        <span className="block rounded-full px-2 py-1 text-xs font-semibold text-green-700 mr-1 mb-1">
                                            My Bid: {myBid} {symbol}
                                        </span>
                                    )}
                                </div>
                                {signer._address !== auctioneer && !ended && endTime - Math.floor(Date.now() / 1000) > 0 &&(
                                    <div>
                                        <button
                                            className="mt-2 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded transition duration-300"
                                            onClick={placeBid}
                                        >
                                            Place Bid
                                        </button>
                                    </div>
                                )}

                                {signer._address !== auctioneer && !ended && myBid && !isWinner && (
                                    <div>
                                        <button
                                            className="mt-2 w-full bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded transition duration-300"
                                            onClick={cancelBid}
                                        >
                                            Cancel Bid
                                        </button>
                                    </div>
                                    )
                                }
                                {signer._address !== auctioneer && ended && !isWinner && myBid && (
                                    <button
                                        className="mt-2 w-full bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded transition duration-300"
                                        onClick={withdraw}
                                    >
                                        Withdraw
                                    </button>
                                )}
                                {(signer._address === auctioneer || isWinner) && !ended && Math.floor(Date.now() / 1000) - endTime > 60 && (
                                    <div>
                                        <button
                                            className="mt-2 w-full bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded transition duration-300"
                                            onClick={endAuction}
                                        >
                                            End Auction
                                        </button>
                                    </div>
                                )}
                                {(isWinner || signer._address === auctioneer) && ended && (
                                    <button
                                        className="mt-2 w-full bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded transition duration-300"
                                        onClick={() => claimNFT(nft.tokenId, nft.address)}
                                    >
                                        Claim NFT
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                </div>
            )}
        </div>
    );
}

export default Auction;
