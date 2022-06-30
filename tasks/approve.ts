import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import { ethers } from "hardhat";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

task("approve", "Approve tokens")
  .addParam("spender", "Address spender")
  .addParam("value", "Msg value")
  .setAction(async (taskArgs, { ethers }) => {
    const Token = await ethers.getContractFactory("ERC20");
    const tokenContract = Token.attach(contractAddress);
    const transaction = await tokenContract.approve(taskArgs.spender, taskArgs.value);
    await transaction.wait();
    console.log(transaction);
  });

module.exports = {};
