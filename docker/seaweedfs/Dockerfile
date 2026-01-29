FROM chrislusf/seaweedfs:latest

# 1. Variables pour l'Admin Global
ENV ADMIN_KEY=${ADMIN_KEY}
ENV ADMIN_SECRET=${ADMIN_SECRET}

# 2. Variables pour le Bucket "app"
ENV APP_KEY=${APP_KEY}
ENV APP_SECRET=${APP_SECRET}

# On expose les ports
EXPOSE 8333 9333 8888

# On copie le template de configuration et le script d'entrée
COPY config.json /data/config.json.template
COPY entrypoint.sh /entrypoint.sh

# On rend le script exécutable
# Note: seaweedfs image might not have 'chmod' in standard path or use a different user
USER root
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]