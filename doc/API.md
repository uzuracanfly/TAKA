TAKA API method
====

Parameters Information
	Required Parameters : <>
	Option Parameters : []


## getaccount

### parameters
	getaccount [key] [LessIndex]



## gettag

### parameters
	gettag <tag>



## getrawtx

### parameters
	getrawtx <objtx>


## gettx

### parameters
	gettx <txid>



## getimporttag

### parameters
	getimporttag


## setimporttag

### parameters
	setimporttag <type> <tag>


## getminingtags

### parameters
	getminingtags


## setminingtags

### parameters
	setminingtags <type> <tag>


## sendtx

### parameters
	sendtx <rawtx>


## sendpaytx

### parameters
	sendpaytx <key> <toaddress> <amount>


## sendtagrewardtx

### parameters
	sendtagrewardtx <key> <tag> <amount>



## senddatabasetx

### parameters
	senddatabasetx <key> <tag> <data>


## sendtagordertx

### parameters
	sendtagordertx <key> <tag> <permissiontype>


## sendtagaddpermittx

### parameters
	sendtagaddpermittx <key> <tag> <address>


## sendsetcontracttransaction

### parameters
	sendsetcontracttransaction <key> <tag> <FunctionName> <CodeType> <CodeData> [CodePath]


## sendruncontracttransaction

### parameters
	sendruncontracttransaction <key> <tag> <FunctionName> <FunctionArgs>


## callruncontracttransaction

### parameters
	callruncontracttransaction <key> <tag> <FunctionName> <FunctionArgs>



## runcode

### parameters
	runcode <key> <tag> <FunctionName> <FunctionArgs>


## exchange

### parameters
	exchange <type> <PayTxid> <ReceiverAddress> <amount>