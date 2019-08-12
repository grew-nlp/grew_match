# decide where you want to store the webpage locally
DEST=/some/directory/accessible/from/the/web/server/

# set the PORT number
PORT=8888

# build the DEST directory if needed
mkdir -p $DEST

# Copy the files in the right place
cp -rf * $DEST

# build local folders for storing data
cd $DEST
mkdir -p data/shorten
chmod -R 777 data

# update parameters in the code
echo ajaxGrew.php | sed "s+@PORT@+${PORT}+" | sed "s+@DATADIR@+$DEST/data/+" > __tmp_file && mv __tmp_file ajaxGrew.php
echo export.php | sed "s+@PORT@+${PORT}+" | sed "s+@DATADIR@+$DEST/data/+" > __tmp_file && mv __tmp_file export.php
echo purge.php | sed "s+@DATADIR@+$DEST/data/+" > __tmp_file && mv __tmp_file purge.php
echo shorten.php | sed "s+@DATADIR@+$DEST/data/+" > __tmp_file && mv __tmp_file shorten.php

