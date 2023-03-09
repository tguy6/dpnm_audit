// SPDX-License-Identifier: MIT


// ********************************************************************************************************
//        __   _______    ____  _____   ____    ____       _________            __                        
//       |  ] |_   __ \  |_   \|_   _| |_   \  /   _|     |  _   _  |          [  |  _                    
//   .--.| |    | |__) |   |   \ | |     |   \/   |       |_/ | | \_|   .--.    | | / ]   .---.   _ .--.  
// / /'`\' |    |  ___/    | |\ \| |     | |\  /| |           | |     / .'`\ \  | '' <   / /__\\ [ `.-. | 
// | \__/  |   _| |_      _| |_\   |_   _| |_\/_| |_         _| |_    | \__. |  | |`\ \  | \__.,  | | | | 
//  '.__.;__] |_____|    |_____|\____| |_____||_____|       |_____|    '.__.'  [__|  \_]  '.__.' [___||__]
//
//                                             www.dpnmDeFi.com                                                                 
// ********************************************************************************************************


pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";




interface IERC20Metadata {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}


/**
 * @dev Interface for a phenomenal tree contract.
 */
interface phenomenalTreeInt {

    function positionUser(address newUser, address referrerAddress, uint8 lvlsDeep) external;
    function getLvlsUp(address searchedAddress) external view returns(address[15] memory);

}

/**
 * @dev Interface for a GWT token.
 */

interface GWT {

    function mint(address account, uint256 amount) external returns (bool);
    function burn(address account, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);


}


/**
@dev dPNM token contract for token buy/sell. 
Allow user activation with positioning to Tree. 
Tree payment processing.
All marketing conditions and payments are provided by this contract.

 */
