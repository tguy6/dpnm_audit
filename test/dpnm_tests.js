const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");

  const { expect } = require("chai");
  const { BigNumber, bigNumberify, utils, parseEther, formatEther  } = require("ethers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

/**
 * @dev Used hardhat+chai for testing. Coverage = 100%.
 * For "Tree completely filled with users | findPositionSpot" test takes long to fill the tree with 88572 addresses
 * treeDepth in dPNM smart contract has to be set to 3, so less lvls, so test take less time
 */
describe("dPNM", () => {
    const owner = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const user1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const user2 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    const user3 = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
    const user4 = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";
    const user5 = "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc";
    const user6 = "0x976EA74026E726554dB657fA54763abd0C3a0aa9";
    const user7 = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955";
    const user8 = "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f";
    const user9 = "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720";
    const user10 = "0xBcd4042DE499D14e55001CcbB24a551F3b954096";
    const user11 = "0x71bE63f3384f5fb98995898A86B02Fb2426c5788";
    const user12 = "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a";
    const user13 = "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec";
    const user14 = "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097";
    const user15 = "0xcd3B766CCDd6AE721141F452C550Ca635964ce71";
    const user16 = "0x2546BcD3c84621e976D8185a91A922aE77ECEc30";
    const user17 = "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E";
    const feeCollector = "0xdD2FD4581271e230360230F9337D5c0430Bf44C0";
    const user19 = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";//busd owner

    /**
     * @dev Fixture. Deploying dPNM, Tree and GWT contract. Adding allowed contracts.
     * @returns 
     */
    async function deploydPNMandTree() {
    
        // Create the smart contract object to test from
        let signers = await ethers.getSigners();
        const _owner = signers[0];
        const _user1 = signers[1];
        const _user2 = signers[2];
        const _user3 = signers[3];
        const _busd_owner = signers[19];
        
        //deploy busd
        let Token = await ethers.getContractFactory("BEP20Token");
        const _busd = await Token.connect(_busd_owner).deploy();
        console.log("BUSd address=",_busd.address);

        //deploy phenomenalTree
        Token = await ethers.getContractFactory("phenomenalTree");
        const _tree = await Token.connect(_owner).deploy();
        console.log("phenomenalTree address=",_tree.address);
            
        //deploy gwt
        Token = await ethers.getContractFactory("GWT_BEP20");
        _gwt = await Token.deploy();
        console.log("GWT address=",_gwt.address);


        //deploy dpnm
        Token = await ethers.getContractFactory("dpnmMain");
        const _dpnm = await Token.connect(_owner).deploy(_busd.address,_tree.address,_gwt.address,feeCollector);
        console.log("dPNM address=",_dpnm.address);
    
        //add dpnm to allowed contracts to call phenomenalTree
        await _tree.addAllowedContract(_dpnm.address);

        //add dpnm to allowed contracts to call gwt
        await _gwt.addAllowedContract(_dpnm.address);
        //set dpnm address and feecollector for gwt
        await _gwt.init(_dpnm.address, feeCollector, _busd.address);

        return { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt };
      }

    /**
     * @dev Fixture. Deploying 3 contracts, without adding allowed contracts
     * @returns 
     */
    async function deploydPNMandTreeWithoutAllowedContrcts() {

    let signers = await ethers.getSigners();
    const _owner = signers[0];
    const _user1 = signers[1];
    const _user2 = signers[2];
    const _user3 = signers[3];
    const _busd_owner = signers[19];
    
    //deploy busd
    let Token = await ethers.getContractFactory("BEP20Token");
    const _busd = await Token.connect(_busd_owner).deploy();
    // console.log("BUSd address=",_busd.address);

    //deploy phenomenalTree
    Token = await ethers.getContractFactory("phenomenalTree");
    const _tree = await Token.connect(_owner).deploy();
    // console.log("phenomenalTree address=",_tree.address);
        
    //deploy gwt
    Token = await ethers.getContractFactory("GWT_BEP20");
    _gwt = await Token.deploy();

    //deploy dpnm
    Token = await ethers.getContractFactory("dpnmMain");
    const _dpnm = await Token.connect(_owner).deploy(_busd.address,_tree.address,_gwt.address,feeCollector);


    return { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt };
    }

    /**
     * @dev Fixture. First user make activation after contracts deployment */
    async function firstUserRegisters() {
        const { _dpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);

        //transfer 10 BUSD to user1 , increase allowance
        const transfer_weiValue = utils.parseEther("10");
        await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
        //increase allowance
        await _busd.connect(_user1).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        
        await _dpnm.connect(_user1).activate(user1,owner);
        return { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt };

        

    }

    /**
     * @dev Fixture. After first activated user second user make activation using user1 ref link
     * @returns 
     */
    async function secondUserRegisters() {
        const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt  } = await loadFixture(firstUserRegisters);
        //transfer 10 BUSD to user2 , increase allowance
        const transfer_weiValue = utils.parseEther("10");
        await _busd.connect(_busd_owner).transfer(user2,transfer_weiValue)
        //increase allowance
        await _busd.connect(_user2).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        
        await _dpnm.connect(_user2).activate(user2,user1);
        return { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt  };


    }

    /**
     * @dev Fixture. User1 and user2 activated. Prestart disabled. User2 buy dPNM for 50 BUSD
     * @returns 
     */
    async function secondUserBuyDPNMFor50BUSD() {
        const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt  } = await loadFixture(secondUserRegisters);

        await disablePrestart(_dpnm,_busd,_busd_owner,_owner)
        //buy dpnm for 50
        const weiValue = utils.parseEther("50");

        await depositBUSD(_busd,_busd_owner,user2,"50")
        await _busd.connect(_user2).increaseAllowance(_dpnm.address,weiValue)
        await _dpnm.connect(_user2).buydPNM(weiValue)

        return { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt  };

    }

    /**
     * @dev Fixture. First 10 users make activation. Each next user use ref link of previous user.
     * @returns 
     */
    async function tenUsersRegistered() {
        /* 10 users are registered after owner, each one use reflink of the previous user*/
        const { _dpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner } = await loadFixture(deploydPNMandTree);
        let signers = await ethers.getSigners();

        // transfer 10 BUSD to each user, increase allowance
        const transfer_weiValue = utils.parseEther("10");
        await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user2,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user3,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user4,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user5,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user6,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user7,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user8,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user9,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user10,transfer_weiValue)
        // increase allowance
        await _busd.connect(signers[1]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[2]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[3]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[4]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[5]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[6]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[7]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[8]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[9]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[10]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        //activate users
        for (let i=1;i<=10;i++) {
            await _dpnm.connect(signers[i]).activate(signers[i].address,signers[i-1].address);    
        }
        
        return { _dpnm, _busd, _tree, _owner, signers };


    }

    /**
     * @dev Fixture. 13 users registered, everyone use owner reflink taking positions on first tree levels from left to right
     * lvls 1-2 from owner completely filled, 1 user located at lvl 3
     * @returns 
     */
    async function thirteenUsersRegisteredWithOwnerReflink() {
        const { _dpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner } = await loadFixture(deploydPNMandTree);
        let signers = await ethers.getSigners();

        // transfer 10 BUSD to each user, increase allowance
        const transfer_weiValue = utils.parseEther("10");
        await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user2,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user3,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user4,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user5,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user6,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user7,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user8,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user9,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user10,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user11,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user12,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user13,transfer_weiValue)

        // increase allowance
        await _busd.connect(signers[1]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[2]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[3]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[4]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[5]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[6]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[7]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[8]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[9]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[10]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[11]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[12]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        await _busd.connect(signers[13]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
        //activate users
        for (let i=1;i<=13;i++) {
            await _dpnm.connect(signers[i]).activate(signers[i].address,signers[0].address);    
        }
        
        return { _dpnm, _busd, _tree, _owner, signers };


    }
    

    /**
     * @dev Fixture. 10 users make activation, each next use ref link of previous.
     * After activation each user buy dPNM for 50 BUSD
     * @returns 
     */
    async function tenUsersBuyDPNM() {
        const { _dpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);
        let signers = await ethers.getSigners();

        console.log("***************LOAD FIXTURE**********");
        // transfer 50 BUSD to each user, increase allowance
        const transfer_weiValue = utils.parseEther("60");
        await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user2,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user3,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user4,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user5,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user6,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user7,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user8,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user9,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user10,transfer_weiValue)
        // increase allowance
        await _busd.connect(signers[1]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[2]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[3]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[4]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[5]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[6]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[7]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[8]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[9]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[10]).increaseAllowance(_dpnm.address,transfer_weiValue)
        let collectorBalance = 0;

        //activate users
        // console.log("Activation:")
        for (let i=1;i<=10;i++) {
            // console.log("Activation u=%s",i)
            await _dpnm.connect(signers[i]).activate(signers[i].address,signers[i-1].address);    
            // collectorBalance = utils.formatEther(await _busd.balanceOf(feeCollector));
            // console.log("Collector Balance=",collectorBalance);
    
        }

        // prestart disabled
        await _busd.connect(_busd_owner).transfer(owner,utils.parseEther("1"))
        await _busd.connect(_owner).increaseAllowance(_dpnm.address,utils.parseEther("1"))
        await _dpnm.disablePrestartMode()

        // every user buy dpnm for 50 busd
        const buy_weiValue = utils.parseEther("50");
        let totalDPNM = 0;
        let contrBalance = 0;
        let dpnmPrice = 0;
        totalDPNM = utils.formatEther(await _dpnm.totaldPNM());
        // console.log("DPNM=",totalDPNM);

        contrBalance = utils.formatEther(await _busd.balanceOf(_dpnm.address));
        collectorBalance = utils.formatEther(await _busd.balanceOf(feeCollector));
        // console.log("Contract Balance=",contrBalance);
        // console.log("Collector Balance=",collectorBalance);
        // console.log('--------\n')

        for (let i=1;i<=10;i++) {
            // console.log("User=",i);

            // dpnmPrice = utils.formatEther(await _dpnm.getdPNMPrice());
            // console.log("Price=",dpnmPrice);

            await _dpnm.connect(signers[i]).buydPNM(buy_weiValue);
            // totalDPNM = utils.formatEther(await _dpnm.totaldPNM());
            // console.log("DPNM=",totalDPNM);

            // contrBalance = utils.formatEther(await _busd.balanceOf(_dpnm.address));
            // console.log("Balance=",contrBalance);
            // collectorBalance = utils.formatEther(await _busd.balanceOf(feeCollector));
            // console.log("Collector Balance=",collectorBalance);

            // console.log('--------\n')
        
        }
        
        console.log("Total earnings=", await _dpnm.totalUsersEarnings());
        console.log("Fee collector=", await _busd.balanceOf(feeCollector));
        console.log("Liquidity=", await _busd.balanceOf(_dpnm.address));
        console.log("dPNM total=", await _dpnm.totaldPNM());
        console.log("***************DONE FIXTURE**********");
        
        return { _dpnm, _busd, _tree, _owner, signers, _gwt };

    }

    /**
     * Fixture. user1 make activation. Prestart disabled. User buy dPNM for 50 BUSd then sell dPNM for 20 BUSD
     * @returns 
     */
    async function firstUserBuyAndSellDPNM() {
        const { _dpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);

        //transfer 60 BUSD to user1 , increase allowance
        const transfer_weiValue = utils.parseEther("60");
        await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)

        // prestart disabled
        await _busd.connect(_busd_owner).transfer(owner,utils.parseEther("1"))
        await _busd.connect(_owner).increaseAllowance(_dpnm.address,utils.parseEther("1"))
        await _dpnm.disablePrestartMode()

                
        //increase allowance
        await _busd.connect(_user1).increaseAllowance(_dpnm.address,utils.parseEther("60"))
        
        await _dpnm.connect(_user1).activate(user1,owner);
    
        const buy_weiValue = utils.parseEther("50");
        await _dpnm.connect(_user1).buydPNM(buy_weiValue);

        const sell_weiValue = utils.parseEther("20");
        await _dpnm.connect(_user1).selldPNM(sell_weiValue);

        return { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt };

        

    }

    /**
     * @dev Function for fast BUSD deposit to user
     */
    async function depositBUSD(_busd,_busd_owner,_receiver,_amount) {
        //transfer BUSD to user1 , increase allowance
        const transfer_weiValue = utils.parseEther(_amount);
        await _busd.connect(_busd_owner).transfer(_receiver,transfer_weiValue)
        
    }

    /**
     * @dev function to disable prestart
     */
    async function disablePrestart(_dpnm,_busd,_busd_owner,_owner) {
        //transfer BUSD to user1 , increase allowance
        // prestart disabled
        await _busd.connect(_busd_owner).transfer(owner,utils.parseEther("1"))
        await _busd.connect(_owner).increaseAllowance(_dpnm.address,utils.parseEther("1"))
        await _dpnm.disablePrestartMode()
        
    }

    /**
     * @dev function to quickly load main user data from contracts
     */
    async function showUserData(_dpnm,_busd,_gwt,_account,_name) {
        const userData = await _dpnm.getUserData(_account)
        const balDpnm = utils.formatEther(userData[0])
        const turnover = utils.formatEther(userData[1])
        const earnLimitLeft = utils.formatEther(userData[2])
        const totalEarn = utils.formatEther(userData[3])
        const totalEarnLimit = utils.formatEther(userData[4])
        const tokenValue = Number(balDpnm)*Number(utils.formatEther(await _dpnm.getdPNMPrice()))
        const gwtBal = utils.formatEther(await _gwt.balanceOf(_account))
        const busdBal = utils.formatEther(await _busd.balanceOf(_account))
        console.log("~~~~~User=%s, dPNM = %s (≈ %s) | GWT = %s |  BUSD = %s | Trnvr = %s | EarnLimLeft = %s  | EarnLimTotal = %s | Earned = %s",_name,balDpnm,tokenValue.toFixed(2) ,gwtBal,busdBal,turnover,earnLimitLeft,totalEarnLimit,totalEarn)


    }

    /**
     * @dev Fixture. Ten user activate. Prestart disabled. Max daily dPNM buy increased to 1000 BUSD.
     * For 12 days each user every day buy dPNM for 1000 BUSD
     * @returns 
     */
    async function tenUsersBuy1000DPNMFor13Days() {
        const { _dpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);
        let signers = await ethers.getSigners();

        console.log("***************LOAD FIXTURE**********");
        // transfer 50 BUSD to each user, increase allowance
        const transfer_weiValue = utils.parseEther("12010");
        await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user2,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user3,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user4,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user5,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user6,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user7,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user8,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user9,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user10,transfer_weiValue)
        // increase allowance
        await _busd.connect(signers[1]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[2]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[3]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[4]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[5]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[6]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[7]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[8]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[9]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[10]).increaseAllowance(_dpnm.address,transfer_weiValue)

        //activate users
        for (let i=1;i<=10;i++) {
            await _dpnm.connect(signers[i]).activate(signers[i].address,signers[i-1].address);    
        }

        // prestart disabled
        await _busd.connect(_busd_owner).transfer(owner,utils.parseEther("1"))
        await _busd.connect(_owner).increaseAllowance(_dpnm.address,utils.parseEther("1"))
        await _dpnm.disablePrestartMode()

        //min dpnm buy increased to 1000
        const dailyBuy_weiValue = utils.parseEther("1000");

        await _dpnm.setDailyBuyLimit(dailyBuy_weiValue)
        // every user buy dpnm for 50 busd
        const buy_weiValue = utils.parseEther("1000");
        let totalDPNM = 0;
        let contrBalance = 0;
        let dpnmPrice = 0;
        totalDPNM = utils.formatEther(await _dpnm.totaldPNM());
        console.log("DPNM=",totalDPNM);

        contrBalance = utils.formatEther(await _busd.balanceOf(_dpnm.address));
        // console.log("Balance=",contrBalance);
        
        for (let day=1;day<13;day++) {
            // console.log("******DAY=%s*****",day)
            for (let i=1;i<=10;i++) {
                // console.log("User=",i);

                // dpnmPrice = utils.formatEther(await _dpnm.getdPNMPrice());
                // console.log("Price=",dpnmPrice);

                await _dpnm.connect(signers[i]).buydPNM(buy_weiValue);
                // totalDPNM = utils.formatEther(await _dpnm.totaldPNM());
                // console.log("DPNM=",totalDPNM);

                // contrBalance = utils.formatEther(await _busd.balanceOf(_dpnm.address));
                // console.log("Balance=",contrBalance);
                // console.log('--------\n')
            
            }

            //wait one day
            await time.increase(60*60*24);

        }
        
        console.log("Total earnings=", utils.formatEther(await _dpnm.totalUsersEarnings()));
        console.log("Fee collector=", utils.formatEther(await _busd.balanceOf(feeCollector)));
        console.log("Liquidity=", utils.formatEther(await _busd.balanceOf(_dpnm.address)));
        console.log("dPNM total=", utils.formatEther(await _dpnm.totaldPNM()));
        console.log("GWT total=", utils.formatEther(await _gwt.totalSupply()));
        console.log("***************DONE FIXTURE**********");
        
        return { _dpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _gwt };

    }

    /**
     * @dev Fixture. 10 users activate. Prestart disabled. Max daily buy limit increased to 1000 BUSD.
     * For 4 days every user buy dPNM for 1000 BUSD daily
     * @returns 
     */
    async function users10Buy1000dPNMFor4days() {
        const { _dpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);
        let signers = await ethers.getSigners();
        usersAmount = 10
        buyAmount = 1000
        daysAmount = 5
        dailyBuyLimit = 1000

        console.log("***LOAD FIXTURE*** | %s Users | %s buy | %s days",usersAmount,buyAmount,daysAmount);
        // transfer 50 BUSD to each user, increase allowance
        const transfer_weiValue = utils.parseEther(String(buyAmount*daysAmount+10));
        await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user2,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user3,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user4,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user5,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user6,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user7,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user8,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user9,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user10,transfer_weiValue)
        // increase allowance
        await _busd.connect(signers[1]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[2]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[3]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[4]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[5]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[6]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[7]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[8]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[9]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[10]).increaseAllowance(_dpnm.address,transfer_weiValue)

        //activate users
        for (let i=1;i<=usersAmount;i++) {
            await _dpnm.connect(signers[i]).activate(signers[i].address,signers[i-1].address);    
        }

        // prestart disabled
        await _busd.connect(_busd_owner).transfer(owner,utils.parseEther("1"))
        await _busd.connect(_owner).increaseAllowance(_dpnm.address,utils.parseEther("1"))
        await _dpnm.disablePrestartMode()

        //min dpnm buy increased to 1000
        const dailyBuy_weiValue = utils.parseEther("1000");

        await _dpnm.setDailyBuyLimit(dailyBuy_weiValue)
        // every user buy dpnm for 50 busd
        const buy_weiValue = utils.parseEther(String(dailyBuyLimit));
        let totalDPNM = 0;
        let contrBalance = 0;
        let dpnmPrice = 0;
        totalDPNM = utils.formatEther(await _dpnm.totaldPNM());
        // console.log("DPNM=",totalDPNM);

        contrBalance = utils.formatEther(await _busd.balanceOf(_dpnm.address));
        // console.log("Balance=",contrBalance);
        
        for (let day=1;day<daysAmount;day++) {
            // console.log("******DAY=%s*****",day)
            for (let i=1;i<=10;i++) {
                // console.log("User=",i);

                // dpnmPrice = utils.formatEther(await _dpnm.getdPNMPrice());
                // console.log("Price=",dpnmPrice);

                await _dpnm.connect(signers[i]).buydPNM(buy_weiValue);
                // totalDPNM = utils.formatEther(await _dpnm.totaldPNM());
                // console.log("DPNM=",totalDPNM);

                // contrBalance = utils.formatEther(await _busd.balanceOf(_dpnm.address));
                // console.log("Balance=",contrBalance);
                // console.log('--------\n')
            
            }

            //wait one day
            await time.increase(60*60*24);

        }
        
        console.log("Total earnings=", utils.formatEther(await _dpnm.totalUsersEarnings()));
        console.log("Fee collector=", utils.formatEther(await _busd.balanceOf(feeCollector)));
        console.log("Liquidity=", utils.formatEther(await _busd.balanceOf(_dpnm.address)));
        console.log("dPNM total=", utils.formatEther(await _dpnm.totaldPNM()));
        console.log("GWT total=", utils.formatEther(await _gwt.totalSupply()));
        console.log("***************DONE FIXTURE**********");
        
        return { _dpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _gwt };

    }

    /**
     * @dev Fixture. 10 users activate. Prestart disabled. Max daily buy limit increased to 10 000 BUSD.
     * For 10 days every user buy dPNM for 10 000 BUSD daily
     * @returns 
     */
    async function users10Buy10000dPNMFor10days() {
        const { _dpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);
        let signers = await ethers.getSigners();
        usersAmount = 10
        buyAmount = 10000
        daysAmount = 11
        dailyBuyLimit = 10000

        console.log("***LOAD FIXTURE*** | %s Users | %s buy | %s days",usersAmount,buyAmount,daysAmount);
        // transfer 50 BUSD to each user, increase allowance
        const transfer_weiValue = utils.parseEther(String(buyAmount*daysAmount+10));
        await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user2,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user3,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user4,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user5,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user6,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user7,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user8,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user9,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user10,transfer_weiValue)
        // increase allowance
        await _busd.connect(signers[1]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[2]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[3]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[4]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[5]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[6]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[7]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[8]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[9]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[10]).increaseAllowance(_dpnm.address,transfer_weiValue)

        //activate users
        for (let i=1;i<=usersAmount;i++) {
            await _dpnm.connect(signers[i]).activate(signers[i].address,signers[i-1].address);    
        }

        // prestart disabled
        await _busd.connect(_busd_owner).transfer(owner,utils.parseEther("1"))
        await _busd.connect(_owner).increaseAllowance(_dpnm.address,utils.parseEther("1"))
        await _dpnm.disablePrestartMode()

        //min dpnm buy increased to 1000
        const dailyBuy_weiValue = utils.parseEther(String(dailyBuyLimit));

        await _dpnm.setDailyBuyLimit(dailyBuy_weiValue)
        // every user buy dpnm for 50 busd
        const buy_weiValue = utils.parseEther(String(dailyBuyLimit));
        let totalDPNM = 0;
        let contrBalance = 0;
        let dpnmPrice = 0;
        totalDPNM = utils.formatEther(await _dpnm.totaldPNM());
        // console.log("DPNM=",totalDPNM);

        contrBalance = utils.formatEther(await _busd.balanceOf(_dpnm.address));
        // console.log("Balance=",contrBalance);
        
        for (let day=1;day<daysAmount;day++) {
            // console.log("******DAY=%s*****",day)
            for (let i=1;i<=10;i++) {
                // console.log("User=",i);

                // dpnmPrice = utils.formatEther(await _dpnm.getdPNMPrice());
                // console.log("Price=",dpnmPrice);

                await _dpnm.connect(signers[i]).buydPNM(buy_weiValue);
                // totalDPNM = utils.formatEther(await _dpnm.totaldPNM());
                // console.log("DPNM=",totalDPNM);

                // contrBalance = utils.formatEther(await _busd.balanceOf(_dpnm.address));
                // console.log("Balance=",contrBalance);
                // console.log('--------\n')
            
            }

            //wait one day
            await time.increase(60*60*24);

        }
        
        console.log("Total earnings=", utils.formatEther(await _dpnm.totalUsersEarnings()));
        console.log("Fee collector=", utils.formatEther(await _busd.balanceOf(feeCollector)));
        console.log("Liquidity=", utils.formatEther(await _busd.balanceOf(_dpnm.address)));
        console.log("dPNM total=", utils.formatEther(await _dpnm.totaldPNM()));
        console.log("GWT total=", utils.formatEther(await _gwt.totalSupply()));
        console.log("***************DONE FIXTURE**********");
        
        return { _dpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _gwt };

    }

    /**
     * @dev Fixture. 10 users activate. Prestart disabled. 
     * For 29 days every user buy dPNM for 50 BUSD daily
     * @returns 
     */
    async function tenUsersBuy50DPNMFor13Days() {
        const { _dpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);
        let signers = await ethers.getSigners();

        console.log("***************LOAD FIXTURE**********");
        // transfer 50 BUSD to each user, increase allowance
        const transfer_weiValue = utils.parseEther("1510");
        await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user2,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user3,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user4,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user5,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user6,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user7,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user8,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user9,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user10,transfer_weiValue)
        // increase allowance
        await _busd.connect(signers[1]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[2]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[3]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[4]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[5]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[6]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[7]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[8]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[9]).increaseAllowance(_dpnm.address,transfer_weiValue)
        await _busd.connect(signers[10]).increaseAllowance(_dpnm.address,transfer_weiValue)

        //activate users
        for (let i=1;i<=10;i++) {
            await _dpnm.connect(signers[i]).activate(signers[i].address,signers[i-1].address);    
        }

        // prestart disabled
        await _busd.connect(_busd_owner).transfer(owner,utils.parseEther("1"))
        await _busd.connect(_owner).increaseAllowance(_dpnm.address,utils.parseEther("1"))
        await _dpnm.disablePrestartMode()

        //min dpnm buy increased to 1000
        // const dailyBuy_weiValue = utils.parseEther("500");

        // await _dpnm.setDailyBuyLimit(dailyBuy_weiValue)
        // every user buy dpnm for 50 busd
        const buy_weiValue = utils.parseEther("50");
        let totalDPNM = 0;
        let contrBalance = 0;
        let dpnmPrice = 0;
        totalDPNM = utils.formatEther(await _dpnm.totaldPNM());
        console.log("DPNM=",totalDPNM);

        contrBalance = utils.formatEther(await _busd.balanceOf(_dpnm.address));
        // console.log("Balance=",contrBalance);
        //first user buy one time
        await _dpnm.connect(signers[1]).buydPNM(buy_weiValue);
        // showUserData(_dpnm,_busd,_gwt,user1,"user1")
        
        for (let day=1;day<30;day++) {
            // console.log("******DAY=%s*****",day)
            for (let i=2;i<=10;i++) {
                // console.log("User=",i);

                // dpnmPrice = utils.formatEther(await _dpnm.getdPNMPrice());
                // console.log("Price=",dpnmPrice);

                await _dpnm.connect(signers[i]).buydPNM(buy_weiValue);
                // totalDPNM = utils.formatEther(await _dpnm.totaldPNM());
                // console.log("DPNM=",totalDPNM);

                // contrBalance = utils.formatEther(await _busd.balanceOf(_dpnm.address));
                // console.log("Balance=",contrBalance);
                // console.log('--------\n')
            
            }

            //wait one day
            await time.increase(60*60*24);
            // showUserData(_dpnm,_busd,_gwt,user1,"user1")


        }
        
        console.log("Total earnings=", utils.formatEther(await _dpnm.totalUsersEarnings()));
        console.log("Fee collector=", utils.formatEther(await _busd.balanceOf(feeCollector)));
        console.log("Liquidity=", utils.formatEther(await _busd.balanceOf(_dpnm.address)));
        console.log("dPNM total=", utils.formatEther(await _dpnm.totaldPNM()));
        console.log("GWT total=", utils.formatEther(await _gwt.totalSupply()));
        console.log("***************DONE FIXTURE**********");
        
        return { _dpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _gwt };

    }


    describe("==1) Deployment dPNM", function () {


        it("Prestart should be enabled", async function () {
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(deploydPNMandTree);

            expect(await _dpnm.prestartMode()).to.equal(true);
        });

        it("Should set the right owner", async function () {
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(deploydPNMandTree);

            expect(await _dpnm.owner()).to.equal(_owner.address);
        });

        it("Should set the right fee collector", async function () {
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(deploydPNMandTree);

            expect(await _dpnm.feeCollector()).to.equal(feeCollector);
        });

        it("Should create first user in tree", async function () {
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(deploydPNMandTree);

            expect(await _dpnm.totalUsers()).to.equal(1);
        });

        it("First user should be contract owner", async function () {
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(deploydPNMandTree);
            expect(await _dpnm.isUserExists(_owner.address)).to.equal(true);
        });

        it("Transfer return false", async function () {
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(deploydPNMandTree);
            expect(await _dpnm.transfer(_owner.address,1)).to.equal(false);
        });

        it("getdPNMPrice returns 0 on prestart", async function () {
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(deploydPNMandTree);
            expect(await _dpnm.getdPNMPrice()).to.equal(utils.parseEther("0"));
        });

        it("Check metadata", async function () {
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(deploydPNMandTree);
            expect(await _dpnm.name()).to.equal("dPNM Token");
            expect(await _dpnm.symbol()).to.equal("dPNM");
            expect(Number(await _dpnm.decimals())).to.equal(18);
        });


    });

    describe("==2 )Deployment Tree", function () {
        it("dPNM contract address added to whitelist", async function () {
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(deploydPNMandTree);

            expect(await _tree.returnAllowedContract(0)).to.equal(_dpnm.address);
        });

        it("Should set the right owner", async function () {
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(deploydPNMandTree);

            expect(await _tree.owner()).to.equal(_owner.address);
        });

        it("First user positioned in a tree", async function () {
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(deploydPNMandTree);
            expect(await _tree.isUserexist(_owner.address)).to.equal(true);
        });


    });

    describe("==3) Deployment GWT", function () {
        it("dPNM contract address added to whitelist", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);

            expect(await _gwt.returnAllowedContract(0)).to.equal(_dpnm.address);
        });

        it("Should set the right owner", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);

            expect(await _gwt.owner()).to.equal(_owner.address);
        });

        it("Staking settings should be correct", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);
            const pool1Data = await _gwt.stakingPools(1)
            const pool2Data = await _gwt.stakingPools(2)
            const pool3Data = await _gwt.stakingPools(3)
            const pool4Data = await _gwt.stakingPools(4)
            const pool5Data = await _gwt.stakingPools(5)
            const pool6Data = await _gwt.stakingPools(6)

            expect(pool1Data[1]).to.equal(10);
            expect(pool2Data[1]).to.equal(20);
            expect(pool3Data[1]).to.equal(25);
            expect(pool4Data[1]).to.equal(30);
            expect(pool5Data[1]).to.equal(40);
            expect(pool6Data[1]).to.equal(50);
        });


    });

    /**
     * @dev this block mostly testing tree by checking that user are correctly positioned, deposited with bonuses etc.
     */
    describe("==4) Prestart | First user after owner join dPNM", function () {
        // return(0);
        it("Total users equals 2", async function () {
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(firstUserRegisters);
            expect(await _dpnm.totalUsers()).to.equal(2);
        });

        it("Fee collector should earn 9.9 BUSD", async function () {
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(firstUserRegisters);
            const weiValue = utils.parseEther("9.9");
            expect(await _busd.balanceOf(feeCollector)).to.equal(weiValue);
        });

        it("User tree timer should be increased", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3 } = await loadFixture(firstUserRegisters);
            const treeDays = await _dpnm.treePaymentPeriod()
            const userTreePaidUntil = await _dpnm.treeActiveUntil(user1)
            // getting timestamp
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;
            expect(await _dpnm.treeActiveUntil(user1)).to.equal(timestampBefore+Number(treeDays));
        });

        it("User tree lvl 1-3 should be enable, lvl 4 should be disabled", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3 } = await loadFixture(firstUserRegisters);
            expect(await _dpnm.getLvlsLockStatus(user1)).to.eql([true,true,true,false,false,false,false,false,false,false]);
        });


        it("Should be positioned in a tree", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3 } = await loadFixture(firstUserRegisters);
            expect(await _tree.isUserexist(user1)).to.equal(true);
        });

        it("Sponsor in a tree should be owner", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3 } = await loadFixture(firstUserRegisters);
            const treeData = await _tree.treeUsers(user1);
            
            expect(treeData[0]).to.equal(owner);
        });

        it("Should be in left leg of the owner", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3 } = await loadFixture(firstUserRegisters);
            const treeData = await _tree.treeUsers(owner);

            expect(treeData[1]).to.equal(user1);
        });

        it("Owner first lvl refs should equal to 1", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3 } = await loadFixture(firstUserRegisters);
            const treeRefsData = await _tree.getTreeRefs(owner);
            expect(treeRefsData[0]).to.equal(1);
        });

        it("Owner gets comission for 0.1 BUSD", async function () {
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(firstUserRegisters);
            const weiValue = utils.parseEther("0.1");
            expect(await _busd.balanceOf(owner)).to.equal(weiValue);
        });

        it("User cannot pay tree once more until he buy dPNM", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(firstUserRegisters);
            depositBUSD(_busd,_busd_owner,user1,"10");
            await _busd.connect(_user1).increaseAllowance(_dpnm.address,utils.parseEther("10"))

            await expect(_dpnm.connect(_user1).makeTreePayment()).to.be.revertedWith("Need first dPNM buy");
        });

        it("User cannot activate tree once more", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(firstUserRegisters);
            depositBUSD(_busd,_busd_owner,user1,"10");
            await _busd.connect(_user1).increaseAllowance(_dpnm.address,utils.parseEther("10"))
            
            await expect(_dpnm.connect(_user1).activate(user1,owner)).to.be.revertedWith("User already exists");
        });

        it("Can not buy dpnm at prestart", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(firstUserRegisters);
            depositBUSD(_busd,_busd_owner,user1,"20");
            await _busd.connect(_user1).increaseAllowance(_dpnm.address,utils.parseEther("20"))

            await expect(_dpnm.connect(_user1).buydPNM("20")).to.be.revertedWith("After Prestart");
        });



    });

    /**
     * @dev this block mostly testing tree by checking that user are correctly positioned, deposited with bonuses etc.
     */
     describe("==5) Prestart | Second user registers using first user ref link", function () {
        // return(0);
        it("Total users equals 3", async function () {
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(secondUserRegisters);
            expect(await _dpnm.totalUsers()).to.equal(3);
        });

        it("Fee collector should earn 19.7 BUSD", async function () {
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(secondUserRegisters);
            const weiValue = utils.parseEther("19.7");
            expect(await _busd.balanceOf(feeCollector)).to.equal(weiValue);
        });

        it("User tree timer should be increased", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3 } = await loadFixture(secondUserRegisters);
            const treeDays = await _dpnm.treePaymentPeriod()
            const userTreePaidUntil = await _dpnm.treeActiveUntil(user2)
            // getting timestamp
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;
            expect(await _dpnm.treeActiveUntil(user2)).to.equal(timestampBefore+Number(treeDays));
        });

        it("User tree lvl 1-3 should be enable, lvl 4 should be disabled", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3 } = await loadFixture(secondUserRegisters);
            expect(await _dpnm.getLvlsLockStatus(user2)).to.eql([true,true,true,false,false,false,false,false,false,false]);
        });


        it("Should be positioned in a tree", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3 } = await loadFixture(secondUserRegisters);
            expect(await _tree.isUserexist(user2)).to.equal(true);
        });

        it("Sponsor in a tree should be user1", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3 } = await loadFixture(secondUserRegisters);
            const treeData = await _tree.treeUsers(user2);
            
            expect(treeData[0]).to.equal(user1);
        });

        it("Should be in left leg of the user1", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3 } = await loadFixture(secondUserRegisters);
            const treeData = await _tree.treeUsers(user1);

            expect(treeData[1]).to.equal(user2);
        });

        it("User1 first lvl refs should equal to 1", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3 } = await loadFixture(secondUserRegisters);
            const treeRefsData = await _tree.getTreeRefs(user1);
            expect(treeRefsData[0]).to.equal(1);
        });

        it("Owner second lvl refs should equal to 1", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3 } = await loadFixture(secondUserRegisters);
            const treeRefsData = await _tree.getTreeRefs(owner);
            expect(treeRefsData[1]).to.equal(1);
        });


        it("Owner gets comission for 0.1 BUSD. Total 0.2 BUSD", async function () {
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(secondUserRegisters);
            const weiValue = utils.parseEther("0.2");
            expect(await _busd.balanceOf(owner)).to.equal(weiValue);
        });

        it("User1 gets comission for 0.1 BUSD", async function () {
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(secondUserRegisters);
            const weiValue = utils.parseEther("0.1");
            expect(await _busd.balanceOf(user1)).to.equal(weiValue);
        });

        it("User3 get correct position", async function () {
            //User3 when using user1 as ref should get correct position check
            const { _dpnm, _busd, _tree, _owner } = await loadFixture(secondUserRegisters);
            const position = await _tree.findPositionSpot(user3,owner,10)
            expect(Number(position[1])).to.equal(2);//positioned in right leg
            expect(Number(position[2])).to.equal(1);//positioned on 1 lvl from owner
        });




    });

    /**
     * @dev this block mostly testing tree by checking that user are correctly positioned, deposited with bonuses etc.
     */
     describe("==6) Prestart | 10 users registers using each one ref link, so from owner 10 lvl", function () {
        // return(0);
        it("Total users equals 11", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersRegistered);
            expect(await _dpnm.totalUsers()).to.equal(11);
        });

        it("Onwer get correct comissins", async function () {
            //1-3 lvl for 0.1 BUSD, 4-6 lvl for 0.5 BUSD, 7-10 lvl for 0.8 BUSD. Total=5 BUSD
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersRegistered);
            const weiValue = utils.parseEther("5");
            expect(await _busd.balanceOf(owner)).to.equal(weiValue);
        });

        it("Fee collector get correct comissions", async function () {
            //All except comissions goes to fee collector. 9.9+9.8+9.7+9.2+8.7+8.2+7.4+6.6+5.8+5 = 80.3
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersRegistered);
            const weiValue = utils.parseEther("80.3");
            expect(await _busd.balanceOf(feeCollector)).to.equal(weiValue);
        });

        it("Owner have 10 users in tree", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersRegistered);
            const treeRefsData = await _tree.getTreeRefs(owner);
            const treeRefsNumber = [Number(treeRefsData[0]),
            Number(treeRefsData[1]),
            Number(treeRefsData[2]),
            Number(treeRefsData[3]),
            Number(treeRefsData[4]),
            Number(treeRefsData[5]),
            Number(treeRefsData[6]),
            Number(treeRefsData[7]),
            Number(treeRefsData[8]),
            Number(treeRefsData[9]),]
            expect(treeRefsNumber).to.eql([1,1,1,1,1,1,1,1,1,1]);

        });

        it("User 1 have 9 users in tree", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersRegistered);
            const treeRefsData = await _tree.getTreeRefs(user1);
            const treeRefsNumber = [Number(treeRefsData[0]),
            Number(treeRefsData[1]),
            Number(treeRefsData[2]),
            Number(treeRefsData[3]),
            Number(treeRefsData[4]),
            Number(treeRefsData[5]),
            Number(treeRefsData[6]),
            Number(treeRefsData[7]),
            Number(treeRefsData[8]),
            Number(treeRefsData[9]),]

            expect(treeRefsNumber).to.eql([1,1,1,1,1,1,1,1,1,0]);
        });

        it("User 5 get correct comissions", async function () {
            //0.1+0.1+0.1+0.5+0.5
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersRegistered);
            const weiValue = utils.parseEther("1.3");
            expect(await _busd.balanceOf(user5)).to.equal(weiValue);
        });


        it("User 5 located in lvl 4 from user1", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersRegistered);
            const lvl = await _tree.connect(signers[1]).getUserDistance(user5,10);
            expect(Number(lvl)).to.equal(4);
        });

        it("User 5 located in lvl 5 from owner", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersRegistered);
            const lvl = await _tree.getUserDistance(user5,10);
            expect(Number(lvl)).to.equal(5);
        });


    });
    
    /**
     * @dev this block mostly testing tree by checking that user are correctly positioned, deposited with bonuses etc.
     */
     describe("==7) Prestart | 13 users registers using owner reflink",  () => {
        // return(0);

        it("Total users equals 13+1", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(thirteenUsersRegisteredWithOwnerReflink);
            expect(await _dpnm.totalUsers()).to.equal(14);
        });

        it("Onwer get correct comissins", async function () {
            //3*0.1 + 9*0.1 + 1*0.1 == 1.3 BUSD
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(thirteenUsersRegisteredWithOwnerReflink);
            const weiValue = utils.parseEther("1.3");
            expect(await _busd.balanceOf(owner)).to.equal(weiValue);
        });

        it("User1 get correct comissins", async function () {
            //3*0.1+1*0.1
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(thirteenUsersRegisteredWithOwnerReflink);
            const weiValue = utils.parseEther("0.4");
            expect(await _busd.balanceOf(user1)).to.equal(weiValue);
        });

        it("User2 get correct comissins with BUSD", async function () {
            //3*0.1
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(thirteenUsersRegisteredWithOwnerReflink);
            const weiValue = utils.parseEther("0.3");
            expect(await _busd.balanceOf(user2)).to.equal(weiValue);
        });

        it("User2 get correct comissins with counter", async function () {
            //3*0.1
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(thirteenUsersRegisteredWithOwnerReflink);
            const weiValue = utils.parseEther("0.3");
            const counter = await _dpnm.getUserData(user2);
            expect(counter[3]).to.equal(weiValue);
        });

        it("Fee collector get correct comissions", async function () {
            //3*9.9 + 9*9.8+1*9.7 = 127.6 BUSD
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(thirteenUsersRegisteredWithOwnerReflink);
            const weiValue = utils.parseEther("127.6");
            expect(await _busd.balanceOf(feeCollector)).to.equal(weiValue);
        });

        it("Owner have 3 usrs at lvl1, 9 usrs at lvl2 and 1 at lvl3", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(thirteenUsersRegisteredWithOwnerReflink);
            const treeRefsData = await _tree.getTreeRefs(owner);
            const treeRefsNumber = [Number(treeRefsData[0]),
            Number(treeRefsData[1]),
            Number(treeRefsData[2]),
            Number(treeRefsData[3]),
            Number(treeRefsData[4]),
            Number(treeRefsData[5]),
            Number(treeRefsData[6]),
            Number(treeRefsData[7]),
            Number(treeRefsData[8]),
            Number(treeRefsData[9]),]

            expect(treeRefsNumber).to.eql([3,9,1,0,0,0,0,0,0,0]);
        });

        it("User 1 have 3 usrs at lvl1 and 1 usr at lvl2", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(thirteenUsersRegisteredWithOwnerReflink);
            const treeRefsData = await _tree.getTreeRefs(user1);
            const treeRefsNumber = [Number(treeRefsData[0]),
            Number(treeRefsData[1]),
            Number(treeRefsData[2]),
            Number(treeRefsData[3]),
            Number(treeRefsData[4]),
            Number(treeRefsData[5]),
            Number(treeRefsData[6]),
            Number(treeRefsData[7]),
            Number(treeRefsData[8]),
            Number(treeRefsData[9]),]

    
            expect(treeRefsNumber).to.eql([3,1,0,0,0,0,0,0,0,0]);
        });

        it("User 2 has 3 usrs at lvl 1", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(thirteenUsersRegisteredWithOwnerReflink);
            const treeRefsData = await _tree.getTreeRefs(user2);
            const treeRefsNumber = [Number(treeRefsData[0]),
            Number(treeRefsData[1]),
            Number(treeRefsData[2]),
            Number(treeRefsData[3]),
            Number(treeRefsData[4]),
            Number(treeRefsData[5]),
            Number(treeRefsData[6]),
            Number(treeRefsData[7]),
            Number(treeRefsData[8]),
            Number(treeRefsData[9]),]

            expect(treeRefsNumber).to.eql([3,0,0,0,0,0,0,0,0,0]);
        });





    });

    /**
     * @dev this block test all conditions are met when prestart is disabled and users start buying dPNM
     */
     describe("==8) NO Prestart | 10 users registered | Everyone buy dPNM for 50 BUSD", () => {
        // return(0);
        it("Prestart disabled", async () => {
            const { _dpnm, _busd, _tree, _owner, signers, _gwt } = await loadFixture(tenUsersBuyDPNM);

            expect(await _dpnm.prestartMode()).to.equal(false);
        });

        it("User 5 GWT balance = 20 GWT", async () => {
            const { _dpnm, _busd, _tree, _owner, signers, _gwt } = await loadFixture(tenUsersBuyDPNM);
            //10 gwt for activation 10 gwt for dpnmbuy            
            const weiValue = utils.parseEther("20.0");

            expect(await _gwt.balanceOf(user5)).to.equal(weiValue);
        });

        it("User5 total earn = 1.6 BUSD = BUSD balance", async function () {
            //5 lines from tree = 0.1*3 + 0.5*2 = 1.3 BUSD
            //3 lines for dpnmbuy = 0.2% of 50 = 0.3 BUSD
            //total 1.6
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersBuyDPNM);
            const userData = await _dpnm.getUserData(user5)
            const weiValue = utils.parseEther("1.6");

            //1.6 BUSD
            expect(userData[3]).to.equal(await _busd.balanceOf(user5));
            expect(userData[3]).to.equal(weiValue);
        });

        it("Users get turnover", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersBuyDPNM);
            const user1Data = await _dpnm.getUserData(user1)
            const user2Data = await _dpnm.getUserData(user2)
            const user3Data = await _dpnm.getUserData(user3)
            const user4Data = await _dpnm.getUserData(user4)
            const user5Data = await _dpnm.getUserData(user5)
            const user6Data = await _dpnm.getUserData(user6)
            const user7Data = await _dpnm.getUserData(user7)
            const user8Data = await _dpnm.getUserData(user8)
            const user9Data = await _dpnm.getUserData(user9)
            const user10Data = await _dpnm.getUserData(user10)
            
            expect(utils.formatEther(user1Data[1])).to.equal("450.0");
            expect(utils.formatEther(user2Data[1])).to.equal("400.0");
            expect(utils.formatEther(user3Data[1])).to.equal("350.0");
            expect(utils.formatEther(user4Data[1])).to.equal("300.0");
            expect(utils.formatEther(user5Data[1])).to.equal("250.0");
            expect(utils.formatEther(user6Data[1])).to.equal("200.0");
            expect(utils.formatEther(user7Data[1])).to.equal("150.0");
            expect(utils.formatEther(user8Data[1])).to.equal("100.0");
            expect(utils.formatEther(user9Data[1])).to.equal("50.0");
            expect(utils.formatEther(user10Data[1])).to.equal("0.0");
        });

        it("Users get earn limits", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersBuyDPNM);
            const user1Data = await _dpnm.getUserData(user1)
            const user2Data = await _dpnm.getUserData(user2)
            const user3Data = await _dpnm.getUserData(user3)
            const user4Data = await _dpnm.getUserData(user4)
            const user5Data = await _dpnm.getUserData(user5)
            const user6Data = await _dpnm.getUserData(user6)
            const user7Data = await _dpnm.getUserData(user7)
            const user8Data = await _dpnm.getUserData(user8)
            const user9Data = await _dpnm.getUserData(user9)
            const user10Data = await _dpnm.getUserData(user10)
            
            expect(utils.formatEther(user1Data[2])).to.equal("100.0");
            expect(utils.formatEther(user2Data[2])).to.equal("100.0");
            expect(utils.formatEther(user3Data[2])).to.equal("100.0");
            expect(utils.formatEther(user4Data[2])).to.equal("100.0");
            expect(utils.formatEther(user5Data[2])).to.equal("100.0");
            expect(utils.formatEther(user6Data[2])).to.equal("100.0");
            expect(utils.formatEther(user7Data[2])).to.equal("100.0");
            expect(utils.formatEther(user8Data[2])).to.equal("100.0");
            expect(utils.formatEther(user9Data[2])).to.equal("100.0");
            expect(utils.formatEther(user10Data[2])).to.equal("100.0");
        });


        it("User 1 lost profit = 3.9 BUSD", async function () {
            //lvl 4,5,6 each 0.5 busd, lvl 7-9 each 0.8 BUSD, total = 3.9 BUSD
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersBuyDPNM);
            const lost_profit = await _dpnm.getLostProfit(user1)

            expect(utils.formatEther(lost_profit[0])).to.equal("0.0");
            expect(utils.formatEther(lost_profit[1])).to.equal("0.0");
            expect(utils.formatEther(lost_profit[2])).to.equal("0.0");
            expect(utils.formatEther(lost_profit[3])).to.equal("0.5");
            expect(utils.formatEther(lost_profit[4])).to.equal("0.5");
            expect(utils.formatEther(lost_profit[5])).to.equal("0.5");
            expect(utils.formatEther(lost_profit[6])).to.equal("0.8");
            expect(utils.formatEther(lost_profit[7])).to.equal("0.8");
            expect(utils.formatEther(lost_profit[8])).to.equal("0.8");
            expect(utils.formatEther(lost_profit[9])).to.equal("0.0");
        });

        it("User 5 lost profit", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersBuyDPNM);
            const lost_profit = await _dpnm.getLostProfit(user5)

            expect(utils.formatEther(lost_profit[0])).to.equal("0.0");
            expect(utils.formatEther(lost_profit[1])).to.equal("0.0");
            expect(utils.formatEther(lost_profit[2])).to.equal("0.0");
            expect(utils.formatEther(lost_profit[3])).to.equal("0.5");
            expect(utils.formatEther(lost_profit[4])).to.equal("0.5");
            expect(utils.formatEther(lost_profit[5])).to.equal("0.0");
            expect(utils.formatEther(lost_profit[6])).to.equal("0.0");
            expect(utils.formatEther(lost_profit[7])).to.equal("0.0");
            expect(utils.formatEther(lost_profit[8])).to.equal("0.0");
            expect(utils.formatEther(lost_profit[9])).to.equal("0.0");
        });

        it("feeCollector balance", async function () {
            /* Goes to collector
            Activation = 80.3:
            u1 = 9.9
            u2 = 9.8
            u3 = 9.7
            u4 = 9.2
            u5 = 8.7
            u6 = 8.2
            u7 = 7.4
            u8 = 6.6
            u9 = 5.8
            u10 = 5
            Token buy = 24:
            u1 = 2.4
            u2 = 2.4
            u3 = 2.4
            u4 = 2.4
            u5 = 2.4
            u6 = 2.4
            u7 = 2.4
            u8 = 2.4
            u9 = 2.4
            u10 = 5
            Total = 104.3
             */
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersBuyDPNM);
            const balance = await _busd.balanceOf(feeCollector);
            
            expect(utils.formatEther(balance)).to.equal("104.3");
        });

        it("User 1 total buy = 50 BUSD", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersBuyDPNM);
            const total_buy = await _dpnm.getUserBuySellData(user1);
            expect(utils.formatEther(total_buy[2])).to.equal("50.0");
        });


        it("User 1 last24h bought", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersBuyDPNM);
            const user1Data = await _dpnm.getUserBuySellData(user1)
            
            expect(utils.formatEther(user1Data[1])).to.equal("50.0");
        });

        it("Sum of feecollectr + totaluserearnings + liquidity = 601 BUSD", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersBuyDPNM);
            const totalUserearn =  utils.formatEther(await _dpnm.totalUsersEarnings())
            // console.log("🚀 ~ file: dpnm_tests.js:1342 ~ totalUserearn", totalUserearn)
            const balanceCollector =  utils.formatEther(await _busd.balanceOf(feeCollector))
            // console.log("🚀 ~ file: dpnm_tests.js:1344 ~ balanceCollector", balanceCollector)
            const liquidty =  utils.formatEther(await _busd.balanceOf(_dpnm.address))
            // console.log("🚀 ~ file: dpnm_tests.js:1346 ~ liquidty", liquidty)
            
            expect(totalUserearn).to.equal("22.4");
            expect(balanceCollector).to.equal("104.3");
            expect(liquidty).to.equal("474.3");
        });

        it("Buy amount cannot be less than min", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersBuyDPNM);
            //10 busd tree activation payment
            await depositBUSD(_busd,signers[19],signers[10].address,"20")
            await _busd.connect(signers[10]).increaseAllowance(_dpnm.address,utils.parseEther("20"))

            await expect(_dpnm.connect(signers[10]).buydPNM(utils.parseEther("19"))).to.be.revertedWith("Less than min buy");

        });

        it("Buy amount cannot be more than daily limit", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersBuyDPNM);

            await depositBUSD(_busd,signers[19],signers[10].address,"20")
            await _busd.connect(signers[10]).increaseAllowance(_dpnm.address,utils.parseEther("20"))

            await expect(_dpnm.connect(signers[10]).buydPNM(utils.parseEther("20"))).to.be.revertedWith("Buy limit low");

        });

        it("Buy amount for last 24h increasing", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersBuyDPNM);
            //day passed, new limit is 50 BUSD
            await time.increase(60*60*24);

            await depositBUSD(_busd,signers[19],signers[10].address,"60")
            await _busd.connect(signers[10]).increaseAllowance(_dpnm.address,utils.parseEther("60"))
            await _dpnm.connect(signers[10]).buydPNM(utils.parseEther("20"))
            let buyData = await _dpnm.getUserBuySellData(signers[10].address)
            // console.log("🚀 ~ file: dpnm_tests.js:1436 ~ buyData", buyData)
            await _dpnm.connect(signers[10]).buydPNM(utils.parseEther("20"))
            buyData = await _dpnm.getUserBuySellData(signers[10].address)
            // console.log("🚀 ~ file: dpnm_tests.js:1436 ~ buyData", buyData)

            expect(utils.formatEther(buyData[1])).to.be.equal("40.0");

        });

        it("When liquidity increase User maxbuy limit increase 50 BUSD", async function () {
            //daily buy = 50 BUSD, bought for 50, so left 0. Sold for 20 so can buy 20
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(users10Buy10000dPNMFor10days);
            //wait for 1 day
            await time.increase(60*60*24*1);

            const dailyBuy_weiValue = utils.parseEther(String(dailyBuyLimit));
            await _dpnm.setDailyBuyLimit(0)
    
            const liquity = await _busd.balanceOf(_dpnm.address)
            console.log("🚀 ~ file: dpnm_tests.js:1451 ~ liquity", liquity)
            const buyLimit = await _dpnm.getMaxDailyBuy(user1)
            console.log("🚀 ~ file: dpnm_tests.js:1452 ~ buyLimit", buyLimit)
            
            expect(utils.formatEther(buyLimit)).to.equal("928.481");
        });

        it("When max buy on previous day bigger than today, no error", async function () {
            //daily buy = 50 BUSD, bought for 50, so left 0. Sold for 20 so can buy 20
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserRegisters);
            //buy limit increased to 100
            await _dpnm.setDailyBuyLimit(utils.parseEther("100"))
            let usermaxBuy = await _dpnm.getMaxDailyBuy(user2)
            // console.log("🚀 ~ file: dpnm_tests.js:781 ~ usermaxBuy", usermaxBuy)
            //user buy for 100
            await disablePrestart(_dpnm,_busd,_busd_owner,_owner)
            //buy dpnm for 50
            const weiValue = utils.parseEther("100");
    
            await depositBUSD(_busd,_busd_owner,user2,"100")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,weiValue)
            await _dpnm.connect(_user2).buydPNM(weiValue)
    

            //buy limit 50
            await _dpnm.setDailyBuyLimit(0)
            usermaxBuy = await _dpnm.getMaxDailyBuy(user2)
            // console.log("🚀 ~ file: dpnm_tests.js:781 ~ usermaxBuy", usermaxBuy)

            // await new Promise(r => setTimeout(r, 200000));
            //user buy 50
            //wait for 1 day
            // await time.increase(60*60*24*2);

            
            expect(utils.formatEther(usermaxBuy)).to.equal("0.0");
        });


    });

    /**
     * @dev this block test all conditions are met when prestart is disabled and users start buying dPNM then selling dPNM
     */
     describe("==9) NO Prestart | User buy 50 BUSD dPNM and sell 20 BUSD dPNM", function () {
        // return(0)
        it("User get 10 + 10 + 2 GWT", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(firstUserBuyAndSellDPNM);
            const gwtbal = await _gwt.balanceOf(user1)
            expect(utils.formatEther(gwtbal)).to.equal("22.0");
        });

        it("Fee collector should earn 9.8 BUSD", async function () {
            //activate 4 BUSD + lvl 8-10 = 4 + 0.8*3 = 6.4
            //buy dpnm sponsor get 0.1 BUSD. collector get 1.6%*3*50 BUSD = 2.4 BUSD
            //sell dpnm fee = 10% of 20 BUSD | 1 BUSD - fee, 1 BUSD - liquidity
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(firstUserBuyAndSellDPNM);
            const weiValue = utils.parseEther("9.8");
            expect(await _busd.balanceOf(feeCollector)).to.equal(weiValue);
        });

        it("Liquidity should equal 33 BUSD", async function () {
            //1 BUSD for prestart deactivate
            //tree payment 10 BUSD - 6.4 collector, - 0.1 owner
            //50 BUSD buy, +50, - 2.4 collector, - 0.1 owner
            //20 BUSD sell, -18 user1, -1 collector 
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(firstUserBuyAndSellDPNM);
            const weiValue = utils.parseEther("33");
            expect(await _busd.balanceOf(_dpnm.address)).to.equal(weiValue);
        });

        it("User earn limit left equals 80, total earn limit equals 100", async function () {
            //earn limit left 50*2 = 100 - 20 = 80
            //total = 100
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(firstUserBuyAndSellDPNM);
            const user1Data = await _dpnm.getUserData(user1)
            
            expect(utils.formatEther(user1Data[2])).to.equal("80.0");
            expect(utils.formatEther(user1Data[4])).to.equal("100.0");

        });


        it("User last sell data time|amount correct", async function () {
            //last sell amount = 20 busd
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(firstUserBuyAndSellDPNM);
            const user1Data = await _dpnm.getUserBuySellData(user1)
            
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;
            
            expect(timestampBefore).to.equal(Number(user1Data[3]));//sold in last block
            expect(utils.formatEther(user1Data[4])).to.equal("20.0");
        });

        it("User maxbuy limit = 20 BUSD", async function () {
            //daily buy = 50 BUSD, bought for 50, so left 0. Sold for 20 so can buy 20
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(firstUserBuyAndSellDPNM);
            //wait for 1 day
            // await time.increase(60*60*24*2);

            const user1Data = await _dpnm.getMaxDailyBuy(user1)
            
            expect(utils.formatEther(user1Data)).to.equal("20.0");
        });

        it("User busd balance = 18 BUSD", async function () {
            //spent 10 activation + 50 buy
            //sold for 20 - 10% = 18
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(firstUserBuyAndSellDPNM);
            

            expect(utils.formatEther(await _busd.balanceOf(user1))).to.equal("18.0");
        });

        it("dPNM supply equal 5.08+1 dpnm", async function () {
            //initial supply = 1, liquidity = 4.5 BUSD | price =4.5 | bought for 50 BUSD, get 8.88 dpnm
            //new price = 5.263
            //sell dpnm = 3.8
            //left 5.08 dpnm + 1dpnm of onwer
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(firstUserBuyAndSellDPNM);
            const supplyData = await _dpnm.totalSupply();
            const balance = await _dpnm.balanceOf(user1);

            expect(utils.formatEther(balance)).to.equal("5.085470085470085469");
            expect(utils.formatEther(supplyData)).to.equal("6.085470085470085469");
        });

        it("Owner gets comission for 0.2 BUSD", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(firstUserBuyAndSellDPNM);
            const weiValue = utils.parseEther("0.2");
            
            expect(await _busd.balanceOf(owner)).to.equal(weiValue);
        });

        it("User have enough dPNM for sale", async function () {
            //last sell amount = 20 busd
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            const user1Data = await _dpnm.getUserBuySellData(user1)
            
            await expect(_dpnm.connect(_user2).selldPNM(utils.parseEther("60"))).to.be.revertedWith("Not enough dPNM");
        });

        it("48 hour sell amount increased correctly", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            
            await _dpnm.connect(_user2).selldPNM(utils.parseEther("10"))
            let userData = await _dpnm.getUserBuySellData(user2)
            expect(utils.formatEther(userData[4])).to.be.equal("10.0")

            await _dpnm.connect(_user2).selldPNM(utils.parseEther("10"))
            userData = await _dpnm.getUserBuySellData(user2)
            expect(utils.formatEther(userData[4])).to.be.equal("20.0")

        });


        it("User have enough earnlimit for dPNM sale | Proportional dPNM decrease on earnlimit>token value", async function () {
            // return(0)
            //last sell amount = 20 busd
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            let user1Data = await _dpnm.getUserBuySellData(user2)
            // console.log("🚀 ~ file: dpnm_tests.js:1571 ~ user1Data", user1Data)

            let dpnmBal = await _dpnm.balanceOf(user2)
            // console.log("🚀 ~ file: dpnm_tests.js:1574 ~ dpnmBal", dpnmBal)


            let dPNMprice = await _dpnm.getdPNMPrice()
            // console.log("🚀 ~ file: dpnm_tests.js:1582 ~ dPNMprice", dPNMprice)


            //increase dpnm price so dPNM value increase earn limit
            const dailyBuy_weiValue = utils.parseEther("20000");
            await _dpnm.setDailyBuyLimit(dailyBuy_weiValue)

            for (let i=1;i<75;i++) {
                const transfer_weiValue = utils.parseEther("1050");
                await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
                // increase allowance
                await _busd.connect(_user1).increaseAllowance(_dpnm.address,transfer_weiValue)
                await _dpnm.connect(_user1).buydPNM(transfer_weiValue)
                await time.increase(60*60*24);

            }
            dPNMprice = await _dpnm.getdPNMPrice()
            // console.log("🚀 ~ file: dpnm_tests.js:1582 ~ dPNMprice", dPNMprice)
            
            user1Data = await _dpnm.getUserBuySellData(user2)
            // console.log("🚀 ~ file: dpnm_tests.js:1571 ~ user1Data", user1Data)
            
            await expect(_dpnm.connect(_user2).selldPNM(utils.parseEther("103"))).to.be.revertedWith("Not enough earn limit"); //try to sell when earn limit not enough

            let busdBal = await _busd.balanceOf(user2)
            // console.log("🚀 ~ file: dpnm_tests.js:1603 ~ busdBal", busdBal)

            //user dPNM value = 103.24 BUSD, sell half earn limit will burn half dPNM
            await _dpnm.connect(_user2).selldPNM(utils.parseEther("75.523"))
            user1Data = await _dpnm.getUserBuySellData(user2)
            // console.log("🚀 ~ file: dpnm_tests.js:1571 ~ user1Data", user1Data)

            dpnmBal = await _dpnm.balanceOf(user2)
            // console.log("🚀 ~ file: dpnm_tests.js:1574 ~ dpnmBal", dpnmBal)

            busdBal = await _busd.balanceOf(user2)
            // console.log("🚀 ~ file: dpnm_tests.js:1603 ~ busdBal", busdBal)


            expect(utils.formatEther(dpnmBal)).to.be.equal("9.7908")//75.523% dpnm burned 
            expect(utils.formatEther(busdBal)).to.be.equal("67.9707")//75.523 BUSD - 90% 
        });

        it("Only activated user with referrer can buydPNM/selldPNM/buyTurnoverWithGWT/buyEarnLimitWithGWT", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            
            await expect(_dpnm.connect(_user3).buydPNM(utils.parseEther("10"))).to.be.revertedWith("Please activate first");
            await expect(_dpnm.connect(_user3).selldPNM(utils.parseEther("10"))).to.be.revertedWith("Please activate first");
            await expect(_dpnm.connect(_user3).buyTurnoverWithGWT(utils.parseEther("10"))).to.be.revertedWith("Please activate first");
            await expect(_dpnm.connect(_user3).buyEarnLimitWithGWT(utils.parseEther("10"))).to.be.revertedWith("Please activate first");

        });




    });

    /**
     * @dev this block test correct marketing conditions, depositing user with bonuses according to tree positions, unlocking tree levels etc.
     */
    describe("==10) NO Prestart | Marketing tests", function () {
        // return(0)
        it("New lvl opened at turnover reach", async function () {
            // return(0)
            const { _dpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(tenUsersBuy1000DPNMFor13Days);

            expect(await _dpnm.getLvlsLockStatus(user1)).to.eql([true,true,true,true,true,false,false,false,false,false]);
        });


        it("Bonus accrued only when bought min dpnm", async function () {
            // return(0)

            //bonus when bought min dpnm
            const { _dpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserRegisters);
            depositBUSD(_busd,_busd_owner,user2,"50")
            const allowedBusd = utils.parseEther("50")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,allowedBusd)

            await disablePrestart(_dpnm,_busd,_busd_owner,_owner)
            
            //user2 buy dpnm
            await _dpnm.connect(_user2).buydPNM(allowedBusd);
            const qualified = await _dpnm.isQualifiedForBonus(user1)//if user1 qualified to receive bonus
            const lostProfit = await _dpnm.getLostProfit(user1);
            
            expect(utils.formatEther(lostProfit[0])).to.equal("0.1");
            expect(qualified).to.equal(false);
        });

        it("Bonus accrued only when bought min dpnm", async function () {
            // return(0)

            //bonus when bought min dpnm
            const { _dpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserRegisters);
            depositBUSD(_busd,_busd_owner,user2,"50")
            const allowedBusd = utils.parseEther("50")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,allowedBusd)

            await disablePrestart(_dpnm,_busd,_busd_owner,_owner)
            
            //user2 buy dpnm
            await _dpnm.connect(_user2).buydPNM(allowedBusd);
            const qualified = await _dpnm.isQualifiedForBonus(user1)//if user1 qualified to receive bonus
            const lostProfit = await _dpnm.getLostProfit(user1);
            
            expect(utils.formatEther(lostProfit[0])).to.equal("0.1");
            expect(qualified).to.equal(false);
        });


        it("Bonus accrued when earn limit>dpnm value", async function () {
            // return(0)

            //user1 buy once, other users buy for 13 days and increase dpnm price so user1 token value<earn limit
            const { _dpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(tenUsersBuy50DPNMFor13Days);
            
            const lostProfit = await _dpnm.getLostProfit(user1)
            const qualified = await _dpnm.isQualifiedForBonus(user1);
            expect(qualified).to.equal(false);
            expect(utils.formatEther(lostProfit[0])).to.be.equal("0.8");
        });


        it("Turnover bought for GWT, lvl opened", async function () {
            // return(0)
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(users10Buy1000dPNMFor4days);
            //user have 36k turnover, buy additional 4k for 20 gwt
            
            const turnoverAmount = utils.parseEther("4000")
            await _dpnm.connect(_user1).buyTurnoverWithGWT(turnoverAmount)
    
            expect(await _dpnm.getLvlsLockStatus(user1)).to.eql([true,true,true,true,false,false,false,false,false,false]);
            expect(await _gwt.balanceOf(user1)).to.be.equal(utils.parseEther("790"))

        });

        it("Not enough GWT for turnover buy", async function () {
            // return(0)
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);

            await depositBUSD(_busd,_busd_owner,user2,"2")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,utils.parseEther("20"))
            
            const turnoverAmount = utils.parseEther("400000")
            await expect(_dpnm.connect(_user2).buyTurnoverWithGWT(turnoverAmount)).to.be.revertedWith("Not enough GWT");


        });



        it("When lvl 8 active pay 10% fee from dPNM buy and tree payment", async function () {
            // return(0)
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(users10Buy10000dPNMFor10days);
            
            //buy turnover to open vlv 8
            const turnoverAmount = utils.parseEther("100000")
            await _dpnm.connect(_user1).buyTurnoverWithGWT(turnoverAmount)

            let u1BUSDbalBefore = await _busd.balanceOf(user1)

            //user2 buy dpnm for 50 busd, bonus should be 90% of 0.1 = 0.09 BUSD
            const transfer_weiValue = utils.parseEther("50");
            await _busd.connect(_busd_owner).transfer(user2,transfer_weiValue)
            // increase allowance
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,transfer_weiValue)
            
            await _dpnm.connect(_user2).buydPNM(transfer_weiValue)

            let u1BUSDbalAfter = await _busd.balanceOf(user1)
            const saldo = Number(utils.formatEther(u1BUSDbalAfter))-Number(utils.formatEther(u1BUSDbalBefore))
            //test tree payment, bonus should be 90% of 0.1 = 0.09 BUSD
            await depositBUSD(_busd,_busd_owner,user2,"10")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,transfer_weiValue)
            await _dpnm.connect(_user2).makeTreePayment()

            let u1BUSDbalAfterTree = await _busd.balanceOf(user1)
            const saldoTree = Number(utils.formatEther(u1BUSDbalAfterTree))-Number(utils.formatEther(u1BUSDbalAfter))

            expect(String(saldo.toPrecision(2))).to.equal("0.090");
            expect(String(saldoTree.toPrecision(2))).to.equal("0.090");
        });


        it("Turnover multiplicator works", async function () {
            // return(0)
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserRegisters);
            await disablePrestart(_dpnm,_busd,_busd_owner,_owner)
            //set multiplicator
            await _dpnm.setdPNMbuyTurnoverIncrease(15)
            //buy dpnm for 50
            const weiValue = utils.parseEther("50");

            await depositBUSD(_busd,_busd_owner,user2,"50")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,weiValue)
            await _dpnm.connect(_user2).buydPNM(weiValue)
            
            const u1Data = await _dpnm.getUserData(user1)

            expect(utils.formatEther(u1Data[1])).to.equal("57.5");
        });

        it("When sell -> get turnover if enabled promo", async function () {
            // return(0)
            //50 BUSD for buy + 20% of 20 BUSD for sell = 54 turnover
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserRegisters);
            await disablePrestart(_dpnm,_busd,_busd_owner,_owner)
            //set turnover for sell to enabled
            await _dpnm.setdPNMsellTurnoverIncrease(20)
            //buy dpnm for 50
            const weiValue = utils.parseEther("50");

            await depositBUSD(_busd,_busd_owner,user2,"50")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,weiValue)
            await _dpnm.connect(_user2).buydPNM(weiValue)
            
            //sell dpnm for 20 busd
            await _dpnm.connect(_user2).selldPNM(utils.parseEther("20"))

            const u1Data = await _dpnm.getUserData(user1)

            expect(utils.formatEther(u1Data[1])).to.equal("54.0");
        });

        it("No SELL turnover if tree is overdue", async function () {
            // return(0)
            //50 BUSD for buy + 20% of 20 BUSD for sell = 54 turnover
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserRegisters);
            await disablePrestart(_dpnm,_busd,_busd_owner,_owner)
            //set turnover for sell to enabled
            await _dpnm.setdPNMsellTurnoverIncrease(20)
            //buy dpnm for 50
            const weiValue = utils.parseEther("50");

            await depositBUSD(_busd,_busd_owner,user2,"50")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,weiValue)
            await _dpnm.connect(_user2).buydPNM(weiValue)
            //30 days passed, tree become overdue
            await time.increase(60*60*24*30);

            //sell dpnm for 20 busd
            await _dpnm.connect(_user2).selldPNM(utils.parseEther("20"))

            const u1Data = await _dpnm.getUserData(user1)

            expect(utils.formatEther(u1Data[1])).to.equal("50.0");
        });



    });

    /**
     * @dev testing earn limit purchase with GWT
     */
    describe("==11) NO Prestart | Earn limit purchase", function () {
        // return(0)
        it("Balances changes correctly", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);

            //user2 buy earn limit
            // await showUserData(_dpnm,_busd,_gwt,user2,'User2')
            //2 busd fee payment
            await depositBUSD(_busd,_busd_owner,user2,"2")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,utils.parseEther("2"))

            //buy 10 BUSD of earn limit
            const turnoverWei = utils.parseEther("10");
            await _dpnm.connect(_user2).buyEarnLimitWithGWT(turnoverWei)

            const collectorBal = await _busd.balanceOf(feeCollector)
            const contractBal = await _busd.balanceOf(_dpnm.address)
            
            // await showUserData(_dpnm,_busd,_gwt,user2,'User2')

            const userData = await _dpnm.getUserData(user2)
            const gwtBal = await _gwt.balanceOf(user2)
            
            expect(userData[2]).to.equal(utils.parseEther("110.0"))//left earn limit = 100 + 10
            expect(userData[4]).to.equal(utils.parseEther("110.0"))//total earn limit = 100 + 10
            expect(utils.formatEther(gwtBal)).to.equal("12.0")//gwt bal == 20 - 8 = 12
            expect(utils.formatEther(collectorBal)).to.equal("23.1")//fee collectr + 1 busd
            expect(utils.formatEther(contractBal)).to.equal("49.5")//contract + 1 busd
        });

        it("Cannot buy earnlimit without min dPNM buy", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);

            //2 busd fee payment
            await depositBUSD(_busd,_busd_owner,user2,"2")
            await _busd.connect(_user2).increaseAllowance(_gwt.address,utils.parseEther("2"))

            //user2 transfer GWT to user1 3 GWT
            await _gwt.connect(_user2).transfer(user1,utils.parseEther("3"))

            //2 busd fee payment
            await depositBUSD(_busd,_busd_owner,user1,"2")
            await _busd.connect(_user1).increaseAllowance(_dpnm.address,utils.parseEther("2"))

                        
            //buy 10 BUSD of earn limit
            const earnlimitWei = utils.parseEther("1");
            
            await expect(_dpnm.connect(_user1).buyEarnLimitWithGWT(earnlimitWei)).to.be.revertedWith("Need min dPNM buy");
        });


        it("GWT balance should be enough", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);

            //2 busd fee payment
            await depositBUSD(_busd,_busd_owner,user2,"2")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,utils.parseEther("2"))

            //buy 10 BUSD of earn limit
            const turnoverWei = utils.parseEther("26");
            await expect(_dpnm.connect(_user2).buyEarnLimitWithGWT(turnoverWei)).to.be.revertedWith("Not enough GWT");


        });

        it("Should not exceed 10% of total earn limit", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);

            //2 busd fee payment
            await depositBUSD(_busd,_busd_owner,user2,"2")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,utils.parseEther("2"))

            //buy 10 BUSD of earn limit
            const turnoverWei = utils.parseEther("11");
            await expect(_dpnm.connect(_user2).buyEarnLimitWithGWT(turnoverWei)).to.be.revertedWith("Exceeds 10%");


        });


    });
 
    /**
     * @dev Tests realated to tree payment, activation
     */
    describe("==12) Tree payments test", function () {
        // return(0)
        it("Can be activated once", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);

            //10 busd tree activation payment
            await depositBUSD(_busd,_busd_owner,user1,"20")
            await _busd.connect(_user1).increaseAllowance(_dpnm.address,utils.parseEther("20"))

            await _dpnm.connect(_user1).activate(user1,_owner.address)
            
            await expect(_dpnm.connect(_user1).activate(user1,_owner.address)).to.be.revertedWith("User already exists");
        });

        it("Sponsor should exist", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);

            //10 busd tree activation payment
            await depositBUSD(_busd,_busd_owner,user1,"20")
            await _busd.connect(_user1).increaseAllowance(_dpnm.address,utils.parseEther("20"))

            await expect(_dpnm.connect(_user1).activate(user1,user2)).to.be.revertedWith("Referrer not exists");
        });

        it("User should exist for makeTreePayment", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);

            //10 busd tree activation payment
            await depositBUSD(_busd,_busd_owner,user3,"20")
            await _busd.connect(_user3).increaseAllowance(_dpnm.address,utils.parseEther("20"))

            await expect(_dpnm.connect(_user3).makeTreePayment()).to.be.revertedWith("Activate first");
        });

        it("User get lostprofit when lvl>=8 if tree is overdue from tree payment", async function () {
            const { _dpnm, _busd, _tree, _owner, signers, _gwt } = await loadFixture(tenUsersBuyDPNM);
            //wait for tree to overdue
            await time.increase(60*60*24*30);

            //10 busd tree activation payment
            await depositBUSD(_busd,signers[19],signers[10].address,"20")
            await _busd.connect(signers[10]).increaseAllowance(_dpnm.address,utils.parseEther("20"))
            await _dpnm.connect(signers[10]).makeTreePayment()
            let lostProfit = await _dpnm.getLostProfit(user1)
            let liquidity = await _busd.balanceOf(_dpnm.address)
            let collector = await _busd.balanceOf(feeCollector)
            //liquidity + 3.6 
            //collector + 5.6 = 4 + 2*0.8 from lvl 8 and 9
            //owner + 0.8 from lvl 10

            expect(utils.formatEther(lostProfit[8])).to.be.equal("1.6")
            expect(utils.formatEther(collector)).to.be.equal("109.9")
            expect(utils.formatEther(liquidity)).to.be.equal("477.9")
        });

        it("User get lostprofit when lvl>=8 if tree is overdue from dpnmBuy", async function () {
            const { _dpnm, _busd, _tree, _owner, signers, _gwt } = await loadFixture(tenUsersBuyDPNM);
            //wait for tree to overdue
            await time.increase(60*60*24*30);

            //10 busd tree activation payment
            await depositBUSD(_busd,signers[19],signers[10].address,"20")
            await _busd.connect(signers[10]).increaseAllowance(_dpnm.address,utils.parseEther("20"))
            await _dpnm.connect(signers[10]).buydPNM(utils.parseEther("20"))
            let lostProfit = await _dpnm.getLostProfit(user1)
            
            let liquidity = await _busd.balanceOf(_dpnm.address)
            let collector = await _busd.balanceOf(feeCollector)
            //liquidity + 19.04 
            //collector + 0.96 = 3*1.6%*20$ from lvl 7,8 and 9

            expect(utils.formatEther(lostProfit[8])).to.be.equal("1.12")
            expect(utils.formatEther(collector)).to.be.equal("105.26")
            expect(utils.formatEther(liquidity)).to.be.equal("493.34")
        });

        it("User do not get bonus from downline dPNM purchase, if he did not buy tokens | isQualifiedForBonus", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(tenUsersRegistered);

            let lostProfit = await _dpnm.getLostProfit(user1)
            // console.log("🚀 ~ file: dpnm_tests.js:1812 ~ lostProfit", lostProfit)

            // prestart disabled
            await _busd.connect(signers[19]).transfer(signers[0].address,utils.parseEther("1"))
            await _busd.connect(signers[0]).increaseAllowance(_dpnm.address,utils.parseEther("1"))
            await _dpnm.disablePrestartMode()

            //10 busd tree activation payment
            await depositBUSD(_busd,signers[19],signers[10].address,"20")
            await _busd.connect(signers[10]).increaseAllowance(_dpnm.address,utils.parseEther("20"))
            await _dpnm.connect(signers[10]).buydPNM(utils.parseEther("20"))
            lostProfit = await _dpnm.getLostProfit(user1)
            // console.log("🚀 ~ file: dpnm_tests.js:1812 ~ lostProfit", lostProfit)
            
            expect(utils.formatEther(lostProfit[8])).to.be.equal("0.32")
        });



        it("Should not register under himself", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);

            //10 busd tree activation payment
            await depositBUSD(_busd,_busd_owner,user1,"20")
            await _busd.connect(_user1).increaseAllowance(_dpnm.address,utils.parseEther("20"))

            await expect(_dpnm.connect(_user1).activate(user1,user1)).to.be.revertedWith("Referrer not exists");
        });

        it("No tree payment at prestart when no dpnm purchased", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);

            //10 busd tree activation payment
            await depositBUSD(_busd,_busd_owner,user1,"20")
            await _busd.connect(_user1).increaseAllowance(_dpnm.address,utils.parseEther("20"))

            await _dpnm.connect(_user1).activate(user1,_owner.address)
            
            await expect(_dpnm.connect(_user1).makeTreePayment()).to.be.revertedWith("Need first dPNM buy");
        });

        it("getUserDistance test when searched user in parallel branch", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);
            //position 11 user one after one
            let signers = await ethers.getSigners();

            for (let i=1;i<=11;i++) {
                await depositBUSD(_busd,_busd_owner,signers[i].address,"10")
                await _busd.connect(signers[i]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
                await _dpnm.connect(signers[i]).activate(signers[i].address,signers[i-1].address)
                // console.log("i=%s | %s",i,signers[i].address)
            }
            //position user in parallel branch
            await depositBUSD(_busd,_busd_owner,signers[12].address,"10")
            await _busd.connect(signers[12]).increaseAllowance(_dpnm.address,utils.parseEther("10"))
            await _dpnm.connect(signers[12]).activate(signers[12].address,signers[0].address)

            //try to search signers[11]
            const parallelBranch = await _tree.getUserDistance(signers[11].address,10)
            // console.log("🚀 ~ file: dpnm_tests.js:1791 ~ parallelBranch", parallelBranch)
            
        });


        it("Tree completely filled with users | findPositionSpot test", async function () {
            // return(0)
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);
            //for this test treeDepth in dPNM has to be set to 3, so less lvls, so test take less time
            //positioning 39 users to fill 5 lvls completely, user 40 should be reverted
            //to make full test with 10 lvls we should position 88572 users, 88573 should be reverted
            let wallet = ethers.Wallet.createRandom();
            wallet = wallet.connect(ethers.provider);
            let tx = {
                to: wallet.address,
                // Convert currency unit from ether to wei
                value: ethers.utils.parseEther("0.01")
            }
            // Send a transaction
            await _user1.sendTransaction(tx)

            // for (let i=1;i<=88572;i++) {

            for (let i=1;i<=39;i++) {
                
                await depositBUSD(_busd,_busd_owner,wallet.address,"10")
                await _busd.connect(wallet).increaseAllowance(_dpnm.address,utils.parseEther("10"))
                await _dpnm.connect(wallet).activate(wallet.address,_owner.address)
                // console.log("🚀 ~ file: dpnm_tests.js:1783 ~ i = %s | account.address", i, wallet.address)
                wallet = ethers.Wallet.createRandom()
                wallet = wallet.connect(ethers.provider);

                //deposit new address with eth
                tx = {
                    to: wallet.address,
                    // Convert currency unit from ether to wei
                    value: ethers.utils.parseEther("0.001")
                }
                // Send a transaction
                await _user1.sendTransaction(tx)
                
                
            }

       
            await depositBUSD(_busd,_busd_owner,user1,"10")
            await _busd.connect(_user1).increaseAllowance(_dpnm.address,utils.parseEther("10"))
            
            
            await expect(_dpnm.connect(_user1).activate(user1,owner)).to.be.revertedWith("Tree is filled");

        });


        it("Tree due increased", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);
            //10 busd tree activation payment
            await depositBUSD(_busd,_busd_owner,user1,"20")
            await _busd.connect(_user1).increaseAllowance(_dpnm.address,utils.parseEther("20"))
            await _dpnm.connect(_user1).activate(user1,_owner.address)
            const treeDate = await _dpnm.treeActiveUntil(user1)
            
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;
            
            
            expect(Number(treeDate) - timestampBefore).to.be.equal(60*60*24*30);//tree due increased for 30 days
        });



        it("NO PRESTART | No tree payment at prestart when no dpnm purchased", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);

            //10 busd tree activation payment
            await depositBUSD(_busd,_busd_owner,user1,"20")
            await _busd.connect(_user1).increaseAllowance(_dpnm.address,utils.parseEther("20"))

            await _dpnm.connect(_user1).activate(user1,_owner.address)

            await disablePrestart(_dpnm,_busd,_busd_owner,_owner)

            await expect(_dpnm.connect(_user1).makeTreePayment()).to.be.revertedWith("Need first dPNM buy");
        });

        it("NO PRESTART | No error if user already exist", async function () {
            //we need new contract, add it to allowed and check new user position (using copy of dpnm)
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);

            
            let treeUsers = await _tree.totalUsers()
            // console.log("🚀 ~ file: dpnm_tests.js:1813 ~ treeUsers", treeUsers)


            //deploy xpnm
            Token = await ethers.getContractFactory("xdpnmMain");
            const _xpnm = await Token.connect(_owner).deploy(_busd.address,_tree.address,_gwt.address,feeCollector);
            // console.log("XPNM=",_xpnm.address)
            //add dpnm to allowed contracts to call phenomenalTree
            await _tree.addAllowedContract(_xpnm.address);

            //add dpnm to allowed contracts to call gwt
            await _gwt.addAllowedContract(_xpnm.address);

            //10 busd tree activation payment
            await depositBUSD(_busd,_busd_owner,user2,"20")
            await _busd.connect(_user2).increaseAllowance(_xpnm.address,utils.parseEther("20"))
            
            await _xpnm.connect(_user2).activate(user2,owner)

            treeUsers = await _tree.totalUsers()
            // console.log("🚀 ~ file: dpnm_tests.js:1813 ~ treeUsers", treeUsers)
            let xpnmUsers = await _xpnm.totalUsers()
            // console.log("🚀 ~ file: dpnm_tests.js:1816 ~ xpnmUsers", xpnmUsers)
            expect(Number(treeUsers)).to.be.equal(2)
            expect(Number(xpnmUsers)).to.be.equal(2)


        });


        it("NO PRESTART | When dpnm purchased can make tree payment, due increased", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);

            //10 busd tree activation payment
            await depositBUSD(_busd,_busd_owner,user2,"20")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,utils.parseEther("20"))
            // await showUserData(_dpnm,_busd,_gwt,user2,'User2')
            let treeDateBefore = await _dpnm.treeActiveUntil(user2)

            await _dpnm.connect(_user2).makeTreePayment()
            // await showUserData(_dpnm,_busd,_gwt,user2,'User2')
            let treeDateAfter = await _dpnm.treeActiveUntil(user2)

            expect(Number(treeDateAfter)-Number(treeDateBefore)).to.be.equal(2592000);
        });

        it("NO PRESTART | Test findPositionSpot", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);


            await expect(_tree.connect(_user1).findPositionSpot(user1, owner, 10)).to.be.revertedWith("Already exist");
            await expect(_tree.connect(_user1).findPositionSpot(user3, user4, 10)).to.be.revertedWith("Referrer not exist");
        });

        it("NO PRESTART | Test getUserDistance", async function () {
            const { _dpnm, _busd, _tree, _owner, signers } = await loadFixture(thirteenUsersRegisteredWithOwnerReflink);

            const wrongBranch = await _tree.connect(signers[1]).getUserDistance(user3,10)//get 0 if no user in account tree (in parallel branch)
            expect(Number(wrongBranch)).to.be.equal(0)

            await expect(_tree.connect(signers[1]).getUserDistance(user15,10)).to.be.revertedWith("Not exist");
            await expect(_tree.connect(signers[15]).getUserDistance(user1,10)).to.be.revertedWith("Register first");
            await expect(_tree.connect(signers[2]).getUserDistance(user1,16)).to.be.revertedWith("Too deep");
        });


        it("NO PRESTART | Amount of days cannot increase treeMaxPaymentPeriod", async function () {
            //treeMaxPaymentPeriod is 90 days, user get 30 days for activation, then 2x30 days for payment, then error
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);

            //10 busd tree activation payment
            await depositBUSD(_busd,_busd_owner,user2,"30")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,utils.parseEther("30"))
            // await showUserData(_dpnm,_busd,_gwt,user2,'User2')

            await _dpnm.connect(_user2).makeTreePayment()
            await _dpnm.connect(_user2).makeTreePayment()
            await expect(_dpnm.connect(_user2).makeTreePayment()).to.be.revertedWith("Exceeds tree days limit");

        });


        it("NO PRESTART | Payment is ok after overdue", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;
            
            //wait 40 days for payment to expire
            let expireDate = await _dpnm.treeActiveUntil(user2)

            await time.increase(60*60*24*40);
                        
            //10 busd tree activation payment
            await depositBUSD(_busd,_busd_owner,user2,"10")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,utils.parseEther("10"))
            // await showUserData(_dpnm,_busd,_gwt,user2,'User2')

            await _dpnm.connect(_user2).makeTreePayment()
            expireDate = await _dpnm.treeActiveUntil(user2)
            expect(Number(expireDate)).to.be.equal(timestampBefore+60*60*24*40+60*60*24*30+3)
            
        });


        it("NO PRESTART | Admin increse days for 60", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);

            //10 busd tree activation payment
            await depositBUSD(_busd,_busd_owner,user2,"20")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,utils.parseEther("20"))
            // await showUserData(_dpnm,_busd,_gwt,user2,'User2')
            let treeDateBefore = await _dpnm.treeActiveUntil(user2)
            await _dpnm.setDaysForTree(60)
            await _dpnm.connect(_user2).makeTreePayment()
            // await showUserData(_dpnm,_busd,_gwt,user2,'User2')
            let treeDateAfter = await _dpnm.treeActiveUntil(user2)

            expect(Number(treeDateAfter)-Number(treeDateBefore)).to.be.equal(5184000);
        });


        it("NO PRESTART | Admin increse gwt for tree to 15", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);

            //10 busd tree activation payment
            await depositBUSD(_busd,_busd_owner,user2,"20")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,utils.parseEther("20"))
            //15 gwt for activation
            await _dpnm.setGWTforActivation(utils.parseEther("15"))
            
            
            await expect(_dpnm.connect(_user2).makeTreePayment()).to.changeTokenBalance(_gwt,user2,utils.parseEther("15"));
        });


    });

    /**
     * @dev GWT staking/claiming tests
     */
    describe("==13) Staking tests", function () {
        // return(0)        

        it("Create stakings", async function () {
            // return(0)
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);

            // await showUserData(_dpnm,_busd,_gwt,user2,'User2')
            await _gwt.connect(_user2).stakeGWT(utils.parseEther("5"),1)
            await _gwt.connect(_user2).stakeGWT(utils.parseEther("7"),5)
            // await showUserData(_dpnm,_busd,_gwt,user2,'User2')
            const stakePools = await _gwt.getUserPoolSlots(user2)

            const pool1Data = await _gwt.getUserPoolData(Number(stakePools[1]))            
            const pool5Data = await _gwt.getUserPoolData(Number(stakePools[5]))            

            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;
            
            
            expect(Number(pool1Data[1]) - timestampBefore+1).to.be.equal(60*60*24*14);//stake for 14 days
            expect(Number(pool5Data[1]) - timestampBefore).to.be.equal(60*60*24*180);//stake for 180 days
        });

        it("Staking should exist", async function () {
            // return(0)
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);

            await expect(_gwt.getUserPoolData(10)).to.be.revertedWith("Not found");
        });


        
        it("Should be enough GWT for staking", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);

            await expect(_gwt.connect(_user2).stakeGWT(utils.parseEther("21"),1)).to.be.revertedWith("Not enough GWT");
        });

        it("Should have only 1 staking of each type", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await _gwt.connect(_user2).stakeGWT(utils.parseEther("5"),1)

            await expect(_gwt.connect(_user2).stakeGWT(utils.parseEther("5"),1)).to.be.revertedWith("Already staked");
        });

        it("GWT Balance decreases", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            
            await expect(_gwt.connect(_user2).stakeGWT(utils.parseEther("5"),1)).to.changeTokenBalance(_gwt,user2,utils.parseEther("-5"));
        });

        it("Check profit in 10 days", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            //stake for 0.1% daily profit
            await _gwt.connect(_user2).stakeGWT(utils.parseEther("5"),1)
            //get user staking slots
            const stakePools = await _gwt.getUserPoolSlots(user2)

            let pool1Data = await _gwt.getUserPoolData(Number(stakePools[1]))            
            //wait 10 days to get 0.05 gwt profit
            await time.increase(60*60*24*10);

            pool1Data = await _gwt.getUserPoolData(Number(stakePools[1]))            
            expect(pool1Data[3]).to.be.equal(utils.parseEther("0.05"))
        });

        it("Claim profit for 10 days, gwt balance increased", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            //stake for 0.1% daily profit
            await _gwt.connect(_user2).stakeGWT(utils.parseEther("5"),1)
            //get user staking slots
            const stakePools = await _gwt.getUserPoolSlots(user2)

            let pool1Data = await _gwt.getUserPoolData(Number(stakePools[1]))            
            //wait 10 days to get 0.05 gwt profit
            await time.increase(60*60*24*10-1);
            //claim profit
            // await _gwt.connect(_user2).claimStaking(Number(stakePools[1]))

            await expect(_gwt.connect(_user2).claimStaking(Number(stakePools[1]))).to.changeTokenBalance(_gwt,user2,utils.parseEther("0.05"));
        });

        it("Claim profit for 10 days, total supply increased, last withdraw updated", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            //stake for 0.1% daily profit
            await _gwt.connect(_user2).stakeGWT(utils.parseEther("5"),1)
            //get user staking slots
            const stakePools = await _gwt.getUserPoolSlots(user2)

            let pool1Data = await _gwt.getUserPoolData(Number(stakePools[1]))            
            //wait 10 days to get 0.05 gwt profit
            await time.increase(60*60*24*10-1);
            let totalSupply = await _gwt.totalSupply()
            
            //claim profit
            await _gwt.connect(_user2).claimStaking(Number(stakePools[1]))

            totalSupply = await _gwt.totalSupply()

            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const BlockTimestamp = blockBefore.timestamp;

            pool1Data = await _gwt.getUserPoolData(Number(stakePools[1]))      
            let totalStaked = await _gwt.totalStaked();
            console.log("🚀 ~ file: dpnm_tests.js:2448 ~ totalStaked", totalStaked)
            
            expect(totalSupply).to.be.equal(utils.parseEther("15.05"));//gwt total supply increased for reward, but decreased for staked amount
            expect(Number(pool1Data[4])).to.be.equal(BlockTimestamp);//last reward claim updated
            expect(Number(pool1Data[3])).to.be.equal(0);//current reward = 0
        });

        it("Check profit in 20 days", async function () {
            //should get profit for 14 days + return of staked gwt
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            //stake for 0.1% daily profit
            await _gwt.connect(_user2).stakeGWT(utils.parseEther("5"),1)
            //get user staking slots
            const stakePools = await _gwt.getUserPoolSlots(user2)

            let pool1Data = await _gwt.getUserPoolData(Number(stakePools[1]))            
            //wait 10 days to get 0.05 gwt profit
            await time.increase(60*60*24*20);

            pool1Data = await _gwt.getUserPoolData(Number(stakePools[1]))            
            expect(pool1Data[3]).to.be.equal(utils.parseEther("5.07"))
        });

        it("Claim profit for 20 days, gwt balance increased", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            //stake for 0.1% daily profit
            await _gwt.connect(_user2).stakeGWT(utils.parseEther("5"),1)
            //get user staking slots
            const stakePools = await _gwt.getUserPoolSlots(user2)

            let pool1Data = await _gwt.getUserPoolData(Number(stakePools[1]))            
            //wait 10 days to get 0.05 gwt profit
            await time.increase(60*60*24*20-1);
            //claim profit
            // await _gwt.connect(_user2).claimStaking(Number(stakePools[1]))

            await expect(_gwt.connect(_user2).claimStaking(Number(stakePools[1]))).to.changeTokenBalance(_gwt,user2,utils.parseEther("5.07"));
        });

        it("Claim profit for 20 days, total supply increased, last withdraw updated, staking closed", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            //stake for 0.1% daily profit
            await _gwt.connect(_user2).stakeGWT(utils.parseEther("5"),1)
            //get user staking slots
            let stakePools = await _gwt.getUserPoolSlots(user2)

            let pool1Data = await _gwt.getUserPoolData(Number(stakePools[1]))            
            //wait 10 days to get 0.05 gwt profit
            await time.increase(60*60*24*20-1);
            let totalSupply = await _gwt.totalSupply()
            
            //claim profit
            await _gwt.connect(_user2).claimStaking(Number(stakePools[1]))

            totalSupply = await _gwt.totalSupply()

            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const BlockTimestamp = blockBefore.timestamp;

            stakePools = await _gwt.getUserPoolSlots(user2)

            expect(totalSupply).to.be.equal(utils.parseEther("20.07"));//gwt total supply increased for reward
            expect(Number(stakePools[1])).to.be.equal(0);//no activae staking in slot 1
        });

        it("Claim profit of a closed staking reverted, not exist staking reverted", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            //stake for 0.1% daily profit
            await _gwt.connect(_user2).stakeGWT(utils.parseEther("5"),1)
            //get user staking slots
            let stakePools = await _gwt.getUserPoolSlots(user2)

            let pool1Data = await _gwt.getUserPoolData(Number(stakePools[1]))            
            //wait 10 days to get 0.05 gwt profit
            await time.increase(60*60*24*20-1);
            let totalSupply = await _gwt.totalSupply()
            
            //claim profit with staking closing
            await _gwt.connect(_user2).claimStaking(Number(stakePools[1]))

            await expect(_gwt.connect(_user2).claimStaking(Number(stakePools[1]))).to.be.revertedWith("Staking closed");
            await expect(_gwt.connect(_user2).claimStaking(5)).to.be.revertedWith("Not found");
        });

        it("Claim profit of another user is reverted", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            //stake for 0.1% daily profit
            await _gwt.connect(_user2).stakeGWT(utils.parseEther("5"),1)
            //get user staking slots
            let stakePools = await _gwt.getUserPoolSlots(user2)

            let pool1Data = await _gwt.getUserPoolData(Number(stakePools[1]))            
            //wait 10 days to get 0.05 gwt profit
            await time.increase(60*60*24*20-1);
            let totalSupply = await _gwt.totalSupply()
            
            await expect(_gwt.connect(_user1).claimStaking(5)).to.be.revertedWith("Not found");
        });


        it("Create staking of incorrect ID is reverted, less than min is reverted", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
                        
            await expect(_gwt.connect(_user2).stakeGWT(utils.parseEther("5"),0)).to.be.revertedWith("Incorrect pool");
            await expect(_gwt.connect(_user2).stakeGWT(utils.parseEther("5"),7)).to.be.revertedWith("Incorrect pool");
            await expect(_gwt.connect(_user2).stakeGWT(utils.parseEther("0.5"),4)).to.be.revertedWith("Less than min stake");
        });

        it("Check profit in 20 days when staking settings changed", async function () {
            //should get profit for 14 days + return of staked gwt
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            //change staking settings, staking #1 from 0.1% to 0.2%
            await _gwt.setStakingDailyProfit(20,1)
            //stake for 0.1% daily profit
            await _gwt.connect(_user2).stakeGWT(utils.parseEther("5"),1)
            //get user staking slots
            const stakePools = await _gwt.getUserPoolSlots(user2)

            let pool1Data = await _gwt.getUserPoolData(Number(stakePools[1]))            
            //wait 10 days to get 0.05 gwt profit
            await time.increase(60*60*24*20);

            pool1Data = await _gwt.getUserPoolData(Number(stakePools[1]))            
            expect(pool1Data[3]).to.be.equal(utils.parseEther("5.14"))
        });

        it("Check profit in 20 days when staking settings changed", async function () {
            //should get profit for 14 days + return of staked gwt
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
                      
            await expect(_gwt.setStakingDailyProfit(70,1)).to.be.revertedWith("Out of range");
            await expect(_gwt.setStakingDailyProfit(5,1)).to.be.revertedWith("Out of range");
            await expect(_gwt.setStakingDailyProfit(10,0)).to.be.revertedWith("Wrong ID");
            await expect(_gwt.setStakingDailyProfit(10,7)).to.be.revertedWith("Wrong ID");
        });

        it("When staking disabled its reverted", async function () {
            //should get profit for 14 days + return of staked gwt
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await _gwt.changeStakingEnabled()
            await expect(_gwt.connect(_user2).stakeGWT(utils.parseEther("5"),1)).to.be.revertedWith("Staking disabled");
        });
    });

    /**
     * @dev GWT transfer tests, 2 BUSD fee distribution
     */
     describe("==14) GWT transfer tests", function () {
        // return(0)
        it("Transfer, sender|receiver balances updated", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await depositBUSD(_busd,_busd_owner,user2,"2")
            await _busd.connect(_user2).increaseAllowance(_gwt.address,utils.parseEther("2"))
    
            //deposit 2 busd for fee payment
            await expect(_gwt.connect(_user2).transfer(user1, 1)).to.changeTokenBalances(
                _gwt,
                [user2, user1],
                [-1, 1]
                );           
            // await showUserData(_dpnm,_busd,_gwt,user1,"user1")


        });

        it("Transfer, fee distributed to feecollector", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await depositBUSD(_busd,_busd_owner,user2,"2")
            await _busd.connect(_user2).increaseAllowance(_gwt.address,utils.parseEther("2"))
    
            //deposit 2 busd for fee payment
            await expect(_gwt.connect(_user2).transfer(user1, 1)).to.changeTokenBalances(
                _busd,
                [user2, feeCollector],
                [utils.parseEther("-2"), utils.parseEther("1")]
                );           

        });

        it("Transfer, fee distributed to pool", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await depositBUSD(_busd,_busd_owner,user2,"2")
            await _busd.connect(_user2).increaseAllowance(_gwt.address,utils.parseEther("2"))
    
            await expect(_gwt.connect(_user2).transfer(user1, 1)).to.changeTokenBalances(
                _busd,
                [user2, _dpnm.address],
                [utils.parseEther("-2"), utils.parseEther("1")]
            );           
            


        });

        it("Transfer, fee changed", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await depositBUSD(_busd,_busd_owner,user2,"3")
            await _busd.connect(_user2).increaseAllowance(_gwt.address,utils.parseEther("3"))
            //increase liquidity fee 1->2
            await _gwt.setgwtTransFeeLiquidity(utils.parseEther("2"))
            //total fee 1+2
            await expect(_gwt.connect(_user2).transfer(user1, 1)).to.changeTokenBalances(
                _busd,
                [user2, _dpnm.address],
                [utils.parseEther("-3"), utils.parseEther("2")]
            );           
            
        });



    });

    /**
     * @dev Check if Tree and GWT are working only with allowed contracts
     */
     describe("==15) GWT and Tree allowed contracts check", function () {
        // return(0)
        it("Tree check", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTreeWithoutAllowedContrcts);
            
            await expect(_tree.positionUser(user1,owner,10)).to.be.revertedWith("403");
        });

        it("GWT check", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);
            await _gwt.init(_dpnm.address, feeCollector, _busd.address);
            //test adding new address to allowedContracts
            await _gwt.addAllowedContract(user3);
            expect(await _gwt.returnAllowedContract(1)).to.be.equal(user3)
            await expect(_gwt.mint(user1,utils.parseEther("5"))).to.be.revertedWith("403");
            await expect(_gwt.burn(user1,utils.parseEther("5"))).to.be.revertedWith("403");
        });

    });

    /**
     * @dev Check that variables correctly changes in ranges by owner or promoter
     */
     describe("==16) Check variables changed by owner", function () {
        // return(0)
        it("Prestart disabled once", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);

            await expect(_dpnm.disablePrestartMode()).to.be.revertedWith("Already disabled");

        });

        it("Only owner can change", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);

            await expect(_dpnm.connect(_user1).changeFeeCollector(user3)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(_dpnm.connect(_user1).changePromoter(user3)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(_gwt.connect(_user1).changeFeeCollector(user3)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(_tree.connect(_user1).transferOwnership(user3)).to.be.revertedWith("Ownable: caller is not the owner");

        });

        it("dPNM/GWT | changeFeeCollector", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            //dPNM
            await _dpnm.changeFeeCollector(user3)
            expect(await _dpnm.feeCollector()).to.be.equal(user3)

            await expect(_dpnm.connect(_user1).changeFeeCollector(user1)).to.be.revertedWith("Ownable: caller is not the owner");
            //GWT
            await _gwt.changeFeeCollector(user3)
            expect(await _gwt.feeCollector()).to.be.equal(user3)

            await expect(_gwt.connect(_user1).changeFeeCollector(user1)).to.be.revertedWith("Ownable: caller is not the owner");

        });

        it("dPNM | changePromoter", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            //dPNM
            await _dpnm.changePromoter(user3)
            expect(await _dpnm.promoter()).to.be.equal(user3)
            //check that promoter changed and can change data
            await _dpnm.connect(_user3).setDaysForTree(47)
            const days = await _dpnm.treePaymentPeriod()
            expect(Number(days)).to.be.equal(47*86400)

            await expect(_dpnm.connect(_user1).setearnLimitDepositedPerc(220)).to.be.revertedWith("Need promoter or higher");

        });


        it("dPNM/GWT/Tree | transferOwnership", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(deploydPNMandTree);
            //reverted not from owner
            await expect(_dpnm.connect(_user1).transferOwnership(user1)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(_tree.connect(_user1).transferOwnership(user1)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(_gwt.connect(_user1).transferOwnership(user1)).to.be.revertedWith("Ownable: caller is not the owner");
            
            //changed ok
            await _dpnm.transferOwnership(user1)
            await _tree.transferOwnership(user1)
            await _gwt.transferOwnership(user1)

            expect(await _dpnm.owner()).to.be.equal(user1)
            expect(await _tree.owner()).to.be.equal(user1)
            expect(await _gwt.owner()).to.be.equal(user1)

        });


        it("dPNM | setDailyBuyLimit", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await _dpnm.setDailyBuyLimit(utils.parseEther("0"))
            expect(await _dpnm.maxDailyBuy()).to.be.equal(utils.parseEther("0"))

            await _dpnm.setDailyBuyLimit(utils.parseEther("50"))
            expect(await _dpnm.maxDailyBuy()).to.be.equal(utils.parseEther("50"))

            await _dpnm.setDailyBuyLimit(utils.parseEther("70"))
            expect(await _dpnm.maxDailyBuy()).to.be.equal(utils.parseEther("70"))

            await expect(_dpnm.setDailyBuyLimit(utils.parseEther("25"))).to.be.revertedWith("Too low");
        });

        it("dPNM | setGWTforActivation", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await _dpnm.setGWTforActivation(utils.parseEther("5"))
            expect(await _dpnm.gwtForTreeActivation()).to.be.equal(utils.parseEther("5"))

            await _dpnm.setGWTforActivation(utils.parseEther("15"))
            expect(await _dpnm.gwtForTreeActivation()).to.be.equal(utils.parseEther("15"))

            await expect(_dpnm.setGWTforActivation(utils.parseEther("25"))).to.be.revertedWith("Out of range");
        });

        it("dPNM | setDaysForTree", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await _dpnm.setDaysForTree(30)
            expect(await _dpnm.treePaymentPeriod()).to.be.equal(30*60*60*24)

            await _dpnm.setDaysForTree(60)
            expect(await _dpnm.treePaymentPeriod()).to.be.equal(60*60*60*24)

            await expect(_dpnm.setDaysForTree(25)).to.be.revertedWith("Out of range");
        });

        it("dPNM | setMaxDaysForTree", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await _dpnm.setMaxDaysForTree(100)
            expect(await _dpnm.treeMaxPaymentPeriod()).to.be.equal(100*60*60*24)

            await _dpnm.setMaxDaysForTree(180)
            expect(await _dpnm.treeMaxPaymentPeriod()).to.be.equal(180*60*60*24)

            await expect(_dpnm.setMaxDaysForTree(25)).to.be.revertedWith("Out of range");
        });


        it("dPNM | setbuyFeeToLiquidity", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await _dpnm.setbuyFeeToLiquidity(0)
            expect(await _dpnm.buyFeeToLiquidity()).to.be.equal(0)

            await _dpnm.setbuyFeeToLiquidity(10)
            expect(await _dpnm.buyFeeToLiquidity()).to.be.equal(10)

            await expect(_dpnm.setbuyFeeToLiquidity(11)).to.be.revertedWith("Out of range");
        });

        it("dPNM | setsellFeeToLiquidity", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await _dpnm.setsellFeeToLiquidity(0)
            expect(await _dpnm.sellFeeToLiquidity()).to.be.equal(0)

            await _dpnm.setsellFeeToLiquidity(5)
            expect(await _dpnm.sellFeeToLiquidity()).to.be.equal(5)

            await expect(_dpnm.setsellFeeToLiquidity(6)).to.be.revertedWith("Out of range");
            
        });

        it("dPNM/GWT | setgwtTransFeeLiquidity", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            //dPNM
            await _dpnm.setgwtTransFeeLiquidity(utils.parseEther("0"))
            expect(await _dpnm.gwtTransFeeLiquidity()).to.be.equal(utils.parseEther("0"))

            await _dpnm.setgwtTransFeeLiquidity(utils.parseEther("2"))
            expect(await _dpnm.gwtTransFeeLiquidity()).to.be.equal(utils.parseEther("2"))

            await expect(_dpnm.setgwtTransFeeLiquidity(utils.parseEther("3"))).to.be.revertedWith("Out of range");
            //GWT
            await _gwt.setgwtTransFeeLiquidity(utils.parseEther("0"))
            expect(await _gwt.gwtTransFeeLiquidity()).to.be.equal(utils.parseEther("0"))

            await _gwt.setgwtTransFeeLiquidity(utils.parseEther("2"))
            expect(await _gwt.gwtTransFeeLiquidity()).to.be.equal(utils.parseEther("2"))

            await expect(_gwt.setgwtTransFeeLiquidity(utils.parseEther("3"))).to.be.revertedWith("Out of range");


        });

        it("dPNM | setturnoverForOneGWT", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await _dpnm.setturnoverForOneGWT(utils.parseEther("200"))
            expect(await _dpnm.turnoverForOneGWT()).to.be.equal(utils.parseEther("200"))

            await _dpnm.setturnoverForOneGWT(utils.parseEther("250"))
            expect(await _dpnm.turnoverForOneGWT()).to.be.equal(utils.parseEther("250"))

            await expect(_dpnm.setturnoverForOneGWT(utils.parseEther("100"))).to.be.revertedWith("Out of range");
        });

        it("dPNM | setdPNMbuyTurnoverIncrease", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await _dpnm.setdPNMbuyTurnoverIncrease(0)
            expect(await _dpnm.dPNMbuyTurnoverIncrease()).to.be.equal(0)

            await _dpnm.setdPNMbuyTurnoverIncrease(25)
            expect(await _dpnm.dPNMbuyTurnoverIncrease()).to.be.equal(25)

            await expect(_dpnm.setdPNMbuyTurnoverIncrease(26)).to.be.revertedWith("Out of range");
        });


        it("dPNM | setgwtBuyIncrease", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await _dpnm.setgwtBuyIncrease(0)
            expect(await _dpnm.gwtBuyIncrease()).to.be.equal(0)

            await _dpnm.setgwtBuyIncrease(25)
            expect(await _dpnm.gwtBuyIncrease()).to.be.equal(25)

            await expect(_dpnm.setgwtBuyIncrease(26)).to.be.revertedWith("Out of range");
        });

        it("dPNM | setgwtSellIncrease", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await _dpnm.setgwtSellIncrease(0)
            expect(await _dpnm.gwtSellIncrease()).to.be.equal(0)

            await _dpnm.setgwtSellIncrease(25)
            expect(await _dpnm.gwtSellIncrease()).to.be.equal(25)

            await expect(_dpnm.setgwtSellIncrease(26)).to.be.revertedWith("Out of range");
        });

        it("dPNM | setdPNMsellTurnoverIncrease", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await _dpnm.setdPNMsellTurnoverIncrease(0)
            expect(await _dpnm.dPNMsellTurnoverIncrease()).to.be.equal(0)

            await _dpnm.setdPNMsellTurnoverIncrease(25)
            expect(await _dpnm.dPNMsellTurnoverIncrease()).to.be.equal(25)

            await expect(_dpnm.setdPNMsellTurnoverIncrease(26)).to.be.revertedWith("Out of range");
        });

        it("dPNM | setearnLimitDepositedPerc", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await _dpnm.setearnLimitDepositedPerc(200)
            expect(await _dpnm.earnLimitDepositedPerc()).to.be.equal(200)

            await _dpnm.setearnLimitDepositedPerc(250)
            expect(await _dpnm.earnLimitDepositedPerc()).to.be.equal(250)

            await expect(_dpnm.setearnLimitDepositedPerc(260)).to.be.revertedWith("Out of range");
        });

        it("dPNM | check if locked", async function () {
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt } = await loadFixture(secondUserBuyDPNMFor50BUSD);
            await _dpnm.changeLock()
            expect(await _dpnm.isLocked()).to.be.equal(true)

            await expect(_dpnm.connect(_user1).changeLock()).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(_dpnm.connect(_user1).activate(user3,user2)).to.be.revertedWith("Locked");
            await expect(_dpnm.connect(_user1).buydPNM(utils.parseEther("5"))).to.be.revertedWith("Locked");
        });


    });


    /**
     * @dev Variables changed by owner/promoter should work as expected. In this block are covered variables that has not been covered in previous tests
     */
    describe("==17) Check that variables changed by owner change behaviour", function () {
        // return(0)
        it("dPNM | setbuyFeeToLiquidity works ", async function () {
            //when buy dpnm should take not 20% but 10% fee, liquidity changed on marketing leftover
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt  } = await loadFixture(secondUserRegisters);
            await _dpnm.setbuyFeeToLiquidity(0)
            expect(await _dpnm.buyFeeToLiquidity()).to.be.equal(0)

            await disablePrestart(_dpnm,_busd,_busd_owner,_owner)
            //buy dpnm for 50, price = 1, so should get 50-10% = 45 dpnm
            const weiValue = utils.parseEther("50");

            let liquidity = await _busd.balanceOf(_dpnm.address)//47.5 goes to liquidity + 1 from prestart
            await depositBUSD(_busd,_busd_owner,user2,"50")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,weiValue)
            await _dpnm.connect(_user2).buydPNM(weiValue)
            liquidity = await _busd.balanceOf(_dpnm.address)


            expect(liquidity).to.be.equal(utils.parseEther("48.5"))
            expect(await _dpnm.balanceOf(user2)).to.be.equal(utils.parseEther("45.0"))
        });


        it("dPNM | setsellFeeToLiquidity works ", async function () {
            //when buy dpnm should take not 20% but 10% fee, liquidity changed on marketing leftover
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt  } = await loadFixture(secondUserRegisters);
            await _dpnm.setsellFeeToLiquidity(0)
            expect(await _dpnm.sellFeeToLiquidity()).to.be.equal(0)

            await disablePrestart(_dpnm,_busd,_busd_owner,_owner)
            //buy dpnm for 50, price = 1, so should get 50-10% = 45 dpnm
            const weiValue = utils.parseEther("50");

            let liquidity = await _busd.balanceOf(_dpnm.address)//47.5 goes to liquidity + 1 from prestart
            await depositBUSD(_busd,_busd_owner,user2,"50")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,weiValue)
            await _dpnm.connect(_user2).buydPNM(weiValue)
            liquidity = await _busd.balanceOf(_dpnm.address)

            //user sell for 20 BUSD
            await _dpnm.connect(_user2).selldPNM(utils.parseEther("20"))
            liquidity = await _busd.balanceOf(_dpnm.address)

            expect(liquidity).to.be.equal(utils.parseEther("28.5"))//48.5-20
            expect(await _busd.balanceOf(feeCollector)).to.be.equal(utils.parseEther("23.1"))//+1 BUSD
            expect(await _busd.balanceOf(user2)).to.be.equal(utils.parseEther("19"))//20-5%
        });
        

        it("dPNM | setturnoverForOneGWT works ", async function () {
            //when buy dpnm should take not 20% but 10% fee, liquidity changed on marketing leftover
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt  } = await loadFixture(secondUserRegisters);
            await _dpnm.setturnoverForOneGWT(utils.parseEther("250"))
            expect(await _dpnm.turnoverForOneGWT()).to.be.equal(utils.parseEther("250"))

            await disablePrestart(_dpnm,_busd,_busd_owner,_owner)
            //buy dpnm for 50, price = 1, so should get 50-10% = 45 dpnm
            const weiValue = utils.parseEther("50");

            let liquidity = await _busd.balanceOf(_dpnm.address)//47.5 goes to liquidity + 1 from prestart
            await depositBUSD(_busd,_busd_owner,user2,"52")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,utils.parseEther("52"))
            await _dpnm.connect(_user2).buydPNM(utils.parseEther("50"))
            liquidity = await _busd.balanceOf(_dpnm.address)

            //buy turnover
            await _dpnm.connect(_user2).buyTurnoverWithGWT(utils.parseEther("250"))
            liquidity = await _busd.balanceOf(_dpnm.address)

            const userData = await _dpnm.getUserData(user2)

            expect(userData[1]).to.be.equal(utils.parseEther("250.0"))//250 turnover
        });

        
        it("dPNM | setgwtBuyIncrease works ", async function () {
            //when buy dpnm should take not 20% but 10% fee, liquidity changed on marketing leftover
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt  } = await loadFixture(secondUserRegisters);
            await _dpnm.setgwtBuyIncrease(10)
            expect(await _dpnm.gwtBuyIncrease()).to.be.equal(10)

            await disablePrestart(_dpnm,_busd,_busd_owner,_owner)
            //buy dpnm for 50, price = 1, so should get 50-10% = 45 dpnm
            const weiValue = utils.parseEther("50");

            await depositBUSD(_busd,_busd_owner,user2,"50")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,utils.parseEther("50"))
            await _dpnm.connect(_user2).buydPNM(utils.parseEther("50"))

            expect(await _gwt.balanceOf(user2)).to.be.equal(utils.parseEther("21.0"))//10 activation + (10 dpnmbuy + 10%)
        });
        
        it("dPNM | setgwtSellIncrease works ", async function () {
            //when buy dpnm should take not 20% but 10% fee, liquidity changed on marketing leftover
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt  } = await loadFixture(secondUserRegisters);
            await _dpnm.setgwtSellIncrease(10)
            expect(await _dpnm.gwtSellIncrease()).to.be.equal(10)

            await disablePrestart(_dpnm,_busd,_busd_owner,_owner)
            //buy dpnm for 50, price = 1, so should get 50-10% = 45 dpnm
            const weiValue = utils.parseEther("50");

            let liquidity = await _busd.balanceOf(_dpnm.address)//47.5 goes to liquidity + 1 from prestart
            await depositBUSD(_busd,_busd_owner,user2,"50")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,weiValue)
            await _dpnm.connect(_user2).buydPNM(weiValue)
            liquidity = await _busd.balanceOf(_dpnm.address)

            //user sell for 20 BUSD
            await _dpnm.connect(_user2).selldPNM(utils.parseEther("20"))
            liquidity = await _busd.balanceOf(_dpnm.address)

            expect(await _gwt.balanceOf(user2)).to.be.equal(utils.parseEther("22.2"))//10 activate + 10 buy + (2 sell + 10%)
        });

        
        it("dPNM | setearnLimitDepositedPerc works ", async function () {
            //when buy dpnm should take not 20% but 10% fee, liquidity changed on marketing leftover
            const { _dpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt  } = await loadFixture(secondUserRegisters);
            await _dpnm.setearnLimitDepositedPerc(250)
            expect(await _dpnm.earnLimitDepositedPerc()).to.be.equal(250)

            await disablePrestart(_dpnm,_busd,_busd_owner,_owner)
            //buy dpnm for 50, price = 1, so should get 50-10% = 45 dpnm
            const weiValue = utils.parseEther("50");
            // await showUserData(_dpnm,_busd,_gwt,user2,"user2")

            await depositBUSD(_busd,_busd_owner,user2,"50")
            await _busd.connect(_user2).increaseAllowance(_dpnm.address,utils.parseEther("50"))
            await _dpnm.connect(_user2).buydPNM(utils.parseEther("50"))

            const userData = await _dpnm.getUserData(user2)
            // await showUserData(_dpnm,_busd,_gwt,user2,"user2")

            expect(userData[2]).to.be.equal(utils.parseEther("125.0"))//50*2.5 earn limit
            expect(userData[4]).to.be.equal(utils.parseEther("125.0"))
        });

    });

    
});

