const SYNCREQUEST = require('sync-request');
const HTTP = require('http');
const FS = require('fs');
const bPROMISE = require('bluebird');

const CONFIG = require('./config.js');




exports.ChangeMemDatabase = class{
	constructor (address,port,database){
		this.address = address;
		this.port = port;
		this.database = database;
	};


	SendPostbyjson(url,paras){
		let headers = {
			'Content-Type':'application/json'
		};

		//リクエスト送信
		let res = SYNCREQUEST(
			'POST',
			url, 
			{
				headers: headers,
				json: paras,
			}
		);
		return JSON.parse(res.getBody('utf8'));
	};

	add(table,index,data){
		let result = this.SendPostbyjson("http://"+this.address+":"+this.port,{"function":"add","args":{"database":this.database,"table":table,"index":index,"data":data}});
		return result;
	}


	set(table,index,data){
		let result = this.SendPostbyjson("http://"+this.address+":"+this.port,{"function":"set","args":{"database":this.database,"table":table,"index":index,"data":data}});
		return result;
	}


	remove(table,index,removeindex){
		let result = this.SendPostbyjson("http://"+this.address+":"+this.port,{"function":"remove","args":{"database":this.database,"table":table,"index":index,"removeindex":parseInt(removeindex)}});
		return result;
	}


	delete(table,index){
		let result = this.SendPostbyjson("http://"+this.address+":"+this.port,{"function":"delete","args":{"database":this.database,"table":table,"index":index}});
		return result;
	}


	get(table,index=""){
		let result = this.SendPostbyjson("http://"+this.address+":"+this.port,{"function":"get","args":{"database":this.database,"table":table,"index":index}});
		return result;
	}


	getindexs(table){
		let result = this.SendPostbyjson("http://"+this.address+":"+this.port,{"function":"getindexs","args":{"database":this.database,"table":table}});
		return result;
	}
};






exports.RunCommit = function(){


	function load(database,table,index=""){	
		try {
			if (!index){
				let result = [];
				let path = "database/"+database+"/"+table+"/";
				let list = FS.readdirSync(path);
				for (let index in list){
					let value = list[index];

					result.push(value.replace(/.json/g, ''));
				}

				return result;
			};


			let path = "database/"+database+"/"+table+"/"+index+".json";
			FS.statSync(path);

			let data = FS.readFileSync(path, 'utf8');
			//暗号化必要性
			if ("key" in CONFIG.database && CONFIG.database["key"]){
				const CRYPTO = require('./crypto.js');
				data = new CRYPTO.common().GetDecryptedData(CONFIG.database["key"],data);
			};
			try{
				data = JSON.parse(data);
			}catch(e){
				console.log(e);
				return [];
			}

			return data;

		}catch (e){
			if (e.code === 'ENOENT') {
				return [];
			} else {
				console.log(e);
			}
		}
	}


	function save(database,table,index,data){
		data = JSON.stringify(data);
		if ("key" in CONFIG.database && CONFIG.database["key"]){
			const CRYPTO = require('./crypto.js');
			data = new CRYPTO.common().GetEncryptedData(CONFIG.database["key"],data);
		};

		FS.mkdir("database/", function (err) {
			FS.mkdir("database/"+database+"/", function (err) {
				FS.mkdir("database/"+database+"/"+table+"/", function (err) {

					FS.writeFile("database/"+database+"/"+table+"/"+index+".json", data, "utf8", (error) => {
						if (error) {
							console.log(error.message);
							throw error;
						}
					});

				});
			});
		});
		return true;
	}


	function Delete(database,table,index){
		FS.unlinkSync("database/"+database+"/"+table+"/"+index+".json");
		return true;
	}


	let transactions = [];

	HTTP.createServer(function(request, response) {
		response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});

		if(request.method === 'POST') {
			let postData = "";
			request.on('data', function(chunk) {
				postData += chunk;
			}).on('end', function() {
				postData = JSON.parse(postData);

				if(postData["function"] == "set"){
					let database = postData["args"]["database"];
					let table = postData["args"]["table"];
					let index = postData["args"]["index"];
					let data = postData["args"]["data"];

					let result = [];
					if (data instanceof Array){
						result = data;
					}else{
						result = [data];
					}

					transactions.push({"function":"set","args":{"database":database,"table":table,"index":index,"data":result}});

					response.write(JSON.stringify(true));
					response.end();
				};
				if(postData["function"] == "add"){
					let database = postData["args"]["database"];
					let table = postData["args"]["table"];
					let index = postData["args"]["index"];
					let data = postData["args"]["data"];

					transactions.push({"function":"add","args":{"database":database,"table":table,"index":index,"data":data}});

					response.write(JSON.stringify(true));
					response.end();
				};
				if(postData["function"] == "remove"){
					let database = postData["args"]["database"];
					let table = postData["args"]["table"];
					let index = postData["args"]["index"];
					let removeindex = parseInt(postData["args"]["removeindex"]);

					transactions.push({"function":"remove","args":{"database":database,"table":table,"index":index,"removeindex":removeindex}});

					response.write(JSON.stringify(true));
					response.end();
				};
				if(postData["function"] == "delete"){
					let database = postData["args"]["database"];
					let table = postData["args"]["table"];
					let index = postData["args"]["index"];

					transactions.push({"function":"delete","args":{"database":database,"table":table,"index":index}});

					response.write(JSON.stringify(true));
					response.end();
				};
				if(postData["function"] == "get"){
					let database = postData["args"]["database"];
					let table = postData["args"]["table"];
					let index = postData["args"]["index"];

					

					(function loop(i) {
						if (transactions.length > 0) {
							return bPROMISE.delay(100).then(function() {
								return i+1;
							}).then(loop);
						}

						let result = load(database,table,index);

						if (result){
							response.write(JSON.stringify(result));
							response.end();
						}else{
							response.write(JSON.stringify([]));
							response.end();
						}

						return bPROMISE.resolve(i);
					})(0);

				};
			});
		};

	}).listen(CONFIG.database["port"], CONFIG.database["address"]);



	setInterval(
		function(){
			for (let index in transactions){
				let transaction = transactions[index];

				if (transaction["function"] == "set"){
					save(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"],transaction["args"]["data"]);
				};
				if (transaction["function"] == "add"){
					let data = load(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"]);
					data.push(transaction["args"]["data"]);

					save(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"],data);
				};
				if (transaction["function"] == "remove"){
					let data = load(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"]);
					data.splice(transaction["args"]["removeindex"], 1);

					save(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"],data);
				};
				if (transaction["function"] == "delete"){
					Delete(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"]);
				};
			};
			transactions = [];
		},
		1
	)
};
