/*
 * **************************************************-
 * InGrid Web Map Client
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
package de.ingrid.mapclient.scheduler.tasks;

import java.io.File;
import java.util.Date;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.lang.time.DateUtils;
import org.apache.log4j.Logger;

import de.ingrid.mapclient.ConfigurationProvider;

public class CleanupTask implements Runnable{
    
    private static final Logger log = Logger.getLogger(CleanupTask.class);
    
    public void run() {
        log.info("Cleanup WebMapClient data ...");
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        String configDirPath = p.getProperty( ConfigurationProvider.CONFIG_DIR);
        File configDir = new File(configDirPath);
        File[] configDirFiles = configDir.listFiles();
        for (File file : configDirFiles) {
            if(file.isDirectory()) {
                String filename = file.getName();
                log.info("Cleanup folder: " + filename);
                if(filename == "kml") {
                    cleanupDirectory(
                        configDirFiles,
                        Integer.parseInt(p.getProperty( ConfigurationProvider.KML_MAX_DIRECTORY_FILES, "1000")),
                        Integer.parseInt(p.getProperty( ConfigurationProvider.KML_MAX_DAYS_FILE_EXIST, "365"))
                    );
                } if(filename == "shorten") {
                    cleanupDirectory(
                        configDirFiles,
                        Integer.parseInt(p.getProperty( ConfigurationProvider.SHORTEN_MAX_DIRECTORY_FILES, "1000")),
                        Integer.parseInt(p.getProperty( ConfigurationProvider.SHORTEN_MAX_DAYS_FILE_EXIST, "365"))
                    );
                } else {
                    cleanupDirectoryByRegex(
                        configDirFiles,
                        Integer.parseInt(p.getProperty( ConfigurationProvider.BACKUP_MAX_DAYS_FILE_EXIST, "7")),
                        "\\.([0-9]*)$"
                    );
                }
            }
        }
        log.info("Cleanup WebMapClient data finished.");
    }

    private void cleanupDirectory(File[] listOfFiles, int maxDirectoryFiles, int maxDaysOfFileExist) {
        if(listOfFiles.length > maxDirectoryFiles){
            for (File file : listOfFiles) {
                if(file.exists()) {
                    if (file.isFile()) {
                        Date limitDate = DateUtils.addDays(new Date(),-maxDaysOfFileExist);
                        Date fileDate = new Date(file.lastModified());
                        if(fileDate.before(limitDate)) {
                            file.delete();
                            log.debug("Delete file: " + file.getAbsoluteFile());
                        }
                    } else if(file.isDirectory()) {
                        cleanupDirectory(file.listFiles(), maxDirectoryFiles, maxDaysOfFileExist);
                    }
                }
            }
        }
    }
    
    private void cleanupDirectoryByRegex(File[] listOfFiles, int maxDaysOfFileExist, String regex) {
        for (File file : listOfFiles) {
            if(file.exists()) {
                if (file.isFile()) {
                    Pattern pattern = Pattern.compile(regex);
                    Matcher matcher = pattern.matcher(file.getName());

                    if(matcher.find()) {
                        Date limitDate = DateUtils.addDays(new Date(),-maxDaysOfFileExist);
                        Date fileDate = new Date(file.lastModified());
                        if(fileDate.before(limitDate)) {
                            file.delete();
                            log.debug("Delete file: " + file.getAbsoluteFile());
                        }
                    }
                } else if(file.isDirectory()) {
                    cleanupDirectoryByRegex(file.listFiles(), maxDaysOfFileExist, regex);
                }
            }
        }
    }
}
