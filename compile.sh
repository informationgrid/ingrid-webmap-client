# remove mf-geoadmin3
rm -rf mf-geoadmin3

# clone repo
git clone https://github.com/geoadmin/mf-geoadmin3.git mf-geoadmin3

cd ./mf-geoadmin3

# checkout mf-geoadmin3 state
git checkout 3a43911a12584353a6ea2422e5282ade258369b3

# copy ingrid files to mf-geoadmin3/src
cp -r ../src/main/webapp/frontend/ingrid/scripts ./
cp -r ../src/main/webapp/frontend/ingrid/lib src/
cp -r ../src/main/webapp/frontend/ingrid/components src/
cp -r ../src/main/webapp/frontend/ingrid/js src/
cp -r ../src/main/webapp/frontend/ingrid/style src/
cp -r ../src/main/webapp/frontend/ingrid/img src/
cp -r ../src/main/webapp/frontend/ingrid/locales src/

# make libs
make libs

# make dev version
make debug

# make prod version
make release