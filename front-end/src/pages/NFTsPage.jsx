import NFT from "../components/NFT.jsx";
import {useEffect, useState} from "react";
import axios from "axios";
import {ethers} from "ethers";
import Swal from "sweetalert2";

import NFTAuction from "../assets/contracts/NFTAuction.json";
import NFTAuctionToken from "../assets/contracts/NFTAuctionToken.json";

function NFTsPage({ signer }) {
    const [nfts, setNfts] = useState([]);
    const [address, setAddress] = useState("");
    const [tokenId, setTokenId] = useState("");
    const [showModal, setShowModal] = useState(false);


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

    const handleCreateAuction = async (nftAddress, nftTokenId) => {
        console.log("Creating auction for NFT:", nftAddress, nftTokenId);
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

        const NFTContract = new ethers.Contract(nftAddress, ERC721abi, signer);
        console.log("Contract:", NFTContract);

        const owner = await NFTContract.ownerOf(nftTokenId);
        if (owner !== signer._address) {
            alert("You don't own this NFT!");
            return;
        }
        // create form for auction details: paymentToken, duration, initialPrice
        const {value: formValues} = await Swal.fire({
            title: "Create Auction",
            html:
                '<input id="paymentToken" class="swal2-input" placeholder="Payment Token Address">' +
                '<input id="durationValue" class="swal2-input" placeholder="Duration">' +
                '<select id="durationUnit" class="swal2-input">' +
                '<option value="seconds">Seconds</option>' +
                '<option value="minutes">Minutes</option>' +
                '<option value="hours">Hours</option>' +
                '<option value="days">Days</option>' +
                '</select>' +
                '<input id="initialPrice" class="swal2-input" placeholder="Initial Price">',
            focusConfirm: false,
            preConfirm: () => {
                const durationValue = document.getElementById("durationValue").value;
                const durationUnit = document.getElementById("durationUnit").value;
                let durationInSeconds;

                switch (durationUnit) {
                    case "seconds":
                        durationInSeconds = durationValue;
                        break;
                    case "minutes":
                        durationInSeconds = durationValue * 60;
                        break;
                    case "hours":
                        durationInSeconds = durationValue * 60 * 60;
                        break;
                    case "days":
                        durationInSeconds = durationValue * 60 * 60 * 24;
                        break;
                }

                return {
                    paymentToken: document.getElementById("paymentToken").value,
                    duration: durationInSeconds,
                    initialPrice: ethers.utils.parseEther(document.getElementById("initialPrice").value)
                };
            }
        });

        console.log("Form values:", formValues)

        if (formValues) {
            try {
                if (formValues.paymentToken === "" || formValues.paymentToken === null || formValues.paymentToken === undefined) {
                    await NFTContract.approve(NFTAuction.address, nftTokenId);
                    console.log("approved")
                    const NFTAuctionContract = new ethers.Contract(NFTAuction.address, NFTAuction.abi, signer);
                    console.log("NFTAuctionContract", NFTAuctionContract)
                    await NFTAuctionContract.createAuction(
                        nftAddress,
                        nftTokenId,
                        formValues.initialPrice,
                        formValues.duration,
                    );
                    Swal.fire("Auction created successfully!", "", "success");
                    return;
                }
                // check payment token is valid ERC20 token
                let isERC20 = await checkIfERC20(formValues.paymentToken);
                if (!isERC20) {
                    alert("Invalid ERC20 token address!");
                    return;
                }
                await NFTContract.approve(NFTAuctionToken.address, nftTokenId);
                const NFTAuctionContract = new ethers.Contract(NFTAuctionToken.address, NFTAuctionToken.abi, signer);
                await NFTAuctionContract.createAuction(
                    nftAddress,
                    nftTokenId,
                    formValues.paymentToken,
                    formValues.initialPrice,
                    formValues.duration,
                );
                Swal.fire("Auction created successfully!", "", "success");
            } catch (error) {
                console.error("Error creating auction:", error);
                Swal.fire("Error creating auction!", error.message, "error");
            }

        }
    }

    const checkIfERC20 = async (address) => {
        try {
            const contract = new ethers.Contract(address, [
                "function name() view returns (string)",
                "function symbol() view returns (string)",
                "function decimals() view returns (uint8)"
            ], provider);

            const name = await contract.name();
            const symbol = await contract.symbol();
            const decimals = await contract.decimals();

            return {name, symbol, decimals};
        } catch (error) {
            console.error("Error fetching ERC20 token:", error);
            return false;
        }
    };
    const toggleModal = () => {
        setShowModal(!showModal);
    };
    const handleOutsideClick = (e) => {
        if (e.target.id === 'modal-background') {
            setShowModal(false);
        }
    };

    return (
        <div className="container mx-auto">
            
            <div>
            <button
                onClick={toggleModal}
                className="bg-blue-500 text-white p-2 rounded mb-4 hover:bg-blue-600 mt-4"
            >
                Import NFT
            </button>
            {showModal && (
                <div
                    id="modal-background"
                    className="fixed inset-0 flex items-center justify-center z-50"
                    onClick={handleOutsideClick}
                >
                    <div className="absolute inset-0 bg-black opacity-50"></div>
                    <div className="bg-white p-6 rounded-lg shadow-lg z-10 w-96 relative">
                        <h2 className="text-2xl mb-4">Import NFT</h2>
                        <form onSubmit={handleSubmit} className="mb-8">
                            <div className="flex flex-col items-center">
                                <input
                                    type="text"
                                    placeholder="NFT Contract Address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="mb-4 p-2 border border-gray-300 rounded w-full"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="NFT Token ID"
                                    value={tokenId}
                                    onChange={(e) => setTokenId(e.target.value)}
                                    className="mb-4 p-2 border border-gray-300 rounded w-full"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="bg-blue-500 text-white p-2 rounded w-full"
                                >
                                    Import NFT
                                </button>
                            </div>
                        </form>
                        <button
                            onClick={toggleModal}
                            className="absolute top-2 right-2 bg-gray-300 p-2 rounded-full"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
            <div className="flex flex-wrap ">
                {nfts.map((nft, index) => (
                    <div key={index} onClick={() => handleCreateAuction(nft.address, nft.tokenId)}>
                        <NFT
                            image={nft.image}
                            name={nft.name}
                            description={nft.description}
                            owner={nft.owner}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default NFTsPage;
