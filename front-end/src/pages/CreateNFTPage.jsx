import {useState} from "react";
import axios from "axios";
import OnePieceNFT from "../assets/contracts/OnePieceNFT.json";
import {ethers} from "ethers";

function createNFTPage({signer}) {

    // nft metadata
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [image, setImage] = useState(null)

    const [loading, setLoading] = useState(false)


    const createNFT = async (event) => {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        formData.append("image", image);

        try {
            const response = await axios.post('https://phanlong.id.vn/metadata.php', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log(response)


            const data = await response.data

            if (response.status === 200 && data.message === "Metadata added successfully.") {
                console.log("Metadata added successfully!");

                const contract = new ethers.Contract(OnePieceNFT.address, OnePieceNFT.abi, signer);
                console.log("Contract:", contract);

                const tokenId = await contract.mint(data.metadata_url);

                console.log("Token ID:", tokenId.value.toNumber());

                // save to local storage
                const nft = {
                    tokenId: tokenId.value.toNumber(),
                    address: contract.address,
                    uri: data.metadata_url,
                    owner: await signer.getAddress()
                }

                let nfts = JSON.parse(localStorage.getItem("nfts")) || [];
                nfts.push(nft);
                localStorage.setItem("nfts", JSON.stringify(nfts));
                console.log("NFT created successfully!");
            } else {
                console.error("Error in response:", data);
            }
        } catch (error) {
            console.error("Error creating NFT:", error);
        }

        setLoading(false);
    };


    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Create NFT</h1>
            <form onSubmit={createNFT} className="flex flex-col gap-4">
                <label htmlFor="name">Name:</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    onChange={(e) => setName(e.target.value)}
                />

                <label htmlFor="description">Description:</label>
                <input
                    type="text"
                    id="description"
                    name="description"
                    required
                    onChange={(e) => setDescription(e.target.value)}
                />

                <label htmlFor="image">Image:</label>
                <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    required
                    onChange={(e) => setImage(e.target.files[0])}
                />

                <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded" disabled={loading}>
                    Create NFT
                </button>
            </form>
        </div>
    )
}

export default createNFTPage