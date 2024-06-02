import {Link} from "react-router-dom";
import {useEffect} from 'react';

import {ethers} from "ethers";
import Sweet from "sweetalert2";

function Navbar({signer, setSigner}) {
    const connectWallet = async () => {
        try {
            if (!window.ethereum) {
                await Sweet.fire({
                    icon: "error",
                    title: "Please install MetaMask!"
                });

                return;
            }
            const newProvider = new ethers.providers.Web3Provider(window.ethereum);

            // const network = await newProvider.getNetwork();
            // setNetwork(network);

            const accounts = await newProvider.send('eth_requestAccounts', []);
            const signer = await newProvider.getSigner(accounts[0]);

            setSigner(signer);

            // Add listener for account changes
            window.ethereum.on('accountsChanged', async (newAccounts) => {
                if (newAccounts.length === 0) {
                    setSigner(null);
                } else {
                    const updatedSigner = await newProvider.getSigner(newAccounts[0]);
                    setSigner(updatedSigner);
                }
            });

            // Add listener for chain changes
            // window.ethereum.on('chainChanged', async () => {
            //     // Reset the provider to avoid network mismatch issues
            //     const updatedProvider = new ethers.providers.Web3Provider(window.ethereum);
            //
            //     // const updatedNetwork = await updatedProvider.getNetwork();
            //     // setNetwork(updatedNetwork);
            //
            //     const updatedAccounts = await updatedProvider.listAccounts();
            //     if (updatedAccounts.length === 0) {
            //         setSigner(null);
            //     } else {
            //     const updatedSigner = await updatedProvider.getSigner(updatedAccounts[0]);
            //     setSigner(updatedSigner);
            //     }
            // });
        } catch (error) {
            console.error("Error connecting to wallet: ", error);
        }
    };

    // Automatically connect the wallet when the component mounts
    useEffect(() => {
        connectWallet().then();
    }, []);


    return (
        <nav className="flex justify-between items-center py-5 px-10 bg-white shadow-md">
            <ul className="flex space-x-8">
                <Link className="text-gray-700 hover:text-blue-500 transition" to={"/my-nft"}>My NFT</Link>
                <Link className="text-gray-700 hover:text-blue-500 transition" to={"/auction"}>Auction</Link>
                <Link className="text-gray-700 hover:text-blue-500 transition" to={"/ongoing-auction"}>On Going
                    Auction</Link>
                <Link className="text-gray-700 hover:text-blue-500 transition" to={"/create-nft"}>Create NFT</Link>
            </ul>

            <div className="flex items-center space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-10 h-auto">
                    <path
                        d="M4.5 7c.681 0 1.3-.273 1.75-.715C6.7 6.727 7.319 7 8 7s1.3-.273 1.75-.715A2.5 2.5 0 1 0 11.5 2h-7a2.5 2.5 0 0 0 0 5ZM6.25 8.097A3.986 3.986 0 0 1 4.5 8.5c-.53 0-1.037-.103-1.5-.29v4.29h-.25a.75.75 0 0 0 0 1.5h.5a.754.754 0 0 0 .138-.013A.5.5 0 0 0 3.5 14H6a.5.5 0 0 0 .5-.5v-3A.5.5 0 0 1 7 10h2a.5.5 0 0 1 .5.5v3a.5.5 0 0 0 .5.5h2.5a.5.5 0 0 0 .112-.013c.045.009.09.013.138.013h.5a.75.75 0 1 0 0-1.5H13V8.21c-.463.187-.97.29-1.5.29a3.986 3.986 0 0 1-1.75-.403A3.986 3.986 0 0 1 8 8.5a3.986 3.986 0 0 1-1.75-.403Z"/>
                </svg>

                <h1 className="text-blue-500 text-3xl font-bold">NFT Market</h1>
            </div>

            <div className="relative">
                {signer ? (
                    <div className="relative inline-block">
                        <button
                            type="button"
                            className="px-6 py-2 bg-blue-500 text-white rounded-md font-semibold text-lg transition hover:bg-blue-600"
                        >
                            {signer._address.slice(0, 6) + '...' + signer._address.slice(-4)}
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        className="px-6 py-2 bg-blue-500 text-white rounded-md font-semibold text-lg transition hover:bg-blue-600"
                        onClick={connectWallet}
                    >
                        Connect
                    </button>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
