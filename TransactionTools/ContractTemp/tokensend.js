try{
	let SendingData = (process.argv).slice(-1)[0];
	SendingData = JSON.parse(SendingData.replace(/@!/g, '"'));

	const runnerkeys = SendingData["keys"]; //コントラクト実行しているアカウント情報取得
	const args = SendingData["args"]; //引数取得
	const data = SendingData["data"]; //tagに関連したコントラクトのデータをすべて取得


	const tokenowner = "eb86950b214dea4c863d10c5c0fa22fd027647ca";
	const PremineAmount = 100000000;


	let address = runnerkeys["address"];
	let toaddress = args["toaddress"];
	let amount = args["amount"];




	let SetData = {};
	if (!(address in data)){
		if (tokenowner == address){
			SetData[address] = {
				"balance":PremineAmount
			}
		}else{
			SetData[address] = {
				"balance":0
			}
		};
	}else{
		SetData[address] = {
			"balance":data[address]["balance"]
		};
	}


	if (!(toaddress in data)){
		if (tokenowner == toaddress){
			SetData[toaddress] = {
				"balance":PremineAmount
			}
		}else{
			SetData[toaddress] = {
				"balance":0
			}
		};
	}else{
		SetData[toaddress] = {
			"balance":data[toaddress]["balance"]
		};
	}


	if (SetData[address]["balance"] < amount) {
		return 0;
	};



	SetData[address]["balance"] = SetData[address]["balance"] - amount;
	SetData[toaddress]["balance"] = SetData[toaddress]["balance"] + amount;



	console.log( JSON.stringify({"result":true,"SetData":SetData}) );
}catch(e){
	console.log( JSON.stringify({"result":false,"SetData":e.message}) )
}