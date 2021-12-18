// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameNFT is ERC721Enumerable, Ownable {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    string base_url;
    Counters.Counter _nextTokenId;
    uint256 mint_price;
    mapping(uint256 => address) token_provider;
    mapping(uint256 => uint256) token_price;
    mapping(uint256 => uint256) spent_for_token;
    mapping(address => mapping(uint256 => uint256)) owned_tokens;
    mapping(address => uint256[]) bought_tokens;
    mapping(address => uint256[]) minted_tokens;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory token_url,
        uint256 _mint_price
    ) ERC721(_name, _symbol) {
        base_url = token_url;
        mint_price = _mint_price;
    }

    function isTokenOwner(uint256 tokenId, address account) public view returns(bool) {
        return owned_tokens[account][tokenId] > 0;
    }

    function isTokenProvider(uint256 tokenId, address account) public view returns(bool) {
        return token_provider[tokenId] == account;
    }
    
    function mint(uint256 price) public payable returns(uint256) {
        require(msg.value == mint_price);
        uint256 currentTokenId = _nextTokenId.current();
        _nextTokenId.increment();
        _safeMint(msg.sender, currentTokenId);
        token_provider[currentTokenId] = msg.sender;
        token_price[currentTokenId] = price;
        minted_tokens[msg.sender].push(currentTokenId);
        return currentTokenId;
    }

    function buy(uint256 tokenId) public payable returns(bool){
        require(exists(tokenId));
        require(token_price[tokenId] == msg.value);
        require(owned_tokens[msg.sender][tokenId] == 0);
        spent_for_token[tokenId] += msg.value;
        owned_tokens[msg.sender][tokenId] += 1;
        bought_tokens[msg.sender].push(tokenId);
        return true;
    } 

    function getMinted() public view returns(uint256[] memory) {
        return minted_tokens[msg.sender];
    }

    function getBought() public view returns(uint256[] memory) {
        return bought_tokens[msg.sender];
    }

    function collectTokenETH(uint256 tokenId, address _to) public returns(bool) {
        require(token_provider[tokenId] == msg.sender);
        require(spent_for_token[tokenId] > 0);
        (bool sent, bytes memory data) = _to.call{value: spent_for_token[tokenId]}("");
        require(sent, "DivinityCellAuction: Failed to send Ether");
        spent_for_token[tokenId] = 0;
        return true;
    }

    function get_token_provider(uint256 tokenId) public view returns(address) {
        return token_provider[tokenId];
    }
     
    function totalSupply() public override view returns (uint256) {
        return _nextTokenId.current();
    }

    function setURI(string memory baseUrl) public onlyOwner returns (bool) {
        base_url = baseUrl;

        return true;
    }

    function URI() public view returns (string memory) {
        return base_url;
    }

    function tokenURI(uint256 _tokenId) override public view returns (string memory) {
        return string(abi.encodePacked(URI(), Strings.toString(_tokenId)));
    }

    function burn(uint256 tokenId) public returns(bool) {
        _burn(tokenId);
        return true;
    } 

    function exists(uint256 tokenId) public view returns(bool) {
        return ERC721._exists(tokenId);
    }
}   
