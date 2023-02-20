// SPDX-License-Identifier: MIT

// **********************************************************************************************
//    ______                                     _________            __                        
//  .' ___  |                                   |  _   _  |          [  |  _                    
// / .'   \_|   _ .--.    .--.    _   _   __    |_/ | | \_|   .--.    | | / ]   .---.   _ .--.  
// | |   ____  [ `/'`\] / .'`\ \ [ \ [ \ [  ]       | |     / .'`\ \  | '' <   / /__\\ [ `.-. | 
// \ `.___]  |  | |     | \__. |  \ \/\ \/ /       _| |_    | \__. |  | |`\ \  | \__.,  | | | | 
//  `._____.'  [___]     '.__.'    \__/\__/       |_____|    '.__.'  [__|  \_]  '.__.' [___||__]
//                                                                                             
//                                       www.dpnmDeFi.com                                                                 
// **********************************************************************************************


pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Grow Token Contract
 * @dev GWT is ERC20 standart token. Can be minted and burned by allowed contracts.
 * Stakable. BUSD fee required for token transfer.
 */
contract GWT_BEP20 is ERC20, Ownable {
    using SafeERC20 for IERC20;
    IERC20 public busd;

    address public dPNMcontract;
    address public feeCollector;

    uint public gwtTransFeeCollector = 1e18;//1 BUSD, immutable
    uint public gwtTransFeeLiquidity = 1e18;//Default 1 BUSD, mutable 0-2 BUSD

    bool stakingEnabled = true;
    uint lastStakingPoolId = 1;

    uint public totalStaked;//total staked GWT, should be added to _totalSupply for all tokens amount

    //GWT base staking pools settings
    struct GWTstakingPool {
        uint period;
        uint dailyProfit;
    }

    //Stake created by address
    struct userStakingPool {
        address userAddress;
        uint expirationDate;
        uint dailyProfit;
        uint gwtBalance;
        uint lastWithdraw;
        uint stakingNum;
    }


    mapping(uint => GWTstakingPool) public stakingPools;//staking pools settings
    mapping (uint => userStakingPool) public usersActivePools;//map to staking pools created by all users


    mapping(address => uint[]) public _userPoolsID;//ID of staking pools belong to each user
    mapping(address => uint[7]) public _ISfreeStakinSlot;//Slots used by address, 0 if staking slot is free, else staking ID


    event stakedGWT(address indexed user, uint GWTamount, uint expirationDate, uint dailyProfit, uint stakingID);
    event claimedGWT(address indexed user, uint GWTamount, uint stakingID);

    mapping(address => bool) internal allowedContractsMap;//list of contracts allowed to burn/mint GWT

    constructor() ERC20("Grow Token", "GWT") {}

    /**
     * @dev Fills staking pool settings, setting base vars
     * @param _dPNM dPNM token contract address, it receives BUSD fees for GWT transfer
     * @param collector feeCollector address, it receives BUSD fees for GWT transfer
     * @param _busd BUSD contract address for fee payments
     */
    function init(address _dPNM, address collector, IERC20 _busd) public onlyOwner {
        require(collector!=address(0),'Non zero address');
        dPNMcontract = _dPNM;
        feeCollector = collector;
        busd = _busd;

        //create staking pools
        stakingPools[0].period = 0;
        stakingPools[0].dailyProfit = 0;

        stakingPools[1].period = 14 days;
        stakingPools[1].dailyProfit = 10;//0.1% daily

        stakingPools[2].period = 30 days;
        stakingPools[2].dailyProfit = 20;//0.2% daily

        stakingPools[3].period = 60 days;
        stakingPools[3].dailyProfit = 25;//0.25% daily

        stakingPools[4].period = 90 days;
        stakingPools[4].dailyProfit = 30;//0.30% daily

        stakingPools[5].period = 180 days;
        stakingPools[5].dailyProfit = 40;//0.4% daily

        stakingPools[6].period = 365 days;
        stakingPools[6].dailyProfit = 50;//0.5% daily


    }

  /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     * 
     * Overrides ERC20 by adding payFeeForGWTtrans
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        address owner = _msgSender();

        //pay BUSD fee for transfer
        payFeeForGWTtrans();

        _transfer(owner, to, amount);
        return true;
    }

    /**
     * @dev ERC20 minting triggered only by allowed contracts
     */
    function mint(address account, uint256 amount) onlyAllowed public returns (bool) {
        _mint(account,amount);
        return(true);

    }

    /**
     * @dev ERC20 burning triggered only by allowed contracts
     */
    function burn(address account, uint256 amount) onlyAllowed public returns (bool) {
        _burn(account,amount);
        return(true);
    }

    /**
     * @dev Stake GWT function.
     * Requirements:
     * - Staking pool ID should be 1-6
     * - Staking should be enabled
     * - Address should have enough GWT
     * - Stake amount should be more than 1 GWT
     * - Only one staking of each type can be active at the moment
     * 
     * Staked GWT are burned.
     * totalStaked increased in the amount of staked GWT.
     * @param GWTamount Stake GWT amount
     * @param poolID Desired staking pool ID from 1-6
     */
    function stakeGWT(uint GWTamount, uint poolID) public {
        //check if pool is correct
        require(poolID>0&&poolID<7,'Incorrect pool');
        //check if staking enabled
        require(stakingEnabled,'Staking disabled');
        //check enough gwt
        require(GWTamount<=balanceOf(msg.sender),'Not enough GWT');
        //check if min gwt size is ok
        require(GWTamount>=1e18,'Less than min stake');
        //check if staking slot is free
        require(_ISfreeStakinSlot[msg.sender][poolID] == 0,'Already staked');

        //decrease gwt balance
        _burn(msg.sender,GWTamount);
        //increase totalStaked
        totalStaked += GWTamount;
        //make staking structure, add to mapping
        uint expires = block.timestamp + stakingPools[poolID].period;
        userStakingPool memory newPool = userStakingPool({
        expirationDate: expires,
        dailyProfit: stakingPools[poolID].dailyProfit,
        gwtBalance: GWTamount,
        lastWithdraw: block.timestamp,
        userAddress: msg.sender,
        stakingNum: poolID});

        usersActivePools[lastStakingPoolId] = newPool;
        //save pool id to user active pools
        _userPoolsID[msg.sender].push(lastStakingPoolId);
        //set user staking slot to not free
        _ISfreeStakinSlot[msg.sender][poolID] = lastStakingPoolId;
        //increase counter for last created staking pool
        lastStakingPoolId += 1;
        //emit event
        emit stakedGWT(msg.sender,GWTamount,expires,stakingPools[poolID].dailyProfit,lastStakingPoolId-1);

    }

    /**
     * @dev Staking claiming.
     * Requirements:
     * - Staking pool should belong to claimer
     * - Staking should be active
     * 
     * If claiming before expiration date then porift deposited
     * If claim after expiration date then profit+staked GWT are accrued
     * On claim GWT tokens are minted
     * If claimed after expiration then totalStaked decreased for staked GWT amount
     */
    function claimStaking(uint userStakeID) public {
        //check that staking exists and belong to claimer
        require(msg.sender==usersActivePools[userStakeID].userAddress,"Not found");
        //check if not closed
        require(usersActivePools[userStakeID].gwtBalance != 0, 'Staking closed');

        uint gwtReward = getStakingPoolProfit(userStakeID);

        //check if staking is finished
        if (usersActivePools[userStakeID].expirationDate <= block.timestamp) {
            //reset this staking pool
            usersActivePools[userStakeID].gwtBalance = 0;
            //free slot for new staking
            _ISfreeStakinSlot[msg.sender][usersActivePools[userStakeID].stakingNum] = 0;
            //decrease totalStaked
            totalStaked -= usersActivePools[userStakeID].gwtBalance;
            
        } 
        
        //update last claim
        usersActivePools[userStakeID].lastWithdraw = block.timestamp;

        //deposit reward
        _mint(msg.sender,gwtReward);
        

        emit claimedGWT(msg.sender, gwtReward, userStakeID);

    }

    /**
     * @dev Returns user pool slots
     * If slot is 0 then no active staking at this slot, else number is staking ID
     * @param _address User address
     */
    function getUserPoolSlots(address _address) public view returns(uint[7] memory) {
        return(_ISfreeStakinSlot[_address]);
    }

    /**
     * @dev Show information regarding staking by ID
     * Staking should exist in mapping
     * Returns:
     * gwtBalance - amount of staked GWT
     * expirationDate - timestamp when staking expires
     * dailyProfit - profit accrued daily for this staking
     * getStakingPoolProfit - current profit that can be claimed from this staking
     * lastWithdraw - timestamp when last claim occured
     * @param userStakeID Searched stake ID
     */
    function getUserPoolData(uint userStakeID) public view returns(uint, uint, uint, uint, uint) {
        require(usersActivePools[userStakeID].gwtBalance != 0, 'Not found');        
        return(usersActivePools[userStakeID].gwtBalance, usersActivePools[userStakeID].expirationDate, usersActivePools[userStakeID].dailyProfit, getStakingPoolProfit(userStakeID), usersActivePools[userStakeID].lastWithdraw);
    }

    /**
     * @dev Calculate pool profit that can be claimed.
     * Amount fo seconds passed from last claim * profit per second
     * If staking is expired then return profit + staked amount
     * If staking not expired then retun profit
     */
    function getStakingPoolProfit(uint userStakeID) internal view returns (uint) {
        //check if staking is finished
        uint secondsPassed = 0;
        uint gwtReward = 0;
        if (usersActivePools[userStakeID].expirationDate > block.timestamp) {
            //staking is not expired
            secondsPassed = block.timestamp - usersActivePools[userStakeID].lastWithdraw;
            //get reward amount for second, day=86400 seconds
            gwtReward = usersActivePools[userStakeID].gwtBalance * secondsPassed / (86400*10000) * (usersActivePools[userStakeID].dailyProfit) ;
            
            
        } else {
            //staking expired, get profit for time till expiration + staking amount
            secondsPassed = usersActivePools[userStakeID].expirationDate - usersActivePools[userStakeID].lastWithdraw;
            //get reward amount for period, day=86400 seconds
            gwtReward = usersActivePools[userStakeID].gwtBalance *secondsPassed / (86400*10000) * usersActivePools[userStakeID].dailyProfit;
            
            //add staking pool locked GWT
            gwtReward = gwtReward + usersActivePools[userStakeID].gwtBalance;
            

        }
        return(gwtReward);

    }

    /**
     * @dev Fee is distributed between dPNM contract and feeCollector
     */
    function payFeeForGWTtrans() private {
        //transfer fee to collector and dpnm liquidity
        busd.safeTransferFrom(msg.sender, feeCollector, gwtTransFeeCollector);
        busd.safeTransferFrom(msg.sender, dPNMcontract, gwtTransFeeLiquidity);

    }

    /**
     * @dev Trigger selector for staking enabled/disabled.
     * Do not allow to stake.
     * Allow to claim
     */
    function changeStakingEnabled() external onlyOwner {
        stakingEnabled = !stakingEnabled;
    }

    /**
     * @dev change fee that goes to dPNM contract BUSD liquidity on GWT transfer
     * Should be in range 0-2 BUSD
     */
    function setgwtTransFeeLiquidity(uint amount) external onlyOwner {
        require(0<=amount&&amount<=2e18, 'Out of range');
        gwtTransFeeLiquidity = amount;
    }

    /**
     * @dev Allow to change daily profit for each staking pool.
     * Pool ID should be from 1-6
     * Profit should be in range 0.1-0.6% daily (10-60)
     */
    function setStakingDailyProfit(uint amount, uint stakingID) external onlyOwner {
        require(1<=stakingID&&stakingID<=6, 'Wrong ID');
        require(10<=amount&&amount<=60, 'Out of range');
        stakingPools[stakingID].dailyProfit = amount;
    }

    /**
     * @dev Adding new address to the list of contracts that is allowed to mint/burn GWT
     * @param allowedContract Allowed address
     */
    function addAllowedContract (address allowedContract) external onlyOwner {
        require(allowedContract!=address(0),'Non zero address');
        allowedContractsMap[allowedContract] = true;

    }

    /**
     * @dev Removing address from the list of contracts that is allowed to to mint/burn GWT
     * @param allowedContract Allowed address to remove permission
     */
    function removeAllowedContract (address allowedContract) external onlyOwner {
        require(allowedContract!=address(0),'Non zero address');
        allowedContractsMap[allowedContract] = false;
    }


    /**
     * @dev Check if checkedAddress is in allowed contracts list
     * @param checkedAddress Checked address
     */
    function returnAllowedContract(address checkedAddress) public view onlyOwner returns (bool) {
        return(allowedContractsMap[checkedAddress]);

    }

    /**
     * @dev Changing address of feeCollector
     */
    function changeFeeCollector(address newCollector) public onlyOwner {
        require(newCollector!=address(0),'Non zero address');
        feeCollector = newCollector;
    }

    /**
     * @dev Checks if address that made a call is on the map of allowed contracts
     */
    modifier onlyAllowed() { 
        require(allowedContractsMap[msg.sender], "403"); 
        _; 
    }



}