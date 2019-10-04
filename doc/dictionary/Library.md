Library
====

load library.

	<script src="https://neko.taka.site/lib/TAKALibRapper"></script>

or

Downlaod and Using [TAKALibRapper_bundle.js](https://github.com/uzuracanfly/TAKA/blob/master/UI/lib/TAKALibRapper_bundle.js)









# TAKA.RappingFunctions(apiurl)

	const TAKALIB = new TAKA.RappingFunctions("https://neko.taka.site");


### TAKALIB.SendTransaction(privkey,type,tag,toaddress,amount,data)

### TAKALIB.SendTransactionWithSendFee(privkey,type,tag,toaddress,amount,data)









# TAKA.TRANSACTION

### TAKA.TRANSACTION.transaction(rawtx="",privkey="",objtx="")

	const TRANSACTION = new TAKA.TRANSACTION.transaction(rawtx="",privkey="",objtx="");

#### TRANSACTION.GetRawTx()

#### TRANSACTION.GetObjTx()

#### TRANSACTION.GetTxid()








# TAKA.ACCOUNT

### TAKA.ACCOUNT.account(key="")

	const ACCOUNT = new TAKA.ACCOUNT.account(key);

key = MinPrivkey or privkey or pubkey or address
* New generation when key is blank.

#### ACCOUNT.GetKeys(key="")

Get keys of class argument key.

	console.log(ACCOUNT.GetKeys());

	console.log(ACCOUNT.GetKeys([address]));






# TAKA.TRANSACTIONTOOLS_CONTRACT

### TAKA.TRANSACTIONTOOLS_CONTRACT.SetFunctionData(rawdata="",objdata={});

	let objdata = {
		"FunctionName":FunctionName,
		"CodeType":CodeType,
		"CodeData":CodeData,
	};
	const SETFUNCTIONDATA = new TAKA.TRANSACTIONTOOLS_CONTRACT.SetFunctionData("",objdata);


#### SETFUNCTIONDATA.GetRawData()

	console.log(SETFUNCTIONDATA.GetRawData());

#### SETFUNCTIONDATA.GetObjData()

	console.log(SETFUNCTIONDATA.GetObjData());




### TAKA.TRANSACTIONTOOLS_CONTRACT.RunFunctionData(rawdata="",objdata={});

	let objdata = {
		"FunctionName":FunctionName,
		"FunctionArgs":FunctionArgs,
		"result":ResultPlan["result"],
		"SetData":ResultPlan["SetData"],
	};
	const RUNFUNCTIONDATA = new TAKA.TRANSACTIONTOOLS_CONTRACT.RunFunctionData("",objdata);

#### RUNFUNCTIONDATA.GetRawData()

	console.log(RUNFUNCTIONDATA.GetRawData());

#### RUNFUNCTIONDATA.GetObjData()

	console.log(RUNFUNCTIONDATA.GetObjData());






# TAKA.API(apiurl)

	const TAKAAPI = new TAKA.API("https://neko.taka.site");

### TAKAAPI.getaccount(key,LessIndex=0,callback="",CallbackArgs="")

### TAKAAPI.gettag(tag)

### TAKAAPI.sendtx(rawtx,callback="",CallbackArgs="")

### TAKAAPI.gettx(txid)

### TAKAAPI.CallRunContractTransaction(address,tag,FunctionName,FunctionArgs,AddressIndexs=[],lastonly=false)

### TAKAAPI.RunCode(address,tag,FunctionName,FunctionArgs,AddressIndexs=[],lastonly=false)

### TAKAAPI.exchange(type,PayTxid,ReceiverAddress,amount)