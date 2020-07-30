#!/usr/bin/env sh

# exit when any command fails
#set -e

if ! npm run download-from-api
then 
  echo "Stopped script without publishing."
else
  npm run cp
  npm run publish
fi

exit 0