# Group 11: Building NFT Auction Smart Contract and NFT marketplace
## Prerequisites:
- Basic understanding of Solidity.
- Development environment setup with Hardhat
## Example (Hardhat Project):
- This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.
- Try running some of the following tasks:
	```bash
	npx hardhat help
	npx hardhat test
	REPORT_GAS=true npx hardhat test
	npx hardhat node
	npx hardhat run scripts/deploy_local.js
	```

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
---
### 3. Enhanced NFT Auction Contract
Source: `NFTAuctionToken.sol`
This smart contract enhances the traditional second price auction mechanism for NFTs by allowing bids with ERC20 tokens. The contract includes several features to ensure a secure, transparent, and efficient auction process.
#### 3.1. Auction Contract Overview
**Auction Struct**: 
```solidity
struct Auction {
    address auctioneer;            // Address of the auctioneer who created the auction
    IERC721 nftContract;           // NFT contract address
    uint256 nftId;                 // NFT ID
    IERC20 tokenPayment;           // ERC20 token contract for payment
    uint256 initialPrice;          // Initial price set for the auction
    uint256 endTime;               // End time of the auction
    bool ended;                    // Flag to indicate if the auction has ended
    uint256 highestBid;            // Highest bid received during the auction
    address winner;                // Address of the highest bidder (winner)
    uint256 winnerBid;             // The winning bid amount (second highest bid)
}
```
---
**Events:**
-   **AuctionCreated**: Emitted when a new auction is created.
    -   Parameters: `auctionId`, `nftContract`, `nftId`, `tokenPayment`, `initialPrice`, `endTime`.
-   **BidPlaced**: Emitted when a new bid is placed.
    -   Parameters: `auctionId`, `bidder`.
-   **WinnerBid**: Emitted when the highest bid is updated.
    -   Parameters: `auctionId`, `winnerBid`.
-   **AuctionEnded**: Emitted when an auction ends.
    -   Parameters: `auctionId`, `winner`, `winningBid`.
-   **AuctionExtended**: Emitted when the auction end time is extended due to a late bid.
    -   Parameters: `auctionId`, `newEndTime`.
-   **AuctionCancelled**: Emitted when an auction is cancelled.
    -   Parameters: `auctionId`.
-   **BidCancelled**: Emitted when a bid is cancelled.
    -   Parameters: `auctionId`, `bidder`.
-   **OrganizerChanged**: Emitted when the organizer address is changed.
    -   Parameters: `organizer`.
-   **ServiceFeeRateChanged**: Emitted when the service fee rate is changed.
    -   Parameters: `rate`.
---
**Mappings and Variables:**

-   **Mappings**:
    -   `mapping(uint256 => Auction) private _auctions`: Stores auction details by auction ID.
    -   `mapping(uint256 => mapping(address => uint256)) private _bids`: Stores bids for each auction by bidder address.
-   **Variables**:
    -   `uint256 public _auctionIdCounter`: Counter for generating unique auction IDs.
    -   `address public _organizer`: Address of the contract organizer.
    -   `uint256 public AUCTION_SERVICE_FEE_RATE`: Percentage of the winning bid taken as a service fee.
    -   `uint256 public constant EXTENSION_DURATION`: Duration by which the auction is extended if a bid is placed in the last 10 minutes.
---
**Features:**
-   **Auction Creation**:
    
    -   **Function**: `createAuction`
    -   **Description**: The auctioneer initiates an auction by specifying the NFT contract address, NFT ID, ERC20 token for payment, initial price, and auction duration. The NFT is transferred to the contract until the auction ends.
    -   **Parameters**:
        -   `nftContract`: Address of the ERC721 NFT contract.
        -   `nftId`: ID of the NFT to be auctioned.
        -   `tokenPayment`: Address of the ERC20 token used for payment.
        -   `initialPrice`: Minimum starting price for bids.
        -   `duration`: Duration of the auction in seconds.
    -   **Conditions**:
        -   The auctioneer must own the NFT.
        -   Valid addresses for the NFT and ERC20 token contracts.
        -   Initial price must be greater than zero.
        -   Auction duration must be between 1 second and 30 days.
-   **Bid Placement**:
    
    -   **Function**: `placeBid`
    -   **Description**: Users place bids on ongoing auctions by specifying the auction ID and bid amount. The bid is recorded along with the bidder's address.
    -   **Parameters**:
        -   `auctionId`: ID of the auction to bid on.
        -   `bidAmount`: Amount of the bid in the specified ERC20 token.
    -   **Conditions**:
        -   Bids must be greater than zero and at least the initial price.
        -   Bids must exceed the current highest bid.
        -   Bids within the last 10 minutes of the auction extend the duration by 10 minutes.
-   **Bid Withdrawal**:
    
    -   **Function**: `withdrawBid`
    -   **Description**: Allows users to withdraw their bids after the auction ends if they are not the highest bidder.
    -   **Parameters**:
        -   `auctionId`: ID of the auction to withdraw the bid from.
    -   **Conditions**:
        -   The auction must be concluded.
        -   The caller must not be the highest bidder.
        -   There must be a bid to withdraw.
