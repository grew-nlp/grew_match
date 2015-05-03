# kill all previous daemons and wait
sudo killall grew_daemon || true
sleep 5

# run a daemon for each corpus
cd corpora

# deep-sequoia
cd deep-sequoia-1.1
PORT=`cat port`
FILE=`cat file`
LOG=/data/semagramme/log/grew_daemon_deep-sequoia.log
ERROR_LOG=/data/semagramme/log/grew_daemon_deep-sequoia_error.log
echo "/home/guillaum/.opam/4.02.0/bin/grew_daemon -p ${PORT} -c ${FILE} -d declaration.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..

# sequoia
cd sequoia-6.0
PORT=`cat port`
FILE=`cat file`
LOG=/data/semagramme/log/grew_daemon_sequoia.log
ERROR_LOG=/data/semagramme/log/grew_daemon_sequoia_error.log
echo "/home/guillaum/.opam/4.02.0/bin/grew_daemon -p ${PORT} -c ${FILE} -d declaration.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..

# TIGER
cd tiger-2.2
PORT=`cat port`
FILE=`cat file`
LOG=/data/semagramme/log/grew_daemon_tiger.log
ERROR_LOG=/data/semagramme/log/grew_daemon_tiger_error.log
echo "/home/guillaum/.opam/4.02.0/bin/grew_daemon -p ${PORT} -c ${FILE} -d tiger_decl.grs > ${LOG} 2> ${ERROR_LOG}" | at now +1 minute
cd ..
