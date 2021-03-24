pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '5'))
    }

    tools {
        nodejs "nodejs10.15.3"
    }

    stages {
        stage('Prepare') {
            steps {
                sh 'apt update'
                sh 'apt install python-pip'
            }
        }
        stage('Build') {
            steps {
                withMaven(
                    // Maven installation declared in the Jenkins "Global Tool Configuration"
                    maven: 'Maven3',
                    // Maven settings.xml file defined with the Jenkins Config File Provider Plugin
                    // Maven settings and global settings can also be defined in Jenkins Global Tools Configuration
                    mavenSettingsConfig: '2529f595-4ac5-44c6-8b4f-f79b5c3f4bae'
                ) {

                    // Run the maven build
                    sh 'mvn clean deploy -Dmaven.test.failure.ignore=true'

                } // withMaven will discover the generated Maven artifacts, JUnit Surefire & FailSafe & FindBugs reports...
            }
        }
        stage ('SonarQube Analysis'){
            steps {
                withMaven(
                    maven: 'Maven3',
                    mavenSettingsConfig: '2529f595-4ac5-44c6-8b4f-f79b5c3f4bae'
                ) {
                    withSonarQubeEnv('Wemove SonarQube') {
                        sh 'mvn org.sonarsource.scanner.maven:sonar-maven-plugin:3.4.0.905:sonar'
                    }
                }
            }
        }
    }
    post {
        changed {
            // send Email with Jenkins' default configuration
            script { 
                emailext (
                    body: '${DEFAULT_CONTENT}',
                    subject: '${DEFAULT_SUBJECT}',
                    to: '${DEFAULT_RECIPIENTS}')
            }
        }
    }
}
