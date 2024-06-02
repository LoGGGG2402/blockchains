import {useState} from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import OnePieceNFT from "../assets/contracts/OnePieceNFT.json";
import {ethers} from "ethers";
import Sweet from "sweetalert2";

function createNFTPage({signer}) {

    // nft metadata
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [image, setImage] = useState(null)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate();

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



            const data = await response.data

            if (response.status === 200 && data.message === "Metadata added successfully.") {

                const contract = new ethers.Contract(OnePieceNFT.address, OnePieceNFT.abi, signer);

                const tx = await contract.mint(data.metadata_url);
                console.log("tx", tx)
                const successTx = await tx.wait();
                const tokenId = successTx.events[1].args._tokenId;
                console.log("tokenId", tokenId)


                // save to local storage
                const nft = {
                    tokenId: tokenId.toNumber(),
                    address: contract.address,
                    uri: data.metadata_url,
                    owner: await signer.getAddress()
                }

                let nfts = JSON.parse(localStorage.getItem("nfts")) || [];
                nfts.push(nft);
                localStorage.setItem("nfts", JSON.stringify(nfts));
                navigate('/my-nft');
            } else {
                await Sweet.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Something went wrong!',
                    html: data.message,
                });
            }
        } catch (error) {
            await Sweet.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Something went wrong!',
                html: error.message || error,
            });
        }

        setLoading(false);
    };


    return (
        <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-md mt-4 ">
            {loading && (
                <div id="modal-background"
                     className="fixed inset-0 flex items-center justify-center z-50"
                >
                    <div className="absolute inset-0 bg-black opacity-50"></div>
                    <div className="bg-white p-6 rounded-lg shadow-lg z-10 w-96 relative">
                        <h2 className="text-2xl mb-4">Waiting for transaction</h2>
                        <div className="flex flex-col items-center">
                            <p>Waiting for transaction to be mined...</p>
                        </div>
                    </div>
                </div>
            )}
            <h1 className="text-3xl font-bold mb-6 text-center">Create NFT</h1>
            <form onSubmit={createNFT} className="flex flex-col gap-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="description"
                           className="block text-sm font-medium text-gray-700">Description:</label>
                    <input
                        type="text"
                        id="description"
                        name="description"
                        required
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700">Image:</label>
                    <input
                        type="file"
                        id="image"
                        name="image"
                        accept="image/*"
                        required
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={(e) => setImage(e.target.files[0])}
                    />
                </div>

                <button
                    type="submit"
                    className={`w-full py-3 px-4 rounded-md text-white font-semibold 
                    ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'} `}
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Create NFT'}
                </button>
            </form>
        </div>
    )
}

export default createNFTPage