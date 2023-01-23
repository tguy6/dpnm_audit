/**
 *Submitted for verification at BscScan.com on 2022-05-17
*/

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "hardhat/console.sol";


/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

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

interface GWT {

    function mint(address account, uint256 amount) external returns (bool);
    function burn(address account, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);


}


/**
 * @dev Collection of functions related to the address type
 */
library Address {
    /**
     * @dev Returns true if `account` is a contract.
     *
     * [IMPORTANT]
     * ====
     * It is unsafe to assume that an address for which this function returns
     * false is an externally-owned account (EOA) and not a contract.
     *
     * Among others, `isContract` will return false for the following
     * types of addresses:
     *
     *  - an externally-owned account
     *  - a contract in construction
     *  - an address where a contract will be created
     *  - an address where a contract lived, but was destroyed
     * ====
     *
     * [IMPORTANT]
     * ====
     * You shouldn't rely on `isContract` to protect against flash loan attacks!
     *
     * Preventing calls from contracts is highly discouraged. It breaks composability, breaks support for smart wallets
     * like Gnosis Safe, and does not provide security since it can be circumvented by calling from a contract
     * constructor.
     * ====
     */
    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize/address.code.length, which returns 0
        // for contracts in construction, since the code is only stored at the end
        // of the constructor execution.

        return account.code.length > 0;
    }

    /**
     * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
     * `recipient`, forwarding all available gas and reverting on errors.
     *
     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
     * of certain opcodes, possibly making contracts go over the 2300 gas limit
     * imposed by `transfer`, making them unable to receive funds via
     * `transfer`. {sendValue} removes this limitation.
     *
     * https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/[Learn more].
     *
     * IMPORTANT: because control is transferred to `recipient`, care must be
     * taken to not create reentrancy vulnerabilities. Consider using
     * {ReentrancyGuard} or the
     * https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }

    /**
     * @dev Performs a Solidity function call using a low level `call`. A
     * plain `call` is an unsafe replacement for a function call: use this
     * function instead.
     *
     * If `target` reverts with a revert reason, it is bubbled up by this
     * function (like regular Solidity function calls).
     *
     * Returns the raw returned data. To convert to the expected return value,
     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
     *
     * Requirements:
     *
     * - `target` must be a contract.
     * - calling `target` with `data` must not revert.
     *
     * _Available since v3.1._
     */
    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, "Address: low-level call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with
     * `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but also transferring `value` wei to `target`.
     *
     * Requirements:
     *
     * - the calling contract must have an ETH balance of at least `value`.
     * - the called Solidity function must be `payable`.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, value, "Address: low-level call with value failed");
    }

    /**
     * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but
     * with `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(address(this).balance >= value, "Address: insufficient balance for call");
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
        return functionStaticCall(target, data, "Address: low-level static call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionDelegateCall(target, data, "Address: low-level delegate call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    /**
     * @dev Tool to verify that a low level call to smart-contract was successful, and revert (either by bubbling
     * the revert reason or using the provided one) in case of unsuccessful call or if target was not a contract.
     *
     * _Available since v4.8._
     */
    function verifyCallResultFromTarget(
        address target,
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        if (success) {
            if (returndata.length == 0) {
                // only check isContract if the call was successful and the return data is empty
                // otherwise we already know that it was a contract
                require(isContract(target), "Address: call to non-contract");
            }
            return returndata;
        } else {
            _revert(returndata, errorMessage);
        }
    }

    /**
     * @dev Tool to verify that a low level call was successful, and revert if it wasn't, either by bubbling the
     * revert reason or using the provided one.
     *
     * _Available since v4.3._
     */
    function verifyCallResult(
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal pure returns (bytes memory) {
        if (success) {
            return returndata;
        } else {
            _revert(returndata, errorMessage);
        }
    }

    function _revert(bytes memory returndata, string memory errorMessage) private pure {
        // Look for revert reason and bubble it up if present
        if (returndata.length > 0) {
            // The easiest way to bubble the revert reason is using memory via assembly
            /// @solidity memory-safe-assembly
            assembly {
                let returndata_size := mload(returndata)
                revert(add(32, returndata), returndata_size)
            }
        } else {
            revert(errorMessage);
        }
    }
}

/**
 * @title SafeERC20
 * @dev Wrappers around ERC20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
    using Address for address;

    function safeTransfer(
        IERC20 token,
        address to,
        uint256 value
    ) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transfer.selector, to, value));
    }

    function safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value
    ) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transferFrom.selector, from, to, value));
    }

    /**
     * @dev Deprecated. This function has issues similar to the ones found in
     * {IERC20-approve}, and its usage is discouraged.
     *
     * Whenever possible, use {safeIncreaseAllowance} and
     * {safeDecreaseAllowance} instead.
     */
    function safeApprove(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        // safeApprove should only be called when setting an initial allowance,
        // or when resetting it to zero. To increase and decrease it, use
        // 'safeIncreaseAllowance' and 'safeDecreaseAllowance'
        require(
            (value == 0) || (token.allowance(address(this), spender) == 0),
            "SafeERC20: approve from non-zero to non-zero allowance"
        );
        _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, value));
    }

    function safeIncreaseAllowance(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        uint256 newAllowance = token.allowance(address(this), spender) + value;
        _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, newAllowance));
    }

    function safeDecreaseAllowance(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        unchecked {
            uint256 oldAllowance = token.allowance(address(this), spender);
            require(oldAllowance >= value, "SafeERC20: decreased allowance below zero");
            uint256 newAllowance = oldAllowance - value;
            _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, newAllowance));
        }
    }


    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     */
    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
        // we're implementing it ourselves. We use {Address-functionCall} to perform this call, which verifies that
        // the target address contains contract code and also asserts for success in the low-level call.

        bytes memory returndata = address(token).functionCall(data, "SafeERC20: low-level call failed");
        if (returndata.length > 0) {
            // Return data is optional
            require(abi.decode(returndata, (bool)), "SafeERC20: ERC20 operation did not succeed");
        }
    }
}



