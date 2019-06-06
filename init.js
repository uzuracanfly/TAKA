const STARTTIME = Math.floor( new Date().getTime() / 1000 );

global.Config = require('./config.js');

const CLUSTER = require('cluster');
const FS = require('fs');

//WebAssembly Load
global.YESCRYPT = require('./yescrypt.js');





let FunctionList = [
	{"name":"DatabaseRunCommit","function":function(){let Database = require('./database.js');Database.RunCommit(Config.database["key"])}},
	{"name":"TransactionRunCommit","function":function(){let Transaction = require('./transaction.js');Transaction.RunCommit()}},
	{"name":"BroadcastSetServer","function":function(){let Broadcast = require('./broadcast.js');Broadcast.SetServer()}},
	{"name":"BroadcastRunScanning","function":function(){let Broadcast = require('./broadcast.js');Broadcast.RunScanning()}},
	{"name":"APISetServer","function":function(){let API = require('./api.js');API.SetServer()}},
	{"name":"NegoRunMining","function":function(){let Nego = require('./TransactionTools/nego.js');Nego.RunMining()}},
	{"name":"console","function":function(){let Console = require('./console.js');Console.RunConsole()}},
	{"name":"TEST","function":function(){
		FS.stat('./test.js', (error, stats) => {
			if (!error) {
				let TEST = require('./test.js');
				TEST.main();
			}
		})
	}},
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
	setTimeout(function()
		{
			let worker_id = CLUSTER.worker.id;
			FunctionList[worker_id-1]["function"]();

			console.log(`Worker ${process.pid} to ${FunctionList[worker_id-1]["name"]} started`);
		},
		1000
	);
}
