import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Auction from "../components/Auction.jsx";
import NFTAuction from "../assets/contracts/NFTAuction.json";
import NFTAuctionToken from "../assets/contracts/NFTAuctionToken.json";
import Sweet from "sweetalert2";

function OnGoingAuctionsPage({ signer }) {
    let [auctions, setAuctions] = useState([]);
    let [auctionsTokens, setAuctionsTokens] = useState([]);

    useEffect(() => {
        const fetchAuctions = async () => {
            if (!window.ethereum) {
                await Sweet.fire({
                    icon: "error",
                    title: "Please install MetaMask!"
                });
                return;
            }
            const provider = new ethers.providers.Web3Provider(window.ethereum);

            let NFTAuctionContract;
            let NFTAuctionTokenContract;

            try {
                NFTAuctionContract = new ethers.Contract(
                    NFTAuction.address,
                    NFTAuction.abi,
                    provider
                );
                NFTAuctionTokenContract = new ethers.Contract(
                    NFTAuctionToken.address,
                    NFTAuctionToken.abi,
                    provider
                );
            } catch (error) {
                console.error("Error creating contract instances:", error);
                return;
            }

            try {
                const auctions_count = await NFTAuctionContract._auctionIdCounter();
                const auctionsTokens_count = await NFTAuctionTokenContract._auctionIdCounter();

                const auctions = [];
                const auctionsTokens = [];

                for (let i = 1; i < auctions_count; i++) {
                    auctions.push({
                        auctionContract: NFTAuctionContract,
                        auctionId: i
                    });
                }

                for (let i = 1; i < auctionsTokens_count; i++) {
                    auctionsTokens.push({
                            auctionContract: NFTAuctionTokenContract,
                            auctionId: i
                    });
                }

                setAuctions(auctions);
                setAuctionsTokens(auctionsTokens);
            } catch (error) {
                console.error("Error fetching auctions:", error);
            }
        };

        fetchAuctions().then()
    }, [signer]);

    return (
        <>
            <h1>On Going Auctions</h1>
            <div>
                {auctions.map((auction, index) => (
                    <Auction
                        key={index}
                        auctionContract={auction.auctionContract}
                        auctionId={auction.auctionId}
                        signer={signer}
                    />
                ))}
            </div>
            <h1>On Going Auctions Tokens</h1>
            <div>
                {auctionsTokens.map((auctionToken, index) => (
                    <Auction
                        key={index}
                        auctionContract={auctionToken.auctionContract}
                        auctionId={auctionToken.auctionId}
                        signer={signer}
                    />
                ))}
            </div>
        </>
    );
}

export default OnGoingAuctionsPage;
