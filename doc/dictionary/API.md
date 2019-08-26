TAKA API and console method
====

Parameters Information

	Required Parameters : <>
	Option Parameters : []


# getaccount

### parameters
	getaccount [key] [LessIndex]

### example
New account data.

	sudo curl http://127.0.0.1 -d '{"function":"getaccount","args":{}}'

Show account data.

	sudo curl http://127.0.0.1 -d '{"function":"getaccount","args":{"key":"ee54d6211a9e1b3756fe6866bfc4411e98c41e1e"}}'



# gettag

### parameters
	gettag <tag>

### example
	sudo curl http://127.0.0.1 -d '{"function":"gettag","args":{"tag":"pay"}}'



# getrawtx

	Get rawtx.
	objtx is Human-friendly shape.
	rawtx is for streaming on the network.

### parameters
	getrawtx <txid>

### example
	sudo curl http://127.0.0.1 -d '{"function":"getrawtx","args":{"txid":"008cc065b696c150f83c320614ef41940731ba0805654dbbbd83be59c545d98a"}}'





# gettx

	Get objtx.
	objtx is Human-friendly shape.
	rawtx is for streaming on the network.

### parameters
	gettx <txid>

### example



# getimporttag

### parameters
	getimporttag

### example



# setimporttag

### parameters
	setimporttag <type> <tag>

### example



# getminingtags

### parameters
	getminingtags

### example



# setminingtags

### parameters
	setminingtags <type> <tag>

### example



# sendtx

### parameters
	sendtx <rawtx>

### example



# sendpaytx

### parameters
	sendpaytx <key> <toaddress> <amount>

### example



# sendtagrewardtx

### parameters
	sendtagrewardtx <key> <tag> <amount>

### example



# senddatabasetx

### parameters
	senddatabasetx <key> <tag> <data>

### example



# sendtagordertx

### parameters
	sendtagordertx <key> <tag> <permissiontype> [powtarget]

### example



# sendtagaddpermittx

### parameters
	sendtagaddpermittx <key> <tag> <addaddress>

### example



# sendsetcontracttransaction

### parameters
	sendsetcontracttransaction <key> <tag> <FunctionName> <CodeType> <CodeData> [CodePath]

### example



# sendruncontracttransaction

### parameters
	sendruncontracttransaction <key> <tag> <FunctionName> <FunctionArgs>

### example



# callruncontracttransaction

### parameters
	callruncontracttransaction <address> <tag> <FunctionName> <FunctionArgs>

### example



# runcode

### parameters
	runcode <address> <tag> <FunctionName> <FunctionArgs>

### example



# exchange

### parameters
	exchange <type> <PayTxid> <ReceiverAddress> <amount>

### example
