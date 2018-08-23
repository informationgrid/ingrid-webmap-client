/*-
 * **************************************************-
 * InGrid Map Client
 * ==================================================
 * Copyright (C) 2014 - 2018 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.1 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * http://ec.europa.eu/idabc/eupl5
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * **************************************************#
 */
package de.ingrid.mapclient.print.servlet;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.Map;
import java.util.Properties;

import javax.servlet.ServletException;

import org.apache.commons.io.FileUtils;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.mapfish.print.MapPrinter;
import org.mapfish.print.ShellMapPrinter;
import org.mapfish.print.servlet.MapPrinterServlet;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;
import org.springframework.context.support.FileSystemXmlApplicationContext;
import org.springframework.web.context.support.WebApplicationContextUtils;

import com.google.common.collect.Maps;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.utils.Utils;

public class IngridMapPrinterServlet extends MapPrinterServlet{

    private static final long serialVersionUID = 525819445237152542L;

    private final Map<String, MapPrinter> printers = Maps.newHashMap();
    private final Map<String,Long> lastModifieds = Maps.newHashMap();

    private volatile ApplicationContext context;

    /**
     * Builds a MapPrinter instance out of the file pointed by the servlet's
     * configuration. The location can be configured in two locations:
     * <ul>
     * <li>web-app/servlet/init-param[param-name=config] (top priority)
     * <li>web-app/context-param[param-name=config] (used only if the servlet has no config)
     * </ul>
     * <p/>
     * If the location is a relative path, it's taken from the servlet's root directory.
     */
    protected synchronized MapPrinter getMapPrinter(String app) throws ServletException {
        String configPath = System.getProperty("mapfish-print-config", getInitParameter("config"));
        if (configPath == null) {
            throw new ServletException("Missing configuration in web.xml 'web-app/servlet/init-param[param-name=config]' or 'web-app/context-param[param-name=config]'");
        }
        //String debugPath = "";

        if (app == null) {
            LOGGER.info("app is null, setting it as default configPath: " + configPath);
            app = configPath;
        }

        if (!app.toLowerCase().endsWith(".yaml")) {
            app = app + ".yaml";
        }

        File configFile = new File(app);

        if (!configFile.isAbsolute() || !configFile.exists()) {

            LOGGER.info("Attempting to locate app config file: '" + app + " in the webapplication.");
            String realPath = getServletContext().getRealPath(app);

            if (realPath != null) {
                configFile = new File(realPath);
            } else {
                LOGGER.info("Unable to find config file in web application using getRealPath.  Adding a / because that is often dropped");
                realPath = getServletContext().getRealPath("/" + app);
                configFile = new File(realPath);
            }
        }

        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String config_dir = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        String content = Utils.getFileContent(config_dir, "service.auth", ".json", "config/");
        if(content != null) {
            try {
                if(configFile.exists()) {
                    File tmpFile = new File(config_dir + "config/print_config.yaml");
                    if(tmpFile.exists()) {
                        tmpFile.delete();
                    }
                    FileUtils.copyFile(configFile, tmpFile);
                    configFile = tmpFile;
                    JSONObject auths = new JSONObject(content);
                    if(auths.length() > 0) {
                        app = tmpFile.getAbsolutePath();
                        if(tmpFile.exists()) {
                            try(FileWriter fw = new FileWriter(app, true);
                                BufferedWriter bw = new BufferedWriter(fw);
                                PrintWriter out = new PrintWriter(bw))
                            {
                                out.println("");
                                out.println("security:");
                            } catch (IOException e) {
                                LOGGER.error("Error write into yaml file: " + app);
                            }
                        }
                        Iterator<?> keys = auths.keys();
                        ArrayList<String> tmpLogins = new ArrayList<String>();
                        while( keys.hasNext() ) {
                            String host = (String)keys.next();
                            if (auths.has(host)) {
                                JSONObject authLogin = auths.getJSONObject(host);
                                String login = null;
                                String password = null;
                                String port = null;
                                if(authLogin.has("login")) {
                                    login = authLogin.getString("login");
                                }
                                if(authLogin.has("password")) {
                                    password = authLogin.getString("password");
                                }
                                if(authLogin.has("port")) {
                                    port = authLogin.getString("port");
                                } else {
                                    port = "80";
                                }
                                if(login != null && password != null) {
                                    if(!tmpLogins.contains(host)) {
                                        tmpLogins.add(host);
                                        try(FileWriter fw = new FileWriter(app, true);
                                            BufferedWriter bw = new BufferedWriter(fw);
                                            PrintWriter out = new PrintWriter(bw))
                                        {
                                            out.println("  - !basicAuth");
                                            out.println("      matcher: !dnsMatch");
                                            out.println("        host: " + host);
                                            out.println("        port: " + port);
                                            out.println("      username: " + login);
                                            out.println("      password: " + password);
                                            //more code
                                        } catch (IOException e) {
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (JSONException e) {
                LOGGER.error("Error get auth json.");
            } catch (IOException e) {
                LOGGER.error("Error create auth yaml.");
            }
        }
        
        LOGGER.info("Loading app from: " + configFile);
        MapPrinter printer;
        final String configFileCanonicalPath;
        try {
            configFileCanonicalPath = configFile.getCanonicalPath();
            printer = printers.get(configFileCanonicalPath);
        } catch (IOException e) {
            throw new ServletException(e);
        }

        final long lastModified;
        if (lastModifieds.containsKey(app)) {
            lastModified = lastModifieds.get(app);
        } else {
            lastModified = 0L;
        }

        boolean forceReload = false;
        if (printer != null && (!printer.isRunning() || printer.getConfig().getReloadConfig())) {
            forceReload = true;
        }

        if (forceReload || (printer != null && (configFile.lastModified() != lastModified || !printer.isRunning()))) {
            //file modified, reload it
            if (!forceReload) {
                LOGGER.info("Configuration file modified. Reloading...");
            }
            try {
                printer.stop();

                //debugPath += "printer stopped, setting NULL\n";
            } catch (NullPointerException npe) {
                LOGGER.info("BaseMapServlet.java: printer was not stopped. This happens when a switch between applications happens.\n"+ npe);
            }

            printer = null;
            LOGGER.info("Printer for "+ app +" stopped");
            printers.put(configFileCanonicalPath, null);
        }

        if (printer == null) {
            //debugPath += "printer == null, lastModified from configFile = "+lastModified+"\n";
            try {
                LOGGER.info("Loading configuration file: " + configFile.getAbsolutePath());
                printer = getApplicationContext().getBean(MapPrinter.class).setYamlConfigFile(configFile);
                printers.put(configFileCanonicalPath, printer);
                lastModifieds.put(app,  configFile.lastModified());
            } catch (FileNotFoundException e) {
                throw new ServletException("Cannot read configuration file: " + configPath, e);
            } catch (Throwable e) {
                LOGGER.error("Error occurred while reading configuration file", e);
                throw new ServletException("Error occurred while reading configuration file '" + configFile + "': " + e );
            }
        }
        if (printer != null) {
            printer.start();
        }
        return printer;
    }
    
    private ApplicationContext getApplicationContext() {
        if (this.context == null) {
            synchronized (this) {
                if (this.context == null) {
                    this.context = WebApplicationContextUtils.getWebApplicationContext(getServletContext());
                    if (this.context == null || context.getBean(MapPrinter.class) == null) {
                        String springConfig = System.getProperty("mapfish.print.springConfig");
                        if(springConfig != null) {
                            this.context = new FileSystemXmlApplicationContext(new String[]{"classpath:/"+ShellMapPrinter.DEFAULT_SPRING_CONTEXT, springConfig});
                        } else {
                            this.context = new ClassPathXmlApplicationContext(ShellMapPrinter.DEFAULT_SPRING_CONTEXT);
                        }
                    }
                }
            }
        }
        return this.context;
    }
}