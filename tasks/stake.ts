import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract, ContractFactory, providers } from "ethers";

const contractAddress = "0xB51A453d5DE3584E5503FD63CbF76A6978F9D37b";
let Staking: ContractFactory;
let stakingContract: Contract;
let owner: SignerWithAddress;
const lpHolderAddress = "0x71c916C1A79cc66bfD39a2cc6f7B4feEd589d21e";
let lpHolder: providers.JsonRpcSigner;
let lpToken: Contract;

task("stake", "Stakes LP tokens")
  .addParam("amount", "Amount of LP tokens to stake")
  .setAction(async (taskArgs, { ethers, network }) => {
    [owner] = await ethers.getSigners();
    lpToken = await ethers.getContractAt("IERC20", "0xb5C2dd7609De028091e49803A4F36E2A1cC187Ff");

    Staking = await ethers.getContractFactory("Staking");
    stakingContract = Staking.attach(contractAddress);
    await stakingContract.connect(owner).modifyStakeSettings(100, 1, 1);
    const stakeSettings = await stakingContract.getStakeSettings();
    console.log(stakeSettings);

    await network.provider.request({method: "hardhat_impersonateAccount", params: [lpHolderAddress]});
    await network.provider.send("hardhat_setBalance", [lpHolderAddress, "0xffffffffffffffffff"]);
    lpHolder = ethers.provider.getSigner(lpHolderAddress);
    await lpToken.connect(lpHolder).transfer(owner.address, taskArgs.amount);
    await network.provider.request({method: "hardhat_stopImpersonatingAccount", params: [lpHolderAddress]});
    await lpToken.connect(owner).approve(contractAddress, taskArgs.amount);

    const transaction = await stakingContract.stake(taskArgs.amount);
    await transaction.wait();
    console.log(transaction);
  });

module.exports = {};
