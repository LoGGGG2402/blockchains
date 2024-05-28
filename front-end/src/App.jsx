import {useEffect, useState} from 'react'
import './App.css'
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import CreateNFTPage from "./pages/CreateNFTPage.jsx";
import NFTsPage from "./pages/NFTsPage.jsx";



function App() {
    const [signer, setSigner] = useState(null);
    const [network, setNetwork] = useState(null);

    const [nftForm, setNftForm] = useState({
        name: "",
        description: "",
        image: null
    });


    return (
        <Router>
                <Navbar signer={signer} setSigner={setSigner} network={network} setNetwork={setNetwork}/>

            <Routes>
                {/*<Route path="/" element={<NFTsPage/>}/>*/}
                <Route path="/my-nft" element={<NFTsPage signer={signer}/>}/>
                {/*<Route path="/auction" element={<AuctionsPage.jsx/>}/>*/}
                <Route path="/create-nft" element={<CreateNFTPage signer={signer}/>}/>
            </Routes>
        </Router>
    )
}

export default App
