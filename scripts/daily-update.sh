#!/usr/bin/env sh

# Example command line usage: ./daily-update.sh 2020-07-11

date=$1

npm run json $date
npm run merge
npm run cp
npm run publish