-   **Auction End**:
    
    -   **Function**: `endAuction`
    -   **Description**: Ends the auction, transfers the NFT to the highest bidder, and processes payments and fees.
    -   **Parameters**:
        -   `auctionId`: ID of the auction to end.
    -   **Conditions**:
        -   The auction duration must have elapsed.
        -   The auction must not have been previously ended.
    -   **Process**:
        -   Calculates and transfers service fees to the organizer.
        -   Transfers the remaining bid amount to the auctioneer.
        -   Refunds any excess amount to the highest bidder.
        -   Transfers the NFT to the highest bidder.
-   **Service Fees**:
    
    -   **Description**: Configurable service fee deducted from the winning bid amount and transferred to the contract organizer.
    -   **Functions**:
        -   `setServiceFeeRate`: Sets the service fee rate.
        -   `setOrganizer`: Sets a new organizer address.
    -   **Parameters**:
        -   `rate`: Percentage of the winning bid taken as a service fee.
        -   `organizer`: New organizer address.
-   **Auction Management**:
    
    -   **Functions**:
        -   `getAuctionDetails`: Retrieves details of a specific auction.
        -   `getBidPrice`: Retrieves the bid amount for a specific auction by the caller.
        -   `isWinner`: Checks if the caller is the winner of a specific auction.
        -   `getOngoingAuctions`: Retrieves a list of ongoing auction IDs.
---
**Functions:**

- **createAuction**: Initiates a new auction by transferring the NFT to the contract and defining auction parameters.
-  **placeBid**: Allows users to bid on ongoing auctions, updating the highest bid and bidder.
-  **cancelBid**: Allows users to cancel their bids if they are not the highest bidder.
-  **endAuction**: Ends an auction, transfers the NFT to the winner, and handles the payments.
-  **withdrawBid**: Allows users to withdraw their bid amounts after the auction has ended, if they are not the winner.
-  **setOrganizer**: Sets a new organizer address.
-  **setServiceFeeRate**: Sets a new service fee rate.
-  **getAuctionDetails**: Retrieves details of a specific auction.
-  **getBidPrice**: Retrieves the bid amount for a specific auction by the caller.
-  **isWinner**: Checks if the caller is the winner of a specific auction.
-  **getOngoingAuctions**: Retrieves a list of ongoing auction IDs.
---
### 4. NFT Marketplace Smart Contract
Source: `NFTMarket.sol`

The NFTMarket contract is a robust smart contract designed to facilitate the listing, unlisting, and purchasing of NFTs (Non-Fungible Tokens) using either ETH or ERC20 tokens. It leverages the OpenZeppelin library for security and utility functions, ensuring reliable and secure operations. The contract follows the ERC721 standard for NFTs and the ERC20 standard for token payments, making it flexible for a variety of token types.
#### 4.1. Contract Overview
**Struct:**
`Product`: A struct that holds information about each NFT listed on the marketplace.

-   `owner`: The address of the NFT owner.
-   `nftContract`: The ERC721 contract of the NFT.
-   `tokenId`: The ID of the NFT token.
-   `price`: The listing price of the NFT.
-   `tokenPayment`: The address of the ERC20 token for payment (or address(0) for ETH).
-   `isListed`: A boolean indicating if the product is currently listed.
---
**Events:**
-   `ProductListed`: Emitted when an NFT is listed on the marketplace.
-   `ProductSold`: Emitted when an NFT is sold.
-   `ProductUnlisted`: Emitted when an NFT is unlisted from the marketplace.
---
**Variables:**
-   `nextProductId`: A counter to generate unique product IDs for each listed NFT.
-   `products`: A mapping to store details of each listed product using the product ID as the key.
---
**Features:**
- **Listing Products:**
	- **Function Name:** `listProduct`
	- **Description:** Users can list their NFTs for sale by specifying the NFT contract, token ID, sale price, and payment token (either ETH or an ERC20 token).
	-   **Parameters**:
    -   `address _nftContract`: The address of the NFT contract.
    -   `uint256 _tokenId`: The ID of the NFT to be listed.
    -   `uint256 _price`: The listing price of the NFT.
    -   `address _tokenPayment`: The address of the ERC20 token contract for payment (use address(0) for ETH).
	-   **Returns**: None.
	-   **Requirements**:
	    -   The NFT contract address must be valid and support the ERC721 interface.
	    -   The caller must own the NFT and have approved the contract to transfer it.
	    -   The listing price must be greater than zero.
	    -   The ERC20 token payment address, if provided, must be valid and support the ERC20 interface.
	-   **Emits**:
	    -   `ProductListed` event with details of the listed product.
---
- **Unlisting Products:**
	- **Function Name:** `unlistProduct`
	- **Description:** Owners can unlist their NFTs from the marketplace, transferring the NFT back to their ownership.
	-   **Parameters**:
	    -   `uint256 _productId`: The ID of the product to be unlisted.
	-   **Returns**: None.
	-   **Requirements**:
	    -   The caller must be the owner of the product.
	    -   The product must be currently listed.
	-   **Emits**:
	    -   `ProductUnlisted` event with the product ID.
---
- **Buying Products:**
	- **Function Name:** `buyProduct`
	- **Description:** Buyers can purchase listed NFTs by sending the required payment in either ETH or the specified ERC20 token.
	-   **Parameters**:
	    -   `uint256 _productId`: The ID of the product to be bought.
	-   **Returns**: None.
	-   **Requirements**:
	    -   The product must be currently listed.
	    -   The caller must send the correct amount of ETH or have enough ERC20 tokens approved for the transaction.
	-   **Emits**:
	    -   `ProductSold` event with the product ID and buyer's address.
---
