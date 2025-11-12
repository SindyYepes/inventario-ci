pipeline {
  agent any
  stages {
    stage('Checkout') {
      steps {
        checkout([$class: 'GitSCM',
          branches: [[name: '*/main']],
          userRemoteConfigs: [[
            url: 'https://github.com/tuusuario/inventario-ci.git',
            credentialsId: 'github-pat'
          ]]
        ])
      }
    }
  }
}
