#!/bin/bash
# chmod +x sync.sh

current_datetime=$(date +"%Y-%m-%d %H:%M")
git add .
git commit -m "Update - $current_datetime"
git push origin master
