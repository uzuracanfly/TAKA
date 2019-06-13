const runnerkeys = JSON.parse(process.argv[2]); //コントラクト実行しているアカウント情報取得
const args = JSON.parse(process.argv[3]); //引数取得
const data = JSON.parse(process.argv[4]); //tagに関連したコントラクトのデータをすべて取得

const tokenowner = "610b878b39201535046ded58b8bbd84bd8581745";
const PremineAmount = 100000000;



let address = runnerkeys["address"];
let toaddress = args["toaddress"];
let amount = args["amount"];


if (!(address in data)){
	if (tokenowner == address){
		data[address] = {
			"balance":PremineAmount
		}
	}else{
		data[address] = {
			"balance":0
		}
	};
}
if (!(toaddress in data)){
	data[toaddress] = {
		"balance":0
	}
}


if (data[address]["balance"] < amount) {
	return 0;
};

data[address]["balance"] = data[address]["balance"] - amount;
data[toaddress]["balance"] = data[toaddress]["balance"] + amount;



console.log( JSON.stringify({"result":true,"SetData":data}) );
