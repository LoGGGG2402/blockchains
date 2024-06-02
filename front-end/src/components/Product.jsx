import Sweet from "sweetalert2";
import {useEffect, useState} from "react";
import {ethers} from "ethers";
import axios from "axios";

function Product({marketContract, productId, signer}) {
    const [owner, setOwner] = useState("");
    const [nft, setNft] = useState({});

    const [price, setPrice] = useState("");
    const [symbol, setSymbol] = useState("");
    const [decimals, setDecimals] = useState(18);

    const [paymentContract, setPaymentContract] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
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
                const product = await marketContract.getProduct(productId);
                const {owner, nftContract, tokenId, price, tokenPayment} = product;
                console.log(product);

                setOwner(owner);

                const ERC721abi = [
                    "function tokenURI(uint256 tokenId) view returns (string)",
                    "function approve(address to, uint256 tokenId)",
                    "function balanceOf(address owner) view returns (uint256)",
                    "function ownerOf(uint256 tokenId) view returns (address)",
                ];

                const contract = new ethers.Contract(nftContract, ERC721abi, provider);

                const uri = await contract.tokenURI(tokenId);
                const response = await axios.get(uri);
                const nft = {
                    tokenId: tokenId.toNumber(),
                    address: nftContract,
                    name: response.data.name,
                    description: response.data.description,
                    image: response.data.image,
                };

                setNft(nft);

                if (tokenPayment) {
                    const ERC20abi = [
                        "function balanceOf(address owner) view returns (uint256)",
                        "function transfer(address to, uint256 value) returns (bool)",
                        "function approve(address spender, uint256 amount) returns (bool)",
                        "function allowance(address owner, address spender) view returns (uint256)",
                        "function symbol() view returns (string)",
                        "function decimals() view returns (uint8)",
                    ];
                    const paymentContract = new ethers.Contract(tokenPayment, ERC20abi, provider);
                    const paymentSymbol = await paymentContract.symbol();
                    const paymentDecimals = await paymentContract.decimals();
                    setSymbol(paymentSymbol);
                    setDecimals(paymentDecimals);
                    setPaymentContract(paymentContract);
                    setPrice(ethers.utils.formatUnits(price, paymentDecimals));
                }


            } catch (error) {
                console.log("Error fetching product:", error);
                // await Sweet.fire({
                //     icon: "error",
                //     title: "Error fetching product!",
                //     html: JSON.stringify(error.reason || error.message || error),
                // });
            }
        };

        fetchProduct().then();
    }, [marketContract, productId, signer]);

    const buyProduct = async () => {
        if (!window.ethereum) {
            await Sweet.fire({
                icon: "error",
                title: "Please install MetaMask!",
            });
            return;
        }
        const contractWithSigner = marketContract.connect(signer);
        try {
            setLoading(true);
            let tx;
            if (paymentContract) {
                const value = ethers.utils.parseUnits(price, decimals);
                let allowance = await paymentContract.allowance(signer._address, contractWithSigner.address);
                if (allowance.lt(value)) {
                    const approveTx = await paymentContract.approve(contractWithSigner.address, value);
                    await approveTx.wait();
                }
                tx = await contractWithSigner.buyProduct(productId, value);
            } else {
                const value = ethers.utils.parseEther(price);
                tx = await contractWithSigner.buyProduct(productId, {value});
            }
            if (tx) {
                await tx.wait();
                await Sweet.fire({
                    icon: "success",
                    title: "Product bought successfully!"
                });
            }
        } catch (error) {
            await Sweet.fire({
                icon: "error",
                title: "Failed to buy product.",
                html: JSON.stringify(error.reason || error.message || error),
            });
        } finally {
            setLoading(false);
        }
    }

    const unListProduct = async () => {
        if (!window.ethereum) {
            await Sweet.fire({
                icon: "error",
                title: "Please install MetaMask!",
            });
            return;
        }
        const contractWithSigner = marketContract.connect(signer);
        try {
            const tx = await contractWithSigner.unListProduct(productId);
            await tx.wait();
            await Sweet.fire({
                icon: "success",
                title: "Product unlisted successfully!"
            });
        } catch (error) {
            await Sweet.fire({
                icon: "error",
                title: "Failed to un list product.",
                html: JSON.stringify(error.reason || error.message || error),
            });
        }
    }

    return (
        <>
            {loading ? (
                <div className="flex  items-center h-screen">
                    <div className="loader"></div>
                </div>
            ) : (
                <div className="max-w-xs rounded overflow-hidden shadow-md bg-white mx-auto">
                    <img className="w-full h-48 object-cover" src={nft.image} alt={nft.name}/>
                    <div className="px-4 ">
                        <div className="font-bold text-lg mb-1 text-gray-800 text-center">{nft.name}</div>
                        <p className="text-gray-700 text-sm ">Description: {nft.description}</p>
                    </div>
                    <div className="px-4 py-3 bg-white rounded-b-lg">
                        <div className="flex flex-wrap justify-center">
                            <span
                                className="block  rounded-full px-2 py-1 text-xs font-semibold text-green-700 mr-1 mb-1">
                                Owner: {owner}
                            </span>
                            <span
                                className="block  rounded-full px-2 py-1 text-xs font-semibold text-green-700 mr-1 mb-1">
                                Price: {price} {symbol}
                            </span>
                        </div>
                        {owner === signer._address ?
                            (
                                <button
                                    className="mt-2 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded transition duration-300"
                                    onClick={unListProduct}
                                >
                                    Unlist Product
                                </button>
                            )
                            :
                            (
                                <button
                                    className="mt-2 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded transition duration-300"
                                    onClick={buyProduct}
                                >
                                    Buy Product
                                </button>
                            )
                        }
                    </div>
                </div>
            )
            }
        </>
    );
}

export default Product;