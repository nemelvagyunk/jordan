# Eles bundle epitese WSL-ben a Windows-os repobol.
# Futtatas: build_bundle.bat (Windows) vagy WSL-ben: tr -d '\r' < build_bundle.sh | bash
set -e
SRC=/mnt/c/JORDANHAZKEZELO/jordan
WORK=/root/jordan-build
OUT=/root/build-out

echo "1/4 Forras szinkronizalasa a WSL-be..."
mkdir -p $WORK
cd $SRC
tar cf - --exclude=./.git --exclude=./node_modules --exclude=./.meteor/local --exclude=./deploy/bundle . | tar xf - -C $WORK

echo "2/4 npm fuggosegek..."
cd $WORK
export METEOR_ALLOW_SUPERUSER=1
meteor npm install --silent

echo "3/4 Meteor build (5-15 perc)..."
rm -rf $OUT
meteor build $OUT --server-only --architecture os.linux.x86_64

echo "4/4 Bundle masolasa a deploy/bundle ala..."
mkdir -p $SRC/deploy/bundle
cp $OUT/*.tar.gz $SRC/deploy/bundle/jordan.tar.gz
ls -lh $SRC/deploy/bundle/jordan.tar.gz
echo "KESZ - jöhet a 'fly deploy' a deploy mappabol."
