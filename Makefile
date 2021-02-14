.DEFAULT_GOAL := all

esbuild = ./node_modules/.bin/esbuild

all: node_modules chart.js

node_modules/: package.json
	npm install

chart.js: *.ts *.tsx
	$(esbuild) --bundle --define:process.env.NODE_ENV=\"development\" charts.tsx > charts.js
