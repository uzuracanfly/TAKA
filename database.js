const SYNCREQUEST = require('sync-request');
const HTTP = require('http');
const FS = require('fs');
const bPROMISE = require('bluebird');
const CRYPTO = require('crypto');

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






exports.RunCommit = async function(){


	const GetFillZero = function(hex, hexlength){
		let needzeroffill = hexlength-hex.length;
		if (needzeroffill > 0){
			for (var i=needzeroffill;i>0;i--){
				hex = "0" + hex
			};
		};

		return hex;
	};


	const sleep = function(msec){
		return new Promise(function(resolve) {
			setTimeout(function() {resolve()}, 1000*msec);
		})
	}


	const ConversionData = function(array,hex){
		if (array){
			let lencount = array.length;
			lencount = lencount.toString(16);
			hex = GetFillZero(lencount,16);
			
			for (let index in array){
				let per = array[index];

				let perlen = per.length;
				perlen = perlen.toString(16);
				perlen = GetFillZero(perlen,16);

				hex = hex + perlen + per;
			}

			return hex;
		}else if (hex){
			function cut(len){
				let cuthex = hex.slice(0,len);
				hex = hex.slice(len);
				return cuthex;
			};


			function VariableCut(lenlen=16){
				let len = parseInt(cut(lenlen),16);

				let cuthex = hex.slice(0,len);
				hex = hex.slice(len);

				return cuthex;
			};

			array = [];
			let lencount = parseInt(cut(16),16);
			for (let index=0;index<lencount;index++){
				array.push(VariableCut(16));
			}

			return array;
		}
	};



	async function load(database,table,index=""){
		while (true){
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

				let data = FS.readFileSync(path, 'hex');
				//暗号化必要性
				if ("key" in CONFIG.database && CONFIG.database["key"]){
					const CRYPTO = require('./crypto.js');
					data = new CRYPTO.common().GetDecryptedData(CONFIG.database["key"],data);
				};


				if (!data){
					throw new Error("no data");
				}

				data = ConversionData("",data);

				return data;

			}catch(e){
				if (e.code === 'ENOENT') {
					return [];
				} else {
					console.log(e);
				}
			};

			await sleep(1);
		};
	}


	/*
		arg data : array
		save data : hex
	*/
	async function save(database,table,index,data){
		return new Promise(function (resolve, reject) {
			data = ConversionData(data,"");

			if ("key" in CONFIG.database && CONFIG.database["key"]){
				const CRYPTO = require('./crypto.js');
				data = new CRYPTO.common().GetEncryptedData(CONFIG.database["key"],data);
			};

			FS.mkdir("database/", function (err) {
				FS.mkdir("database/"+database+"/", function (err) {
					FS.mkdir("database/"+database+"/"+table+"/", function (err) {

						FS.writeFile("database/"+database+"/"+table+"/"+index+".json", data, "hex", (error) => {
							if (error) {
								return resolve(false);
							}
							return resolve(true);
						});

					});
				});
			});
		});
	}


	function Delete(database,table,index){
		FS.unlinkSync("database/"+database+"/"+table+"/"+index+".json");
		return true;
	}


	let transactions = [];
	let ResultValues = {};

	HTTP.createServer(async function(request, response) {
		response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});

		if(request.method === 'POST') {
			let postData = "";
			request.on('data', async function(chunk) {
				postData += chunk;
			}).on('end', async function() {
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
					
					let ResultsKey = CRYPTO.randomBytes(16).toString('base64').substring(0, 16);
					transactions.push({"function":"load","args":{"database":database,"table":table,"index":index},"ResultsKey":ResultsKey});

					while (true){
						if (ResultsKey in ResultValues){
							let result = ResultValues[ResultsKey];

							response.write(JSON.stringify(result));
							response.end();

							delete ResultValues[ResultsKey];

							break;
						}

						await sleep(0.1);
					}

				};
			});
		};

	}).listen(CONFIG.database["port"], CONFIG.database["address"]);




	while (true){
		if (transactions.length > 0){
			let transaction = transactions[0];

			transactions.shift();

			if (transaction["function"] == "set"){
				await save(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"],transaction["args"]["data"]);
			};
			if (transaction["function"] == "add"){
				let data = await load(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"]);
				data.push(transaction["args"]["data"]);
				await save(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"],data);
			};
			if (transaction["function"] == "remove"){
				let data = await load(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"]);
				data.splice(transaction["args"]["removeindex"], 1);
				await save(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"],data);
			};
			if (transaction["function"] == "delete"){
				Delete(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"]);
			};
			if (transaction["function"] == "load"){
				ResultValues[transaction["ResultsKey"]] = await load(transaction["args"]["database"],transaction["args"]["table"],transaction["args"]["index"]);
			}
		};

		await sleep(0.1);
	};

};
