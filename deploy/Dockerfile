# Jordan (LiDeHouse) - eles futtatas Fly.io-n
# A Meteor 1.10-es bundle Node 12-t igenyel; a node:12.22.12 az utolso 12-es kiadas.
# A bundle-t elore megepitjuk WSL-ben (build_bundle.bat), ide csak bemasoljuk.
FROM node:12.22.12-slim

ENV NODE_ENV=production
WORKDIR /app

COPY bundle/jordan.tar.gz /tmp/jordan.tar.gz
RUN tar -xzf /tmp/jordan.tar.gz -C /app --strip-components=1 && rm /tmp/jordan.tar.gz

# Szerver-oldali npm fuggosegek (bcrypt 5 es fibers keszen kapott binarissal telepul, nem kell fordito)
RUN cd /app/programs/server && npm install --production --unsafe-perm

EXPOSE 3000
CMD ["node", "main.js"]
