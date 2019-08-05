const CLUSTER = require('cluster');
const FS = require('fs');

const MAIN = require('./main.js');
const CRYPTO = require('./crypto.js');

(async () => {
	try{
		const CONFIG = require('./config.js');
	}catch(e){
		console.log("None Config!Setup Config!");

		/*
			Configの設定
		*/
		let DATABASE_ADDRESS = await MAIN.GetConsole("[Database] Use Address (127.0.0.1) : ");
		if (!DATABASE_ADDRESS){
			DATABASE_ADDRESS = "127.0.0.1";
		};
		let DATABASE_PORT = await MAIN.GetConsole("[Database] Use Port (20195) : ");
		if (!DATABASE_PORT){
			DATABASE_PORT = "20195";
		};
		let DATABASE_KEY = await MAIN.GetConsole("[Database] Use Key () : ");
		if (!DATABASE_KEY){
			DATABASE_KEY = "";
		};
		let API_ADDRESS = await MAIN.GetConsole("[API] Use Address (0.0.0.0) : ");
		if (!API_ADDRESS){
			API_ADDRESS = "0.0.0.0";
		};
		let API_PORT = await MAIN.GetConsole("[API] Use Port (80) : ");
		if (!API_PORT){
			API_PORT = "80";
		};
		let IMPORTTAGS = await MAIN.GetConsole('[ImportTags] (["pay","tagreward"]) : ');
		if (!IMPORTTAGS){
			IMPORTTAGS = "[]";
		};
		let TAGREWARD_MININGTAGS = await MAIN.GetConsole('[TagReward] Mining Tags (["pay","tagreward"]) : ');
		if (!TAGREWARD_MININGTAGS){
			TAGREWARD_MININGTAGS = "[]";
		};

		let TAGREWARD_COLLECTPRIVKEY = await MAIN.GetConsole('[TagReward] Collect Privkey () : ');
		if (!TAGREWARD_COLLECTPRIVKEY){
			TAGREWARD_COLLECTPRIVKEY = await new CRYPTO.signature().CreatePrivkey();
		}



		let ConfigData = FS.readFileSync("./config_sample.js", 'utf8');
		ConfigData = ConfigData.replace( 'DATABASE_ADDRESS', '"'+DATABASE_ADDRESS+'"' );
		ConfigData = ConfigData.replace( 'DATABASE_PORT', DATABASE_PORT );
		ConfigData = ConfigData.replace( 'DATABASE_KEY', '"'+DATABASE_KEY+'"' );
		ConfigData = ConfigData.replace( 'API_ADDRESS', '"'+API_ADDRESS+'"' );
		ConfigData = ConfigData.replace( 'API_PORT', API_PORT );

		ConfigData = ConfigData.replace( 'IMPORTTAGS', IMPORTTAGS );

		ConfigData = ConfigData.replace( 'TAGREWARD_MININGTAGS', TAGREWARD_MININGTAGS );
		ConfigData = ConfigData.replace( 'TAGREWARD_COLLECTPRIVKEY', '"'+TAGREWARD_COLLECTPRIVKEY+'"' );

		FS.writeFile("./config.js", ConfigData, "utf8", (error) => {
			if (error) {
				console.log(error.message);
				throw error;
			}
			console.log("Done!Restart please!");
			process.exit(0);
		});
	}





	let FunctionList = [
		{"name":"DatabaseRunCommit","function":function(){let Database = require('./database.js');Database.RunCommit()},"time":0},
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
})();