# HoneyChain(`mocha` and `ethers`)

This project showcases a blockchain system made for Beekeepers and consumers and any other professions involved in this to keep track of honey produced right from its harvesting phase till it reaches consumers to verify them . This is Hardhat 3 project using `mocha` for tests and the `ethers` library for Ethereum interactions.

To learn more about Hardhat 3, please visit the [Getting Started guide](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3). To share your feedback, join our [Hardhat 3](https://hardhat.org/hardhat3-telegram-group) Telegram group or [open an issue](https://github.com/NomicFoundation/hardhat/issues/new) in our GitHub issue tracker.

## Project Overview

This project includes:

- A fully working Smart Contract built for this blockchain
- Admin,Beekeeper,Lab,Processor,Distributors roles and a default consumer roles
- Secure File Transfers for reports using PINATA IPFS . Reports are hashed to maintain integrity
- A fully funtional full stack web Applications to interact with this blockcahin.

## Usage
### Setup
Make sure to have metamask account and Pinata API key
and paste it in env folder in backend if there isnt one MAKE one and put content in it acc to the .env example file given and put port=4000

###Deployed on Ploygon Amoy Testnet
RPC URL :- 
```shell
https://polygon-amoy.drpc.org
```
Frontend URL :-
```shell
https://honeychain-1-qss4.onrender.com
```

Backend URL :-
```shell
https://honeychain-epxx.onrender.com
```

### Running Tests (pre deployment phase for testing)

To Run Test and Deploy the Contract

```shell
npx hardhat compile
npx hardhat test
```

Make sure all tests are runned and tested successfully
Now run this,
```shell
npx hardhat run scripts/deploy.ts --network localhost
```
Copy Blockchain deployed address and paste in this command below and check if address length is 42 characters.

```shell
$env:CONTRACT_ADDRESS="PASTE_HERE"
($env:CONTRACT_ADDRESS).Length
```
Now deploy it
```shell
npx hardhat run scripts/seedRoles.ts --network localhost
npx hardhat run scripts/exportAbi.ts
```

Now to Run everything
In root folder in IDE in a terminal use this to activate the blockchain network
```shell
npx hardhat node
```

In separate terminal, move to frontend file and deploy the react server
```shell
cd frontend
npm run dev
```

In separate terminal, move to backend folder and deploy the node.js server
```shell
cd backend
node server.js
```
or
```shell
cd backend
npm run dev
```
