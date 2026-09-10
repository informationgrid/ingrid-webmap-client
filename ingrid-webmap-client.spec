%define app_name ingrid-webmap-client
%define tomcat_home %{_localstatedir}/lib/tomcat
%define tomcat_webapps %{tomcat_home}/webapps
%define tomcat_conf %{_sysconfdir}/tomcat
%define tomcat_user tomcat
%define tomcat_group tomcat

Name:           ingrid-webmap-client
Version:        0.0.0
Release:        1%{?dist}
Summary:        InGrid Map Client

License:        EUPL-1.2
URL:            https://github.com/informationgrid/ingrid-webmap-client
Source0:        target/%{name}-%{version}.war
Source1:        docker/files/tomcat-9/ingrid-webmap-client.xml
Source2:        docker/files/tomcat-9/tomcat-users.xml
Source3:        docker/files/tomcat-9/server.xml
Source4:        docker/entrypoint.sh

BuildArch:      noarch

Requires:       tomcat9
Requires:       unzip

%description
The InGrid Map Client is part of the InGrid software package. It is
integrated into the InGrid Portal and allows displaying Web Map Services (WMS)
and other geospatial data.

%prep
# Pre-built WAR and configuration files packaging

%build
# Nothing to build; packaging pre-built WAR artifact

%install
rm -rf %{buildroot}

# Create target directories
mkdir -p %{buildroot}%{tomcat_webapps}/%{app_name}
mkdir -p %{buildroot}%{tomcat_conf}/Catalina/localhost
mkdir -p %{buildroot}%{_datadir}/%{name}/conf
mkdir -p %{buildroot}%{_bindir}

# Install WAR file
install -m 0644 ${WORKSPACE}/target/%{name}.war %{buildroot}%{tomcat_webapps}/%{app_name}.war
cp -R ${WORKSPACE}/target/%{name} %{buildroot}%{tomcat_webapps}/%{app_name}

# Install Tomcat Context XML configuration
install -m 0644 ${WORKSPACE}/docker/files/tomcat-9/ingrid-webmap-client.xml %{buildroot}%{tomcat_conf}/Catalina/localhost/%{app_name}.xml

# Install sample/template Tomcat configurations and entrypoint script
install -m 0644 ${WORKSPACE}/docker/files/tomcat-9/tomcat-users.xml %{buildroot}%{_datadir}/%{name}/conf/tomcat-users.xml
install -m 0644 ${WORKSPACE}/docker/files/tomcat-9/server.xml %{buildroot}%{_datadir}/%{name}/conf/server.xml
install -m 0755 ${WORKSPACE}/docker/entrypoint.sh %{buildroot}%{_datadir}/%{name}/entrypoint.sh
install -m 0755 ${WORKSPACE}/docker/entrypoint.sh %{buildroot}%{_bindir}/%{name}-setup

%post
# Handle theme configuration if THEME environment variable is provided
if [ -n "$THEME" ] && [ "$THEME" != "false" ]; then
    MAPCLIENT_HOME="%{tomcat_webapps}/%{app_name}"
    MAPCLIENT_THEME_HOME="$MAPCLIENT_HOME/themes/$THEME"
    if [ -d "$MAPCLIENT_THEME_HOME" ]; then
        echo "Applying theme: $THEME"
        cp -rf "$MAPCLIENT_THEME_HOME"/* "$MAPCLIENT_HOME/"
        if [ -d "$MAPCLIENT_THEME_HOME/frontend/src" ]; then
            cp -rf "$MAPCLIENT_THEME_HOME/frontend/src" "$MAPCLIENT_HOME/frontend/prd"
        fi
        chown -R %{tomcat_user}:%{tomcat_group} "$MAPCLIENT_HOME" 2>/dev/null || true
    fi
fi

%files
#%doc README.md CHANGELOG.md
#%license LICENSE.txt
%config(noreplace) %attr(0644, %{tomcat_user}, %{tomcat_group}) %{tomcat_conf}/Catalina/localhost/%{app_name}.xml
%attr(0644, %{tomcat_user}, %{tomcat_group}) %{tomcat_webapps}/%{app_name}.war
%attr(-, %{tomcat_user}, %{tomcat_group}) %{tomcat_webapps}/%{app_name}
%{_datadir}/%{name}
%{_bindir}/%{name}-setup

%changelog
* Thu Sep 10 2026 InGrid Team <info@ingrid-oss.eu> - 8.3.0-1
- Initial RPM package release for Tomcat container installation
