token
====

Goal

	・Buy ETAKA
	・Exchange ETAKA to TAKA.
	・Order tag.
	・Set contract function
	・Send contract



# Using console

### Buy TAKA
To network usage fee.<br>
[Buy TAKA](https://github.com/uzuracanfly/TAKA/blob/master/doc/example/BuyTAKA.md).

### Node Start.

	node init.js

### Tag Order
type to console.

	node console.js sendtagordertx [MinPrivkey] [TAG] 0 ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff 1000000

### Set contract function
	node console.js sendsetcontracttransaction [MinPrivkey] [TAG] tokensend 1 null /root/TAKA/TransactionTools/ContractTemp/tokensend.js
	node console.js sendsetcontracttransaction [MinPrivkey] [TAG] tokenbalance 1 null /root/TAKA/TransactionTools/ContractTemp/tokenbalance.js

### Run contract function

#### Send token
	node console.js sendruncontracttransaction [MinPrivkey] [TAG] tokensend '{"toaddress":[toaddress],"amount":[amount]}' [toaddress]

#### Show token balance
	node console.js callruncontracttransaction [address] [TAG] tokenbalance '[[address]]'




# Using library

### Buy TAKA and Tag Order and Set contract function
[Using console](https://github.com/uzuracanfly/TAKA/blob/master/doc/example/token.md#using-console)

### load library.

	<script src="https://neko.taka.site/lib/TAKALibRapper"></script>

### Run contract function

#### Send token
	(async () => {
		const TAKAAPI = new TAKA.API("https://neko.taka.site");
		const TAKAFUNCTIONS = new TAKA.RappingFunctions("https://neko.taka.site");
		let ResultPlan = TAKAAPI.RunCode([address],[TAG],"tokensend",{"toaddress":[toaddress],"amount":[amount]});
		let objdata = {
			"FunctionName":"tokensend",
			"FunctionArgs":{"toaddress":[toaddress],"amount":[amount]},
			"result":ResultPlan["result"],
			"SetData":ResultPlan["SetData"],
		};
		let TXDATA = new TAKA.TRANSACTIONTOOLS_CONTRACT.RunFunctionData("",objdata);
		let rawdata = TXDATA.GetRawData();
		let result = await TAKAFUNCTIONS.SendTransaction([MinPrivkey],112,[TAG],[toaddress],0,rawdata);
		console.log(result);
	})();

#### Show token balance
	(async () => {
		const TAKAAPI = new TAKA.API("https://neko.taka.site");
		const TAKAFUNCTIONS = new TAKA.RappingFunctions("https://neko.taka.site");
		let result = TAKAAPI.CallRunContractTransaction(address,tag,FunctionName,FunctionArgs,AddressIndexs,lastonly);
		console.log(result);
	})();