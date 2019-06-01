const cluster = require('cluster');
global.Config = require('./config.js');



function genesis_transaction(toprivkey,InitialAmount){
	let Account = require('./account.js');
	let Hashs = require('./hashs.js');

	let privkey = new Hashs.hashs().sha256d(Math.floor(Date.now()/1000).toString(16));

	let AccountClass = new Account.account(privkey);
	let ToAccountClass = new Account.account(toprivkey);
	console.log("[Owner]");
	console.log(AccountClass.GetKeys());


	console.log("[GenesisObjTx]");
	let objtx = {
		"pubkey":ToAccountClass.GetKeys()["pubkey"],
		"type":1,
		"time":Math.floor(Date.now()/1000),
		"tag":"pay",
		"index":1,
		"MerkleRoot":"",
		"toaddress":ToAccountClass.GetKeys()["address"],
		"amount":InitialAmount,
		"data":"",
		"sig":"",
		"nonce":0
	};
	console.log(objtx);


	let TransactionName = require('./transaction.js');
	let TestTransaction = new TransactionName.Transaction("",privkey,objtx);
	console.log(TestTransaction.commit())
};





let FunctionList = [
	{"name":"DatabaseRunCommit","function":function(){let Database = require('./database.js');Database.RunCommit(Config.database["key"])}},
	{"name":"TransactionRunCommit","function":function(){let Transaction = require('./transaction.js');Transaction.RunCommit()}},
	{"name":"BroadcastSetServer","function":function(){let Broadcast = require('./broadcast.js');Broadcast.SetServer()}},
	{"name":"BroadcastRunScanning","function":function(){let Broadcast = require('./broadcast.js');Broadcast.RunScanning()}},
	{"name":"APISetServer","function":function(){let API = require('./api.js');API.SetServer()}},
	{"name":"NegoRunMining","function":function(){let Nego = require('./TransactionTools/nego.js');Nego.RunMining()}},
	{"name":"console","function":function(){let Console = require('./console.js');Console.RunConsole()}},
];



if (cluster.isMaster) {
	for (let index in FunctionList) {
		let worker = cluster.fork();
		FunctionList[index]["pid"] = worker.process.pid;
	}

	cluster.on('exit', (worker, code, signal) => {
		console.log(`worker ${worker.process.pid} died`);
	});
}else{

	let worker_id = cluster.worker.id;
	FunctionList[worker_id-1]["function"]();

	console.log(`Worker ${process.pid} to ${FunctionList[worker_id-1]["name"]} started`);
}
