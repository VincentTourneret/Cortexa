FROM chrislusf/seaweedfs:latest

USER root

# Installation de envsubst (disponible dans le paquet gettext)
RUN apk add --no-cache gettext

# Préparation des dossiers
RUN mkdir -p /etc/seaweedfs /data && \
    chown -R seaweed:seaweed /etc/seaweedfs /data

# Copie du template et du script
COPY --chown=seaweed:seaweed ./config.json /etc/seaweedfs/s3.json.template
COPY --chown=seaweed:seaweed entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

USER seaweed

# On définit notre script comme point d'entrée
ENTRYPOINT ["/entrypoint.sh"]

# Commande par défaut
CMD ["server", "-dir=/data", "-s3", "-s3.config=/etc/seaweedfs/s3.json"]