import {useState} from 'react'
import './App.css'
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import CreateNFTPage from "./pages/CreateNFTPage.jsx";
import NFTsPage from "./pages/NFTsPage.jsx";
import OnGoingAuctionsPage from "./pages/OnGoingAuctionsPage.jsx";
import AuctionsPage from "./pages/AuctionsPage.jsx";
import MarketPage from "./pages/MarketPage.jsx";


function App() {
    const [signer, setSigner] = useState(null);

    return (
        <Router>
            <Navbar signer={signer} setSigner={setSigner}/>

            <Routes>
                <Route path="/" element={<MarketPage signer={signer}/>}/>
                <Route path="/my-nft" element={<NFTsPage signer={signer}/>}/>
                <Route path="/ongoing-auction" element={<OnGoingAuctionsPage signer={signer}/>}/>
                <Route path="/auction" element={<AuctionsPage signer={signer}/>}/>
                <Route path="/create-nft" element={<CreateNFTPage signer={signer}/>}/>
            </Routes>
        </Router>
    )
}

export default App
