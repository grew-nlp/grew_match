# decide where you want to store the webpage locally
DEST=DOCUMENT_ROOT/grew_match

# set the PORT number
PORT=8888

# build the DEST directory if needed
mkdir -p $DEST

# Copy the files in the right place
cp *.php *.xml *.html *.png $DEST
cp -r corpora css fonts icon js tuto $DEST

# build local folders for storing data
cd $DEST
mkdir -p data/shorten
chmod -R 777 data

# build other useful folders
mkdir -p _tables
mkdir -p _logs
mkdir -p _descs

# update parameters in the code
cat main.php | sed "s+@PORT@+${PORT}+" | sed "s+@DATADIR@+$DEST/data/+" > __tmp_file && mv -f __tmp_file main.php

