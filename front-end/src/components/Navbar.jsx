import { useState } from 'react';
import { Link } from "react-router-dom";
import { useEffect } from 'react';
import { ethers } from "ethers";
import Sweet from "sweetalert2";

function Navbar({ signer, setSigner }) {
    const [isNavOpen, setIsNavOpen] = useState(false); // State để điều khiển trạng thái hiển thị của menu

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

            const accounts = await newProvider.send('eth_requestAccounts', []);
            const signer = await newProvider.getSigner(accounts[0]);

            setSigner(signer);

            window.ethereum.on('accountsChanged', async (newAccounts) => {
                if (newAccounts.length === 0) {
                    setSigner(null);
                } else {
                    const updatedSigner = await newProvider.getSigner(newAccounts[0]);
                    setSigner(updatedSigner);
                }
            });
        } catch (error) {
            console.error("Error connecting to wallet: ", error);
        }
    };

    useEffect(() => {
        connectWallet().then()
    }, []);

    return (
        <div style={{position: 'relative'}}>
            <nav className="flex justify-between items-center py-5 px-10 bg-yellow-100 shadow-md">
                <div className="relative">
                    <button
                        className="burger-menu"
                        onClick={() => setIsNavOpen(!isNavOpen)} // Toggle state khi click vào button
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                             className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d={isNavOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}/>
                        </svg>
                    </button>
                </div>
                <Link className="flex items-center space-x-3" to={"/"}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                         className="w-10 h-auto">
                        <path
                            d="M4.5 7c.681 0 1.3-.273 1.75-.715C6.7 6.727 7.319 7 8 7s1.3-.273 1.75-.715A2.5 2.5 0 1 0 11.5 2h-7a2.5 2.5 0 0 0 0 5ZM6.25 8.097A3.986 3.986 0 0 1 4.5 8.5c-.53 0-1.037-.103-1.5-.29v4.29h-.25a.75.75 0 0 0 0 1.5h.5a.754.754 0 0 0 .138-.013A.5.5 0 0 0 3.5 14H6a.5.5 0 0 0 .5-.5v-3A.5.5 0 0 1 7 10h2a.5.5 0 0 1 .5.5v3a.5.5 0 0 0 .5.5h2.5a.5.5 0 0 0 .112-.013c.045.009.09.013.138.013h.5a.75.75 0 1 0 0-1.5H13V8.21c-.463.187-.97.29-1.5.29a3.986 3.986 0 0 1-1.75-.403A3.986 3.986 0 0 1 8 8.5a3.986 3.986 0 0 1-1.75-.403Z"/>
                    </svg>
                    <h1 className="text-blue-500 text-3xl font-bold">NFT Marketplace</h1>
                </Link>
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
            <ul className={`nav-links ${isNavOpen ? 'block' : 'hidden'} bg-amber-400 shadow-md py-2 px-4 mt-2 rounded-md w-40 absolute top-full left-0 z-10`}>
                <li>
                    <Link to={"/my-nft"} onClick={() => setIsNavOpen(false)}
                          className="block py-2 px-4 text-gray-800 hover:bg-gray-100">My NFT</Link>
                </li>
                <li>
                    <Link to={"/auction"} onClick={() => setIsNavOpen(false)}
                          className="block py-2 px-4 text-gray-800 hover:bg-gray-100">Auction</Link>
                </li>
                <li>
                    <Link to={"/ongoing-auction"} onClick={() => setIsNavOpen(false)}
                          className="block py-2 px-4 text-gray-800 hover:bg-gray-100">On Going Auction</Link>
                </li>
                <li>
                    <Link to={"/create-nft"} onClick={() => setIsNavOpen(false)}
                          className="block py-2 px-4 text-gray-800 hover:bg-gray-100">Create NFT</Link>
                </li>
            </ul>

        </div>
    );
}

export default Navbar;
