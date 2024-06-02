import {useEffect, useState} from "react";
import {ethers} from "ethers";
import Auction from "../components/Auction.jsx";
import NFTAuction from "../assets/contracts/NFTAuction.json";
import NFTAuctionToken from "../assets/contracts/NFTAuctionToken.json";
import Sweet from "sweetalert2";

function OnGoingAuctionsPage({signer}) {
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
                await Sweet.fire({
                    icon: "error",
                    title: "Error creating contract instances!",
                    html: error
                });

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
                await Sweet.fire({
                    icon: "error",
                    title: "Error fetching auctions!",
                    html: error
                });
            }
        };

        fetchAuctions().then()
    }, [signer]);

    return (
        <>
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800 border-b-2 border-gray-300 pb-2">
                    On Going Auctions
                </h1>
                <div className="flex flex-wrap -mx-2">
                    {auctions.map((auction, index) => (
                        <div key={index} className>
                            <Auction
                                auctionContract={auction.auctionContract}
                                auctionId={auction.auctionId}
                                signer={signer}
                            />
                        </div>
                    ))}
                </div>

                <h1 className="text-3xl font-extrabold my-6 text-center text-gray-800 border-b-2 border-gray-300 pb-2">
                    On Going Auctions Tokens
                </h1>
                <div className="flex flex-wrap -mx-2">
                    {auctionsTokens.map((auctionToken, index) => (
                        <div key={index} className>
                            <Auction
                                auctionContract={auctionToken.auctionContract}
                                auctionId={auctionToken.auctionId}
                                signer={signer}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default OnGoingAuctionsPage;
