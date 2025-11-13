pipeline {
  agent any

  parameters {
    choice(
      name: 'OPERATION',
      description: '¿Qué quieres hacer?',
      choices: ['up', 'down', 'restart', 'test', 'clean']
    )
    choice(
      name: 'SERVICE',
      description: 'Servicio objetivo (para restart)',
      choices: ['backend', 'frontend', 'all']
    )
    string(
      name: 'TAIL',
      defaultValue: '200',
      description: 'Líneas de logs a mostrar (solo en test/logs si lo usas luego)'
    )
  }

  environment {
    // Comando base de docker compose
    COMPOSE       = 'docker compose'
    COMPOSE_FILES = '-f docker-compose.yml -f docker-compose.ci.yml'
    PROFILE       = '--profile app'

    // 🔹 Nombre de proyecto fijo para el stack que maneja Jenkins
    // Esto lo diferencia del proyecto "inventario-ci" donde corre tu Jenkins padre
    PROJECT       = '-p gestor-operaciones-ci'
  }

  options {
    disableConcurrentBuilds()
    // skipDefaultCheckout(true) // si algún día quieres desactivar el checkout implícito
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
        sh 'ls -la'
      }
    }

    stage('Docker Info') {
      steps {
        sh """
          set -e
          echo '>>> Docker version'
          docker version

          echo ''
          echo '>>> docker compose ps (stack CI: gestor-operaciones-ci)'
          ${COMPOSE} ${PROJECT} ${COMPOSE_FILES} ${PROFILE} ps || true
        """
      }
    }

    stage('Run Operation') {
      steps {
        script {
          // Comando base para no repetir
          def baseCmd = "${COMPOSE} ${PROJECT} ${COMPOSE_FILES} ${PROFILE}"

          echo "Operación seleccionada: ${params.OPERATION}"
          echo "Servicio objetivo: ${params.SERVICE}"

          switch (params.OPERATION) {

            case 'up':
              echo "Levantando stack CI (build + up -d)..."
              sh """
                set -e
                ${baseCmd} up -d --build
                ${baseCmd} ps
              """
              break

            case 'down':
              echo "Bajando stack CI (down --remove-orphans)..."
              sh """
                set -e
                ${baseCmd} down --remove-orphans
                ${baseCmd} ps || true
              """
              break

            case 'restart':
              if (params.SERVICE == 'all') {
                echo "Reiniciando todos los servicios del stack CI..."
                sh """
                  set -e
                  ${baseCmd} restart
                  ${baseCmd} ps
                """
              } else {
                echo "Reiniciando solo el servicio: ${params.SERVICE}"
                sh """
                  set -e
                  ${baseCmd} restart ${params.SERVICE}
                  ${baseCmd} ps
                """
              }
              break

            case 'test':
              echo "Ejecutando operación de prueba (por ahora solo ps)..."
              sh """
                set -e
                ${baseCmd} ps
              """
              // Aquí en el futuro puedes:
              // - hacer curl a backend
              // - ejecutar tests dentro de un contenedor, etc.
              break

            case 'clean':
              echo "Clean: down + remove-orphans + -v (volúmenes)..."
              sh """
                set -e
                ${baseCmd} down --remove-orphans -v
                ${baseCmd} ps || true
              """
              break

            default:
              error "Operación no soportada: ${params.OPERATION}"
          }
        }
      }
    }
  }

  post {
    always {
      echo "Post actions: estado final del stack CI (gestor-operaciones-ci):"
      sh """
        ${COMPOSE} ${PROJECT} ${COMPOSE_FILES} ${PROFILE} ps || true
      """
    }
  }
}
