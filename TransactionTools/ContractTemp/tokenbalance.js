const runnerkeys = JSON.parse(process.argv[2]); //コントラクト実行しているアカウント情報取得
const args = JSON.parse(process.argv[3]); //引数取得
const data = JSON.parse(process.argv[4]); //tagに関連したコントラクトのデータをすべて取得



let address = runnerkeys["address"];

if (!(address in data)){
	return {"result":0,"SetData":data};
};


console.log( JSON.stringify({"result":data[address]["balance"],"SetData":data}) );
