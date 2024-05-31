import {useEffect, useState} from "react";
import {ethers} from "ethers";

import Auction from "../components/Auction.jsx";

import NFTAuction from "../assets/contracts/NFTAuction.json";
import NFTAuctionToken from "../assets/contracts/NFTAuctionToken.json";


function AuctionsPage({signer}){
    let [auctions, setAuctions] = useState([]);
    let [auctionsTokens, setAuctionsTokens] = useState([]);

    useEffect(() => {
        const fetchAuctions = async () => {
            if (!window.ethereum) {
                alert("Please install MetaMask!");
                return;
            }
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const NFTAuctionContract = new ethers.Contract(
                NFTAuction.address,
                NFTAuction.abi,
                provider
            );
            const NFTAuctionTokenContract = new ethers.Contract(
                NFTAuctionToken.address,
                NFTAuctionToken.abi,
                provider
            );
            const onGoingAuctions = await NFTAuctionContract.getOngoingAuctions();
            const onGoingAuctionsTokens = await NFTAuctionTokenContract.getOngoingAuctions();
            console.log("On Going Auctions:", onGoingAuctions);
            console.log("On Going Auctions Tokens:", onGoingAuctionsTokens);

            for (let i = 0; i < onGoingAuctions.length; i++) {
                const auction = {
                    auctionContract: NFTAuctionContract,
                    auctionId: onGoingAuctions[i],
                };
                setAuctions((auctions) => [...auctions, auction]);
            }

            for (let i = 0; i < onGoingAuctionsTokens.length; i++) {
                const auctionToken = {
                    auctionContract: NFTAuctionTokenContract,
                    auctionId: onGoingAuctionsTokens[i],
                };
                setAuctionsTokens((auctionsTokens) => [...auctionsTokens, auctionToken]);
            }
        };
        fetchAuctions().then()
    }, []);



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
    )

}

export default AuctionsPage