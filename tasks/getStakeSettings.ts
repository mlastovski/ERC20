import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import { Contract, ContractFactory } from "ethers";

const contractAddress = "0xB51A453d5DE3584E5503FD63CbF76A6978F9D37b";
let Staking: ContractFactory;
let stakingContract: Contract;

task("getStakeSettings", "Gets stake settings")
  .setAction(async (taskArgs, { ethers }) => {
    Staking = await ethers.getContractFactory("Staking");
    stakingContract = Staking.attach(contractAddress);
    await stakingContract.modifyStakeSettings(100, 1, 1);
    const stakeSettings = await stakingContract.getStakeSettings();
    console.log(stakeSettings);
  });

module.exports = {};
