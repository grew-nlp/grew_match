# kill all previous daemons and wait
sudo killall grew_daemon || true
sleep 5

EXEC=/home/guillaum/.opam/last/bin/grew_daemon

# sequoia
cd sequoia-7.0
PORT=`cat port` # 8181
FILE=/data/semagramme/resources/sequoia-7.0.conll
LOG=/data/semagramme/log/grew_daemon_sequoia.log
ERROR_LOG=/data/semagramme/log/grew_daemon_sequoia_error.log
echo "${EXEC} -p ${PORT} -c ${FILE} -d ../sequoia_decl.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..

# deep-sequoia
cd deep-sequoia-7.0
PORT=`cat port` # 8182
FILE=/data/semagramme/resources/deep-sequoia-7.0.conll
LOG=/data/semagramme/log/grew_daemon_deep-sequoia.log
ERROR_LOG=/data/semagramme/log/grew_daemon_deep-sequoia_error.log
echo "${EXEC} -p ${PORT} -c ${FILE} -d ../sequoia_decl.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..

# UD_French version 1.2
cd UD_French
PORT=`cat port` # 8183
FILE=/data/semagramme/resources/fr-ud-all-1.2.conll
LOG=/data/semagramme/log/grew_daemon_UD.log
ERROR_LOG=/data/semagramme/log/grew_daemon_UD_error.log
echo "${EXEC} -p ${PORT} -c ${FILE} -d ../UD.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..

# UD_English version 1.2
cd UD_English
PORT=`cat port` # 8184
FILE=/data/semagramme/resources/en-ud-all-1.2.conll
LOG=/data/semagramme/log/grew_daemon_UD.log
ERROR_LOG=/data/semagramme/log/grew_daemon_UD_error.log
echo "${EXEC} -p ${PORT} -c ${FILE} -d ../UD.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
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

# UD_French Trunk version
cd UD_French
PORT=`cat port` # 8188
FILE=/data/semagramme/resources/fr-ud-all-trunk.conll
LOG=/data/semagramme/log/grew_daemon_UD.log
ERROR_LOG=/data/semagramme/log/grew_daemon_UD_error.log
echo "${EXEC} -p ${PORT} -c ${FILE} -d ../UD.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..
