const MAIN = require('./main.js');
const TRANSACTION = require('./transaction.js');
const ACCOUNT = require('./account.js');


process.on('message', async function(args) {
	try{
		if (args == "KILL"){
			process.exit();
		}

		let nonce = args["nonce"];
		let rawtx = args["rawtx"];
		let StartTime = args["StartTime"];
		let TimeoutToNonceScan = args["TimeoutToNonceScan"];
		let target = BigInt(args["target"]);

		let TargetTransaction = new TRANSACTION.Transaction(rawtx);
		let objtx = await TargetTransaction.GetObjTx();

		while (true){
			let TargetAccount = new ACCOUNT.account(objtx["pubkey"]);

			objtx["nonce"] = nonce;
			rawtx = await TargetTransaction.GetRawTx(TargetAccount,objtx);
			txid = await TargetTransaction.GetTxid(rawtx);
			numtxid = BigInt("0x"+txid);


			if (numtxid <= target){
				process.send(nonce);
				break;
			}else{
				nonce = nonce + 1;
			};


			if (TimeoutToNonceScan){
				if (Math.floor(Date.now()/1000) >= StartTime + TimeoutToNonceScan){
					process.send(-1);
					break;
				}
			};

			await MAIN.sleep(0.01);
		};
	}catch(e){
		console.log(e.message);
	}
});
