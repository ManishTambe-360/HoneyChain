# Sample Hardhat 3 Project (`mocha` and `ethers`)

This project showcases a Hardhat 3 project using `mocha` for tests and the `ethers` library for Ethereum interactions.

To learn more about Hardhat 3, please visit the [Getting Started guide](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3). To share your feedback, join our [Hardhat 3](https://hardhat.org/hardhat3-telegram-group) Telegram group or [open an issue](https://github.com/NomicFoundation/hardhat/issues/new) in our GitHub issue tracker.

## Project Overview

This example project includes:

- A simple Hardhat configuration file.
- Foundry-compatible Solidity unit tests.
- TypeScript integration tests using `mocha` and ethers.js
- Examples demonstrating how to connect to different types of networks, including locally simulating OP mainnet.

## Usage
### Setup
Make sure to have metamask account and Pinata API key
and paste it in env folder in backend if there isnt one MAKE one and put content in it acc to the .env example file given and put port=4000

### Running Tests

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

In separate terminal, move to backend folder and deploye node.js server
```shell
cd backend
node server.js
```

### Make a deployment to Sepolia

This project includes an example Ignition module to deploy the contract. You can deploy this module to a locally simulated chain or to Sepolia.

To run the deployment to a local chain:

```shell
npx hardhat ignition deploy ignition/modules/Counter.ts
```

To run the deployment to Sepolia, you need an account with funds to send the transaction. The provided Hardhat configuration includes a Configuration Variable called `SEPOLIA_PRIVATE_KEY`, which you can use to set the private key of the account you want to use.

You can set the `SEPOLIA_PRIVATE_KEY` variable using the `hardhat-keystore` plugin or by setting it as an environment variable.

To set the `SEPOLIA_PRIVATE_KEY` config variable using `hardhat-keystore`:

```shell
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

After setting the variable, you can run the deployment with the Sepolia network:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```
