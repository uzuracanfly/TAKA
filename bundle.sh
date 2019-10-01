#!/bin/sh

CONFIGFILE=`cat ./config.js`

rm ./config.js
echo "" > config.js

sleep 1


browserify GetNonceForWeb.js -o GetNonceForWeb_bundle.js
browserify UI/lib/ETHCoindRapper.js -o UI/lib/ETHCoindRapper_bundle.js
browserify UI/lib/TAKALibRapper.js -o UI/lib/TAKALibRapper_bundle.js


sleep 1


rm ./config.js
echo "$CONFIGFILE" > config.js
