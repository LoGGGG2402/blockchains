import NFT from "../components/NFT.jsx";
import { useEffect, useState } from "react";
import axios from "axios";
import { ethers } from "ethers";

function NFTsPage({ signer }) {
    const [nfts, setNfts] = useState([]);
    const [address, setAddress] = useState("");
    const [tokenId, setTokenId] = useState("");

    useEffect(() => {
        async function fetchData() {
            const nftsStorage = JSON.parse(localStorage.getItem("nfts")) || [];
            try {
                const promises = nftsStorage.map(async (nft) => {
                    const response = await axios.get(nft.uri);
                    return {
                        address: nft.address,
                        tokenId: nft.tokenId,
                        image: response.data.image,
                        name: response.data.name,
                        description: response.data.description,
                        owner: nft.owner
                    };
                });
                const nftsData = await Promise.all(promises);
                setNfts(nftsData);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }

        fetchData().then(() => console.log("Data fetched"));
    }, []);

    const handleAddNFT = async (address, tokenId) => {
        console.log("Adding NFT:", address, tokenId);
        if (!window.ethereum) {
            alert("Please install MetaMask!");
            return;
        }
        let provider = new ethers.providers.Web3Provider(window.ethereum);
        let ERC721abi = [
            "function tokenURI(uint256 tokenId) view returns (string)",
            "function approve(address to, uint256 tokenId)",
            "function balanceOf(address owner) view returns (uint256)",
            "function ownerOf(uint256 tokenId) view returns (address)",
        ];

        const contract = new ethers.Contract(address, ERC721abi, provider);
        console.log("Contract:", contract);

        const owner = await contract.ownerOf(tokenId);
        if (owner !== signer._address) {
            alert("You don't own this NFT!");
            return;
        }

        const uri = await contract.tokenURI(tokenId);
        const response = await axios.get(uri);
        const nft = {
            image: response.data.image,
            name: response.data.name,
            description: response.data.description,
            owner: owner
        };

        const nftData = {
            tokenId: tokenId,
            address: contract.address,
            uri: uri,
            owner: await signer.getAddress()
        };

        let nftsStorage = JSON.parse(localStorage.getItem("nfts")) || [];
        nftsStorage.push(nftData);
        localStorage.setItem("nfts", JSON.stringify(nftsStorage));

        setNfts([...nfts, nft]);
        console.log("NFT added successfully!");
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        handleAddNFT(address, tokenId).then(() => console.log("NFT added successfully!"));
        setAddress("");
        setTokenId("");
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-center my-8">My NFT Collection</h1>
            <form onSubmit={handleSubmit} className="mb-8">
                <div className="flex flex-col items-center">
                    <input
                        type="text"
                        placeholder="NFT Contract Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="mb-4 p-2 border border-gray-300 rounded"
                        required
                    />
                    <input
                        type="text"
                        placeholder="NFT Token ID"
                        value={tokenId}
                        onChange={(e) => setTokenId(e.target.value)}
                        className="mb-4 p-2 border border-gray-300 rounded"
                        required
                    />
                    <button
                        type="submit"
                        className="bg-blue-500 text-white p-2 rounded"
                    >
                        Add NFT
                    </button>
                </div>
            </form>
            <div className="flex flex-wrap justify-center">
                {nfts.map((nft, index) => (
                    <NFT
                        key={index}
                        image={nft.image}
                        title={nft.name}
                        description={nft.description}
                        owner={nft.owner}
                    />
                ))}
            </div>
        </div>
    );
}

export default NFTsPage;
