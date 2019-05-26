exports.ChangeMemDatabase = class{
	constructor (address,port,database){
		this.request = require('sync-request');

		this.address = address;
		this.port = port;
		this.database = database;
	};


	SendPostbyjson(url,paras){
		let headers = {
			'Content-Type':'application/json'
		};

		//リクエスト送信
		let res = this.request(
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


	get(table,index=""){
		let result = this.SendPostbyjson("http://"+this.address+":"+this.port,{"function":"get","args":{"database":this.database,"table":table,"index":index}});
		return result;
	}


	getindexs(table){
		let result = this.SendPostbyjson("http://"+this.address+":"+this.port,{"function":"getindexs","args":{"database":this.database,"table":table}});
		return result;
	}
};






exports.RunCommit = function(key){
	let http = require('http');
	let fs = require('fs');
	let crypto = require('./crypto.js');
	let main = require('./main.js');

	function load(database,table,index=""){
		try {
			if (!index){
				let result = [];
				let path = "database/"+database+"/"+table+"/";
				let list = fs.readdirSync(path);
				for (let index in list){
					let value = list[index];

					result.push(value.replace(/.json/g, ''));
				}

				return result;
			}


			let path = "database/"+database+"/"+table+"/"+index+".json";
			fs.statSync(path);
			let data = fs.readFileSync(path, 'utf8');
			data = new crypto.common().GetDecryptedData(key,data);
			data = JSON.parse(data);
			return data;
		} catch (error) {
			if (error.code === 'ENOENT') {
				return [];
			} else {
				console.log(error);
			}
		}
	}


	function save(database,table,index,data){
		data = JSON.stringify(data);
		data = new crypto.common().GetEncryptedData(key,data);

		fs.mkdir("database/", function (err) {
			fs.mkdir("database/"+database+"/", function (err) {
				fs.mkdir("database/"+database+"/"+table+"/", function (err) {

					fs.writeFile("database/"+database+"/"+table+"/"+index+".json", data, "utf8", (error) => {
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


	let transactions = [];

	http.createServer(function(request, response) {
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

					transactions.push({"database":database,"table":table,"index":index,"data":result});

					response.write(JSON.stringify(true));
					response.end();
				};
				if(postData["function"] == "add"){
					let database = postData["args"]["database"];
					let table = postData["args"]["table"];
					let index = postData["args"]["index"];
					let data = postData["args"]["data"];


					let result = load(database,table,index);
					result.push(data);

					transactions.push({"database":database,"table":table,"index":index,"data":result});

					response.write(JSON.stringify(true));
					response.end();
				};
				if(postData["function"] == "get"){
					let database = postData["args"]["database"];
					let table = postData["args"]["table"];
					let index = postData["args"]["index"];

					while(transactions.length > 0){};

					let result = load(database,table,index);

					if (result){
						response.write(JSON.stringify(result));
						response.end();
					}else{
						response.write(JSON.stringify([]));
						response.end();
					}
				};
			});
		};

	}).listen(Config.database["port"], Config.database["address"]);



	setInterval(
		function(){
			for (let index in transactions){
				let transaction = transactions[index];

				save(transaction["database"],transaction["table"],transaction["index"],transaction["data"]);
			};
			transactions = [];
		},
		1
	)
};
