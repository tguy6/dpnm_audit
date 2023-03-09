// SPDX-License-Identifier: MIT

// ******************************************************************************************************************
//  _______  __                                                                __    _________                      
// |_   __ \[  |                                                              [  |  |  _   _  |                     
//   | |__) || |--.  .---.  _ .--.   .--.   _ .--..--.  .---.  _ .--.   ,--.   | |  |_/ | | \_|_ .--.  .---.  .---. 
//   |  ___/ | .-. |/ /__\\[ `.-. |/ .'`\ \[ `.-. .-. |/ /__\\[ `.-. | `'_\ :  | |      | |   [ `/'`\]/ /__\\/ /__\\
//  _| |_    | | | || \__., | | | || \__. | | | | | | || \__., | | | | // | |, | |     _| |_   | |    | \__.,| \__.,
// |_____|  [___]|__]'.__.'[___||__]'.__.' [___||__||__]'.__.'[___||__]\'-;__/[___]   |_____| [___]    '.__.' '.__.'
//                                                                                                                 
//                                                  www.dpnmDeFi.com                                                                 
// ******************************************************************************************************************


pragma solidity 0.8.9;
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Phenomenal User Tree
 * Contract stores tree of addresses. Tree has 3 branches. Total depth of tree is 15 lvls.
 * @dev Only allowed contracts can interact with tree contract to position new addresses.
 */
