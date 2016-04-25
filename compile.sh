if [ -d "mf-geoadmin3" ] ; then
    echo "*** RESET REPO ***"
    cd ./mf-geoadmin3
    
	# reset mf-geoadmin3 changes
	git reset
	git clean -f
	
	# clean mf-geoadmin3 build path
	make cleanall 
else
	echo "*** CLONE REPO ***"
    # clone repo
	git clone https://github.com/geoadmin/mf-geoadmin3.git mf-geoadmin3
	cd ./mf-geoadmin3
fi

# checkout mf-geoadmin3 state
echo "*** Checkout mf-geoadmin3 revision ***"
git checkout 3a43911a12584353a6ea2422e5282ade258369b3
	
# copy ingrid files to mf-geoadmin3/src
echo "*** Copy files ***"
cp -r ../src/main/webapp/frontend/ingrid/scripts ./
cp -r ../src/main/webapp/frontend/ingrid/lib src/
cp -r ../src/main/webapp/frontend/ingrid/components src/
cp -r ../src/main/webapp/frontend/ingrid/js src/
cp -r ../src/main/webapp/frontend/ingrid/style src/
cp -r ../src/main/webapp/frontend/ingrid/img src/
cp -r ../src/main/webapp/frontend/ingrid/locales src/
cp -r ../src/main/webapp/frontend/src/index.mako.html src/

# Add environments
echo "*** Export environments ***"
export DEFAULT_TOPIC_ID=themen
export DEFAULT_EXTENT="'[0.42587260523, 46.9672880527, 15.7908768234, 55.1764096793]'"
export DEFAULT_EPSG="EPSG:3857"
export DEFAULT_EPSG_EXTEND="'[0.42587260523, 46.9672880527, 15.7908768234, 55.1764096793]'"

# make libs
echo "*** Make libs ***"
make libs

# make dev version
echo "*** Make debug ***"
make debug

# make prod version
echo "*** Make release ***"
make release