contract xdpnmMain is IERC20Metadata {
    using SafeERC20 for IERC20;
    IERC20 public busd;
    phenomenalTreeInt public contractTree;
    GWT public gwt;


    address public contractOwner;
    address public feeCollector;//dev address for earning fees

    uint public buyFeeToLiquidity = 10;//changeable 0-10
    uint public buyFeetoMarketing = 10;//non changeable

    uint public sellFeeToLiquidity = 5;//changeable 0-5
    uint public sellFeeToDevs = 5;//non changeable

    uint public gwtTransFeeCollector = 1e18;//1 BUSD, non changeale
    uint public gwtTransFeeLiquidity = 1e18;//1 BUSD, changeable 0-2 BUSD

    // uint public mindPNMforGWTtransfer = 50e18;//non changeable, dpnm has to be bought for 50 BUSD in order to allow gwt transfer
    uint public turnoverForOneGWT = 200e18;//changeable 200-250 BUSD, can be purchased 200 BUSD turnover for 1 GWT

    uint public earnLimitForOneGWT = 125e16;//non changeable, can be purchased 1.25 BUSD earn limit for 1 GWT

    uint public dPNMbuyTurnoverIncrease = 0;//changeable 0-25%, additional turnover for dpnm buy
    uint public dPNMsellTurnoverIncrease = 0;//changeable 0-25%, additional turnover for dpnm sell

    uint public gwtBuyIncrease = 0;//changeable 0-25%, additional gwt for dPNM buy
    uint public gwtSellIncrease = 0;//changeable 0-25%, additional gwt for dPNM sell
    uint public gwtForTreeActivation = 10e18;//changeable 5-15 GWT, amount of gwt deposited for tree payment

    uint public earnLimitDepositedPerc = 200;//changeable 200-250%, deposit 200% of BUSD price in  earn limit for dPNM purchase
    uint public maxDailyBuy = 0;//changeable, if 0 then 0.5% of a liquidity size, else amount in busd, not less than minDailyBuy
    uint public minDailyBuy = 50e18;//not chngeable, min amount of allowed daily buy in busd

    uint public totalUsers = 0;
    uint public totalUsersEarnings = 0;
    uint public treePaymentPeriod = 30 days;//changeable, 30-60 days
    uint public treeMaxPaymentPeriod = 90 days;//changeable, 90-180 days

    uint public totaldPNM = 0;//total amount of dPNM tokens
    uint public mindPNMBuy = 20e18;//min buy in BUSD
    uint[] treeLvlUnlockCost;//cost in turnover to unlock tree level, 4-10

    bool public isLocked = false;//global lock for tree activate and dpnm buy
    bool public prestartMode = true;//only tree position allowed, all busd transfered to fee collector

    string private _name;
    string private _symbol;

    struct User {
        address referrer;
        uint dpnmBalance;
        uint treePaidUntil;
        uint earnLimitLeft;
        uint totalEarnLimit;//cannot be more than totalbuy+25%
        uint totalTurnover;
        uint totalEarned;
        buySellData tokenData;
    }

    struct buySellData {
        uint lastBuyTime;//record time of last buy, overwrite if more than 24 hours
        uint lastBuyAmount;//increase amount of total buy since 24h from last buy
        uint totalBuyAmount;//BUSD amount of dPNM buy for all time

        uint lastSellTime;//have 48 hours to buy back from last sell time
        uint lastSellAmount;//increase volume of possible buyback for 48 hours
    }
    


    mapping(address => User) public users;
    mapping(address => uint[10]) public treeUserLostProfits;
    mapping(address => bool[10]) public treeuserlevelslock;

    event Activation(address indexed user, address indexed referrer);

    event BuydPNM(address indexed user, uint dPNMamount, uint BUSDamount, uint dPNMprice);
    event SelldPNM(address indexed user, uint dPNMamount, uint BUSDamount, uint dPNMprice);

    event GWTtransfer(address indexed sender, uint GWTamount, address indexed receiver);
    event stakedGWT(address indexed user, uint GWTamount, uint expirationDate, uint dailyProfit, uint stakingID);
    event claimedGWT(address indexed user, uint GWTamount, uint stakingID);

    event buyTurnover(address indexed user, uint turnoverAmount, uint GWTcost);
    event buyEarnLimit(address indexed user, uint earnLimitAmount, uint GWTcost);


    constructor(IERC20 _depositTokenAddress, phenomenalTreeInt _treeAddress, GWT _gwt, address collector) {
        _name = "dPNM";
        _symbol = "dPNM";

        contractOwner = msg.sender;
        init(_depositTokenAddress, _treeAddress, _gwt, collector);
    }
  


    fallback() external {

    }
    //$$$$$$$$ contract initialisation, setting BUSD contract address
    function init(IERC20 _depositTokenAddress, phenomenalTreeInt _treeAddress, GWT _gwt, address collector) private {
        //first user
        busd = _depositTokenAddress;
        contractTree = _treeAddress;
        gwt = _gwt;
        feeCollector = collector;
        // buySellData memory buyselldata = buySellData(0,0,0,0,0);

        User memory user = User({
            dpnmBalance: 0,
            referrer: address(0),
            treePaidUntil: block.timestamp,//date until tree is paid
            earnLimitLeft: 0,
            totalEarnLimit: 0,
            totalTurnover: 0,
            totalEarned: 0,
            tokenData: buySellData(0,0,0,0,0)

        });

        //add data to struct
        users[msg.sender] = user;
        treeUserLostProfits[msg.sender] = [0,0,0,0,0,0,0,0,0,0];
        treeuserlevelslock[msg.sender] = [true,true,true,false,false,false,false,false,false,false];

        //total users count
        totalUsers = 1;

        //set cost of lvls to unlock
        
        for (uint i=0;i<3;i++) {
            treeLvlUnlockCost.push(0);
        }
        //lvl4
        // treeLvlUnlockCost.push(10e18);
        treeLvlUnlockCost.push(40000e18);
        //lvl5
        // treeLvlUnlockCost.push(50e18);
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

    //$$$$$$$$$$$$$$$$$$$$$$  -------   activate function, position user to a tree if not exist, get payment 10$ 4-company, 5 -marketing tree, 1-pool
    function activate(address newUser, address referrerAddress) external onlyUnlocked{
        //check if new user not exist yet
        require(!isUserExists(newUser), "User already exists");
        //check that referrer exist
        require(isUserExists(referrerAddress), "Referrer not exists");

        //position user in a tree
        contractTree.positionUser(newUser,referrerAddress,10);
        
        //create new user structs
        createUser(newUser, referrerAddress);

        //get payment, pay to network and liquidity
        _TreePayment(newUser, true);
    }

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
        treeUserLostProfits[_userAddress] = [0,0,0,0,0,0,0,0,0,0];
        treeuserlevelslock[_userAddress] = [true,true,true,false,false,false,false,false,false,false];

        //total users count
        totalUsers += 1;
    }

    function makeTreePayment () public onlyUnlocked{
        _TreePayment(msg.sender,false);
    }
    
    function _TreePayment (address newUser, bool firstPayment) private {
        require(isUserExists(newUser), "user not found. Activate first.");
        //if user paid for tree but did not buy dPNM then do not allow second payment
        require(users[newUser].tokenData.totalBuyAmount != 0||firstPayment,"Not allowed");
        //check if new payment do not overflow maxDays for tree
        if (users[newUser].treePaidUntil > block.timestamp) {
            uint treeDaysLeft = users[newUser].treePaidUntil - block.timestamp;
            require(treeDaysLeft + treePaymentPeriod <= treeMaxPaymentPeriod,"Exceeds tree days limit"); 
        }
        
        //take payment 10 BUSD for position, paid by one who sign transaction
        busd.safeTransferFrom(msg.sender, address(this), 10e18);

        //set fee in busd for each level of tree in BUSD, total 5 BUSD
        uint[] memory treeRefs = new uint[](11);
        treeRefs[1] = 1e17;//10 BUSD cents
        treeRefs[2] = 1e17;
        treeRefs[3] = 1e17;
        treeRefs[4] = 5e17;//50 BUSD cents
        treeRefs[5] = 5e17;
        treeRefs[6] = 5e17;
        treeRefs[7] = 8e17;//80 BUSD cents
        treeRefs[8] = 8e17;
        treeRefs[9] = 8e17;
        treeRefs[10] = 8e17;

        //loop tree for 10 lvls up depositing bonus
        address[15] memory uplineUsers = contractTree.getLvlsUp(newUser);
        //deposit bonus to 10 lvls up
        for(uint i=0;i<10;i++){
            // console.log("i=",i);
            if (uplineUsers[i] == address(0)) {
                //top of tree, rest fee stays at contract liquidity, lvl 8-10 goes to collector
                if (i<8) {
                    busd.safeTransfer(feeCollector, 24e17);//transfer 2.4 BUSD
                } else {
                    busd.safeTransfer(feeCollector, (10-i)*8e17);//transfer 0.8 BUSD for each left lvl
                }
                
                break;
            } else {
                // console.log("Bonus to=",uplineUsers[i]);
                depositBonus(uplineUsers[i],treeRefs[i+1],0,true,i+1);
            }
            
        }

        //deposit company fee 4 BUSD, 1 BUSD stays in liquidity
        busd.safeTransfer(feeCollector, 4e18);

        //mint gwt to user balance, only if already bought dPNM (not first tree payment)
        if (users[newUser].tokenData.totalBuyAmount > 0 ) {
            gwt.mint(newUser,gwtForTreeActivation);
        }
        
        //set time until tree is active
        if (users[newUser].treePaidUntil == 0||block.timestamp > users[newUser].treePaidUntil) {
        users[newUser].treePaidUntil = block.timestamp + treePaymentPeriod;
        }
        else { users[newUser].treePaidUntil += treePaymentPeriod; }

        //if prestart mode then send all rest from refs to fee collector
        if (prestartMode) {
            busd.safeTransfer(feeCollector, busd.balanceOf(address(this)));
        }

    }

    //function deposit bonus, check if tree activation is not overdue
    function depositBonus(address userAddress, uint bonusAmount, uint purchaseAmount, bool treeActivationBonus, uint lvl) private {
        //if tree activation bonus then deposit for all 10 lvls, only check if tree payment is not overdue
        //if dpnmbuy bonus then check if deposit level is active, and tree is not overdue

        

        if (treeActivationBonus) {
            if (users[userAddress].treePaidUntil >= block.timestamp||userAddress==contractOwner) {
                //if lvl8+ is unlocked then 10% fee
                if (treeuserlevelslock[userAddress][7] == true) { bonusAmount = bonusAmount/100*90; }
                busd.safeTransfer(userAddress, bonusAmount);
                users[userAddress].totalEarned += bonusAmount;
                totalUsersEarnings += bonusAmount;
                // console.log("Tree bonus=",bonusAmount);
            }
            else {
                //increase lost profit counter
                treeUserLostProfits[userAddress][lvl-1] += bonusAmount;

                // console.log("Tree lost profit=",bonusAmount);
                if (lvl>=8) { busd.safeTransfer(feeCollector, bonusAmount);}


            }
        } else {
            //tree is paid
            if (users[userAddress].treePaidUntil >= block.timestamp||userAddress==contractOwner) {
                //deposit bonus or lost profit, lvls 1-7 stays in liquidity, 8-10 goes to fee collector
                if (!treeuserlevelslock[userAddress][lvl-1]) {
                    treeUserLostProfits[userAddress][lvl-1] += bonusAmount;

                    if (lvl>=8) { busd.safeTransfer(feeCollector, bonusAmount); }
                    

                } else {
                    //should buy min tokens amount and token value should be less than earn limit
                    if (isQualifiedForBonus(userAddress)||userAddress==contractOwner) {
                        //if lvl 8+ is unlocked then 10% fee
                        if (treeuserlevelslock[userAddress][7] == true) { bonusAmount = bonusAmount/100*90; }
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

                if (lvl>=8) { busd.safeTransfer(feeCollector, bonusAmount);}

            }
            
        }
        
    }

    //check if user bought dPNM for less than min amoun + check if earnlimit is less than dPNM value
    function isQualifiedForBonus (address userAddress) public view returns (bool) {
        
        //user earn limit is less than dPNM value
        if (getdPNMPrice() * users[userAddress].dpnmBalance / 1e18 >= users[userAddress].earnLimitLeft) {
            return(false);
        }
        //user bought tokens for less than minBuy
        if (users[userAddress].tokenData.totalBuyAmount < mindPNMBuy) {
            return(false);
        }

        return(true);

    }

    function openNewLvl (address userAddress) private {
        //check if user have enough earn limit to open new tree levels
        
        
        for (uint i=0;i<10;i++) {
            if (!treeuserlevelslock[userAddress][i]&&users[userAddress].totalTurnover>=treeLvlUnlockCost[i]) {
                treeuserlevelslock[userAddress][i] = true;
            }    
        }
    }

    function buydPNM (uint BUSDamount) public onlyActivated notPrestart onlyUnlocked{   

        require(BUSDamount >= mindPNMBuy,"Less than min buy");
        //check if user already bought in last 24 hours, increase counter bought, and decrease buy amount, else make record and update time
        User memory userData = users[msg.sender];

        //check if this buy amount does not exceed user daily buy limit left
        require(getMaxDailyBuy(msg.sender)>=BUSDamount,"Limit low");
        

        //deposit dpnm
        uint totalFee = buyFeeToLiquidity + buyFeetoMarketing;
        uint totalBUSDForTokenBuy = BUSDamount / 100 * (100-totalFee);
        // console.log("Total busd for buy=",totalBUSDForTokenBuy);//16
        uint contractBalance = busd.balanceOf(address(this));        
        uint tokenPrice = contractBalance * 1e18 / totaldPNM;
        
        // console.log(contractBalance);
        // console.log(totaldPNM);
        // console.log("Token price=",tokenPrice);
        uint userTotaldPNMdeposit = totalBUSDForTokenBuy * 1e18 / tokenPrice;
        // console.log("Total dPNM=",userTotaldPNMdeposit);
        totaldPNM += userTotaldPNMdeposit;

        //get busd payment
        busd.safeTransferFrom(msg.sender, address(this), BUSDamount);

        users[msg.sender].dpnmBalance += userTotaldPNMdeposit;
        //deposit gwt for fee amount + additional gwt if available
        uint userTotalGWTdeposit = BUSDamount / 100 * totalFee;//fee increase with multiplier

        //mint gwt for user, if first purchase then also add gwt for tree payment
        if (users[msg.sender].tokenData.totalBuyAmount == 0) {
            gwt.mint(msg.sender,userTotalGWTdeposit + (userTotalGWTdeposit / 100 * gwtBuyIncrease) + gwtForTreeActivation);
        } else {
            gwt.mint(msg.sender,userTotalGWTdeposit + (userTotalGWTdeposit / 100 * gwtBuyIncrease));
        }
        //increase total buy
        users[msg.sender].tokenData.totalBuyAmount += BUSDamount;

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

        //deposit marketing for tree upline
        depositBonusFordPNMbuy(msg.sender,BUSDamount);
        // console.log('Bought=',userTotaldPNMdeposit);
        emit BuydPNM(msg.sender, userTotaldPNMdeposit,BUSDamount,tokenPrice);
    }

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
        } else if (maxBuyLimit < minDailyBuy) {
            buyLimit = minDailyBuy;
        } else {
            buyLimit = maxBuyLimit;
        }
        
        //bought in last 24 hours buy
        uint last24BuyAmount = 0;
        // console.log("1=",users[user].tokenData.lastBuyTime);
        if (users[user].tokenData.lastBuyTime + 24 hours > block.timestamp) {
            last24BuyAmount = users[user].tokenData.lastBuyAmount;
            // console.log("2=",last24BuyAmount);
        }

        //sold in last 48 hours
        uint soldLast48Hours = 0;
        if (users[user].tokenData.lastSellTime + 48 hours > block.timestamp) {
            soldLast48Hours = users[user].tokenData.lastSellAmount;
            // console.log("3=",soldLast48Hours);

        }
        
        buyLimit = buyLimit - last24BuyAmount + soldLast48Hours;

        return(buyLimit);
    }

    function depositBonusFordPNMbuy (address userAddress, uint buyAmount) private {

        //accrue bonus to upline
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
        //deposit bonus to 10 lvls up
        for(uint i=0;i<10;i++){
            // console.log("i=",i);
            if (uplineUsers[i] == address(0)) {
                //top of tree, rest fee stays at contract liquidity, lvl 8-10 goes to collector
                if (i<8) {
                    busd.safeTransfer(feeCollector, buyAmount / 1000 * 48);//transfer 4.8% BUSD
                } else {
                    busd.safeTransfer(feeCollector, buyAmount / 1000 * (10-i)*16);//transfer 1.6% for each left lvl
                }

                break;
            } else {
                uint bonus_size = buyAmount / 1000 * treeRefs[i+1];
                depositBonus(uplineUsers[i],bonus_size,buyAmount,false,i+1);

            }   
        }
    }

    function selldPNM (uint BUSDamount) public onlyActivated notPrestart {
        //get user total token value
        uint dPNMprice = getdPNMPrice();
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
            //decrease dPNM amount proprtionally
            uint percentBurn = BUSDamount / leftLimit;
            dPNMtoBurn = users[msg.sender].dpnmBalance * (1-percentBurn);//to test
            
        }

        //decrease dpnm amount
        // console.log("dpnm to burn=",dPNMtoBurn);
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
        //get fee
        uint totalFee = sellFeeToDevs + sellFeeToLiquidity;
        
        //mint gwt + additional gwt if available
        gwt.mint(msg.sender,(BUSDamount / 100 * totalFee) + (BUSDamount / 100 * totalFee / 100 * gwtSellIncrease));
        //send busd to user
        uint depositBUSD = BUSDamount / 100 * (100-totalFee);
        busd.safeTransfer(msg.sender, depositBUSD);
        //send busd to fee collector
        busd.safeTransfer(feeCollector, BUSDamount / 100 * sellFeeToDevs);
        //try to increase turnover for 10 lvl up if enabled
        accruedPNMsellTurnover(msg.sender,BUSDamount);
        //emit event
        emit SelldPNM(msg.sender, dPNMtoBurn,depositBUSD,dPNMprice);

    }

    function transfer(address to, uint256 amount) public returns (bool) {
        // address owner = _msgSender();
        return false;
    }

    function accruedPNMsellTurnover(address sellingUser, uint sellAmount) private {
        //accrue turnover for 10 lvls up in case its enabled
        if (dPNMsellTurnoverIncrease!=0) {
            uint turnover = sellAmount / 100 * dPNMsellTurnoverIncrease;

            address[15] memory uplineUsers = contractTree.getLvlsUp(sellingUser);
            //deposit bonus to 10 lvls up
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

    function buyTurnoverWithGWT(uint turnoverAmount) public onlyActivated notPrestart {
        //should have enough GWT for purchase, 1 GWT = 200 BUSD turnover
        uint gwtCost = turnoverAmount * 1e18 / turnoverForOneGWT;
        require(gwtCost<=gwt.balanceOf(msg.sender),'Not enough GWT');
        //pay fee
        payFeeForGWTtrans();
        
        //burn gwt
        gwt.burn(msg.sender,gwtCost);

        //add turnover
        users[msg.sender].totalTurnover += turnoverAmount;

        //check if new lvl opened
        openNewLvl(msg.sender);

        emit buyTurnover(msg.sender, turnoverAmount, gwtCost);
        
    }

    function buyEarnLimitWithGWT(uint earnlimitAmount) public onlyActivated notPrestart {
        //should have enough GWT for purchase, 1 GWT = 1.25 BUSD earn limit
        uint gwtCost = earnlimitAmount * 1e18 / earnLimitForOneGWT;
        console.log(gwtCost);
        require(gwtCost<=gwt.balanceOf(msg.sender),'Not enough GWT');
        //increase earn if not more than 10% of total earn limit for all time
        uint maxearnLimitFromdPNMbuy = users[msg.sender].tokenData.totalBuyAmount / 100 * 220;//220% from purchase cost (equals 10% of total earn limit)
        require(maxearnLimitFromdPNMbuy>=(users[msg.sender].totalEarnLimit + earnlimitAmount),'Exceeds 10%');

        //pay fee
        payFeeForGWTtrans();

        //burn gwt
        gwt.burn(msg.sender,gwtCost);

        //increase earn limit
        users[msg.sender].earnLimitLeft += earnlimitAmount;
        users[msg.sender].totalEarnLimit += earnlimitAmount;

        emit buyEarnLimit(msg.sender, earnlimitAmount, gwtCost);
        
    }

    function payFeeForGWTtrans() private {
        //pay fee in BUSD
        busd.safeTransferFrom(msg.sender, address(this), (gwtTransFeeCollector + gwtTransFeeLiquidity));
        //transfer fee to collector
        busd.safeTransfer(feeCollector, gwtTransFeeCollector);

    }

    /////---------Owner control functions---------

    //change amount of dPNM buy limit for 24 hours timeframe
    function setDailyBuyLimit (uint amount) public onlyContractOwner {
        require(amount >= minDailyBuy||amount == 0, 'Too low');
        maxDailyBuy = amount;
    }

    //change amount of GWT deposited for activation
    function setGWTforActivation (uint amount) public onlyContractOwner {
        //should be in range 5-15 GWT
        require(5e18<=amount&&amount<=15e18, 'Out of range');
        gwtForTreeActivation = amount;
    }

    //change amount of days given for tree activation
    function setDaysForTree(uint amount) public onlyContractOwner {
        require(30<=amount&&amount<=60, 'Out of range');
        treePaymentPeriod = amount * 1 days;
    }

    //change amount of days user can have in tree payment
    function setMaxDaysForTree(uint amount) public onlyContractOwner {
        require(90<=amount&&amount<=180, 'Out of range');
        treeMaxPaymentPeriod = amount * 1 days;
    }


    //change fee in percent that goes to liquidity on dpnm buy
    function setbuyFeeToLiquidity(uint amount) public onlyContractOwner {
        require(0<=amount&&amount<=10, 'Out of range');
        buyFeeToLiquidity = amount;
    }

    //change fee in percent that goes to liquidity on dpnm sell
    function setsellFeeToLiquidity(uint amount) public onlyContractOwner {
        require(0<=amount&&amount<=5, 'Out of range');
        sellFeeToLiquidity = amount;
    }

    //change fee in BUSD that goes to liquidity on gwt transfer
    function setgwtTransFeeLiquidity(uint amount) public onlyContractOwner {
        require(0<=amount&&amount<=2e18, 'Out of range');
        gwtTransFeeLiquidity = amount;
    }

    //change fee in BUSD that goes to liquidity on gwt transfer
    function setturnoverForOneGWT(uint amount) public onlyContractOwner {
        require(200e18<=amount&&amount<=250e18, 'Out of range');
        turnoverForOneGWT = amount;
    }

    //change percent of additional turnover added on dPNM purchase
    function setdPNMbuyTurnoverIncrease(uint amount) public onlyContractOwner {
        require(0<=amount&&amount<=25, 'Out of range');
        dPNMbuyTurnoverIncrease = amount;
    }

    //change percent of additional gwt for dPNM buy in percent 
    function setgwtBuyIncrease(uint amount) public onlyContractOwner {
        require(0<=amount&&amount<=25, 'Out of range');
        gwtBuyIncrease = amount;
    }

    //change percent of additional gwt for dPNM sell in percent 
    function setgwtSellIncrease(uint amount) public onlyContractOwner {
        require(0<=amount&&amount<=25, 'Out of range');
        gwtSellIncrease = amount;
    }

    //change percent of additional gwt for dPNM sell in percent 
    function setdPNMsellTurnoverIncrease(uint amount) public onlyContractOwner {
        require(0<=amount&&amount<=25, 'Out of range');
        dPNMsellTurnoverIncrease = amount;
    }

    //change percent of earn limit for dpnmbuy
    function setearnLimitDepositedPerc(uint amount) public onlyContractOwner {
        require(200<=amount&&amount<=250, 'Out of range');
        earnLimitDepositedPerc = amount;
    }


    //change state of lock fir dpnmbuy and tree join
    function changeLock() external onlyContractOwner() {
        isLocked = !isLocked;
    }



    ////------------------

    function getUserData(address account) public view returns (uint, uint, uint, uint, uint) {
        return(
            users[account].dpnmBalance, 
            users[account].totalTurnover, 
            users[account].earnLimitLeft,
            users[account].totalEarned,
            users[account].totalEarnLimit
            );
    }

    function getUserBuySellData(address account) public view returns (uint, uint, uint, uint, uint) {
        return(
            users[account].tokenData.lastBuyTime, 
            users[account].tokenData.lastBuyAmount, 
            users[account].tokenData.totalBuyAmount, 
            users[account].tokenData.lastSellTime, 
            users[account].tokenData.lastSellAmount);
    }


    
    //check if user exist
    function isUserExists(address user) public view returns (bool) {
        return (users[user].referrer != address(0)||user==contractOwner);
    }

    function treeActiveUntil(address account) external view returns (uint256) {
    return users[account].treePaidUntil;
    }

    function getLvlsLockStatus(address user) public view returns(bool[10] memory) {
        return(treeuserlevelslock[user]);
    }

    //return amount of lost profit for each lvl of tree
    function getLostProfit(address account) public view returns (uint[10] memory) {
        return(treeUserLostProfits[account]);
        
    }

    function getdPNMLiquidity() external view returns (uint,uint) {
        //BUSD liquidity balance + total tokens
        return(busd.balanceOf(address(this)),totaldPNM);
    }

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
    function name() public view virtual override returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual override returns (string memory) {
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
    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public view returns (uint256) {
        return totaldPNM;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account) public view returns (uint256) {
        return users[account].dpnmBalance;
    }

    

    // Modifiers --------------
    modifier onlyContractOwner() { 
        require(msg.sender == contractOwner, "onlyOwner"); 
        _; 
    }

    modifier onlyActivated() { 
        require(users[msg.sender].referrer != address(0)||msg.sender==contractOwner, "onlyActivated"); 
        _; 
    }

    modifier notPrestart() { 
        require(!prestartMode, "After Prestart"); 
        _; 
    }

    modifier onlyUnlocked() { 
        require(!isLocked || msg.sender == contractOwner,"Locked"); 
        _; 
    }

    //state control functions
    function disablePrestartMode() public onlyContractOwner() {
        prestartMode = false;
        //deposit 1 BUSD
        busd.safeTransferFrom(msg.sender, address(this), 1e18);
        //deposit first user 1 dPNM
        users[msg.sender].dpnmBalance = 1e18;
        totaldPNM = 1e18;
    }

    function changeOwnership(address newOwner) public onlyContractOwner {
        contractOwner = newOwner;
    }
    
    function changeFeeCollector(address newCollector) public onlyContractOwner {
        feeCollector = newCollector;
    }

    

}