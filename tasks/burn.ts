import { task, types } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import { ethers } from "hardhat";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

task("burn", "Mints tokens")
  .addParam("from", "Address to")
  .addParam("value", "Msg value")
  .setAction(async (taskArgs, { ethers }) => {
    const Token = await ethers.getContractFactory("ERC20");
    const tokenContract = Token.attach(contractAddress);
    const transaction = await tokenContract.burn(taskArgs.from, taskArgs.value);
    await transaction.wait();
    console.log(transaction);
  });

module.exports = {};
