import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract, ContractFactory, providers, BigNumber } from "ethers";

const contractAddress = "0xB51A453d5DE3584E5503FD63CbF76A6978F9D37b";
let Staking: ContractFactory;
let stakingContract: Contract;
let owner: SignerWithAddress;
let lpToken: Contract;
const CRTAdminAddress = "0x71c916C1A79cc66bfD39a2cc6f7B4feEd589d21e";
let CRTAdmin: providers.JsonRpcSigner;
let CRT: Contract;

task("unstake", "Unstakes LP tokens")
  .setAction(async (taskArgs, { ethers, network }) => {
    [owner] = await ethers.getSigners();
    lpToken = await ethers.getContractAt("IERC20", "0xb5C2dd7609De028091e49803A4F36E2A1cC187Ff");

    Staking = await ethers.getContractFactory("Staking");
    stakingContract = Staking.attach(contractAddress);

    await network.provider.request({method: "hardhat_impersonateAccount", params: [CRTAdminAddress]});
    await network.provider.send("hardhat_setBalance", [CRTAdminAddress, "0xffffffffffffffffff"]);
    CRTAdmin = ethers.provider.getSigner(CRTAdminAddress);
    CRT = await ethers.getContractAt("ERC20", "0x7Dbef992Db777E8cF9A28DaA08BC2Ca5970b8731");
    await CRT.connect(CRTAdmin).grantRole("0x0000000000000000000000000000000000000000000000000000000000000000", contractAddress);
    await network.provider.request({method: "hardhat_stopImpersonatingAccount", params: [CRTAdminAddress]});

    // Make better output
    const transaction = await stakingContract.unstake();
    await transaction.wait();
    const afterBalance = BigNumber.from(await lpToken.balanceOf(owner.address));
    console.log(afterBalance);
    console.log(transaction);
  });

module.exports = {};