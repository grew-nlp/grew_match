# set destination
dest="/users/guillaum/.local/www/grew"

# Copy files to destination
mkdir -p $dest
cp -rf * $dest

# =========== build directories for local storage of the server ===========
cd $dest
mkdir -p data/shorten
chmod -R 777 data

# update DATADIR and PORT metavariable in server code
sed -i xxx "s+@DATADIR@+$dest/data/+" ajaxGrew.php
sed -i xxx "s+@PORT@+8282+" ajaxGrew.php
sed -i xxx "s+@DATADIR@+$dest/data/+" purge.php
sed -i xxx "s+@DATADIR@+$dest/data/+" shorten.php
rm -f *xxx

# change color for easy distinction of prod VS dev
# sed -i xxx 's+003171+443171+' css/main.css
# rm -f css/*xxx

cd corpora/seq/sequoia.deep_and_surf-7.0
sed -i xxx 's+talc2.loria.fr+localhost+' doc.html
rm -f *xxx
cd ../../..

cd corpora/seq/sequoia.deep_and_surf-trunk
sed -i xxx 's+talc2.loria.fr+localhost+' doc.html
rm -f *xxx
cd ../../..
