import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

task("allowance", "Approve tokens")
  .addParam("owner", "Address spender")
  .addParam("spender", "Msg value")
  .setAction(async (taskArgs, { ethers }) => {
    const Token = await ethers.getContractFactory("ERC20");
    const tokenContract = Token.attach(contractAddress);
    const transaction = await tokenContract.allowance(taskArgs.owner, taskArgs.spender);
    console.log(transaction);
  });

module.exports = {};
