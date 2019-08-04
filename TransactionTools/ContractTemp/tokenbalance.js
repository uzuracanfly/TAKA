try{
	let SendingData = (process.argv).slice(-1)[0];
	SendingData = JSON.parse(SendingData.replace(/@!/g, '"'));

	const runnerkeys = SendingData["keys"]; //コントラクト実行しているアカウント情報取得
	const args = SendingData["args"]; //引数取得
	const data = SendingData["data"]; //tagに関連したコントラクトのデータをすべて取得


	let address = runnerkeys["address"];

	if (!(address in data)){
		return {"result":0,"SetData":data};
	};


	console.log( JSON.stringify({"result":data[address]["balance"],"SetData":data}) );

}catch(e){
	console.log( JSON.stringify({"result":false,"SetData":e.message}) )
}