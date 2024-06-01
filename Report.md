# Building an NFT Auction Smart Contract
## Prerequisites:
- Basic understanding of Solidity.
- Development environment setup with Hardhat

## I. Introduction
Blockchain technology's decentralized framework has unlocked new opportunities for digital assets, particularly through Non-Fungible Tokens (NFTs). NFTs symbolize distinct digital assets, and auctions have emerged as a favored method for their trading. We’ll explore how to build an Ethereum-based NFT auction smart contract, focusing on implementing a `second-price auction` (also known as a Vickrey auction).
## II. Smart Contract Structure
### 1. NFT Smart Contract (for testing)
OnePieceNFT.sol
```solidity
// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OnePieceNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor()
        ERC721("OnePieceNFT", "ONF")
        Ownable(msg.sender)
    {}

    function safeMint(address to, string memory uri) public onlyOwner returns (uint256){
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    function mint(string memory uri) external returns (uint256){
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    // The following functions are overrides required by Solidity.
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```
- `OnePieceNFT` extends ERC721, ERC721URIStorage, Ownable. Facilitating the creation and management of NFTs.
- Function `safeMint` is used to mint ERC721 tokens safely. It can only be called by the owner of the contract (`onlyOwner` modifier). It takes `to` an address `tokenId`and a `uri` string as arguments. Inside the function, it mints a new token to the `to` address and sets its URI using `_setTokenURI`.
- Function `tokenURI` overrides the default implementation in ERC721. It retrieves and returns the URI associated with a given `_tokenId`. It ensures that the token exists before querying its URI.
- Function `supportsInterface` overrides the function from ERC721 contract. It checks whether a particular interface is supported by the contract by calling the `supportsInterface` function from the inherited contracts.
### 2. Auction Smart Contract
Source: `NFTAuction.sol`
```solidity
contract NFTAuction is IERC721Receiver, ReentrancyGuard {...}
```
The `NFTAuction` contract extends `ReentrancyGuard` and implements `IERC721Receiver`.

The `ReentrancyGuard` is a protective mechanism used in Solidity to prevent reentrant attacks in smart contracts. A reentrancy attack occurs when an external attacker exploits a contract's vulnerable state by repeatedly calling back into the contract before the ongoing execution completes. `ReentrancyGuard` is a crucial security measure in Solidity contracts, particularly in scenarios involving asset transfers, to prevent reentrancy attacks and ensure the integrity of contract state changes during critical operations.

On the other hand, implementing `IERC721Receiver` ensures that the `NFTAuction` contract can safely receive ERC721 tokens. The `IERC721Receiver` interface requires the implementation of the `onERC721Received` function, which is called whenever an ERC721 token is transferred to this contract. This function confirms the contract's ability to handle ERC721 tokens, preventing accidental transfers to contracts that cannot process them and avoiding token loss.

By extending `ReentrancyGuard` and implementing `IERC721Receiver`, the `NFTAuction` contract manages the auction process for NFTs securely and efficiently. It governs bidding, ownership transfer, and ensures safe interaction with ERC721 tokens, providing a robust platform for auctioning NFTs while safeguarding against common security vulnerabilities.
#### 2.1. Auction Contract Overview
**Auction Struct**:
- To encapsulate auction details effectively, a `struct` is utilized, capturing essential information such as the auctioneer, the NFT contract, the NFT ID, the highest bid, the highest bidder, the auction's end time, and its ended state. 
	```
	struct Auction {
	    address auctioneer;
	    IERC721 nftContract;
	    uint256 nftId;
	    uint256 endTime;
	    bool ended;
	    uint256 highestBid;
	    uint256 winnerBid;
	    address winner;
	}
	```
**Event**:
- These events serve to notify external systems or users about critical actions within the auction contract. They help track the auction's progress, facilitate user interface updates, and trigger further actions in response to these events.
	```solidity
	event AuctionCreated(
	    uint256 auctionId,
	    address nftContract,
	    uint256 nftId,
	    uint256 initialPrice,
	    uint256 endTime
	);

	event BidPlaced(uint256 auctionId, address bidder);
	event WinnerBid(uint256 auctionId, uint256 winnerBid);
	event AuctionEnded(uint256 auctionId, address winner, uint256 winningBid);
	event AuctionExtended(uint256 auctionId, uint256 newEndTime);
	event AuctionCancelled(uint256 auctionId);
	event BidCancelled(uint256 auctionId, address bidder);
	event OrganizerChanged(address organizer);
	event ServiceFeeRateChanged(uint256 rate);
	```
-   **AuctionCreated**: Signals the creation of a new auction, providing the auction ID, NFT contract address, NFT ID, initial price, and auction end time.
-   **BidPlaced**: Indicates a new bid has been placed, specifying the auction ID and the bidder's address.
-   **WinnerBid**: Indicates the highest bid in the auction, specifying the auction ID and the highest bid amount.
-   **AuctionEnded**: Signals the end of an auction, specifying the auction ID, winning bidder, and the winning bid amount.
-   **AuctionExtended**: Indicates the extension of the auction's end time, specifying the auction ID and the new end time.
-   **AuctionCancelled**: Signals that an auction has been cancelled.
-   **BidCancelled**: Indicates that a bid has been cancelled, specifying the auction ID and the bidder's address.
-   **OrganizerChanged**: Signals a change in the auction organizer.
-   **ServiceFeeRateChanged**: Indicates a change in the service fee rate for the auctions.

