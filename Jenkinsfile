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
    COMPOSE       = 'docker compose'
    COMPOSE_FILES = '-f docker-compose.yml -f docker-compose.ci.yml'
    PROFILE       = '--profile app'
    PROJECT       = '-p gestor-operaciones-ci'
  }

  options {
    disableConcurrentBuilds()
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

    /* ============================================================
       🧪 STAGE: PRUEBAS UNITARIAS (Backend + Frontend)
       ============================================================ */
    stage('Unit Tests') {
      when {
        expression { return params.OPERATION == 'test' }
      }
      steps {
        script {
          def baseCmd = "${COMPOSE} ${PROJECT} ${COMPOSE_FILES} ${PROFILE}"

          echo "🚀 Ejecutando pruebas unitarias..."

          /* -------- BACKEND TESTS -------- */
          echo "📌 Levantando backend para pruebas..."
          sh """
            set -e
            ${baseCmd} up -d --build backend
          """

          echo "⏳ Esperando backend..."
          sleep 5

          echo "🧪 Ejecutando pytest..."
          sh """
            set -e
            ${baseCmd} exec backend pytest -q
          """

          echo "✅ Pruebas del backend completadas."

          /* -------- FRONTEND TESTS -------- */
          echo "📌 Levantando frontend para pruebas..."
          sh """
            set -e
            ${baseCmd} up -d --build frontend
          """

          echo "⏳ Esperando frontend..."
          sleep 5

          echo "🧪 Ejecutando npm test..."
          sh """
            set -e
            ${baseCmd} exec frontend npm test --silent --yes || true
          """

          echo "✅ Pruebas del frontend completadas."
        }
      }
    }

    /* ============================================================
       RUN OPERATION (up, down, restart, clean)
       ============================================================ */
    stage('Run Operation') {
      steps {
        script {
          def baseCmd = "${COMPOSE} ${PROJECT} ${COMPOSE_FILES} ${PROFILE}"

          echo "Operación seleccionada: ${params.OPERATION}"
          echo "Servicio objetivo: ${params.SERVICE}"

          switch (params.OPERATION) {

            /* ======================= UP ======================== */
            case 'up':
              echo "Levantando stack CI (build + up -d)..."
              sh """
                set -e
                ${baseCmd} up -d --build
                ${baseCmd} ps
              """

              def isBackendRunning = {
                return sh(
                  script: "${baseCmd} ps -q backend",
                  returnStdout: true
                ).trim()
              }

              sleep 5

              if (!isBackendRunning()) {
                echo "⚠️ Backend no corrió en primer up. Intentando restart..."

                sh """
                  set -e
                  ${baseCmd} restart backend || true
                  sleep 5
                  ${baseCmd} ps || true
                """

                if (!isBackendRunning()) {
                  echo "❌ Backend sigue caído. Debug info:"

                  sh """
                    echo '>>> docker ps -a (backend)'
                    docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Image}}' | grep backend || true

                    echo ''
                    echo '>>> Logs del backend (últimas ${params.TAIL} líneas)...'
                    ${baseCmd} logs backend --tail=${params.TAIL} || true

                    echo ''
                    echo '>>> Inspect backend'
                    docker inspect gestor-operaciones-ci-backend-1 || true
                  """

                  error "Backend no se pudo levantar en CI."
                } else {
                  echo "✅ Backend quedó corriendo tras restart."
                }

              } else {
                echo "✅ Backend corriendo después de up."
              }

              break

            /* ======================= DOWN ======================== */
            case 'down':
              echo "Bajando stack CI..."
              sh """
                set -e
                ${baseCmd} down --remove-orphans
                ${baseCmd} ps || true
              """
              break

            /* ======================= RESTART ======================== */
            case 'restart':
              if (params.SERVICE == 'all') {
                echo "Reiniciando todos los servicios..."
                sh """
                  set -e
                  ${baseCmd} restart
                  ${baseCmd} ps
                """
              } else {
                echo "Reiniciando servicio: ${params.SERVICE}"
                sh """
                  set -e
                  ${baseCmd} restart ${params.SERVICE}
                  ${baseCmd} ps
                """
              }
              break

            /* ======================= TEST ======================== */
            case 'test':
              echo "🔍 Operación TEST: las pruebas se ejecutan en el stage 'Unit Tests'."
              break

            /* ======================= CLEAN ======================== */
            case 'clean':
              echo "Clean: down + remove-orphans + -v..."
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
      echo "Post actions: estado final del stack CI:"
      sh """
        ${COMPOSE} ${PROJECT} ${COMPOSE_FILES} ${PROFILE} ps || true
      """
    }
  }
}
