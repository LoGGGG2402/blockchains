import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Auction from "../components/Auction.jsx";
import NFTAuction from "../assets/contracts/NFTAuction.json";
import NFTAuctionToken from "../assets/contracts/NFTAuctionToken.json";

function AuctionsPage({ signer }) {
    let [auctions, setAuctions] = useState([]);
    let [auctionsTokens, setAuctionsTokens] = useState([]);

    useEffect(() => {
        const fetchAuctions = async () => {
            if (!window.ethereum) {
                alert("Please install MetaMask!");
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
                const onGoingAuctions = await NFTAuctionContract.getOngoingAuctions();
                const onGoingAuctionsTokens = await NFTAuctionTokenContract.getOngoingAuctions();

                const auctionsList = onGoingAuctions.map(auctionId => ({
                    auctionContract: NFTAuctionContract,
                    auctionId
                }));

                const auctionsTokensList = onGoingAuctionsTokens.map(auctionId => ({
                    auctionContract: NFTAuctionTokenContract,
                    auctionId
                }));

                setAuctions(auctionsList);
                setAuctionsTokens(auctionsTokensList);
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

export default AuctionsPage;
