import { ethers } from "hardhat";

async function main() {
  const Token = await ethers.getContractFactory("ERC20");
  const token = await Token.deploy("Crypton", "CRT", 18);

  await token.deployed();

  console.log("Crypton deployed to:", token.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
