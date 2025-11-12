pipeline {
  agent any

  parameters {
    choice(name: 'OPERATION', description: '¿Qué quieres hacer?', choices: [
      'build',        // Construir imágenes
      'up',           // Levantar servicios en segundo plano
      'down',         // Parar y eliminar contenedores
      'restart',      // Reiniciar un servicio
      'test',         // Probar /health y CRUD mínimo
      'clean'         // Limpiar imágenes y volúmenes huérfanos
    ])
    choice(name: 'SERVICE', description: 'Servicio objetivo (para restart/logs)', choices: [
      'backend', 'frontend', 'jenkins', 'all'
    ])
    string(name: 'TAIL', defaultValue: '200', description: 'Líneas de logs a mostrar (solo en logs)')
  }

  environment {
    COMPOSE = 'docker compose'  // usa el plugin v2
  }

  options {
    timestamps()
    ansiColor('xterm')
    disableConcurrentBuilds()
  }

  stages {

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
              sh """
                ${COMPOSE} build --no-cache
              """
              break

            case 'up':
              sh """
                ${COMPOSE} up -d --build
                ${COMPOSE} ps
              """
              break

            case 'down':
              sh """
                ${COMPOSE} down
              """
              break

            case 'restart':
              def svc = params.SERVICE == 'all' ? '' : params.SERVICE
              sh """
                if [ -n "${svc}" ]; then
                  ${COMPOSE} restart ${svc}
                else
                  ${COMPOSE} restart
                fi
                ${COMPOSE} ps
              """
              break

            case 'test':
              // Prueba básica del backend
              sh '''
                set -e
                # Asegura que esté arriba
                ${COMPOSE} up -d --build
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
                curl -sSf http://localhost:8000/items | jq '.'

                echo "POST /items (semilla temporal de prueba)"
                curl -sSf -X POST http://localhost:8000/items \
                  -H 'Content-Type: application/json' \
                  -d '{"nombre":"Lapicero","cantidad":10,"precio":1.2,"activo":true}' | jq '.'

                echo "GET /items (validando inserción)"
                curl -sSf http://localhost:8000/items | jq '.'
              '''
              break

            case 'clean':
              sh '''
                ${COMPOSE} down -v || true
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
      script {
        // Muestra estado final; no falla el build por esto
        sh "${COMPOSE} ps || true"
      }
    }
  }
}

