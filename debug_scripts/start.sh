#!/bin/sh

kill -9 `lsof -t -i:3000`

npm start
