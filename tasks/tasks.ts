// Написать таски на transfer, transferFrom, approve, mint, burn
import { task, types } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import { ethers } from "hardhat";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

task("mint", "Mints tokens")
  .addParam("to", "Address to")
  .addParam("value", "Msg value")
  .setAction(async (taskArgs, { ethers }) => {
    const Token = await ethers.getContractFactory("ERC20");
    const tokenContract = Token.attach(contractAddress);
    const transaction = await tokenContract.mint(taskArgs.to, taskArgs.value);
    await transaction.wait();
    console.log(transaction);
  });

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

task("allowance", "Approve tokens")
  .addParam("owner", "Address spender")
  .addParam("spender", "Msg value")
  .setAction(async (taskArgs, { ethers }) => {
    const Token = await ethers.getContractFactory("ERC20");
    const tokenContract = Token.attach(contractAddress);
    const transaction = await tokenContract.allowance(taskArgs.owner, taskArgs.spender);
    console.log(transaction);
  });

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

task("balance", "Mints tokens")
  .addParam("address", "Address to")
  .setAction(async (taskArgs, { ethers }) => {
    const Token = await ethers.getContractFactory("ERC20");
    const tokenContract = Token.attach(contractAddress);
    const transaction = await tokenContract.balanceOf(taskArgs.address);
    console.log(transaction);
  });

task("transfer", "Transfers token")
  .addParam("to", "Address to")
  .addParam("value", "Msg value")
  .setAction(async (taskArgs, { ethers }) => {
    const Token = await ethers.getContractFactory("ERC20");
    const tokenContract = Token.attach(contractAddress);
    const transaction = await tokenContract.transfer(taskArgs.to, taskArgs.value);
    await transaction.wait();
    console.log(transaction);
  });

module.exports = {};