contract phenomenalTree  is Ownable{
    uint public totalUsers = 1;//total users ina tree
    address immutable public rootOfTree;

    //tree of 3 branches structure by ID
    struct Tree {
        address topUser;
        address leftUser;
        address centerUser;
        address rightUser;
    }

    mapping(address => Tree) public treeUsers;
    mapping(address => uint[15]) public treeuserlevels;//amount of addresses at each of 15 lvls down for address in a tree
    mapping(address => bool) internal allowedContractsMap;//map of contracts allowed to position new addresses

    /**
     * @dev First tree user is deployer
     */
    constructor() {
        rootOfTree = msg.sender;

    }
    
    /**
     * @dev Function to find a place and position address in a tree.
     * If address already exists in a tree error is not thrown.
     * @param newUser New address that is positioning on a tree
     * @param referrerAddress Address from which to start searching position
     * @param lvlsDeep Depth how far can go to search for a position
     */
    function positionUser (address newUser, address referrerAddress, uint8 lvlsDeep) external onlyAllowed{
        //if user already exists then skip positioning, do not throw error
        if (isUserexist(newUser)) {
            return();
        }
        
        
        uint8 treeBranch;

        (referrerAddress, treeBranch, ) = findPositionSpot(newUser,referrerAddress,lvlsDeep);
        //create records for user in tree
        Tree memory treeUser = Tree({
            topUser: referrerAddress,
            leftUser: address(0),
            centerUser: address(0),
            rightUser: address(0)
        });

        treeUsers[newUser] = treeUser;

        updateTreeUplineCounters(referrerAddress,newUser,treeBranch);

        totalUsers += 1;

    }

    /**
     * @dev Function to search position where address should be positioned.
     * Address should not exist in tree.
     * Referrer address should exist in tree.
     * Place is searched starting from referrer, branch with smallest amount of addresses are searched.
     * First 3 positions under referrer are considerate level 1. Next 9 positions - level 2 and so on.
     * Position is searched from left to right.
     * If whole levels of tree of reffereer are filled with address error is thrown.
     * @param newUser Address of a new user that is positioning
     * @param referrerAddress Address from which search is performed
     * @param lvlsDeep Depth of levels that take action in search
     */
    function findPositionSpot(address newUser,  address referrerAddress, uint8 lvlsDeep) public view returns(address, uint8, uint8) {
        require(lvlsDeep>5&&lvlsDeep<=15,'Depth not in range');
        //if user already exists then skip search
        require(!isUserexist(newUser),'Already exist');

        //if sponsor not exists then skip search
        require(isUserexist(referrerAddress),'Referrer not exist');

        //search where to position in tree
        bool foundPosition = false;
        uint8 lvl = 1;
        uint8 treeBranch = 0;

        address left;
        address center;
        address right;

        uint leftNetwork = 0;
        uint centerNetwork = 0;
        uint rightNetwork = 0;
        
        //loop for 10 lvls deep finding weakest leg
        while ( !foundPosition && lvl<=lvlsDeep) {
            //calc each leaf total tree users    
            left = treeUsers[referrerAddress].leftUser;
            center = treeUsers[referrerAddress].centerUser;
            right = treeUsers[referrerAddress].rightUser;


            if (left == address(0)){
                //left user spot is free, position here
                foundPosition = true;
                treeBranch = 1;

            }
            else if (center == address(0)){
                //center user spot is free, position here
                foundPosition = true;
                treeBranch = 2;

            }
            else if (right == address(0)){
                //right user spot is free, position here
                foundPosition = true;
                treeBranch = 3;
            }
            else {
                //find leg with smallest network, count network in depth for up to 10 lvls from referrerID
                leftNetwork = calcTreeNetwork(left, lvlsDeep-lvl); 
                centerNetwork = calcTreeNetwork(center, lvlsDeep-lvl);
                rightNetwork = calcTreeNetwork(right, lvlsDeep-lvl);
                if (leftNetwork <= centerNetwork && leftNetwork <= rightNetwork){
                    //use left
                    referrerAddress = left;
                }
                else if (centerNetwork <= rightNetwork ) {
                    //use center
                    referrerAddress = center;
                }
                else {
                    //use right
                    referrerAddress = right;
                }
            }
            lvl++;
            

            
        }

        require(foundPosition, "Tree is filled");
        return(referrerAddress,treeBranch,lvl-1);
    }

    /**
     * @dev Function returns 15 upline addresses relative to searched address
     * @param searchedAddress Address from which return upline addresses
     */
    function getLvlsUp(address searchedAddress) external view onlyAllowed returns(address[15] memory) {
        address[15] memory uplineUsers;
        

        address topUser = treeUsers[searchedAddress].topUser;
        //get address of 15 lvls up
        for(uint i=0;i<15;i++){
            if (topUser == address(0)) {
                //top of tree
                break;
            } else {
                uplineUsers[i] = topUser;
            }
            topUser = treeUsers[topUser].topUser;
            
        }
        return(uplineUsers);
    }

    /**
     * @dev Returns amount of addresses located on each tree level from searched address 15 levels deep
     * @param searchedAddress Address that is queried
     */
    function getTreeRefs(address searchedAddress) external view returns(uint[15] memory) {
        return(treeuserlevels[searchedAddress]);    
    }

    /**
     * @dev Sums amount of addresses on each tree level to return total amount of addresses in a tree
     * @param _userAddress Address for which calculation should be performed
     * @param _depth How many tree levels use for calculation
     */
    function calcTreeNetwork(address _userAddress, uint _depth ) public view returns(uint) {
        require(_depth>=0&&_depth<=15,'Depth not in range');

        //calculate amount of users for amount of lvls in depth of tree
        uint total;
        for (uint i=0; i<_depth; i++) {
            total += treeuserlevels[_userAddress][i];
        }
        
        return(total);
    }

    /**
     * @dev Add address to tree struct.
     * Moves upline for 15 levels on a tree increasing amonut of addresses on each corresponding level by 1.
     * @param _treeReferrerAddress Address one level up from positioning address
     * @param _treeNewUserAddress Address that is positioning to tree
     * @param _treeBranch Tree branch left/center/right where new address is located under _treeReferrerAddress
     */
    function updateTreeUplineCounters(address _treeReferrerAddress, address _treeNewUserAddress, uint8 _treeBranch) private {
        //update referrer first line, add new user
        if (_treeBranch == 1){
            treeUsers[_treeReferrerAddress].leftUser = _treeNewUserAddress;
        }
        else if (_treeBranch == 2){
            treeUsers[_treeReferrerAddress].centerUser = _treeNewUserAddress;
        }
        else {
            treeUsers[_treeReferrerAddress].rightUser = _treeNewUserAddress;
        }
        //update amount of addresses for upliners, 15 lvls up
        address treeUp = _treeReferrerAddress;

        for (uint i=0;i<15; i++) {
            treeuserlevels[treeUp][i] += 1;
            treeUp = treeUsers[treeUp].topUser;
            if (treeUp == address(0)) {
                //top of tree
                break;
            }    
        }

        
    }


    /**
     * @dev Check if address positioned in tree
     * @param userAddress Searched address
     */
    function isUserexist(address userAddress) public view returns(bool) {
        if (treeUsers[userAddress].topUser != address(0)||userAddress==rootOfTree) {
            return(true);
        } else {
            return(false);
        }
    }
    
    /**
     * @dev Search address in a tree returning level number where it located according to caller.
     * Searched address should exist in tree
     * Caller should exist in tree
     * Search depth should not exceed 15 levels
     * Return 0 if not found
     * @param searchedAddress Address to get distance to caller
     * @param _depth Amount of levels down the tree to search
     */
    function getUserDistance(address searchedAddress, uint _depth) external view returns(uint) {
        require(isUserexist(searchedAddress),'Not exist');
        require(isUserexist(msg.sender),'Register first');
        require(_depth<=15,'Too deep');
        address topUser = treeUsers[searchedAddress].topUser;

        for (uint i=1; i<=_depth; i++) {
            if (topUser == rootOfTree&&msg.sender!=rootOfTree) { 
                return(0);
            } else if (topUser == msg.sender) { 
                return(i);
            }
            topUser = treeUsers[topUser].topUser;
        }
        return(0);

    }

    /**
     * @dev Adding new address to the list of contracts that is allowed to position new addresses to tree
     * @param allowedContract Allowed address
     */
    function addAllowedContract (address allowedContract) external onlyOwner {
        require(allowedContract!=address(0),'Non zero address');
        allowedContractsMap[allowedContract] = true;
    }

    /**
     * @dev Removing address from the list of contracts that is allowed to position new addresses to tree
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
    function returnAllowedContract(address checkedAddress) external view onlyOwner returns (bool) {
        return(allowedContractsMap[checkedAddress]);
    }

    /**
     * @dev Checks if address that made a call is on the map of allowed contracts
     */
    modifier onlyAllowed() { 
        require(allowedContractsMap[msg.sender], "403"); 
        _; 
    }


}