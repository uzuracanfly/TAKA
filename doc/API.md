TAKA API method
====

Parameters Information

	Required Parameters : <>
	Option Parameters : []


## getaccount

### parameters
	getaccount [key] [LessIndex]

### example
New account data.

	sudo curl http://127.0.0.1 -d '{"function":"getaccount","args":{}}'

Show account data.

	sudo curl http://127.0.0.1 -d '{"function":"getaccount","args":{"key":"ee54d6211a9e1b3756fe6866bfc4411e98c41e1e"}}'



## gettag

### parameters
	gettag <tag>

### example
	gettag pay



## getrawtx

### parameters
	getrawtx <objtx>

### example



## gettx

### parameters
	gettx <txid>

### example



## getimporttag

### parameters
	getimporttag

### example



## setimporttag

### parameters
	setimporttag <type> <tag>

### example



## getminingtags

### parameters
	getminingtags

### example



## setminingtags

### parameters
	setminingtags <type> <tag>

### example



## sendtx

### parameters
	sendtx <rawtx>

### example



## sendpaytx

### parameters
	sendpaytx <key> <toaddress> <amount>

### example



## sendtagrewardtx

### parameters
	sendtagrewardtx <key> <tag> <amount>

### example



## senddatabasetx

### parameters
	senddatabasetx <key> <tag> <data>

### example



## sendtagordertx

### parameters
	sendtagordertx <key> <tag> <permissiontype>

### example



## sendtagaddpermittx

### parameters
	sendtagaddpermittx <key> <tag> <addaddress>

### example



## sendsetcontracttransaction

### parameters
	sendsetcontracttransaction <key> <tag> <FunctionName> <CodeType> <CodeData> [CodePath]

### example



## sendruncontracttransaction

### parameters
	sendruncontracttransaction <key> <tag> <FunctionName> <FunctionArgs>

### example



## callruncontracttransaction

### parameters
	callruncontracttransaction <key> <tag> <FunctionName> <FunctionArgs>

### example



## runcode

### parameters
	runcode <key> <tag> <FunctionName> <FunctionArgs>

### example



## exchange

### parameters
	exchange <type> <PayTxid> <ReceiverAddress> <amount>

### example
