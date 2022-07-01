import { task, types } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

task("transferFrom", "transferFrom tokens")
  .addParam("from", "Address spender")
  .addParam("to", "Address spender")
  .addParam("value", "Msg value")
  .setAction(async (taskArgs, { ethers }) => {
    const Token = await ethers.getContractFactory("ERC20");
    const tokenContract = Token.attach(contractAddress);
    const transaction = await tokenContract.transferFrom(taskArgs.from, taskArgs.to, taskArgs.value);
    await transaction.wait();
    console.log(transaction);
  });

module.exports = {};
