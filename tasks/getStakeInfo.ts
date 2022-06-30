import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import { Contract, ContractFactory } from "ethers";

const contractAddress = "0xB51A453d5DE3584E5503FD63CbF76A6978F9D37b";
let Staking: ContractFactory;
let stakingContract: Contract;

task("getStakeInfo", "Gets stake info")
  .addParam("from", "Address from")
  .setAction(async (taskArgs, { ethers, network }) => {
    Staking = await ethers.getContractFactory("Staking");
    stakingContract = Staking.attach(contractAddress);
    const info = await stakingContract.getStakeInfo(taskArgs.from);
    console.log(info);
  });

module.exports = {};
