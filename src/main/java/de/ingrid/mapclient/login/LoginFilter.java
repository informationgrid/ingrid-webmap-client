package de.ingrid.mapclient.login;

import java.io.File;
import java.io.IOException;
import java.util.Properties;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import de.ingrid.mapclient.ConfigurationProvider;
import de.ingrid.mapclient.utils.Utils;

public class LoginFilter implements Filter {

    private String loginLockUrl;
    private String logoutUrl;

    @Override
    public void init(FilterConfig config) throws ServletException {
        loginLockUrl = config.getInitParameter("loginLockUrl");
        logoutUrl = config.getInitParameter("logoutUrl");
        destroy();
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;
        HttpSession session = request.getSession(false);
        Properties p = ConfigurationProvider.INSTANCE.getProperties();

        boolean isAdminLock = Boolean.parseBoolean(p.getProperty(ConfigurationProvider.ADMIN_LOCK));
        if(isAdminLock) {
            boolean isLogin = true;
            String path = request.getRequestURI();
            if(path.equals(logoutUrl)) {
                isLogin = false;
            }
            if (request.getRemoteUser() != null) {
                String filePath = p.getProperty(ConfigurationProvider.CONFIG_DIR);
                File file = new File( filePath, p.getProperty(ConfigurationProvider.ADMIN_LOCK_FILE) );
                String content = session.getId();
                if(file.exists()) {
                    String fileContent = Utils.getFileContent(filePath, p.getProperty(ConfigurationProvider.ADMIN_LOCK_FILE), "", "");
                    if(fileContent.equals(content)) {
                        if(!isLogin) {
                            destroy();
                        }
                        chain.doFilter(req, res);
                    } else {
                        response.sendRedirect(request.getContextPath() + loginLockUrl);
                    }
                    
                } else {
                    if(isLogin) {
                        Utils.writeFileContent(file, content);
                    }
                    chain.doFilter(req, res);
                }
            }
        } else {
            chain.doFilter(req, res);
        }
    }

    @Override
    public void destroy() {
        Properties p = ConfigurationProvider.INSTANCE.getProperties();
        boolean isAdminLock = Boolean.parseBoolean(p.getProperty(ConfigurationProvider.ADMIN_LOCK));
        if(isAdminLock) {
            Utils.removeFile(p.getProperty(ConfigurationProvider.ADMIN_LOCK_FILE));
        }
    }

}