#!/bin/bash

python3 -m http.server &

eval $(opam env)
pushd /opt/grew_match_back
make clean
make test.opt
