if [ -d "mf-geoadmin3" ] ; then
    echo "RESET REPO"
    cd ./mf-geoadmin3
    
	# reset mf-geoadmin3 changes
	git reset
	git clean -f
	
	# clean mf-geoadmin3 build path
	make cleanall 
else
	echo "CLONE REPO"
    # clone repo
	git clone https://github.com/geoadmin/mf-geoadmin3.git mf-geoadmin3
	cd ./mf-geoadmin3
fi

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
cp -r ../src/main/webapp/frontend/src/index.mako.html src/
cp -r ../src/main/webapp/frontend/src/rc_ingrid ./

# Add environments
source rc_ingrid
 
# make libs
make libs

# make dev version
make debug

# make prod version
make release