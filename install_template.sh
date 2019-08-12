# decide where you want to store the webpage locally
DEST=/some/directory/accessible/from/the/web/server/

# set the PORT number
PORT=8888

# build the DEST directory if needed
mkdir -p $DEST

# Copy the files in the right place
cp *.php *.xml *.html *.png $DEST
cp -r corpora css fonts icon js tables tuto $DEST

# build local folders for storing data
cd $DEST
mkdir -p data/shorten
chmod -R 777 data

# update parameters in the code
cat ajaxGrew.php | sed "s+@PORT@+${PORT}+" | sed "s+@DATADIR@+$DEST/data/+" > __tmp_file && mv __tmp_file ajaxGrew.php
cat export.php | sed "s+@PORT@+${PORT}+" | sed "s+@DATADIR@+$DEST/data/+" > __tmp_file && mv __tmp_file export.php
cat purge.php | sed "s+@DATADIR@+$DEST/data/+" > __tmp_file && mv __tmp_file purge.php
cat shorten.php | sed "s+@DATADIR@+$DEST/data/+" > __tmp_file && mv __tmp_file shorten.php

