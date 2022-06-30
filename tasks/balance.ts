import { task, types } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import { ethers } from "hardhat";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

task("balance", "Mints tokens")
  .addParam("address", "Address to")
  .setAction(async (taskArgs, { ethers }) => {
    const Token = await ethers.getContractFactory("ERC20");
    const tokenContract = Token.attach(contractAddress);
    const transaction = await tokenContract.balanceOf(taskArgs.address);
    console.log(transaction);
  });

module.exports = {};
