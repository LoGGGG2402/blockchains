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
                console.error("Error fetching products:", error);
            }
        };

        fetchProducts().then()
    }, [signer]);

    return (
        <div className="container">
            <h1 className="text-center">Market</h1>
            <div className="row">
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