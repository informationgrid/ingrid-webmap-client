cd ./mf-geoadmin3

# checkout mf-geoadmin3 state
git checkout 3a43911a12584353a6ea2422e5282ade258369b3

# reset mf-geoadmin3 changes
git reset
git clean -f

# clean mf-geoadmin3 build path
make cleanall

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