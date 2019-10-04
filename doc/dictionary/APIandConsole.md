TAKA API and console method
====

Parameters Information

	Required Parameters : <>
	Option Parameters : []


# getaccount

### parameters
	getaccount [key] [LessIndex] [LessTime] [BoolNeedApproved]

### example
New account data.

	sudo curl http://127.0.0.1/api -d '{"function":"getaccount","args":{}}'

Show account data.

	sudo curl http://127.0.0.1/api -d '{"function":"getaccount","args":{"key":"ee54d6211a9e1b3756fe6866bfc4411e98c41e1e"}}'





# getsendamounttoaddress

### parameters
	getsendamounttoaddress [key] [toaddress] [LessIndex]

### example
	sudo curl http://127.0.0.1/api -d '{"function":"getsendamounttoaddress","args":{"key":"ee54d6211a9e1b3756fe6866bfc4411e98c41e1e","toaddress":"80ba149c1e71ca4576198998418bc47d4e297ab2"}}'





# gettag

### parameters
	gettag <tag>

### example
	sudo curl http://127.0.0.1/api -d '{"function":"gettag","args":{"tag":"pay"}}'




# gettx

	Get objtx and rawtx.
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
	sendtagordertx <key> <tag> <permissiontype> [powtarget] [FeeToAddress] [FeeAmount]

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
	callruncontracttransaction <address> <tag> <FunctionName> <FunctionArgs> [AddressIndexs] [lastonly]

### example



# runcode

### parameters
	runcode <address> <tag> <FunctionName> <FunctionArgs> [AddressIndexs] [lastonly]

### example



# exchange

### parameters
	exchange <type> <PayTxid> <ReceiverAddress> <amount>

### example
