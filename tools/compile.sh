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
echo "*** Checkout mf-geoadmin3 ***"
echo "* Merge pull request #5239 from geoadmin/BGDIINF_SB-1828_update_translation *"
echo "* Dienstag, 29. Juni 2021 12:10:21 *"

git checkout 1a5f4d9155c4dd55fda4fa12e4c176f9046c2821

# copy ingrid files to mf-geoadmin3/src
echo "*** Copy files ***"
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
sed -i -e 's/${PIP_CMD}/${PYTHON_CMD} ${PIP_CMD}/g' mk/last.mk
sed -i -e 's/${AUTOPEP8_CMD}/${PYTHON_CMD} ${AUTOPEP8_CMD}/g' Makefile


# fix .submodules
echo "*** fix .gitmodules ***"
sed -i -e 's/git@github.com:openlayers/https:\/\/github.com\/openlayers/g' .gitmodules
sed -i -e 's/git@github.com:camptocamp/https:\/\/github.com\/camptocamp/g' .gitmodules

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
rm -rf node-modules
npm cache clean -f
npm install
ng -v || npm install -g @angular/cli
ng lint > lint.log
cat lint.log
ng build --prod --base-href . > admin.log
cat admin.log