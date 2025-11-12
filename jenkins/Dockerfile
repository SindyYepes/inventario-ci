# Imagen base de Jenkins con Java 21
FROM jenkins/jenkins:lts-jdk21

# Cambiar a root para instalar dependencias
USER root

# --- Instalar plugins de Jenkins ---
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

# --- Copiar script Groovy de inicialización ---
COPY bootstrap.groovy /usr/share/jenkins/ref/init.groovy.d/bootstrap.groovy

# Volver al usuario Jenkins
USER jenkins
