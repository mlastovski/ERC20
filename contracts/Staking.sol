//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "hardhat/console.sol";
import { IERC20 } from "@openzeppelin/contracts/interfaces/IERC20.sol";
import { ERC20 } from "./ERC20.sol";

contract Staking {
    IERC20 immutable lpToken = IERC20(0xb5C2dd7609De028091e49803A4F36E2A1cC187Ff);
    ERC20 immutable crt = ERC20(0x7Dbef992Db777E8cF9A28DaA08BC2Ca5970b8731);

    address private immutable owner;
    uint256 private interest;
    uint256 private minRewardsTimestamp;
    uint256 private minUnstakeFreezeTime;

    struct Stake {
        uint256 balance;
        uint256 timestamp;
    }

    mapping(address => Stake) internal _stakes;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "You are not an owner");
        _;
    }

    event Staked(address _from, uint256 amount);
    event Claimed(address _from, uint256 amount);
    event Unstaked(address _from, uint256 amount);

    function stake(uint256 amount) public {
        if(_stakes[msg.sender].balance > 0) {
            require(block.timestamp - _stakes[msg.sender].timestamp >= minRewardsTimestamp, "Less than minRewardsTimestamp");
            claim();
        }

        lpToken.approve(address(this), amount);
        lpToken.transferFrom(msg.sender, address(this), amount);
        _stakes[msg.sender].balance += amount;
        _stakes[msg.sender].timestamp = block.timestamp;

        emit Staked(msg.sender, amount);
    }

    function claim() public {
        require(block.timestamp - _stakes[msg.sender].timestamp >= minRewardsTimestamp, "Less than minRewardsTimestamp");
        uint256 rewardInCRT = _calculateRewards(msg.sender);
        require(_stakes[msg.sender].balance > 0 && rewardInCRT > 0, "No CRT to claim");

        crt.mint(msg.sender, rewardInCRT);
        _stakes[msg.sender].timestamp = block.timestamp;

        emit Claimed(msg.sender, rewardInCRT);
    }

    function unstake() public {
        require(block.timestamp - _stakes[msg.sender].timestamp >= minUnstakeFreezeTime, "Less than minUnstakeFreezeTime");

        claim();
        uint256 totalBalance = _stakes[msg.sender].balance;
        _stakes[msg.sender].balance -= totalBalance;
        lpToken.transfer(msg.sender, totalBalance);

        emit Unstaked(msg.sender, totalBalance);
    }

    function getStakeInfo(address _from) public view returns (uint256 _balance, uint256 _timestamp, uint256 _rewards) {
        return(_stakes[_from].balance, _stakes[_from].timestamp, _calculateRewards(_from));
    }

    function getStakeSettings() public view returns (uint256 _interest, uint256 _minRewardsTimestamp, uint256 _minUnstakeFreezeTime) {
        return(interest, minRewardsTimestamp, minUnstakeFreezeTime);
    }

    function modifyStakeSettings(uint256 _interest, uint256 _rewardsInMinutes, uint256 _unstakeFreezeInMinutes) public onlyOwner returns (bool success) {
        interest = _interest;
        minRewardsTimestamp = _rewardsInMinutes * 1 minutes;
        minUnstakeFreezeTime = _unstakeFreezeInMinutes * 1 minutes;

        return true;
    }

    function _calculateRewards(address _from) public view returns (uint256 amount) {
        require(_stakes[_from].timestamp != 0, "Zero timestamp");

        uint256 totalBalance = _stakes[_from].balance;
        uint256 totalTime = block.timestamp - _stakes[_from].timestamp;

        return((totalBalance * (totalTime / minRewardsTimestamp)) * interest / 100);
    } 
}