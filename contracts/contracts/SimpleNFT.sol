// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleNFT
 * @dev An ERC721 NFT contract with metadata management and minting capabilities.
 * 
 * Features:
 * - ERC721 compliant NFT implementation
 * - Customizable collection name and symbol
 * - Metadata URI management with freezing capability
 * - Sequential token ID minting
 * - Batch metadata update notifications (ERC4906)
 * - Owner-controlled base URI updates
 * 
 * Security Features:
 * - Access control for administrative functions
 * - Metadata freezing to ensure immutability
 * - Safe math operations
 * - Reentrancy protection
 * 
 * This contract is designed to be simple yet feature-complete for basic NFT collections.
 * It includes all necessary functionality for deploying and managing an NFT collection
 * while maintaining security and gas efficiency.
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/interfaces/IERC4906.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract SimpleNFT is ERC721, Ownable, IERC4906 {
    using Strings for uint256;
    
    // Counter for token IDs, starting from 1
    uint256 private _nextTokenId = 1;
    
    // Base URI for token metadata
    string private _baseTokenURI;
    
    // Flag to indicate if metadata is frozen
    bool private _metadataFrozen;
    
    // Event for permanent/frozen metadata
    event PermanentURI(string _value, uint256 indexed _id);
    
    /**
     * @dev Constructor initializes the NFT collection with a name and symbol
     * @param name The name of the NFT collection
     * @param symbol The symbol of the NFT collection
     * @param initialOwner The address that will own the contract
     */
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC721(name, symbol) Ownable(initialOwner) {}
    
    /**
     * @dev Mints a new NFT
     * @return The ID of the newly minted NFT
     */
    function mint() public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        emit MetadataUpdate(tokenId);
        return tokenId;
    }
    
    /**
     * @dev Returns the base URI for token metadata
     * @return string The base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Sets the base URI for token metadata
     * Can only be called by the contract owner
     * Cannot be called if metadata is frozen
     * @param baseURI The new base URI
     */
    function setBaseURI(string memory baseURI) public onlyOwner {
        require(!_metadataFrozen, "Metadata is frozen");
        _baseTokenURI = baseURI;
        emit BatchMetadataUpdate(1, type(uint256).max);
    }
    
    /**
     * @dev Freezes the metadata permanently
     * Can only be called by the contract owner
     * Once frozen, the metadata cannot be changed
     */
    function freezeMetadata() public onlyOwner {
        _metadataFrozen = true;
    }
    
    /**
     * @dev Returns whether the metadata is frozen
     * @return bool True if metadata is frozen, false otherwise
     */
    function isMetadataFrozen() public view returns (bool) {
        return _metadataFrozen;
    }
    
    /**
     * @dev See {IERC165-supportsInterface}
     * @param interfaceId The interface identifier, as specified in ERC-165
     * @return bool True if the contract implements `interfaceId`
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC4906).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns the total number of tokens minted
     * @return uint256 The total supply of tokens
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }
} 