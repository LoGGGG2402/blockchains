# Building an NFT Auction Smart Contract
## Prerequisites:
- Basic understanding of Solidity.
- Development environment setup with Hardhat

## I. Introduction
Blockchain technology's decentralized framework has unlocked new opportunities for digital assets, particularly through Non-Fungible Tokens (NFTs). NFTs symbolize distinct digital assets, and auctions have emerged as a favored method for their trading. We’ll explore how to build an Ethereum-based NFT auction smart contract, focusing on implementing a `second-price auction` (also known as a Vickrey auction).
## II. Smart Contract Structure
### 1. NFT Smart Contract (for testing)
Source: `OnePieceNFT.sol`
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

---

**Start Auction**:
Initiates a new auction by transferring the NFT to the contract and defining auction parameters.
```solidity
function createAuction(
        address nftContract,
        uint256 nftId,
        uint256 initialPrice,
        uint256 duration
    ) public returns (uint256){
        require(
            nftContract != address(0),
            "NFTAuction: Invalid NFT contract address"
        );
        require(
            IERC721(nftContract).supportsInterface(type(IERC721).interfaceId),
            "NFTAuction: Contract does not support ERC721 interface"
        );
        require(
            IERC721(nftContract).ownerOf(nftId) != address(0),
            "NFTAuction: NFT does not exist"
        );
        require(
            IERC721(nftContract).ownerOf(nftId) == msg.sender,
            "NFTAuction: Not the owner of the NFT"
        );
        require(
            initialPrice > 0,
            "NFTAuction: Reserve price must be greater than zero"
        );
        require(
            duration > 0 && duration <= 30 days,
            "NFTAuction: Invalid auction duration"
        );

        IERC721 _nftContract = IERC721(nftContract);
        _nftContract.safeTransferFrom(msg.sender, address(this), nftId);

        uint256 endTime = block.timestamp + duration;

        uint256 auctionId = _auctionIdCounter++;

        Auction memory _auction = Auction({
            auctioneer: msg.sender,
            nftContract: _nftContract,
            nftId: nftId,
            endTime: endTime,
            ended: false,
            highestBid: initialPrice,
            winnerBid: initialPrice,
            winner: address(0)
        });

        _auctions[auctionId] = _auction;

        emit AuctionCreated(
            auctionId,
            nftContract,
            nftId,
            initialPrice,
            endTime
        );

        return auctionId;
    }
```
-   **Function Name**: `createAuction`
-   **Description**: Initiates a new auction by transferring the NFT to the contract and setting auction parameters.
-   **Parameters**:
    -   `address nftContract`: The address of the NFT contract.
    -   `uint256 nftId`: The ID of the NFT to be auctioned.
    -   `uint256 initialPrice`: The initial price for the auction.
    -   `uint256 duration`: The duration of the auction in seconds.
-   **Returns**: The auction ID of the newly created auction.
-   **Requirements**:
    -   The NFT contract address must be valid.
    -   The NFT contract must support the ERC721 interface.
    -   The NFT must exist and be owned by the caller.
    -   The initial price must be greater than zero.
    -   The duration must be greater than zero and less than or equal to 30 days.
-   **Emits**: `AuctionCreated` event with auction details.

---

**Place Bid**:
Allows users to bid on ongoing auctions, updating the highest bid and bidder.
```solidity
function placeBid(uint256 auctionId) public payable nonReentrant returns (uint256){
        Auction storage auction = _auctions[auctionId];
        require(
            block.timestamp < auction.endTime,
            "NFTAuction: Auction has ended"
        );
        require(msg.value > 0, "NFTAuction: Bid must be greater than zero");

        uint256 currentBid = _bids[auctionId][msg.sender] + msg.value;
        require(
            currentBid > auction.winnerBid,
            "NFTAuction: Bid must be higher than the current highest bid"
        );

        if (block.timestamp + EXTENSION_DURATION > auction.endTime) {
            auction.endTime += EXTENSION_DURATION;
            emit AuctionExtended(auctionId, auction.endTime);
        }

        _bids[auctionId][msg.sender] = currentBid;

        if (currentBid > auction.highestBid) {
            if (auction.winner != msg.sender){
                auction.winnerBid = auction.highestBid;
                auction.highestBid = currentBid;
                auction.winner = msg.sender;
            } else {
                auction.highestBid = currentBid;
            }
        } else if (currentBid > auction.winnerBid) {
            auction.winnerBid = currentBid;
        }

        emit WinnerBid(auctionId, currentBid);

        emit BidPlaced(auctionId, msg.sender);

        return currentBid;
    }
```
-   **Function Name**: `placeBid`
-   **Description**: Allows users to place bids on ongoing auctions, updating the highest bid and bidder.
-   **Parameters**:
    -   `uint256 auctionId`: The ID of the auction.
-   **Returns**: The current bid amount.
-   **Requirements**:
    -   The auction must be ongoing (not ended).
    -   The bid amount must be greater than zero.
    -   The bid must be higher than the current highest bid.
