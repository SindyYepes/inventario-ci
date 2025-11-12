pipeline {
  agent any

  parameters {
    choice(name: 'OPERATION', description: '¿Qué quieres hacer?', choices: ['up','down','restart','test','clean'])
    choice(name: 'SERVICE', description: 'Servicio objetivo (para restart)', choices: ['backend','frontend','all'])
    string(name: 'TAIL', defaultValue: '200', description: 'Líneas de logs a mostrar (solo en logs)')
  }

  environment {
    COMPOSE       = 'docker compose'
    COMPOSE_FILES = '-f docker-compose.yml -f docker-compose.ci.yml'
    PROFILE       = '--profile app'   // 👈 solo trabajamos con el perfil "app"
  }

  options {
    disableConcurrentBuilds()
    // skipDefaultCheckout(true)  // si no quieres el checkout implícito
  }

  stages {
    stage('Checkout') {
      steps { checkout scm; sh 'ls -la' }
    }

    stage('Docker Info') {
      steps {
        sh '''
          set -e
          docker version
          ${COMPOSE} ${COMPOSE_FILES} ${PROFILE} ps || true
        '''
      }
    }

    stage('Run Operation') {
      steps {
        script {
          // helpers
          def isRunning = { svc ->
            return sh(script: "${COMPOSE} ${COMPOSE_FILES} ${PROFILE} ps -q ${svc}", returnStdout: true).trim()
          }
          def ensureUp = { List svcs ->
            def toUp = []
            svcs.each { s -> if (!isRunning(s)) { toUp << s } }
            if (toUp) {
              sh """
                ${COMPOSE} ${COMPOSE_FILES} ${PROFILE} up -d --build ${toUp.join(' ')}
              """
            } else {
              echo "Nada que levantar: ${svcs.join(', ')} ya están arriba."
            }
            sh "${COMPOSE} ${COMPOSE_FILES} ${PROFILE} ps || true"
          }

          switch (params.OPERATION) {

            case 'up':
              // Sube backend y frontend SOLO si no están corriendo
              ensureUp(['backend','frontend'])
              break

            case 'down':
              // Baja SOLO el perfil app (backend + frontend)
              sh "${COMPOSE} ${COMPOSE_FILES} ${PROFILE} down --remove-orphans || true"
              break

            case 'restart':
              if (params.SERVICE == 'all') {
                // Si no están arriba, primero súbelos; luego restart
                ensureUp(['backend','frontend'])
                sh """
                  ${COMPOSE} ${COMPOSE_FILES} ${PROFILE} restart backend frontend
                """
              } else {
                def svc = params.SERVICE
                if (!isRunning(svc)) {
                  echo "Servicio ${svc} no está arriba: levantando primero."
                  ensureUp([svc])
                } else {
                  sh "${COMPOSE} ${COMPOSE_FILES} ${PROFILE} restart ${svc}"
                }
              }
              sh "${COMPOSE} ${COMPOSE_FILES} ${PROFILE} ps || true"
              break

            case 'test':
              // Levanta si hace falta, espera /health y hace CRUD mínimo
              ensureUp(['backend','frontend'])
              sh '''
                set -e
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

                echo "POST /items (semilla)"
                curl -sSf -X POST http://localhost:8000/items \
                  -H 'Content-Type: application/json' \
                  -d '{"nombre":"Lapicero","cantidad":10,"precio":1.2,"activo":true}'

                echo "GET /items (validando inserción)"
                curl -sSf http://localhost:8000/items
              '''
              break

            case 'clean':
              // Limpieza de perfil app + basura de Docker
              sh '''
                ${COMPOSE} ${COMPOSE_FILES} ${PROFILE} down -v || true
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
      sh "${COMPOSE} ${COMPOSE_FILES} ${PROFILE} ps || true"
    }
  }
}
