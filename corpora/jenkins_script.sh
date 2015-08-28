# kill all previous daemons and wait
sudo killall grew_daemon || true
sleep 5

EXEC=/home/guillaum/.opam/last/bin/grew_daemon

# sequoia
cd sequoia-6.0
PORT=`cat port` # 8181
FILE=/data/semagramme/resources/sequoia-6.0.conll
LOG=/data/semagramme/log/grew_daemon_sequoia.log
ERROR_LOG=/data/semagramme/log/grew_daemon_sequoia_error.log
echo "${EXEC} -p ${PORT} -c ${FILE} -d ../sequoia_decl.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..

# deep-sequoia
cd deep-sequoia-1.1
PORT=`cat port` # 8182
FILE=/data/semagramme/resources/deep-sequoia-1.1.conll
LOG=/data/semagramme/log/grew_daemon_deep-sequoia.log
ERROR_LOG=/data/semagramme/log/grew_daemon_deep-sequoia_error.log
echo "${EXEC} -p ${PORT} -c ${FILE} -d ../sequoia_decl.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..

# UDT 1.1- French
cd UD_French
PORT=`cat port` # 8183
FILE=/data/semagramme/resources/fr-ud-all.conll
LOG=/data/semagramme/log/grew_daemon_UD.log
ERROR_LOG=/data/semagramme/log/grew_daemon_UD_error.log
echo "${EXEC} -p ${PORT} -c ${FILE} -d ../UD.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..

# UDT- English
cd UD_English
PORT=`cat port` # 8184
FILE=/data/semagramme/resources/en-ud-all.conll
LOG=/data/semagramme/log/grew_daemon_UD.log
ERROR_LOG=/data/semagramme/log/grew_daemon_UD_error.log
echo "${EXEC} -p ${PORT} -c ${FILE} -d ../UD.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..

# Universal Treebank v2.0- Korean
cd uni-dep-tb-ko-2.0
PORT=`cat port` # 8185
FILE=/data/semagramme/resources/uni-dep-tb-ko-2.0.conll
SPECIAL_CHARS=/data/semagramme/resources/ko_chars
LOG=/data/semagramme/log/grew_daemon_uni-dep-tb-ko.log
ERROR_LOG=/data/semagramme/log/grew_daemon_uni-dep-tb-ko_error.log
echo "${EXEC} --special_chars ${SPECIAL_CHARS} -p ${PORT} -c ${FILE} -d ../uni-dep-tb-all-2.0.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..

# TIGER
cd tiger-2.2
PORT=`cat port` # 8186
FILE=/data/semagramme/resources/tiger-2.2.conll
LOG=/data/semagramme/log/grew_daemon_tiger.log
ERROR_LOG=/data/semagramme/log/grew_daemon_tiger_error.log
echo "${EXEC} -p ${PORT} -c ${FILE} -d tiger_decl.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..

# deep-sequoia-trunk
cd deep-sequoia-trunk
PORT=`cat port` # 8187
FILE=/data/semagramme/resources/deep-sequoia.conll
LOG=/data/semagramme/log/grew_daemon_deep-sequoia.log
ERROR_LOG=/data/semagramme/log/grew_daemon_deep-sequoia_error.log
echo "${EXEC} -p ${PORT} -c ${FILE} -d ../sequoia_decl.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..

