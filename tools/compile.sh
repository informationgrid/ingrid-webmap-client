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
export PYTHONIOENCODING=UTF-8

# fix Makefile when script is run in a long directory structure
echo "*** Fix Makefile ***"
sed -i -e 's/${PIP_CMD}/${PYTHON_CMD} ${PIP_CMD}/g' Makefile
sed -i -e 's/${AUTOPEP8_CMD}/${PYTHON_CMD} ${AUTOPEP8_CMD}/g' Makefile


# Pipe make and ng processes into file because build errors in jenkins.
# Message "Picked up JAVA_TOOL_OPTIONS ..." makes "make release" build process unsuccess.
# https://wiki.jenkins.io/display/JENKINS/Pipeline+Maven+Plugin#PipelineMavenPlugin-WhydoIseemessages%22[WARNING]PickedupJAVA_TOOL_OPTIONS...%22inthebuildlogs?

# make lint
echo ""
echo "******************"
echo "*** Make lint ***"
echo "******************"
make lint > lint.log
cat lint.log

# make dev version
echo ""
echo "******************"
echo "*** Make debug ***"
echo "******************"
make debug > debug.log
cat debug.log

# make prod version
echo ""
echo "********************"
echo "*** Make release ***"
echo "********************"
make release > release.log
cat release.log

# create admin
echo ""
echo "********************"
echo "*** Make admin ***"
echo "********************"
cd ../admin
npm install
ng -v || npm install -g @angular/cli
ng lint > lint.log
cat lint.log
ng build --prod --base-href . > admin.log
cat admin.log