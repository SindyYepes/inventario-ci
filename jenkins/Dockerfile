# Imagen base de Jenkins con Java 21
FROM jenkins/jenkins:lts-jdk21

# Cambiar a root para instalar dependencias
USER root

ARG DOCKER_GID=983

# Instala Docker CLI y Compose v2 (la base de Jenkins es Debian)
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl gnupg lsb-release \
 && install -m 0755 -d /etc/apt/keyrings \
 && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
 && chmod a+r /etc/apt/keyrings/docker.gpg \
 && . /etc/os-release \
 && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends docker-ce-cli docker-compose-plugin \
 && groupadd -g ${DOCKER_GID} docker || true \
 && usermod -aG ${DOCKER_GID} jenkins \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# --- Instalar plugins de Jenkins ---
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

# --- Copiar script Groovy de inicialización ---
COPY bootstrap.groovy /usr/share/jenkins/ref/init.groovy.d/bootstrap.groovy

# Volver al usuario Jenkins
USER jenkins
