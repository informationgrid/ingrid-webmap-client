pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '5'))
    }

    environment {
        VERSION = readMavenPom().getVersion()
    }

    tools {
        jdk 'jdk25'
        nodejs "nodejs10.15.3"
    }

    stages {
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
        stage ('Build image version'){
            steps {
                echo 'Starting to build docker image'

                script {

                    docker.withRegistry('https://docker-registry.wemove.com', 'docker-registry-wemove') {
                        def customImage = docker.build("docker-registry.wemove.com/ingrid-webmap-client:${env.VERSION}", "--pull .")

                        /* Push the container to the custom Registry */
                        customImage.push()
                    }
                }
            }
        }
        stage ('Build image latest'){
            when {
                anyOf { branch 'develop' }
            }
            steps {
                echo 'Starting to build docker image latest'

                script {

                    docker.withRegistry('https://docker-registry.wemove.com', 'docker-registry-wemove') {
                        def customImage = docker.build("docker-registry.wemove.com/ingrid-webmap-client:latest", "--pull .")

                        /* Push the container to the custom Registry */
                        customImage.push()
                    }
                }
            }
        }

        stage('Build RPM') {
            when { expression { return shouldBuildDevOrRelease() } }
            agent {
                docker {
                    image 'docker-registry.wemove.com/ingrid-rpmbuilder-jdk21-improved'
                    reuseNode true
                }
            }
            steps {
                script {
                    sh "sed -i 's/^Version:.*/Version: ${determineRpmVersion()}/' ingrid-webmap-client.spec"
                    sh "sed -i 's/^Release:.*/Release: ${determineRpmReleasePart()}/' ingrid-webmap-client.spec"

                    // Prepare build
                    sh "mkdir -p ./build/rpms /root/rpmbuild/SPECS"
                    sh """
                        cp ${WORKSPACE}/ingrid-webmap-client.spec /root/rpmbuild/SPECS/ingrid-webmap-client.spec &&
                        rpmbuild -bb /root/rpmbuild/SPECS/ingrid-webmap-client.spec
                    """

                    withCredentials([
                            file(credentialsId: 'ingrid-rpm-public', variable: 'RPM_PUBLIC_KEY'),
                            file(credentialsId: 'ingrid-rpm-private', variable: 'RPM_PRIVATE_KEY'),
                            string(credentialsId: 'ingrid-rpm-passphrase', variable: 'RPM_SIGN_PASSPHRASE')
                        ]) {
                        sh 'gpg --batch --import $RPM_PUBLIC_KEY'
                        sh 'gpg --batch --import $RPM_PRIVATE_KEY'
                        sh "mkdir -p ./build/rpms/ingrid"
                        sh "cp -r /root/rpmbuild/RPMS/noarch/* ${WORKSPACE}/build/rpms/ingrid/"
                        sh "expect /rpm-sign.exp ${WORKSPACE}/build/rpms/ingrid/*.rpm"

                        archiveArtifacts artifacts: 'build/rpms/ingrid/ingrid-webmap-client-*.rpm', fingerprint: true
                    }

                    withCredentials([
                            file(credentialsId: 'itzbund-ingrid-rpm-public', variable: 'RPM_PUBLIC_KEY'),
                            file(credentialsId: 'itzbund-ingrid-rpm-private', variable: 'RPM_PRIVATE_KEY'),
                            string(credentialsId: 'itzbund-ingrid-rpm-passphrase', variable: 'RPM_SIGN_PASSPHRASE')
                        ]) {
                        sh 'rm -f ~/.gnupg/*.kbx'
                        sh 'rm -f ~/.gnupg/*.gpg'
                        sh 'gpg --batch --import $RPM_PUBLIC_KEY'
                        sh 'gpg --batch --import $RPM_PRIVATE_KEY'
                        sh "mkdir -p ./build/rpms/itzbund"
                        sh "cp -r /root/rpmbuild/RPMS/noarch/* ${WORKSPACE}/build/rpms/itzbund/"
                        sh "expect /rpm-sign.exp ${WORKSPACE}/build/rpms/itzbund/*.rpm"

                        archiveArtifacts artifacts: 'build/rpms/itzbund/ingrid-webmap-client-*.rpm', fingerprint: true
                    }
                }
            }
        }

        stage('Deploy RPM') {
            when { expression { return shouldBuildDevOrRelease() } }
            steps {
                script {
                    def repoType = env.TAG_NAME ? "rpm-ingrid-releases" : "rpm-ingrid-snapshots"
                    sh "mv target/bom.json target/ingrid-webmap-client-${determineRpmVersion()}.bom.json"
                    //archiveArtifacts artifacts: "target/*.bom.json", fingerprint: true

                    withCredentials([usernamePassword(credentialsId: '9623a365-d592-47eb-9029-a2de40453f68', passwordVariable: 'PASSWORD', usernameVariable: 'USERNAME')]) {
                        sh '''
                            curl -f --user $USERNAME:$PASSWORD --upload-file build/rpms/ingrid/*.rpm https://nexus.informationgrid.eu/repository/''' + repoType + '''/
                            curl -f --user $USERNAME:$PASSWORD --upload-file target/*.bom.json https://nexus.informationgrid.eu/repository/''' + repoType + '''/
                        '''
                    }
            /*        if (repoType == 'rpm-ingrid-releases') {
                        withCredentials([usernamePassword(credentialsId: '9623a365-d592-47eb-9029-a2de40453f68', passwordVariable: 'PASSWORD', usernameVariable: 'USERNAME')]) {
                            sh '''
                                curl -f --user $USERNAME:$PASSWORD --upload-file build/rpms/itzbund/*.rpm https://nexus.informationgrid.eu/repository/rpm-ingrid-itzbund/
                                #curl -f --user $USERNAME:$PASSWORD --upload-file target/*.bom.json https://nexus.informationgrid.eu/repository/rpm-ingrid-itzbund/
                            '''
                        }
                        if (env.TAG_NAME && env.TAG_NAME.startsWith("RPM-")) {
                            // No upload to other ITZBund repos
                        } else {
                            withCredentials([usernamePassword(credentialsId: '9623a365-d592-47eb-9029-a2de40453f68', passwordVariable: 'PASSWORD', usernameVariable: 'USERNAME')]) {
                                sh '''
                                    curl -f --user $USERNAME:$PASSWORD --upload-file build/rpms/itzbund/*.rpm https://nexus.informationgrid.eu/repository/rpm-zdm_release/
                                    #curl -f --user $USERNAME:$PASSWORD --upload-file target/*.bom.json https://nexus.informationgrid.eu/repository/rpm-zdm_release/
                                '''
                            }
                        }
                    }*/
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

def determineVersion() {
    if (env.TAG_NAME) {
        if (env.TAG_NAME.startsWith("RPM-")) { // e.g. RPM-8.0.0-0.1SNAPSHOT
            def lastDashIndex = env.TAG_NAME.lastIndexOf("-")
            return env.TAG_NAME.substring(4, lastDashIndex)
        }
        return env.TAG_NAME
    } else {
        return env.BRANCH_NAME.replaceAll('/', '_')
    }
}

def determineRpmVersion() {
    return determineVersion().replaceAll('-', '_')
}

def determineRpmReleasePart() {
    if (env.TAG_NAME) {
        if (env.TAG_NAME.startsWith("RPM-")) {
            return env.TAG_NAME.substring(env.TAG_NAME.lastIndexOf("-") + 1)
        }
        return '1'
    } else {
        return 'dev'
    }
}

def shouldBuildDevOrRelease() {
    // If no tag is being built OR it is the first build of a tag
    boolean isTag = env.TAG_NAME != null && env.TAG_NAME.trim() != ''
    return !isTag || (isTag && currentBuild.number == 1)
}

def shouldBuildDockerImage() {
    if (env.TAG_NAME && env.TAG_NAME.startsWith("RPM-")) {
        return false
    } else return true
}
