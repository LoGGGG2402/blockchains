import {useEffect, useState} from "react";
import {ethers} from "ethers";

import NFTMarket from "../assets/contracts/NFTMarket.json";
import Sweet from "sweetalert2";

import Product from "../components/Product.jsx";

function MarketPage({signer}) {
    const [productsId, setProductsId] = useState([]);
    const [marketContract, setMarketContract] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            if (!window.ethereum) {
                return;
            }
            const provider = new ethers.providers.Web3Provider(window.ethereum);

            let MarketContract;

            try {
                MarketContract = new ethers.Contract(
                    NFTMarket.address,
                    NFTMarket.abi,
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

            setMarketContract(MarketContract);

            try {
                const productsId = await MarketContract.getAllListedProducts();
                setProductsId(productsId);
            } catch (error) {
                await Sweet.fire({
                    icon: "error",
                    title: "Error fetching products!",
                    html: error.message || error
                });
            }
        };

        fetchProducts().then()
    }, [signer]);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800 border-b-2 border-gray-500 pb-2">
                NFT Market
            </h1>
            <div className="flex flex-wrap -mx-2">
                {productsId.map((productId, index) => (
                    <Product
                        key={index}
                        productId={productId}
                        marketContract={marketContract}
                        signer={signer}
                    />
                ))}
            </div>
        </div>
    );

}

export default MarketPage;