import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SimpleNFT", function () {
  let nft: SimpleNFT;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  const NAME = "Test NFT";
  const SYMBOL = "TNFT";
  const BASE_URI = "https://api.example.com/metadata/";
  const TOKEN_ID_ONE = BigInt(1);

  async function getTokenIdFromTx(tx: any) {
    const receipt = await tx.wait();
    const transferEvent = receipt.logs.find(
      (log: any) => log.fragment?.name === 'Transfer' &&
      log.args?.from === ethers.ZeroAddress
    );
    return transferEvent ? transferEvent.args.tokenId : null;
  }

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy contract
    const SimpleNFTFactory = await ethers.getContractFactory("SimpleNFT");
    nft = await SimpleNFTFactory.deploy(
      NAME,
      SYMBOL,
      owner.address
    );
    await nft.waitForDeployment();

    // Set the base URI after deployment
    await nft.setBaseURI(BASE_URI);
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await nft.name()).to.equal(NAME);
      expect(await nft.symbol()).to.equal(SYMBOL);
    });

    it("Should set the correct owner", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should set the correct base URI", async function () {
      const tx = await nft.mint();
      const tokenId = await getTokenIdFromTx(tx);
      expect(await nft.tokenURI(tokenId)).to.equal(BASE_URI + tokenId.toString());
    });
  });

  describe("Minting", function () {
    it("Should allow anyone to mint", async function () {
      const tx = await nft.connect(addr1).mint();
      const tokenId = await getTokenIdFromTx(tx);
      expect(await nft.ownerOf(tokenId)).to.equal(addr1.address);
      expect(await nft.balanceOf(addr1.address)).to.equal(TOKEN_ID_ONE);
    });

    it("Should increment token IDs correctly", async function () {
      await nft.mint();
      await nft.mint();
      const tx = await nft.mint();
      const tokenId = await getTokenIdFromTx(tx);
      expect(await nft.ownerOf(tokenId)).to.equal(owner.address);
    });

    it("Should emit Transfer event on mint", async function () {
      await expect(nft.mint())
        .to.emit(nft, "Transfer")
        .withArgs(ethers.ZeroAddress, owner.address, TOKEN_ID_ONE);
    });

    it("Should emit MetadataUpdate event on mint", async function () {
      await expect(nft.mint())
        .to.emit(nft, "MetadataUpdate")
        .withArgs(TOKEN_ID_ONE);
    });
  });

  describe("Base URI Management", function () {
    it("Should allow owner to update base URI", async function () {
      const newBaseURI = "https://new.example.com/metadata/";
      const tx = await nft.mint();
      const tokenId = await getTokenIdFromTx(tx);
      await nft.setBaseURI(newBaseURI);
      expect(await nft.tokenURI(tokenId)).to.equal(newBaseURI + tokenId.toString());
    });

    it("Should not allow non-owner to update base URI", async function () {
      await expect(nft.connect(addr1).setBaseURI("new-uri/"))
        .to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });

    it("Should emit BatchMetadataUpdate on base URI change", async function () {
      await nft.mint();
      await nft.mint();
      await expect(nft.setBaseURI("new-uri/"))
        .to.emit(nft, "BatchMetadataUpdate")
        .withArgs(TOKEN_ID_ONE, ethers.MaxUint256);
    });
  });

  describe("Metadata Freezing", function () {
    it("Should allow owner to freeze metadata", async function () {
      await nft.freezeMetadata();
      expect(await nft.isMetadataFrozen()).to.be.true;
    });

    it("Should not allow non-owner to freeze metadata", async function () {
      await expect(nft.connect(addr1).freezeMetadata())
        .to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });

    it("Should not allow base URI update after freezing", async function () {
      await nft.freezeMetadata();
      await expect(nft.setBaseURI("new-uri/"))
        .to.be.revertedWith("Metadata is frozen");
    });
  });

  describe("Token Transfers", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      const tx = await nft.mint();
      tokenId = await getTokenIdFromTx(tx);
    });

    it("Should allow token transfers", async function () {
      await nft.transferFrom(owner.address, addr1.address, tokenId);
      expect(await nft.ownerOf(tokenId)).to.equal(addr1.address);
    });

    it("Should update balances after transfer", async function () {
      await nft.transferFrom(owner.address, addr1.address, tokenId);
      expect(await nft.balanceOf(owner.address)).to.equal(BigInt(0));
      expect(await nft.balanceOf(addr1.address)).to.equal(TOKEN_ID_ONE);
    });
  });
}); 