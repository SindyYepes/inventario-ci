pipeline {
  agent any

  parameters {
    choice(name: 'OPERATION', description: '¿Qué quieres hacer?', choices: ['down','restart','test','clean'])
    choice(name: 'SERVICE', description: 'Servicio objetivo (para restart)', choices: ['backend','frontend','all'])  // ← quita jenkins
    string(name: 'TAIL', defaultValue: '200', description: 'Líneas de logs a mostrar (solo en logs)')
  }

  environment {
    COMPOSE = 'docker compose'
    COMPOSE_FILES = '-f docker-compose.yml -f docker-compose.ci.yml'
  }

  options {
    disableConcurrentBuilds()
    // skipDefaultCheckout(true)  // opcional
  }

  stages {
    stage('Checkout') {
      steps { checkout scm; sh 'ls -la' }
    }

    stage('Docker Info') {
      steps {
        sh '''
          docker version
          ${COMPOSE} version || true
          ${COMPOSE} ${COMPOSE_FILES} ps || true
        '''
      }
    }

    stage('Run Operation') {
      steps {
        script {
          // helper: lista de servicios objetivo en CI
          def targets = 'backend frontend'

          switch (params.OPERATION) {
            case 'down':
              sh "${COMPOSE} ${COMPOSE_FILES} down"   // esto baja todo el stack de CI (backend/frontend/red/vols)
              break

            case 'restart':
              if (params.SERVICE == 'all') {
                sh "${COMPOSE} ${COMPOSE_FILES} restart ${targets}"
              } else {
                sh "${COMPOSE} ${COMPOSE_FILES} restart ${params.SERVICE}"
              }
              sh "${COMPOSE} ${COMPOSE_FILES} ps"
              break

            case 'test':
              sh '''
                set -e
                ${COMPOSE} ${COMPOSE_FILES} up -d --build backend frontend
                echo "Esperando backend..."
                for i in $(seq 1 30); do
                  if curl -sSf http://localhost:8000/health >/dev/null; then
                    echo "Backend OK"; break
                  fi
                  sleep 1
                  if [ "$i" -eq 30 ]; then
                    echo "Backend no respondió a tiempo" >&2; exit 1
                  fi
                done
                curl -sSf http://localhost:8000/items
                curl -sSf -X POST http://localhost:8000/items \
                  -H 'Content-Type: application/json' \
                  -d '{"nombre":"Lapicero","cantidad":10,"precio":1.2,"activo":true}'
                curl -sSf http://localhost:8000/items
              '''
              break

            case 'clean':
              sh '''
                ${COMPOSE} ${COMPOSE_FILES} down -v || true
                docker system prune -af || true
              '''
              break

            default:
              error "Operación no reconocida: ${params.OPERATION}"
          }
        }
      }
    }
  }

  post {
    always { sh "${COMPOSE} ${COMPOSE_FILES} ps || true" }
  }
}