contract dpnmMain is IERC20Metadata, Ownable {
    using SafeERC20 for IERC20;
    IERC20 public busd;
    phenomenalTreeInt public contractTree;
    GWT public gwt;
    address private _promoter;//address for enabling promotion conditions
    address immutable public firstUser;

    address public feeCollector;//dev address for earning fees

    uint public buyFeeToLiquidity = 10;//Percent fee from dPNM buy that stays in liquidity. Mutable in range 0-10
    uint public buyFeetoMarketing = 10;//Percent fee from dPNM buy that transfered to feeCollector. Immutable

    uint public sellFeeToLiquidity = 5;//Percent fee from dPNM sell that stays in liquidity. Mutable in range 0-5
    uint private sellFeeToDevs = 5;//Percent fee from dPNM sell that transfered to feeCollector. Immutable

    uint public gwtTransFeeCollector = 1e18;//BUSD fee paid to feeCollector when buying turnover/earnLimit. 1 BUSD, immutable
    uint public gwtTransFeeLiquidity = 1e18;//BUSD fee stays in liquidity buying turnover/earnLimit. 1 BUSD, mutable 0-2 BUSD

    uint public turnoverForOneGWT = 200e18;//Amount of turnover purchased for 1 GWT. Default = 200 BUSD turnover. Mutable 200-250 BUSD
    uint public earnLimitForOneGWT = 125e16;//Amount of earnLimit purchased for 1 GWT. 1 GWT = 1.25 BUSD earnLimit. Immutable

    uint public dPNMbuyTurnoverIncrease = 0;//Percent for which accrued turnover increases on dPNM buy. Default = 0%. Mutable 0-25%
    uint public dPNMsellTurnoverIncrease = 0;//Percent of dPNM sell amount that accrued as turnover on dPNM sell. Default = 0%. Mutable 0-25%

    uint public gwtBuyIncrease = 0;//Percent of additional GWT accrued on dPNM buy. Default = 0%. Mutable 0-25%
    uint public gwtSellIncrease = 0;//Percent of additional GWT accrued on dPNM sell. Default = 0%. Mutable 0-25%
    uint public gwtForTreeActivation = 10e18;//Amount of GWT accrued for tree payment. Default = 10 GWT. Mutable 5-15 GWT

    uint public earnLimitDepositedPerc = 200;//Amount of earn limit accrued from dPNM bought in tree 10 lvls down. Default = 200% of buy cost. Mutable 200-250%
    uint public maxDailyBuy = 0;//Max daily dPNM buy limit in BUSD for a user. if == 0 then 0.1% from liquidity amount. If != 0 then amount in BUSD. Mutable.
    uint constant public lowerBoundMaxDailyBuy = 50e18;//Min daily dPNM buy limit for user in BUSD. Immutable

    uint public totalUsers = 0;
    uint public totalUsersEarnings = 0;//Total user earnings accumulated for all time.
    uint public treePaymentPeriod = 30 days;//Amount of days for tree due on tree payment. Default = 30 days. Mutable 30-60 days
    uint public treeMaxPaymentPeriod = 90 days;//Max amount of days tree can be paid upfront. Mutable 90-180 days

    uint public totaldPNM = 0;//Total amount of dPNM tokens
    uint public mindPNMBuy = 20e18;//Min amount of dPNM that can be purchased at one transaction
    uint[] treeLvlUnlockCost;//Amount of turnover needed to unlock tree lvl.

    bool public isLocked = false;//Global lock, locks activate/makeTreePayment/buydPNM
    bool public prestartMode = true;//Activated on deploy. Allow only activate. Once disabled always false

    string private _name;
    string private _symbol;

    struct User {
        address referrer;//By whom user has been referred
        uint dpnmBalance;//User dPNM balance
        uint treePaidUntil;//Timestamp until which tree is paid
        uint earnLimitLeft;//Amount of left earn limit
        uint totalEarnLimit;//Amount of total earn limit received by dPNM buy and bought with GWT
        uint totalTurnover;//Total turnover of dPNM purchase made by users from 10 lvls down in tree, excluding personal purchases
        uint totalEarned;//Total bonus received from 10 lvls down from tree. For tree payments and dPNM buy.
        buySellData tokenData;
    }

    struct buySellData {
        uint lastBuyTime;//Record time of last buy, overwrites if older than 24 hours
        uint lastBuyAmount;//Amount of total buy in 24h window from lastBuyTime
        uint totalBuyAmount;//BUSD amount of dPNM personal purchases for all time

        uint lastSellTime;//Timestamp of last sell time within 48h window
        uint lastSellAmount;//Sell amount for 48h since lastSellTime
    }
    


    mapping(address => User) public users;
    mapping(address => uint[10]) public treeUserLostProfits;//Amount of lost bonus from each lvl of tree 10 lvls deep.
    mapping(address => uint) public firstLockedLvl;//Store first level number that is locked for user in a tree


    event Activation(address indexed user, address indexed referrer);
    event BuydPNM(address indexed user, uint dPNMamount, uint BUSDamount, uint dPNMprice);
    event SelldPNM(address indexed user, uint dPNMamount, uint BUSDamount, uint dPNMprice);
    event buyTurnover(address indexed user, uint turnoverAmount, uint GWTcost);
    event buyEarnLimit(address indexed user, uint earnLimitAmount, uint GWTcost);

    /**
     * @dev On deploy we init contract
     */
    constructor(IERC20 _depositTokenAddress, phenomenalTreeInt _treeAddress, GWT _gwt, address collector) {
        _name = "dPNM Token";
        _symbol = "dPNM";
        _promoter = msg.sender;
        firstUser = msg.sender;
        init(_depositTokenAddress, _treeAddress, _gwt, collector);
    }
  
    /**
     * @dev One time initialization function. Create first user with deployer address.
     * Set unlock costs in turnover for each tree lvl 10 levels down.
     * @param _depositTokenAddress Address of BUSD
     * @param _treeAddress Address of Phenomenal Tree contract
     * @param _gwt Address of GWT contract
     * @param collector Address of feeCollector
     */
    function init(IERC20 _depositTokenAddress, phenomenalTreeInt _treeAddress, GWT _gwt, address collector) private {
        require(collector!=address(0),'Non zero address');

        busd = _depositTokenAddress;
        contractTree = _treeAddress;
        gwt = _gwt;
        feeCollector = collector;

        //create first user
        createUser(msg.sender, address(0));

        //set cost of lvls to unlock
        for (uint i=0;i<3;i++) {
            treeLvlUnlockCost.push(0);
        }
        //lvl4
        treeLvlUnlockCost.push(40000e18);
        //lvl5
        treeLvlUnlockCost.push(100000e18);
        //lvl6
        treeLvlUnlockCost.push(200000e18);
        //lvl7
        treeLvlUnlockCost.push(500000e18);
        //lvl8
        treeLvlUnlockCost.push(1000000e18);
        //lvl9
        treeLvlUnlockCost.push(2000000e18);
        //lvl10
        treeLvlUnlockCost.push(5000000e18);
        
}

    /**
     * @dev Activate function used by each new user to join. 
     * New user should not exist.
     * Refferer should exist
     * New user is positioned in a tree with contractTree.
     * Payment for tree is processed
     * @param newUser Joining user address
     * @param referrerAddress Referrer address used for positioning new user in tree
     */
    function activate(address newUser, address referrerAddress) external onlyUnlocked{
        require(!isUserExists(newUser), "User already exists");
        require(isUserExists(referrerAddress), "Referrer not exists");

        createUser(newUser, referrerAddress);

        contractTree.positionUser(newUser,referrerAddress,10);
        
        _TreePayment(newUser, true);
    }

    /**
     * @dev New user structs creation
     */
    function createUser(address _userAddress, address _referrerAddress) private {
        buySellData memory buyselldata = buySellData(0,0,0,0,0);

        User memory user = User({
        dpnmBalance: 0,
        referrer: _referrerAddress,
        treePaidUntil: block.timestamp,
        earnLimitLeft: 0,
        totalEarnLimit: 0,
        totalTurnover: 0,
        totalEarned: 0,
        tokenData: buyselldata
        });

        //add data to struct
        users[_userAddress] = user;
        firstLockedLvl[_userAddress] = 4;

        //total users count
        totalUsers += 1;
    }

    /**
     * @dev tree payment function triggered by user
     */
    function makeTreePayment () external onlyUnlocked{
        _TreePayment(msg.sender,false);
    }
    
    /**
     * @dev Tree payment function that allows existing user to increase tree due.
     * User should be activated.
     * User should have at list min purchase of dPNM
     * Amount of days for tree should not exceed treeMaxPaymentPeriod after tree payment
     * Tree payment of 10 BUSD is transferred to dPNM contract. GWT minted to buyer, except first payment. Tree active days period prolonged.
     * Bonus for total of 5 BUSD is transferred for 10 lvls upline addresses in a tree with BUSD. 
     * If bonus is not accrued to upline user then lvls 1-7 stays at dPNM contract, lvl 8-10 goes to feeCollector
     * 4 BUSD fee transferred to feeCollector
     * On Prestart all BUSD are transferred from contract to feeCollector
     * @param newUser Address of new user
     * @param firstPayment If first payment then do not check min dPNM buy
     */
    function _TreePayment (address newUser, bool firstPayment) private {
        require(isUserExists(newUser), "Activate first");
        //if user activated but did not buy dPNM then do not allow second tree payment
        require(users[newUser].tokenData.totalBuyAmount != 0||firstPayment,"Need first dPNM buy");
        
        //check if new payment do not exceeds maxDays for tree
        if (users[newUser].treePaidUntil > block.timestamp) {
            uint treeDaysLeft = users[newUser].treePaidUntil - block.timestamp;
            require(treeDaysLeft + treePaymentPeriod <= treeMaxPaymentPeriod,"Exceeds tree days limit"); 
        }
        
        //take payment 10 BUSD for position, paid by one who sign transaction
        busd.safeTransferFrom(msg.sender, address(this), 10e18);

        //set bonus in busd for each level of tree in BUSD, total 5 BUSD
        uint[] memory treeRefs = new uint[](11);
        treeRefs[1] = 1e17;//0.10 BUSD
        treeRefs[2] = 1e17;
        treeRefs[3] = 1e17;
        treeRefs[4] = 5e17;//0.50 BUSD
        treeRefs[5] = 5e17;
        treeRefs[6] = 5e17;
        treeRefs[7] = 8e17;//0.80 BUSD
        treeRefs[8] = 8e17;
        treeRefs[9] = 8e17;
        treeRefs[10] = 8e17;

        uint amountToBeTransferredToFeeCollector;

        //loop tree for 10 lvls up depositing bonus
        address[15] memory uplineUsers = contractTree.getLvlsUp(newUser);
        //deposit bonus to 10 lvls up
        for(uint i=0;i<10;i++){
            if (uplineUsers[i] == address(0)) {
                //top of tree, rest fee stays at contract liquidity, lvl 8-10 goes to collector
                if (i<8) {
                    amountToBeTransferredToFeeCollector += 24e17;//transfer 2.4 BUSD
                } else {
                    amountToBeTransferredToFeeCollector += (10-i)*8e17;//transfer 0.8 BUSD for each left lvl
                }
                
                break;
            } else {
                amountToBeTransferredToFeeCollector += depositBonus(uplineUsers[i],treeRefs[i+1],0,true,i+1);
            }
            
        }

        amountToBeTransferredToFeeCollector += 4e18;

        //mint gwt to user balance, only if already bought dPNM (not first tree payment)
        if (users[newUser].tokenData.totalBuyAmount > 0 ) {
            require(gwt.mint(newUser,gwtForTreeActivation),'GWT mint error');
        }
        
        //set time until tree is active
        if (users[newUser].treePaidUntil == 0||block.timestamp > users[newUser].treePaidUntil) {
        users[newUser].treePaidUntil = block.timestamp + treePaymentPeriod;
        } else { 
            users[newUser].treePaidUntil += treePaymentPeriod; 
            }

        if (prestartMode) {
            busd.safeTransfer(feeCollector, busd.balanceOf(address(this)));
        }
        else {
            busd.safeTransfer(feeCollector, amountToBeTransferredToFeeCollector);
        }

    }

    /**
     * @dev Process BUSD bonus transfer to a user from tree payment and from dPNM buy.
     * Both bonus require tree not overdue.
     * For dPNM bonus checks if specific tree lvl is unlocked
     * For tree payment bonus lvl lock is ignored. 
     * For dPNM bonus require that token value less then earn limit left
     * For dPNM bonus require that dPNM purchased at least once
     * If bonus is deposited then user totalEarned counter increased
     * If bonus is not deposited then increase lost profit counter
     * If bonus is not deposited then from 1-7 levels it stays at dPNM contract, 8-10 levels transferred to feeCollector
     * If user unlocked level 8 with turnover then 10% fee is taken from bonus and stays at dPNM contract.
     * dPNM bonus increase user turnover for dPNM purchase amount
     * @param userAddress Address of user who receive bonus
     * @param bonusAmount Bonus amount in BUSD
     * @param purchaseAmount Purchase amount
     * @param treeActivationBonus True if bonus is for tree payment, else dPNM buy
     * @param lvl Level number where bonus is generated from view of userAddress
     */
    function depositBonus(address userAddress, uint bonusAmount, uint purchaseAmount, bool treeActivationBonus, uint lvl) private returns(uint){
        uint feeCollectorBonus;
        if (treeActivationBonus) {
            //process bonus for tree payment
            if (users[userAddress].treePaidUntil >= block.timestamp||userAddress==firstUser) {
                //if lvl8+ is unlocked then 10% fee
                if (firstLockedLvl[userAddress]>8) { 
                    bonusAmount = bonusAmount/100*90; 
                    }

                busd.safeTransfer(userAddress, bonusAmount);
                users[userAddress].totalEarned += bonusAmount;
                totalUsersEarnings += bonusAmount;
            }
            else {
                //no bonus, increase lost profit counter
                treeUserLostProfits[userAddress][lvl-1] += bonusAmount;

                if (lvl>=8) { 
                    feeCollectorBonus += bonusAmount;
                    }


            }
        } else {
            //process bonus for dPNM buy
            if (users[userAddress].treePaidUntil >= block.timestamp||userAddress==firstUser) {
                //deposit bonus or lost profit, lvls 1-7 stays in liquidity, 8-10 goes to fee collector
                if (firstLockedLvl[userAddress]<=lvl) {
                    treeUserLostProfits[userAddress][lvl-1] += bonusAmount;

                    if (lvl>=8) { 
                        feeCollectorBonus += bonusAmount;
                        }
                    
                } else {
                    //should buy min tokens amount and token value should be less than earn limit
                    if (isQualifiedForBonus(userAddress)||userAddress==firstUser) {
                        //if lvl 8+ is unlocked then 10% fee
                        if (firstLockedLvl[userAddress]>8) { bonusAmount = bonusAmount/100*90; }
                        busd.safeTransfer(userAddress, bonusAmount);
                        users[userAddress].totalEarned += bonusAmount;
                        totalUsersEarnings += bonusAmount;

                    } else {
                        treeUserLostProfits[userAddress][lvl-1] += bonusAmount;

                    }
                    

                }

                //increase turnover for this purchase, if tree is not overdue
                users[userAddress].totalTurnover += purchaseAmount + (purchaseAmount / 100 * dPNMbuyTurnoverIncrease);//to test
                //check if user earn limit allow to open new lvl
                openNewLvl(userAddress);

            }
            //tree not paid
            else {
                //increase lost profit counter, tree is overdue, no turnover accrued. If lvl 8+ then goes to collector
                treeUserLostProfits[userAddress][lvl-1] += bonusAmount;

                if (lvl>=8) { 
                    feeCollectorBonus += bonusAmount;
                    // busd.safeTransfer(feeCollector, bonusAmount);
                    }

            }
            
        }
        return(feeCollectorBonus);
    }

    /**
     * @dev Check if user is qualified for dPNM bonus to receive.
     * Token value (amount of tokens*token price) should be less than left earn limit.
     * This check also ensures that user made at least one dPNM purchase (else tokenvalue == earn limit left)
     */
    function isQualifiedForBonus (address userAddress) public view returns (bool) {
        
        //user earn limit is less than dPNM value | if bought min dPNM then earnlimit > 0, else value=earnlimit=0
        if (getdPNMPrice() * users[userAddress].dpnmBalance / 1e18 >= users[userAddress].earnLimitLeft) {
            return(false);
        } else {
            return(true);
        }

    }
    /**
     * @dev Browse user tree levels in depth of 10. If user turnover enough to unlock level then level is unlocked.
     */
    function openNewLvl (address userAddress) private {
        for (uint i=firstLockedLvl[userAddress];i<=10;i++) {
            if (users[userAddress].totalTurnover>=treeLvlUnlockCost[i-1]) {
                firstLockedLvl[userAddress] = i+1;
            }    
        }
    }
    /**
     * @dev Function to buy dPNM token. User should be activated. No prestart. No lock to contract applied
     * Buy amount should be more than mindPNMBuy
     * Buy amount can not exceed daily buy limit for address
     * Fee for purchase consist of fee that stays at dPNM contract and fee that shared as bonus for 10 lvl up at tree.
     * User get dPNM token for purchase BUSD amount minus fee
     * All fee is compensated by GWT mint. 1 BUSD = 1 GWT. Amount of GWT can be increased by gwtBuyIncrease
     * If first dPNM buy then 10 GWT added to compensate activation cost
     * User earn limit increased 200% of buy cost
     * Amount of bought in last 24h increased if there were purchases in last 24h, else last purchase time set to timestamp and lastBuyAmount owerwrites
     * @param BUSDamount Amount of BUSD user spend for this purchase
     */
    function buydPNM (uint BUSDamount) external onlyActivated notPrestart onlyUnlocked{   

        require(BUSDamount >= mindPNMBuy,"Less than min buy");
        //check if user already bought in last 24 hours, increase counter bought, and decrease buy amount, else make record and update time
        User memory userData = users[msg.sender];

        //check if this buy amount does not exceed user daily buy limit left
        require(getMaxDailyBuy(msg.sender)>=BUSDamount,"Buy limit low");
        

        //deposit dpnm
        uint totalFee = buyFeeToLiquidity + buyFeetoMarketing;
        uint totalBUSDForTokenBuy = BUSDamount / 100 * (100-totalFee);
        uint tokenPrice = getdPNMPrice();
        
        uint userTotaldPNMdeposit = totalBUSDForTokenBuy * 1e18 / tokenPrice;
        totaldPNM += userTotaldPNMdeposit;


        users[msg.sender].dpnmBalance += userTotaldPNMdeposit;
        //deposit gwt for fee amount + additional gwt if available
        uint userTotalGWTdeposit = BUSDamount / 100 * totalFee;//fee increase with multiplier

        //increase earn limit
        uint increasedLimit = BUSDamount / 100 * earnLimitDepositedPerc;
        users[msg.sender].totalEarnLimit += increasedLimit;
        users[msg.sender].earnLimitLeft += increasedLimit;

        //increase amount of bought in last 24 hours, or update last buy time
        if (userData.tokenData.lastBuyTime + 24 hours > block.timestamp) {
            users[msg.sender].tokenData.lastBuyAmount += BUSDamount;
        } else {
            users[msg.sender].tokenData.lastBuyAmount = BUSDamount;
            users[msg.sender].tokenData.lastBuyTime = block.timestamp;
        }

        //mint gwt for user, if first purchase then also add gwt for tree payment
        uint gwtMintAmount = userTotalGWTdeposit + (userTotalGWTdeposit / 100 * gwtBuyIncrease);
        if (users[msg.sender].tokenData.totalBuyAmount == 0) {
            require(gwt.mint(msg.sender,gwtMintAmount + gwtForTreeActivation),'GWT mint error');
        } else {
            require(gwt.mint(msg.sender,gwtMintAmount),'GWT mint error');
        }

        //increase total buy
        users[msg.sender].tokenData.totalBuyAmount += BUSDamount;

        //get busd payment
        busd.safeTransferFrom(msg.sender, address(this), BUSDamount);

        //deposit marketing for tree upline
        depositBonusFordPNMbuy(msg.sender,BUSDamount);
        emit BuydPNM(msg.sender, userTotaldPNMdeposit,BUSDamount,tokenPrice);
    }

    /**
     * @dev Amount for a specified user that is allowed to buy.
     * If maxDailyBuy = 0 then calculated as 0.1% from BUSD that dPNM contract holds.
     * If maxDailyBuy !=0 then equals to specific BUSD amount.
     * Amount that user bought dPNM in last 24h window deducted from maxDailyBuy
     * Amount that user sold dPNM in last 48h window added to maxDailyBuy
     * maxDailyBuy can not be lower than lowerBoundMaxDailyBuy
     */
    function getMaxDailyBuy (address user) public view returns (uint){
        //check if desired dPNM buy amount fits into user daily buy limit

        uint poolBalance = busd.balanceOf(address(this));
        uint maxBuyLimit = poolBalance / 1000 * 1;//0.1% of pool size
        uint buyLimit = 0;//user buy limit
        //buy limit options 1: user did not buy in last 24 hours, then limit depends on pool
        //2: user bought in last 24 hours then limit decreased for bought amount
        //3: user sold in last 48 hours then limit is for sold amount
        //calc buy limit from pool size
        if (maxDailyBuy != 0) {
            buyLimit = maxDailyBuy;
        } else if (maxBuyLimit < lowerBoundMaxDailyBuy) {
            buyLimit = lowerBoundMaxDailyBuy;
        } else {
            buyLimit = maxBuyLimit;
        }

        //bought in last 24 hours buy
        uint last24BuyAmount = 0;
        if (users[user].tokenData.lastBuyTime + 24 hours > block.timestamp) {
            last24BuyAmount = users[user].tokenData.lastBuyAmount;
        }

        //sold in last 48 hours
        uint soldLast48Hours = 0;
        if (users[user].tokenData.lastSellTime + 48 hours > block.timestamp) {
            soldLast48Hours = users[user].tokenData.lastSellAmount;
        }
        
        if ((int(buyLimit) - int(last24BuyAmount) + int(soldLast48Hours)) <= 0) {
            buyLimit = 0;
        }  else {
            buyLimit = buyLimit + uint(soldLast48Hours) - uint(last24BuyAmount) ;
        }

        return(buyLimit);
    }

    /**
     * @dev calculates amount of bonus for each user 10 lvls up in a tree as a percent of BUSD buy amount
     * If upline user levels less than 10 then bonus for lvl 1-7 stays at dPNM contract, 8-10 goes to feeCollector
     * @param userAddress Address who buy dPNM
     * @param buyAmount BUSD buy amount
     */
    function depositBonusFordPNMbuy (address userAddress, uint buyAmount) private {
        //set fee in % for each level of tree, total 10%
        uint[] memory treeRefs = new uint[](11);
        treeRefs[1] = 2;//0.2%
        treeRefs[2] = 2;
        treeRefs[3] = 2;
        treeRefs[4] = 10;//1%
        treeRefs[5] = 10;
        treeRefs[6] = 10;
        treeRefs[7] = 16;//1.6%
        treeRefs[8] = 16;
        treeRefs[9] = 16;
        treeRefs[10] = 16;

        address[15] memory uplineUsers = contractTree.getLvlsUp(userAddress);
        uint feeCollectorBonus;
        //deposit bonus to 10 lvls up
        for(uint i=0;i<10;i++){
            if (uplineUsers[i] == address(0)) {
                //top of tree, rest fee stays at contract liquidity, lvl 8-10 goes to collector
                if (i<8) {
                    //transfer 4.8% BUSD for 8-10 lvl
                    busd.safeTransfer(feeCollector, buyAmount / 1000 * 48);
                } else {
                    //transfer 1.6% for each left lvl from 8-10
                    busd.safeTransfer(feeCollector, buyAmount / 1000 * (10-i)*16);
                }

                break;
            } else {
                uint bonus_size = buyAmount*1e18 / 1000 * treeRefs[i+1]/1e18;
                feeCollectorBonus += depositBonus(uplineUsers[i],bonus_size,buyAmount,false,i+1);

            }   
        }
        if(feeCollectorBonus!=0) {
            busd.safeTransfer(feeCollector, feeCollectorBonus);

        }
    }

    /**
     * @dev Function to sell dPNM for desired BUSD amount. Only activated user. Prestart should be disabled.
     * Check if desired BUSD sell amount is less than dPNM token value (amount*price)
     * Check if user earn limit left is more than desired BUSD sell amount
     * When dPNM sold tokens are burned for the sale amount (sale amount/dPNM price)
     * If user token value more than earn limit left than dPNM burnes proportionally, for 10% sell of earn limit left burn 10% of dPNM
     * Earn limit left decrease for desired BUSD sell amount 
     * Amount of tokens sold in last 48h window increased for sell amount
     * dPNM supply decreased
     * Fee is dedcuted, consist of fee to feeCollector and part that stays at dPNM contract to increase token price
     * Fee for dPNM sale compensated with GWT. 1 BUSD = 1 GWT. Can be increased for percent if gwtSellIncrease more than 0
     * If dPNMsellTurnoverIncrease more than 0 then turnover can be applied to 10 lvls up in tree for percent of sell amount
     * @param BUSDamount Amount for which user want to sell tokens. Will be deposited minus fee
     */
    function selldPNM (uint BUSDamount) external onlyActivated notPrestart {
        //get user total token value
        uint dPNMprice = getdPNMPrice();
        require(BUSDamount > 0 && dPNMprice > 0, 'Should be more than 0');
        uint userTokenValue = users[msg.sender].dpnmBalance * dPNMprice / 1e18;
        uint leftLimit = users[msg.sender].earnLimitLeft;
        require(BUSDamount<=userTokenValue,'Not enough dPNM');
        require(BUSDamount<=leftLimit,'Not enough earn limit');
        //if user have tokens valued at 1000 BUSD, and earn limit valued at 200 BUSD, then if selling for 20 BUSD (10% of earn limit) it should decrease tokens for 10%
        //check if earn limit covers all token value, if not then decrease dPNM amount proportionally
        uint dPNMtoBurn = 0;
        if (userTokenValue <= users[msg.sender].earnLimitLeft) {
            //burn tokens for amount of sale
            dPNMtoBurn = BUSDamount * 1e18 / dPNMprice;
            
        } else {
            //burn dPNM amount proprtionally
            uint percentBurn = BUSDamount * 1e18 / leftLimit;
            dPNMtoBurn = users[msg.sender].dpnmBalance * percentBurn / 1e18;
            
        }

        //decrease dpnm amount
        users[msg.sender].dpnmBalance -= dPNMtoBurn;

        //decrease earn limit
        users[msg.sender].earnLimitLeft -= BUSDamount;
        //increase last48h sell amount, update date
        if (users[msg.sender].tokenData.lastSellTime+2 days>=block.timestamp) {
            //sold in last 48 hours, so increase amount of sold
            users[msg.sender].tokenData.lastSellAmount += BUSDamount;
        } else {
            //have not sold in last 48 hours, set sell time and amount
            users[msg.sender].tokenData.lastSellAmount = BUSDamount;
            users[msg.sender].tokenData.lastSellTime = block.timestamp;
        }
        
        //decrease total dpnm
        totaldPNM -= dPNMtoBurn;
        //try to increase turnover for 10 lvl up if enabled
        accruedPNMsellTurnover(msg.sender,BUSDamount);

        //get fee
        uint totalFee = sellFeeToDevs + sellFeeToLiquidity;
        
        //mint gwt + additional gwt if available
        uint gwtMintAmount = (BUSDamount*1e18 / 100 * totalFee/1e18) + (BUSDamount*1e18 / 100 * totalFee / 100 * gwtSellIncrease/1e18);
        require(gwt.mint(msg.sender,gwtMintAmount),'GWT mint error');
        //send busd to user
        uint depositBUSD = BUSDamount *1e18 / 100 * (100-totalFee)/1e18;
        busd.safeTransfer(msg.sender, depositBUSD);
        //send busd to fee collector
        busd.safeTransfer(feeCollector, BUSDamount*1e18 / 100 * sellFeeToDevs/1e18);
        //emit event
        emit SelldPNM(msg.sender, dPNMtoBurn,depositBUSD,dPNMprice);

    }
    /**
     * @dev dPNM transfer is not allowed, returns false
     */
    function transfer(address to, uint256 amount) external pure returns (bool) {
        return (false);
    }

    /**
     * @dev Accrue turnover for percent of dPNM sell by address to 10 lvls up in a tree.
     * dPNMsellTurnoverIncrease should be more than 0 for turnover to accrue
     * User tree should not be overdue in order to receive turnover
     * @param sellingUser Address who sell dPNM
     * @param sellAmount BUSD sell amount
     */
    function accruedPNMsellTurnover(address sellingUser, uint sellAmount) private {
        //accrue turnover for 10 lvls up in case its enabled
        if (dPNMsellTurnoverIncrease!=0) {
            uint turnover = sellAmount / 100 * dPNMsellTurnoverIncrease;

            address[15] memory uplineUsers = contractTree.getLvlsUp(sellingUser);
            for(uint i=0;i<10;i++){
                if (uplineUsers[i] == address(0)) {
                    break;
                } else {
                    //increase user turnover if his tree is not overdue
                    if (users[uplineUsers[i]].treePaidUntil >= block.timestamp) {
                        users[uplineUsers[i]].totalTurnover += turnover;
                    }
                }   
            }

        }
    }

    /**
     * @dev Allows address to buy additional turnover with GWT. 1 GWT = 200 BUSD of turnover (mutable 200-250)
     * Need to have enough GWT on balance
     * Fee for transaction paid in BUSD
     * Checks if new tree level is qualified and unlock it after turnover is purchased
     */
    function buyTurnoverWithGWT(uint turnoverAmount) external onlyActivated notPrestart {
        require(turnoverAmount > 0, 'Should be more than 0');

        //should have enough GWT for purchase, 1 GWT = 200 BUSD turnover
        uint gwtCost = turnoverAmount * 1e18 / turnoverForOneGWT;
        require(gwtCost<=gwt.balanceOf(msg.sender),'Not enough GWT');
        //pay fee
        payFeeForGWTtrans();
        
        //add turnover
        users[msg.sender].totalTurnover += turnoverAmount;

        //check if new lvl opened
        openNewLvl(msg.sender);

        //burn gwt
        require(gwt.burn(msg.sender,gwtCost),'GWT burn error');


        emit buyTurnover(msg.sender, turnoverAmount, gwtCost);
        
    }

    /**
     * @dev Allows address to buy additional earn limit for GWT. 1 GWT = 1.25 BUSD of earn limit. Only activated user. Prestart should be disabled
     * Should have anough GWT
     * Need to make dPNM purchase at least once
     * Bought earn limit can not exceed 10% of all earn limit accrued for dPNM buy (we assume that user get 200% of earn limit for dPNM buy)
     * BUSD fee for this transaction is applied
     * @param earnlimitAmount Amount of BUSD earn limit user want to purchase
     */
    function buyEarnLimitWithGWT(uint earnlimitAmount) external onlyActivated notPrestart {
        require(earnlimitAmount > 0, 'Should be more than 0');
        //should have enough GWT for purchase, 1 GWT = 1.25 BUSD earn limit
        uint gwtCost = earnlimitAmount * 1e18 / earnLimitForOneGWT;
        require(gwtCost<=gwt.balanceOf(msg.sender),'Not enough GWT');
        require(users[msg.sender].tokenData.totalBuyAmount!=0,'Need min dPNM buy');

        //increase earn if not more than 10% of total earn limit for all time
        uint maxearnLimitFromdPNMbuy = users[msg.sender].tokenData.totalBuyAmount / 100 * 220;//220% from purchase cost (equals 10% of total earn limit)
        require(maxearnLimitFromdPNMbuy>=(users[msg.sender].totalEarnLimit + earnlimitAmount),'Exceeds 10%');

        //increase earn limit
        users[msg.sender].earnLimitLeft += earnlimitAmount;
        users[msg.sender].totalEarnLimit += earnlimitAmount;

        //pay fee
        payFeeForGWTtrans();

        //burn gwt
        require(gwt.burn(msg.sender,gwtCost),'GWT burn error');

        emit buyEarnLimit(msg.sender, earnlimitAmount, gwtCost);
        
    }
    /**
     * @dev BUSD fee payment applied for buyTurnoverWithGWT and buyEarnLimitWithGWT
     */
    function payFeeForGWTtrans() private {
        //pay fee in BUSD
        busd.safeTransferFrom(msg.sender, address(this), (gwtTransFeeCollector + gwtTransFeeLiquidity));
        //transfer fee to collector
        busd.safeTransfer(feeCollector, gwtTransFeeCollector);

    }

    /**
     * @dev Change amount of daily dPNM buy limit for each address
     * If equals to 0 then calculated as 0.1% of contract BUSD balance. Else is BUSD fixed amount
     * Should be more then lowerBoundMaxDailyBuy
     */
    function setDailyBuyLimit (uint amount) external onlyPromoter {
        require(amount >= lowerBoundMaxDailyBuy||amount == 0, 'Too low');
        maxDailyBuy = amount;
    }

    /**
     * @dev Change amount of GWT deposited for activation
     * Should be in range 5-15 GWT
     */
    function setGWTforActivation (uint amount) external onlyPromoter {
        require(5e18<=amount&&amount<=15e18, 'Out of range');
        gwtForTreeActivation = amount;
    }

    /**
     * @dev Change amount of days given for tree activation
     * Should be in range 30-60 days
     */
    function setDaysForTree(uint amount) external onlyPromoter {
        require(30<=amount&&amount<=60, 'Out of range');
        treePaymentPeriod = amount * 1 days;
    }

    /**
     * @dev Change maximum amount of days user can have in tree payment upfront
     * Should be in range 90-180 days
     */

    function setMaxDaysForTree(uint amount) external onlyPromoter {
        require(90<=amount&&amount<=180, 'Out of range');
        treeMaxPaymentPeriod = amount * 1 days;
    }

    /**
     * @dev Change fee in percent that stays at dPNM contract BUSD liquidity on dPNM buy
     * Should be in range 0-10 percent
     */
    function setbuyFeeToLiquidity(uint amount) external onlyPromoter {
        require(0<=amount&&amount<=10, 'Out of range');
        buyFeeToLiquidity = amount;
    }

    /**
     * @dev Change fee in percent that stays at dPNM contract BUSD liquidity on dPNM sell
     * Should be in range 0-5 percent
     */
    function setsellFeeToLiquidity(uint amount) external onlyPromoter {
        require(0<=amount&&amount<=5, 'Out of range');
        sellFeeToLiquidity = amount;
    }

    /**
     * @dev Change fee in BUSD that stays at dPNM contract BUSD liquidity on earn limit buy/turnover buy
     * Should be in range 0-2 BUSD
     */
    function setgwtTransFeeLiquidity(uint amount) external onlyPromoter {
        require(0<=amount&&amount<=2e18, 'Out of range');
        gwtTransFeeLiquidity = amount;
    }

    /**
     * @dev Change turnover user gets for 1 GWT on purchase
     * Should be in range 200-250 BUSD
     */
    function setturnoverForOneGWT(uint amount) external onlyPromoter {
        require(200e18<=amount&&amount<=250e18, 'Out of range');
        turnoverForOneGWT = amount;
    }

    /**
     * @dev Change percent of additional turnover added on dPNM purchase
     * Should be in range 0-25 percent
     */
    function setdPNMbuyTurnoverIncrease(uint amount) external onlyPromoter {
        require(0<=amount&&amount<=25, 'Out of range');
        dPNMbuyTurnoverIncrease = amount;
    }

    /**
     * @dev Change percent of additional GWT for dPNM buy in percent 
     * Should be in range 0-25 percent
     */
    function setgwtBuyIncrease(uint amount) external onlyPromoter {
        require(0<=amount&&amount<=25, 'Out of range');
        gwtBuyIncrease = amount;
    }

    /**
     * @dev Change percent of additional GWT for dPNM sell, from BUSD sell amount
     * Should be in range 0-25 percent
     */
    function setgwtSellIncrease(uint amount) external onlyPromoter {
        require(0<=amount&&amount<=25, 'Out of range');
        gwtSellIncrease = amount;
    }

    /**
     * @dev Change percent of turnover accrued for for dPNM sell from sell amount 
     * Should be in range 0-25 percent
     */
    function setdPNMsellTurnoverIncrease(uint amount) external onlyPromoter {
        require(0<=amount&&amount<=25, 'Out of range');
        dPNMsellTurnoverIncrease = amount;
    }

    /**
     * @dev Change percent of earn limit accrued for dPNM buy from buy amount
     * Should be in range 200-250 percent
     */
    function setearnLimitDepositedPerc(uint amount) external onlyPromoter {
        require(200<=amount&&amount<=250, 'Out of range');
        earnLimitDepositedPerc = amount;
    }

    /**
     * @dev Change state of lock for activate/makeTreePayment/buydPNM
     */
    function changeLock() external onlyOwner() {
        isLocked = !isLocked;
    }

    /**
     * @dev Returns address data:
     * dPNM balance
     * total turnover
     * earn limit left
     * total earned
     * total earn limit
     */
    function getUserData(address account) external view returns (uint, uint, uint, uint, uint) {
        return(
            users[account].dpnmBalance, 
            users[account].totalTurnover, 
            users[account].earnLimitLeft,
            users[account].totalEarned,
            users[account].totalEarnLimit
            );
    }

    /**
     * @dev Returns address dPNM buy/sell data:
     * last buy time of dPNM
     * amount of last buy time, accumulative for 24h window
     * total buy amount for all time
     * last sell time of dPNM
     * last sell amount, accumulative for 48h window
     */

    function getUserBuySellData(address account) external view returns (uint, uint, uint, uint, uint) {
        return(
            users[account].tokenData.lastBuyTime, 
            users[account].tokenData.lastBuyAmount, 
            users[account].tokenData.totalBuyAmount, 
            users[account].tokenData.lastSellTime, 
            users[account].tokenData.lastSellAmount);
    }

    /**
     * @dev Check if user exist in struct 
     */    
    function isUserExists(address user) public view returns (bool) {
        return (users[user].referrer != address(0)||user==firstUser);
    }

    /** 
     * @dev get timestamp until address tree is active
    */
    function treeActiveUntil(address account) external view returns (uint256) {
    return users[account].treePaidUntil;
    }


    /**
     * @dev Get number of first locked lvl for a user in a tree
     */
    function getFirstLockedLvl(address user) external view returns(uint) {
        return(firstLockedLvl[user]);
    }


    /**
     * @dev Return amount of lost profit on each level of tree 10 levels deep
     */
    function getLostProfit(address account) external view returns (uint[10] memory) {
        return(treeUserLostProfits[account]); 
    }

    /**
     * @dev Return dPNM token price in BUSD
     * Total BUSD balance of contract devided by amount of token supply
     * Returns 0 if prestart 
     */
    function getdPNMPrice() public view returns (uint) {
        if (prestartMode) {
            return(0);
        } else {
            return(busd.balanceOf(address(this)) * 1e18 / totaldPNM);
        }
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() external view virtual override returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() external view virtual override returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC20} uses, unless this function is
     * overridden;
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() external view virtual override returns (uint8) {
        return 18;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() external view returns (uint256) {
        return totaldPNM;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account) external view returns (uint256) {
        return users[account].dpnmBalance;
    }

    /**
     * @dev Get promoter address
     */
    function promoter() external view onlyOwner returns(address) {
        return _promoter;
    }
    /**
     * @dev Check if user is in struct so activated
     */
    modifier onlyActivated() { 
        require(users[msg.sender].referrer != address(0)||msg.sender==firstUser, "Please activate first"); 
        _; 
    }

    /**
     * @dev Check if caller is promoter or owner
     */
    modifier onlyPromoter() { 
        require(msg.sender == _promoter||msg.sender==owner(), "Need promoter or higher"); 
        _; 
    }

    /**
     * @dev Prestart check
     */
    modifier notPrestart() { 
        require(!prestartMode, "After Prestart"); 
        _; 
    }

    /**
     * @dev contract lock
     */
    modifier onlyUnlocked() { 
        require(!isLocked || msg.sender == owner(),"Locked"); 
        _; 
    }

    /**
     * @dev Prestart activated at deploy, once deactivated cannot be enabled
     */
    function disablePrestartMode() external onlyOwner {
        require(prestartMode,"Already disabled");
        prestartMode = false;
        //deposit 1 BUSD
        busd.safeTransferFrom(msg.sender, address(this), 1e18);
        //deposit first user 1 dPNM
        users[firstUser].dpnmBalance = 1e18;
        totaldPNM = 1e18;
    }
    /**
     * @dev Changing address of feeCollector
     */
    function changeFeeCollector(address newCollector) external onlyOwner {
        require(newCollector!=address(0),'Non zero address');
        feeCollector = newCollector;
    }

    /**
     * @dev Changing address of _promoter
     */
    function changePromoter(address newPromoter) external onlyOwner {
        require(newPromoter!=address(0),'Non zero address');
        _promoter = newPromoter;
    }
    

}