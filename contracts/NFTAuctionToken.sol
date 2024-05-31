// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTAuctionToken is IERC721Receiver, ReentrancyGuard {
    using Address for address;
    using SafeERC20 for IERC20;

    uint256 public _auctionIdCounter;
    address public _organizer;

    uint256 public constant EXTENSION_DURATION = 10 minutes; // if bid in last 10 mins
    uint256 public constant AUCTION_SERVICE_FEE_RATE = 3; // Percentage

    struct Auction {
        address auctioneer;
        IERC721 nftContract;
        uint256 nftId;
        IERC20 tokenPayment;
        uint256 initialPrice;
        uint256 endTime;
        bool ended;
        uint256 highestBid;
        address winner;
        uint256 winnerBid;
    }

    mapping(uint256 => Auction) private _auctions;
    mapping(uint256 => mapping(address => uint256)) private _bids;

    event AuctionCreated(
        uint256 auctionId,
        address nftContract,
        uint256 nftId,
        address tokenPayment,
        uint256 initialPrice,
        uint256 endTime
    );

    event BidPlaced(uint256 auctionId, address bidder);
    event WinnerBid(uint256 auctionId, uint256 winnerBid);
    event AuctionEnded(uint256 auctionId, address winner, uint256 winningBid);
    event AuctionExtended(uint256 auctionId, uint256 newEndTime);
    event AuctionCancelled(uint256 auctionId);
    event BidCancelled(uint256 auctionId, address bidder);

    constructor() {
        _organizer = msg.sender;
        _auctionIdCounter = 1;
    }

    modifier onlyOwner(uint256 auctionId) {
        require(
            _auctions[auctionId].auctioneer == msg.sender,
            "NFTAuction: Only the owner can call this function"
        );
        _;
    }

    function createAuction(
        address nftContract,
        uint256 nftId,
        address tokenPayment,
        uint256 initialPrice,
        uint256 duration
    ) public {
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
            tokenPayment != address(0),
            "NFTAuction: Invalid token contract address"
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
        IERC20 _tokenPayment = IERC20(tokenPayment);
        _nftContract.safeTransferFrom(msg.sender, address(this), nftId);

        uint256 endTime = block.timestamp + duration;

        uint256 auctionId = _auctionIdCounter++;

        Auction memory _auction = Auction({
            auctioneer: msg.sender,
            nftContract: _nftContract,
            nftId: nftId,
            tokenPayment: _tokenPayment,
            initialPrice: initialPrice,
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
            tokenPayment,
            initialPrice,
            endTime
        );
    }

    function placeBid(uint256 auctionId, uint256 bidAmount) public nonReentrant {
        Auction storage auction = _auctions[auctionId];
        require(
            block.timestamp < auction.endTime,
            "NFTAuction: Auction has ended"
        );
        require(bidAmount > 0, "NFTAuction: Bid must be greater than zero");

        uint256 currentBid = _bids[auctionId][msg.sender] + bidAmount;
        require(
            currentBid >= auction.initialPrice,
            "NFTAuction: Bid must be at least the initial price"
        );
        require(
            currentBid > auction.winnerBid,
            "NFTAuction: Bid must be higher than the current highest bid"
        );

        auction.tokenPayment.safeTransferFrom(msg.sender, address(this), bidAmount);

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
                auction.winnerBid = currentBid;
            }
        } else if (currentBid > auction.winnerBid) {
            auction.winnerBid = currentBid;
        }

        emit WinnerBid(auctionId, currentBid);

        emit BidPlaced(auctionId, msg.sender);
    }

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

        auction.tokenPayment.safeTransfer(msg.sender, userBid);

        emit BidCancelled(auctionId, msg.sender);
    }

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

        uint256 serviceFee = (auction.winnerBid * AUCTION_SERVICE_FEE_RATE) / 100;
        uint256 finalAmount = auction.winnerBid - serviceFee;
        uint256 excessAmount = auction.highestBid - auction.winnerBid;

        // Refund the excess amount to the highest bidder (winner)
        if (excessAmount > 0) {
            auction.tokenPayment.safeTransfer(auction.winner, excessAmount);
        }

        auction.tokenPayment.safeTransfer(_organizer, serviceFee);
        auction.tokenPayment.safeTransfer(auction.auctioneer, finalAmount);

        auction.nftContract.safeTransferFrom(
            address(this),
            auction.winner,
            auction.nftId
        );

        emit AuctionEnded(auctionId, auction.winner, auction.winnerBid);
    }

    function cancelAuction(uint256 auctionId)
        public
        nonReentrant
        onlyOwner(auctionId)
    {
        Auction storage auction = _auctions[auctionId];
        require(
            block.timestamp < auction.endTime,
            "NFTAuction: Auction has ended"
        );

        auction.ended = true;

        if (auction.highestBid != 0) {
            auction.tokenPayment.safeTransfer(auction.winner, auction.highestBid);
        }

        auction.nftContract.safeTransferFrom(
            address(this),
            auction.auctioneer,
            auction.nftId
        );

        emit AuctionCancelled(auctionId);
    }

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

        auction.tokenPayment.safeTransfer(msg.sender, userBid);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return
            bytes4(
                keccak256("onERC721Received(address,address,uint256,bytes)")
            );
    }

    // get functions
    function getAuctionDetails(uint256 auctionId) external view returns (
        address auctioneer,
        IERC721 nftContract,
        IERC20 tokenPayment,
        uint256 nftId,
        uint256 endTime,
        bool ended,
        uint256 winnerBid
    ) {
        require(
            auctionId > 0 && auctionId < _auctionIdCounter,
            "NFTAuction: Invalid auction ID"
        );
        Auction memory auction = _auctions[auctionId];
        return (
            auction.auctioneer,
            auction.nftContract,
            auction.tokenPayment,
            auction.nftId,
            auction.endTime,
            auction.ended,
            auction.winnerBid
        );
    }

    function getBidPrice(uint256 auctionId) external view returns (uint256){
        require(
            auctionId > 0 && auctionId < _auctionIdCounter,
            "NFTAuction: Invalid auction ID"
        );
        return _bids[auctionId][msg.sender];
    }

    function getOngoingAuctions() external view returns (uint256[] memory) {
        uint256 totalAuctions = _auctionIdCounter;
        uint256 ongoingCount = 0;

        // First pass to count ongoing auctions
        for (uint256 i = 1; i < totalAuctions; i++) {
            if (!_auctions[i].ended) {
                ongoingCount++;
            }
        }

        // If no ongoing auctions, return an empty array
        if (ongoingCount == 0) {
            return new uint256[](0);
        }

        // Initialize the array with the correct size
        uint256[] memory ongoingAuctions = new uint256[](ongoingCount);
        uint256 index = 0;

        // Second pass to populate the array with ongoing auction IDs
        for (uint256 i = 1; i < totalAuctions; i++) {
            if (!_auctions[i].ended) {
                ongoingAuctions[index] = i;
                index++;
            }
        }

        return ongoingAuctions;
    }
}
