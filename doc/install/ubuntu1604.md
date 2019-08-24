TAKA install to ubuntu 16.04
====

You need Node.js version 10 or higher.

	https://nodejs.org/

Download TAKA.

	git clone https://github.com/uzuracanfly/TAKA.git

Start TAKA node.

	cd TAKA
	npm install
	node init.js

### [OPTION] Using Firejail

	apt-get install firejail

And open and edit config.js

	"UsingFirejail":false

To

	"UsingFirejail":true