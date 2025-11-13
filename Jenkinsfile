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

            // 🔍 helper para saber si el backend está corriendo
            def isBackendRunning = {
              return sh(
                script: "${baseCmd} ps -q backend",
                returnStdout: true
              ).trim()
            }

            // 🕒 pequeña espera inicial
            sleep 5

            if (!isBackendRunning()) {
              echo "⚠️ Backend no está corriendo tras el primer up. Haciendo un intento de restart..."

              // Intento de restart
              sh """
                set -e
                ${baseCmd} restart backend || true
                sleep 5
                ${baseCmd} ps || true
              """

              // Volvemos a comprobar
              if (!isBackendRunning()) {
                echo "❌ Backend sigue caído después del restart. Mostrando info de debug..."

                // Logs y estado del contenedor
                sh """
                  echo '>>> docker ps -a (filtrando backend)...'
                  docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Image}}' | grep backend || true

                  echo ''
                  echo '>>> Logs del backend (últimas ${params.TAIL} líneas)...'
                  ${baseCmd} logs backend --tail=${params.TAIL} || true

                  echo ''
                  echo '>>> Inspect del contenedor backend (si existe)...'
                  docker inspect gestor-operaciones-ci-backend-1 || true
                """

                error "Backend no se pudo levantar en CI (ver logs anteriores)."
              } else {
                echo "✅ Backend quedó corriendo después del restart."
              }

            } else {
              echo "✅ Backend está corriendo después del primer up."
            }

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
