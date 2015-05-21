# kill all previous daemons and wait
sudo killall grew_daemon || true
sleep 5

# sequoia
cd sequoia-6.0
PORT=`cat port` # 8181
FILE=/data/semagramme/resources/sequoia-6.0.conll
LOG=/data/semagramme/log/grew_daemon_sequoia.log
ERROR_LOG=/data/semagramme/log/grew_daemon_sequoia_error.log
echo "/home/guillaum/.opam/4.02.0/bin/grew_daemon -p ${PORT} -c ${FILE} -d ../sequoia_decl.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..

# deep-sequoia
cd deep-sequoia-1.1
PORT=`cat port` # 8182
FILE=/data/semagramme/resources/deep-sequoia-1.1.conll
LOG=/data/semagramme/log/grew_daemon_deep-sequoia.log
ERROR_LOG=/data/semagramme/log/grew_daemon_deep-sequoia_error.log
echo "/home/guillaum/.opam/4.02.0/bin/grew_daemon -p ${PORT} -c ${FILE} -d ../sequoia_decl.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..

# Universal Treebank v2.0- French
cd uni-dep-tb-fr-2.0
PORT=`cat port`  # 8183
FILE=/data/semagramme/resources/uni-dep-tb-fr-2.0.conll
LOG=/data/semagramme/log/grew_daemon_uni-dep-tb-fr.log
ERROR_LOG=/data/semagramme/log/grew_daemon_uni-dep-tb-fr_error.log
echo "/home/guillaum/.opam/4.02.0/bin/grew_daemon -p ${PORT} -c ${FILE} -d ../uni-dep-tb-all-2.0.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..

# Universal Treebank v2.0- Korean
cd uni-dep-tb-ko-2.0
PORT=`cat port`  # 8184
FILE=/data/semagramme/resources/uni-dep-tb-ko-2.0.conll
LOG=/data/semagramme/log/grew_daemon_uni-dep-tb-ko.log
ERROR_LOG=/data/semagramme/log/grew_daemon_uni-dep-tb-ko_error.log
echo "/home/guillaum/.opam/4.02.0/bin/grew_daemon -p ${PORT} -c ${FILE} -d ../uni-dep-tb-all-2.0.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..

# TIGER
cd tiger-2.2
PORT=`cat port` # 8185
FILE=/data/semagramme/resources/tiger-2.2.conll
LOG=/data/semagramme/log/grew_daemon_tiger.log
ERROR_LOG=/data/semagramme/log/grew_daemon_tiger_error.log
echo "/home/guillaum/.opam/4.02.0/bin/grew_daemon -p ${PORT} -c ${FILE} -d tiger_decl.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..

