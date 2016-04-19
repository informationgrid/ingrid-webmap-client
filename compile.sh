cd ./mf-geoadmin3

# checkout mf-geoadmin3 state
git checkout 1014736cfb539665bf1f8c5ebc0e4ae7ffdb2745

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

# make dev version
make dev

# make prod version
make prod