-   **Extends Auction**: If a bid is placed in the last 10 minutes, the auction is extended by 10 minutes.
-   **Emits**:
    -   `AuctionExtended` event if the auction end time is extended.
    -   `WinnerBid` event with the highest bid amount.
    -   `BidPlaced` event with the auction ID and bidder's address.

---

**End Auction**:
Concludes an auction, transfers the NFT to the winner, and handles payment distribution.
```solidity
function endAuction(uint256 auctionId) public nonReentrant {
    Auction storage auction = _auctions[auctionId];
    require(
        block.timestamp >= auction.endTime,
        "NFTAuction: Auction is still ongoing"
    );
    require(!auction.ended, "NFTAuction: Auction has already ended");

    auction.ended = true;

    if (auction.winner == address(0)) {
        auction.nftContract.safeTransferFrom(
            address(this),
            auction.auctioneer,
            auction.nftId
        );
        return;
    }

    uint256 serviceFee = (auction.winnerBid * AUCTION_SERVICE_FEE_RATE) /
        100;
    uint256 finalAmount = auction.winnerBid - serviceFee;
    uint256 excessAmount = auction.highestBid - auction.winnerBid;

    // Refund the excess amount to the highest bidder (winner)
    if (excessAmount > 0) {
        payable(auction.winner).transfer(excessAmount);
    }

    payable(_organizer).transfer(serviceFee);
    payable(auction.auctioneer).transfer(finalAmount);

    auction.nftContract.safeTransferFrom(
        address(this),
        auction.winner,
        auction.nftId
    );

    emit AuctionEnded(auctionId, auction.winner, auction.winnerBid);
}
```
-   **Function Name**: `endAuction`
-   **Description**: Concludes an auction, transfers the NFT to the winner, and handles payment distribution.
-   **Parameters**:
    -   `uint256 auctionId`: The ID of the auction to be ended.
-   **Requirements**:
    -   The auction must have ended (time elapsed).
    -   The auction must not have already ended.
-   **Actions**:
    -   Transfers the NFT to the auction winner or back to the auctioneer if no winner.
    -   Calculates and transfers the service fee to the organizer.
    -   Transfers the winning bid amount minus the service fee to the auctioneer.
    -   Refunds any excess amount to the highest bidder.
-   **Emits**: `AuctionEnded` event with the auction ID, winner, and winning bid amount.

---

**Cancel Bid**:
Allows users to cancel their bids on ongoing auctions and get a refund.
```solidity
function cancelBid(uint256 auctionId) public nonReentrant {
        Auction storage auction = _auctions[auctionId];
        uint256 userBid = _bids[auctionId][msg.sender];

        require(userBid > 0, "NFTAuction: No bid found for user");
        require(
            block.timestamp < auction.endTime,
            "NFTAuction: Auction has ended"
        );
        require(
            msg.sender != auction.winner,
            "NFTAuction: Winner cannot cancel the bid"
        );

        _bids[auctionId][msg.sender] = 0;

        payable(msg.sender).transfer(userBid);

        emit BidCancelled(auctionId, msg.sender);
    }
```
-   **Function Name**: `cancelBid`
-   **Description**: Allows users to cancel their bids on ongoing auctions and get a refund.
-   **Parameters**:
    -   `uint256 auctionId`: The ID of the auction for which the bid is to be canceled.
-   **Requirements**:
    -   The bid must exist for the user.
    -   The auction must still be ongoing.
    -   The user must not be the current highest bidder.
-   **Actions**: Refunds the user's bid amount.
-   **Emits**: `BidCancelled` event with the auction ID and bidder's address.
---
**Withdraw Bid:**
Allows users to withdraw their bid amounts if they are not the current highest bidder or after the auction has ended without winning.
```solidity
function withdrawBid(uint256 auctionId) public nonReentrant {
        Auction storage auction = _auctions[auctionId];
        require(auction.ended, "NFTAuction: Auction is still ongoing");
        require(
            msg.sender != auction.winner,
            "NFTAuction: Winner cannot withdraw their bid"
        );

        uint256 userBid = _bids[auctionId][msg.sender];
        require(userBid > 0, "NFTAuction: No bid to withdraw");

        _bids[auctionId][msg.sender] = 0;

        payable(msg.sender).transfer(userBid);
    }
```
-   **Function Name**: `withdrawBid`
-   **Description**: Allows users to withdraw their bid amounts if they are not the current highest bidder or after the auction has ended without winning.
-   **Parameters**:
    -   `uint256 auctionId`: The ID of the auction for which the bid is to be withdrawn.
-   **Requirements**:
    -   The bid must exist for the user.
    -   The user must not be the auction winner.
    -   The user must not be the highest bidder during an ongoing auction.
    -   If the auction has ended, the user can withdraw their bid if they are not the winner.
-   **Actions**: Refunds the user's bid amount.

