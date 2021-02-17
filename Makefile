.DEFAULT_GOAL := all

esbuild = ./node_modules/.bin/esbuild

all: dist/ dist/chart.js dist/index.html dist/billion.json

dist/:
	mkdir -p $@

dist/chart.js: node_modules src/*.ts src/*.tsx
	$(esbuild) --bundle --define:process.env.NODE_ENV=\"development\" src/charts.tsx > dist/charts.js

dist/index.html: src/index.html
	cp src/index.html $@

dist/billion.json: src/billion.json
	cp src/billion.json $@

node_modules/: package.json
	npm install
