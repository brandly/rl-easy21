.DEFAULT_GOAL := all

esbuild = ./node_modules/.bin/esbuild

all: node_modules chart.js

node_modules/: package.json
	npm install

chart.js: *.ts
	$(esbuild) --bundle charts.ts > charts.js
