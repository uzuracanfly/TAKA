token
====

Goal

	・Buy ETAKA
	・Exchange ETAKA to TAKA.
	・Order tag.
	・Set contract function
	・Send contract



# Using console

### Buy TAKA
To network usage fee.<br>
[Buy TAKA](https://github.com/uzuracanfly/TAKA/blob/master/doc/example/BuyTAKA.md).

### Node Start.

	node init.js

### Tag Order
type to console.

	node console.js sendtagordertx [MinPrivkey] [TAG] 0 ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff 1000000

### Set contract function
	node console.js sendsetcontracttransaction [MinPrivkey] [TAG] tokensend 1 null /root/TAKA/TransactionTools/ContractTemp/tokensend.js
	node console.js sendsetcontracttransaction [MinPrivkey] [TAG] tokenbalance 1 null /root/TAKA/TransactionTools/ContractTemp/tokenbalance.js

### Run contract function

#### Send token
	node console.js sendruncontracttransaction [MinPrivkey] [TAG] tokensend '{"toaddress":[toaddress],"amount":[amount]}' [toaddress]

#### Show token balance
	node console.js callruncontracttransaction [address] [TAG] tokenbalance '[[address]]'