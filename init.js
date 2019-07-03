const CLUSTER = require('cluster');
const FS = require('fs');

const CONFIG = require('./config.js');





let FunctionList = [
	{"name":"DatabaseRunCommit","function":function(){let Database = require('./database.js');Database.RunCommit(CONFIG.database["key"])},"time":0},
	{"name":"TransactionRunCommit","function":function(){let Transaction = require('./transaction.js');Transaction.RunCommit()},"time":1000},
	{"name":"BroadcastSetServer","function":function(){let Broadcast = require('./broadcast.js');Broadcast.SetServer()},"time":1000},
	{"name":"BroadcastSetClient","function":function(){let Broadcast = require('./broadcast.js');Broadcast.SetClient()},"time":1000},
	{"name":"APISetServer","function":function(){let API = require('./api.js');API.SetServer()},"time":1000},
	{"name":"TagrewardRunMining","function":function(){let Tagreward = require('./TransactionTools/tagreward.js');Tagreward.RunMining()},"time":1000},
	{"name":"console","function":function(){let Console = require('./console.js');Console.RunConsole()},"time":1000},
	{
		"name":"TEST",
		"function":function(){
			FS.stat('./test.js', (error, stats) => {
				if (!error) {
					let TEST = require('./test.js');
					TEST.main();
				}
			})
		},
		"time":2000
	},
];



if (CLUSTER.isMaster) {
	for (let index in FunctionList) {
		let worker = CLUSTER.fork();
		FunctionList[index]["pid"] = worker.process.pid;
	}

	CLUSTER.on('exit', (worker, code, signal) => {
		console.log(`worker ${worker.process.pid} died`);
	});
}else{
	let worker_id = CLUSTER.worker.id;
	
	setTimeout(function()
		{
			FunctionList[worker_id-1]["function"]();

			console.log(`Worker ${process.pid} to ${FunctionList[worker_id-1]["name"]} started`);
		},
		FunctionList[worker_id-1]["time"]
	);
}
