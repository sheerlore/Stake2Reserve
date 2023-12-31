const hre = require("hardhat");
const erc20_abi = require("../abi/ERC20.json");

const USDC_DECIMALS = 100*(10**6);

async function main() {
  const [owner, otherAccount] = await hre.ethers.getSigners();
  console.log("owner: ",owner.address);
  console.log("otherAccount: ",otherAccount.address);

  /*--------------------------------+
   *  CHANGE IT HERE WHEN DEPLOY!!  |
   +-------------------------------*/
  const USDC_ADDRESS = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8';
  const USDC = new hre.ethers.Contract(USDC_ADDRESS, erc20_abi, owner);

  const S2RNFTFactory = await ethers.getContractFactory("S2RNFT");
  const S2RNFT = await S2RNFTFactory.deploy();
  // await S2RNFT.waitForDeployment();
  console.log("S2RNFT deployed to: ", S2RNFT.target);

  const S2RAaveFactory = await ethers.getContractFactory("S2RAave");
  const S2RAave = await S2RAaveFactory.deploy();
  // await S2RAave.waitForDeployment();
  console.log("S2RAave deployed to: ", S2RAave.target);

  const contractFactory = await hre.ethers.getContractFactory("Stake2Reserve");
  const contract = await contractFactory.deploy(USDC_ADDRESS, S2RNFT.target, S2RAave.target);
  await contract.waitForDeployment();
  console.log("Stake2Reserve deployed to: ", contract.target);
  
  const registerShopDataTx = await registerShopData(contract);
  // console.log(registerShopDataTx);
  await registerShopDataTx.wait();
  console.log('Registration Done');

  // reservation
  const reservationStartTime = new Date(Date.UTC(2023, 10-1, 3, 12+4, 30, 0)).getTime()/1000;
  const reservationEndTime = new Date(Date.UTC(2023, 10-1, 3, 13+4, 30, 0)).getTime()/1000;
  const usdcApproveTx = await USDC.connect(otherAccount).approve(contract.target, 2*100*USDC_DECIMALS+150*USDC_DECIMALS);
  await usdcApproveTx.wait();
  console.log('Approve (for Reservation) Done');
  const reserveTx = await contract.connect(otherAccount).reserve(owner.address, reservationStartTime, reservationEndTime, 2, 0);
  // const reserveTx2 = await contract.connect(otherAccount).reserve(owner.address, reservationStartTime+3000, reservationEndTime+3000, 2, 0);
  await reserveTx.wait();
  console.log('Reservation Done');

  // Check out
  const setPaymentAmountTx = await contract.setPaymentAmount(0, 250)
  await setPaymentAmountTx.wait();
  console.log('setPaymentAmount Done');
  const checkOutTx = await contract.connect(otherAccount).checkOut(0)
  await checkOutTx.wait();
  console.log('checkOut Done');

  // withdrawCancelFee


}

const registerShopData = async (contract)=>{
  const _name = "Shop Name Here";
  const openingWeekDays = [true, false, true, true, true, true, true]; // only closed on Monday
  const openingTime = 60*60*10; // from 10am
  const closingTime = 60*60*18; // to 6pm
  const courses = [{name: "delicious sushi", cancelFee: 100, imageURLs: ["https://i.imgur.com/4dr7xZo.jpeg", "https://i.imgur.com/zWwZ1Bm.jpeg"]},{name: "delicious sushi #2", cancelFee: 200, imageURLs: ["https://i.imgur.com/4dr7xZo.jpeg", "https://i.imgur.com/zWwZ1Bm.jpeg"]}];
  const imageURL = "https://i.imgur.com/FSmb6op.jpeg";
  const genre = "Japanese Food";
  const description = "ZenBite Sushi is a fictional sushi restaurant with a serene garden ambiance. Their menu includes both traditional and innovative sushi rolls, prepared by expert chefs at an open bar, providing a unique dining experience.";
  const registerShopPropertyTx = await contract.registerShopProperty(_name, openingWeekDays, openingTime, closingTime, courses, imageURL, genre, description);
  return registerShopPropertyTx;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
