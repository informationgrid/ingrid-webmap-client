if [ -d "mf-geoadmin3" ] ; then
    echo "*** RESET REPO ***"
    cd ./mf-geoadmin3
    
    # reset mf-geoadmin3 changes
    git reset --hard
    git clean -fd
    git pull origin master

    # clean mf-geoadmin3 build path
    make cleanall 
else
    echo "*** CLONE REPO ***"
    # clone repo mf-geoadmin3
    git clone https://github.com/geoadmin/mf-geoadmin3.git mf-geoadmin3
    cd ./mf-geoadmin3
fi

# checkout mf-geoadmin3 state 
echo "*** Checkout mf-geoadmin3 revision '3aa882828a1659eebbc88572125a38dd3e2154bd' (Date: Mittwoch, 15. August 2018 08:57:10) ***"
git checkout 3aa882828a1659eebbc88572125a38dd3e2154bd

# copy ingrid files to mf-geoadmin3/src
echo "*** Copy files ***"
cp -r ../frontend/ingrid/scripts ./
cp -r ../frontend/ingrid/lib src/
cp -r ../frontend/ingrid/components src/
cp -r ../frontend/ingrid/js src/
cp -r ../frontend/ingrid/style src/
cp -r ../frontend/ingrid/img src/
cp -r ../frontend/src/index.mako.html src/
cp -r ../frontend/src/auth.jsp src/
cp -r ../frontend/src/geoadmin.mako.appcache src/

# Add environments
echo "*** Export environments ***"
export DEFAULT_TOPIC_ID=themen
export DEFAULT_EXTENT="'[0.42587260523, 46.9672880527, 15.7908768234, 55.1764096793]'"
export DEFAULT_EPSG="EPSG:3857"
export DEFAULT_EPSG_EXTEND="'[0.42587260523, 46.9672880527, 15.7908768234, 55.1764096793]'"

# fix Makefile when script is run in a long directory structure
echo "*** Fix Makefile ***"
sed -i -e 's/${PIP_CMD}/${PYTHON_CMD} ${PIP_CMD}/g' Makefile
sed -i -e 's/${AUTOPEP8_CMD}/${PYTHON_CMD} ${AUTOPEP8_CMD}/g' Makefile

# fix Makefile when open jdk kicks in with JAVA_TOOL_OPTIONS message
# see https://stackoverflow.com/questions/11683715/suppressing-the-picked-up-java-options-message
sed -i -e 's/java -jar/SILENT_JAVA_TOOL_OPTIONS=\"\$JAVA_TOOL_OPTIONS\";unset JAVA_TOOL_OPTIONS;java -jar/g' Makefile

# make lint
echo ""
echo "******************"
echo "*** Make lint ***"
echo "******************"
make lint

# make dev version
echo ""
echo "******************"
echo "*** Make debug ***"
echo "******************"
make debug

# make prod version
echo ""
echo "********************"
echo "*** Make release ***"
echo "********************"
make release

# create admin
echo ""
echo "********************"
echo "*** Make admin ***"
echo "********************"
cd ../admin
npm install
ng -v || npm install -g @angular/cli
ng lint
ng build --prod --base-href .