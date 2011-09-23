
How to Run in Eclipse
---------------------

Preconditions: 
  - Eclipse with WTP, local Tomcat installation (5.5 for InGrid) configured in Eclipse
    (Preferences -> Server Runtime Enviroments)
  - Client configuration: see src/main/webapp/README.txt

1. Command Line in project directory
  - mvn eclipse:eclipse

2. Import in Eclipse

3. Project Properties
  -> Project Facets
    -> Convert to faceted form ...
	  - Runtimes: Apache Tomcat v5.5
      - Dynamic Web Module 2.4 (Further configuration -> Content directory: src/main/webapp)
      - Java 1.6
      - JavaScript 1.0
	-> OK

4. Project Properties
  -> Deployment Assembly
    -> Add ... Java Build Path Entries (All M2_REPO entries, Deploy Path: WEB-INF/lib)
	-> OK

5. Server View
  - Tomcat v5.5 
  -> Add And Remove ...
    - add Project
  -> Publish

6. Run/Debug in Server View