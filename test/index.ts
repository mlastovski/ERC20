import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Contract, ContractFactory, providers, BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

describe("Staking", function () {
  let Staking: ContractFactory;
  let staking: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  const lpHolderAddress = "0x71c916C1A79cc66bfD39a2cc6f7B4feEd589d21e";
  let lpHolder: providers.JsonRpcSigner;
  let lpToken: Contract;
  const CRTAdminAddress = "0x71c916C1A79cc66bfD39a2cc6f7B4feEd589d21e";
  let CRTAdmin: providers.JsonRpcSigner;
  let CRT: Contract;
  const minutes = 60;

  const sendLp = async (to: string, amount: BigNumber) => {
    await network.provider.request({method: "hardhat_impersonateAccount", params: [lpHolderAddress]});
    await network.provider.send("hardhat_setBalance", [lpHolderAddress, "0xffffffffffffffffff"]);
    lpHolder = ethers.provider.getSigner(lpHolderAddress);
    await lpToken.connect(lpHolder).transfer(to, amount);
    await network.provider.request({method: "hardhat_stopImpersonatingAccount", params: [lpHolderAddress]});
  };
  
  const setAdminRole = async (to: string) => {
    await network.provider.request({method: "hardhat_impersonateAccount", params: [CRTAdminAddress]});
    await network.provider.send("hardhat_setBalance", [CRTAdminAddress, "0xffffffffffffffffff"]);
    CRTAdmin = ethers.provider.getSigner(CRTAdminAddress);
    CRT = await ethers.getContractAt("ERC20", "0x7Dbef992Db777E8cF9A28DaA08BC2Ca5970b8731");
    await CRT.connect(CRTAdmin).grantRole("0x0000000000000000000000000000000000000000000000000000000000000000", to);
    await network.provider.request({method: "hardhat_stopImpersonatingAccount", params: [CRTAdminAddress]});
  };
  
  before(async function () {
    [owner, addr1] = await ethers.getSigners();
    Staking = await ethers.getContractFactory("Staking");
  });

  beforeEach(async function () {
    staking = await Staking.deploy();
    await staking.deployed();
    lpToken = await ethers.getContractAt("IERC20", "0xb5C2dd7609De028091e49803A4F36E2A1cC187Ff");
    await staking.connect(owner).modifyStakeSettings(20, 10, 20);
  });

  // TODO: expect await value check
  it("Staking : Should configure stake settings", async function () {
    // 20 means 20%
    await staking.connect(owner).modifyStakeSettings(10, 20, 30);

    const stakeSettings = await staking.getStakeSettings();
    
    expect(stakeSettings[0]).to.equal(10); 

    // here time is in seconds, so 20 minutes = 1200 seconds
    expect(stakeSettings[1]).to.equal(1200);
    expect(stakeSettings[2]).to.equal(1800);
  });

  it("Staking : Should fail to configure stake settings (You are not an owner)", async function () {
    expect(staking.connect(addr1).modifyStakeSettings(10, 20, 40)).to.be.revertedWith("You are not an owner");
  });

  it("Staking: Should stake and calculate rewards", async function () {
    await sendLp(owner.address, parseEther("0.001"));
    await lpToken.approve(staking.address, parseEther("0.001"));
    await staking.stake(parseEther("0.001"));
    expect(await lpToken.balanceOf(staking.address)).to.equal(parseEther("0.001"));

    await ethers.provider.send('evm_increaseTime', [10 * minutes]);
    await ethers.provider.send('evm_mine', []);

    const rewards = await staking._calculateRewards(owner.address);

    expect(Number(rewards)).to.be.greaterThan(199999999900000);
    expect(Number(rewards)).to.be.lessThan(222222222200000);
  });

  it("Staking: Should fail to stake twice (Less than minRewardsTimestamp)", async function () {
    await sendLp(owner.address, parseEther("0.002"));
    await lpToken.approve(staking.address, parseEther("0.002"));
    await staking.stake(parseEther("0.001"));
    await expect(staking.stake(parseEther("0.001"))).to.be.revertedWith("Less than minRewardsTimestamp");
  });

  it("Staking: Should stake twice", async function () {
    await setAdminRole(staking.address);
    await sendLp(owner.address, parseEther("0.002"));
    await lpToken.approve(staking.address, parseEther("0.002"));
    await staking.stake(parseEther("0.001"));

    await ethers.provider.send('evm_increaseTime', [21 * minutes]);
    await ethers.provider.send('evm_mine', []);
    
    await staking.stake(parseEther("0.001"));
    expect(await lpToken.balanceOf(staking.address)).to.equal(parseEther("0.002"));
  });

  it("Staking: Should not calculate rewards (Zero timestamp)", async function () {
    expect(staking._calculateRewards(owner.address)).to.be.revertedWith("Zero timestamp"); 
  });

  it("Staking: Should claim", async function () {
    await setAdminRole(staking.address);
    await sendLp(owner.address, parseEther("0.001"));
    await lpToken.approve(staking.address, parseEther("0.001"));
    await staking.stake(parseEther("0.001"));

    const initialBalance = BigNumber.from(await lpToken.balanceOf(owner.address));

    // skipping time
    await ethers.provider.send('evm_increaseTime', [40 * minutes]);
    await ethers.provider.send('evm_mine', []);

    await staking.claim();

    const afterBalance = BigNumber.from(await lpToken.balanceOf(owner.address));
    const finalBalance = afterBalance.sub(initialBalance).toString();

    expect(finalBalance).to.equal(parseEther("0"));
  });

  it("Staking: Should not claim (Less than minRewardsTimestamp)", async function () {
    await setAdminRole(staking.address);
    await sendLp(owner.address, parseEther("0.001"));
    await lpToken.approve(staking.address, parseEther("0.001"));
    await staking.stake(parseEther("0.001"));

    // skipping time
    await ethers.provider.send('evm_increaseTime', [9 * minutes]);
    await ethers.provider.send('evm_mine', []);

    await expect(staking.claim()).to.be.revertedWith("Less than minRewardsTimestamp");
  });

  it("Staking: Should not claim (No CRT to claim)", async function () {
    await setAdminRole(staking.address);
    await sendLp(owner.address, parseEther("0.001"));
    await lpToken.approve(staking.address, parseEther("0.001"));
    await staking.stake(parseEther("0"));

    // skipping time
    await ethers.provider.send('evm_increaseTime', [40 * minutes]);
    await ethers.provider.send('evm_mine', []);

    await expect(staking.claim()).to.be.revertedWith("No CRT to claim");
  });

  it("Staking: Should unstake", async function () {
    await setAdminRole(staking.address);
    await sendLp(owner.address, parseEther("0.001"));
    await lpToken.approve(staking.address, parseEther("0.001"));
    await staking.stake(parseEther("0.001"));
    const initialBalance = BigNumber.from(await lpToken.balanceOf(owner.address));

    // skipping time
    await ethers.provider.send('evm_increaseTime', [60 * minutes]);
    await ethers.provider.send('evm_mine', []);

    await staking.unstake();
    const afterBalance = BigNumber.from(await lpToken.balanceOf(owner.address));
    const finalBalance = afterBalance.sub(initialBalance).toString();
    expect(finalBalance).to.equal(parseEther("0.001"));
  });

  it("Staking: Should fail to unstake (Less than minUnstakeFreezeTime)", async function () {
    await setAdminRole(staking.address);
    await sendLp(owner.address, parseEther("0.001"));
    await lpToken.approve(staking.address, parseEther("0.001"));
    await staking.stake(parseEther("0.001"));
    const initialBalance = BigNumber.from(await lpToken.balanceOf(owner.address));

    // skipping time
    await ethers.provider.send('evm_increaseTime', [15 * minutes]);
    await ethers.provider.send('evm_mine', []);

    await expect(staking.unstake()).to.be.revertedWith("Less than minUnstakeFreezeTime");
  });
  
  it("Staking: Should getStakeInfo", async function () {
    await sendLp(owner.address, parseEther("0.001"));
    await lpToken.approve(staking.address, parseEther("0.001"));
    await staking.stake(parseEther("0.001"));

    const stakeInfo = await staking.getStakeInfo(owner.address);

    expect(stakeInfo[0]).to.equal(parseEther("0.001")); 
    expect(stakeInfo[2]).to.equal(BigNumber.from("0"));
  });

  it("Staking: Should getStakeSettings", async function () {
    const stakeSettings = await staking.getStakeSettings();
    
    expect(stakeSettings[0]).to.equal(20); 
    expect(stakeSettings[1]).to.equal(600);
    expect(stakeSettings[2]).to.equal(1200);
  });
});

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
    await expect(tokenContract.connect(addr1).mint(addr1.address, parseEther("2"))).to.be.revertedWith("AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000");
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
