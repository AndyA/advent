#!/bin/bash

work="work"

mkdir -p "$work"
perl bin/csv2json.pl < "ref/days.csv" > "$work/days.json"
perl bin/cook-data.pl "$work/days.json" "ref/default.json" "ref/advent-images" "www/data.json" "www/i"

# vim:ts=2:sw=2:sts=2:et:ft=sh

