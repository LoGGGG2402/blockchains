import {useEffect, useState} from "react";

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
            const auctionFactoryContract = new ethers.Contract(
                process.env.REACT_APP_AUCTION_FACTORY_CONTRACT_ADDRESS,
                AuctionFactory.abi,
                provider.getSigner()
            );
            const auctions = await auctionFactoryContract.getAuctions();
            console.log("Auctions:", auctions);
            setAuctions(auctions);
            const auctionsTokens = await Promise.all(
                auctions.map(async (auction) => {
                    const auctionContract = new ethers.Contract(
                        auction,
                        Auction.abi,
                        provider.getSigner()
                    );
                    const token = await auctionContract.token();
                    return token;
                })
            );
            console.log("Auctions Tokens:", auctionsTokens);
            setAuctionsTokens(auctionsTokens);
        };
        fetchAuctions();
    }, []);



    return (
        <>
        </>
    )

}

export default AuctionsPage