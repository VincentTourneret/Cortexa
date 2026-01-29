#!/bin/sh

# Créer le dossier pour les données (juste au cas où)
mkdir -p /data

# Générer le fichier s3.json à partir du template config.json en remplaçant les variables
sed -e "s|\${ADMIN_KEY}|$ADMIN_KEY|g" \
    -e "s|\${ADMIN_SECRET}|$ADMIN_SECRET|g" \
    -e "s|\${APP_KEY}|$APP_KEY|g" \
    -e "s|\${APP_SECRET}|$APP_SECRET|g" \
    /data/config.json.template > /data/s3.json

# Lancer SeaweedFS en arrière-plan
echo "🚀 Starting SeaweedFS..."
weed server -s3 -s3.config=/data/s3.json -filer -ip=$(hostname -i) -dir=/data &
PID=$!

# Fonction pour attendre qu'un port soit ouvert
wait_for_port() {
    local PORT=$1
    echo "⏳ Waiting for port $PORT..."
    timeout 30 sh -c "until nc -z localhost $PORT; do sleep 1; done"
}

# Attendre que le Master (9333) et le Filer (8888) soient prêts
wait_for_port 9333
wait_for_port 8888

# Créer le bucket "app"
echo "🛠 Attempting to create bucket 'app'..."
n=0
until [ "$n" -ge 10 ]
do
   # Tenter de créer le bucket via weed shell
   # On pipe la commande dans weed shell qui se connecte au master local par défaut
   echo "s3.bucket.create -name=app" | weed shell && break
   
   n=$((n+1)) 
   echo "⚠️ Failed to create bucket (attempt $n/10), retrying in 2s..."
   sleep 2
done

echo "✅ Bucket initialization sequence check complete."

# Wait for S3 port to be ready for the app
wait_for_port 8333
echo "✨ SeaweedFS S3 is ready!"

# Attendre la fin du processus SeaweedFS
wait $PID