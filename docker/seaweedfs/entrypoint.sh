#!/bin/sh

# Remplace les variables dans le template et crée le vrai s3.json
envsubst < /etc/seaweedfs/s3.json.template > /etc/seaweedfs/s3.json

# Lance la commande originale de SeaweedFS
exec /usr/bin/weed "$@"