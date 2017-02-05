# Copy files to destination
mkdir -p /users/guillaum/.local/www/grew/
cp -rf * /users/guillaum/.local/www/grew/

# =========== grew ===========
cd /users/guillaum/.local/www/grew/
mkdir -p data/shorten
chmod 777 data

# make "corpora" link to the right place

sed -i xxx 's+@DATADIR@+/users/guillaum/.local/www/grew/data/+' ajaxGrew.php
sed -i xxx 's+@PORT@+8181+' ajaxGrew.php
sed -i xxx 's+@DATADIR@+/users/guillaum/.local/www/grew/data/+' purge.php
sed -i xxx 's+@DATADIR@+/users/guillaum/.local/www/grew/data/+' shorten.php
rm -f *xxx

sed -i xxx 's+003171+443171+' css/main.css
rm -f css/*xxx

