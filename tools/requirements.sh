# Add requirements
echo "*** Add requirements ***"
if [ -r $CYGWIN_HOME/bin/easy_install ]; then
    echo "*** easy_install exist ***"
else
    echo "*** easy_install install ***"
    wget --no-check-certificate http://pypi.python.org/packages/source/d/distribute/distribute-0.6.35.tar.gz
    tar xf distribute-0.6.35.tar.gz
    cd distribute-0.6.35
    python2.7 setup.py install
    rm -r distribute-*
fi

if [ -r $CYGWIN_HOME/bin/pip ]; then
    echo "*** pip exist ***"
else
    echo "*** pip install ***"
    easy_install pip
fi

if [ -r $CYGWIN_HOME/bin/virtualenv ]; then
    echo "*** virtualenv exist ***"
else
    echo "*** virtualenv install ***"
    easy_install virtualenv
fi

if [ -r $CYGWIN_HOME/bin/virtualenvwrapper.sh ]; then
    echo "*** virtualenvwrapper.sh exist ***"
else
    echo "*** virtualenvwrapper.sh install ***"
    easy_install virtualenvwrapper
fi