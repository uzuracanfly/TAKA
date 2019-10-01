#!/bin/bash

CONFIGFILE=`cat ./config.js`
CONFIGSAMPLEFILE=`cat ./config_sample.js`




array=("API_ADDRESS" "API_PORT" "API_ACCESSPOINT" "IMPORTTAGS" "TAGREWARD_MININGTAGS" "TAGREWARD_COLLECTPRIVKEY" "TAGREWARD_CONTROLTAG")
for var in ${array[@]}
do
	CONFIGSAMPLEFILE=${CONFIGSAMPLEFILE//${var}/'""'}
done


rm ./config.js
echo "$CONFIGSAMPLEFILE" > config.js


sleep 1


browserify GetNonceForWeb.js -o GetNonceForWeb_bundle.js
browserify UI/lib/ETHCoindRapper.js -o UI/lib/ETHCoindRapper_bundle.js
browserify UI/lib/TAKALibRapper.js -o UI/lib/TAKALibRapper_bundle.js


sleep 1


rm ./config.js
echo "$CONFIGFILE" > config.js
