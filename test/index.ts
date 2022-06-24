import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

describe("CRT", function () {
  let Token: ContractFactory;
  let tokenContract: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  before(async function () {
    [owner, addr1] = await ethers.getSigners();
    Token = await ethers.getContractFactory("ERC20");
  });

  beforeEach(async function () {
    tokenContract = await Token.deploy("Crypton", "CRT", 18);
    await tokenContract.deployed();
  });

  it("Creation: Should check if the contract data is correct", async function () {
    expect(await tokenContract.name()).to.equal("Crypton");
    expect(await tokenContract.symbol()).to.equal("CRT");
    expect(await tokenContract.decimals()).to.equal(18);
    expect(await tokenContract.totalSupply()).to.equal(parseEther("0"));
  });

  it("Balance: Should get balance for a given address", async function () {
    await tokenContract.connect(owner).mint(addr1.address, parseEther("1"));
    expect(await tokenContract.connect(addr1).balanceOf(addr1.address)).to.equal(parseEther("1"));
  });

  it("Transfer: Should transfer", async function () {
    await tokenContract.connect(owner).mint(addr1.address, parseEther("1"));
    await tokenContract.connect(addr1).transfer(owner.address, parseEther("0.4"));
    expect(await tokenContract.connect(owner).balanceOf(owner.address)).to.equal(parseEther("0.4"));
  });

  it("Transfer: Should fail to transfer (Insufficient balance)", async function () {
    await tokenContract.connect(owner).mint(addr1.address, parseEther("1"));
    await expect(tokenContract.connect(addr1).transfer(owner.address, parseEther("2"))).to.be.revertedWith("Insufficient balance");
  });

  it("TransferFrom: Should transfer", async function () {
    await tokenContract.connect(owner).mint(addr1.address, parseEther("1"));
    await tokenContract.connect(addr1).approve(owner.address, parseEther("0.4"));
    await tokenContract.transferFrom(addr1.address, owner.address, parseEther("0.4"));
    expect(await tokenContract.connect(addr1).balanceOf(addr1.address)).to.equal(parseEther("0.6"));
    expect(await tokenContract.connect(addr1).allowance(addr1.address, owner.address)).to.equal(parseEther("0"));
  });

  it("TransferFrom: Should fail to transfer (Insufficient balance)", async function () {
    await tokenContract.connect(owner).mint(addr1.address, parseEther("1"));
    await tokenContract.connect(addr1).approve(owner.address, parseEther("0.4"));
    await expect(tokenContract.transferFrom(addr1.address, owner.address, parseEther("5"))).to.be.revertedWith("Insufficient balance");
  });

  it("TransferFrom: Should fail to transfer (Insufficient allowance)", async function () {
    await tokenContract.connect(owner).mint(addr1.address, parseEther("1"));
    await expect(tokenContract.transferFrom(addr1.address, owner.address, parseEther("1"))).to.be.revertedWith("Insufficient allowance");
  });

  it("Ownership: Should fail to mint 1 token (You are not an owner)", async function () {
    await expect(tokenContract.connect(addr1).mint(addr1.address, parseEther("2"))).to.be.revertedWith("You are not an owner");
  });

  it("Burn: Should burn 1 token", async function () {
    await tokenContract.connect(owner).mint(addr1.address, parseEther("2"));
    await tokenContract.connect(owner).burn(addr1.address, parseEther("1"));
    expect(await tokenContract.totalSupply()).to.equal(parseEther("1"));
  });

  it("Burn: Should fail to burn 1 token (Insufficient balance)", async function () {
    await expect(tokenContract.connect(owner).burn(addr1.address, parseEther("1"))).to.be.revertedWith("Insufficient balance");
  });
});
