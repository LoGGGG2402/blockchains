// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTMarket is IERC721Receiver, ReentrancyGuard {
    using Address for address payable;

    uint256 public nextProductId = 1;

    struct Product {
        address owner;
        IERC721 nftContract;
        uint256 tokenId;
        uint256 price;
        address paymentToken;
        bool isListed;
    }

    mapping(uint256 => Product) public products;

    event ProductListed(uint256 productId, address owner, address nftContract, uint256 tokenId, uint256 price, address paymentToken);
    event ProductSold(uint256 productId, address buyer);
    event ProductUnlisted(uint256 productId);

    function listProduct(address _nftContract, uint256 _tokenId, uint256 _price, address _paymentToken) external {
        IERC721 nftContract = IERC721(_nftContract);
        require(nftContract.ownerOf(_tokenId) == msg.sender, "NFT not owned");
        require(nftContract.getApproved(_tokenId) == address(this), "NFT not approved");
        require(_price > 0, "Price must be greater than 0");

        uint256 productId = nextProductId++;
        products[productId] = Product({
            owner: msg.sender,
            nftContract: nftContract,
            tokenId: _tokenId,
            price: _price,
            paymentToken: _paymentToken,
            isListed: true
        });
        nftContract.safeTransferFrom(msg.sender, address(this), _tokenId);
        emit ProductListed(productId, msg.sender, _nftContract, _tokenId, _price, _paymentToken);
    }

    function unListProduct(uint256 _productId) external {
        Product storage product = products[_productId];
        require(product.owner == msg.sender, "Not owner");
        require(product.isListed, "Not listed");
        product.isListed = false;
        product.nftContract.safeTransferFrom(address(this), msg.sender, product.tokenId);
        emit ProductUnlisted(_productId);
    }

    function buyProduct(uint256 _productId) external payable nonReentrant {
        Product storage product = products[_productId];
        require(product.isListed, "Not listed");
        require(product.price > 0, "Not for sale");

        if (product.paymentToken == address(0)) {
            // Handle ETH payment
            require(msg.value >= product.price, "Insufficient ETH sent");
            uint256 excessAmount = msg.value - product.price;
            payable(product.owner).sendValue(product.price);
            if (excessAmount > 0) {
                payable(msg.sender).sendValue(excessAmount);
            }
        } else {
            // Handle ERC20 token payment
            require(msg.value == 0, "Product requires token payment, ETH sent will be refunded");
            IERC20 paymentToken = IERC20(product.paymentToken);
            require(paymentToken.balanceOf(msg.sender) >= product.price, "Insufficient token balance");
            require(paymentToken.allowance(msg.sender, address(this)) >= product.price, "Insufficient token allowance");
            paymentToken.transferFrom(msg.sender, product.owner, product.price);
        }

        product.nftContract.safeTransferFrom(address(this), msg.sender, product.tokenId);
        product.isListed = false;
        emit ProductSold(_productId, msg.sender);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
