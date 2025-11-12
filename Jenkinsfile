pipeline {
  agent any

  parameters {
    choice(name: 'OPERATION', description: '¿Qué quieres hacer?', choices: ['build','up','down','restart','test','clean'])
    choice(name: 'SERVICE', description: 'Servicio objetivo (para restart)', choices: ['backend','frontend','jenkins','all'])
    string(name: 'TAIL', defaultValue: '200', description: 'Líneas de logs a mostrar (solo en logs)')
  }

  environment {
    COMPOSE = 'docker compose'
    COMPOSE_FILES = '-f docker-compose.yml -f docker-compose.ci.yml'
  }

  options {
    disableConcurrentBuilds()
    // Si dejas tu stage "Checkout", activa esto:
    // skipDefaultCheckout(true)
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
        sh '''
          docker version
          ${COMPOSE} version || true
          ${COMPOSE} ps || true
        '''
      }
    }

    stage('Run Operation') {
      steps {
        script {
          switch (params.OPERATION) {
            case 'build':
              sh "${COMPOSE} ${COMPOSE_FILES} build --no-cache"
              break
            case 'up':
              sh """
                ${COMPOSE} ${COMPOSE_FILES} up -d --build
                ${COMPOSE} ${COMPOSE_FILES} ps
              """
              break
            case 'down':
              sh "${COMPOSE} ${COMPOSE_FILES} down"
              break
            case 'restart':
              def svc = params.SERVICE == 'all' ? '' : params.SERVICE
              sh """
                if [ -n "${svc}" ]; then
                  ${COMPOSE} ${COMPOSE_FILES} restart ${svc}
                else
                  ${COMPOSE} ${COMPOSE_FILES} restart
                fi
                ${COMPOSE} ${COMPOSE_FILES} ps
              """
              break
            case 'test':
              sh '''
                set -e
                ${COMPOSE} ${COMPOSE_FILES} up -d --build
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

                echo "GET /items"
                curl -sSf http://localhost:8000/items

                echo "POST /items (semilla de prueba)"
                curl -sSf -X POST http://localhost:8000/items \
                  -H 'Content-Type: application/json' \
                  -d '{"nombre":"Lapicero","cantidad":10,"precio":1.2,"activo":true}'

                echo "GET /items (validando inserción)"
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
    always {
      sh "${COMPOSE} ${COMPOSE_FILES} ps || true"
    }
  }
}

