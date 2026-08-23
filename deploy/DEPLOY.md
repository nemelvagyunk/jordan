# Jordan (LiDeHouse) — telepítés Fly.io-ra

A parancsokat **te futtatod** PowerShellben. Első alkalommal kb. 20–30 perc, utána egy frissítés = 2 parancs.

## 0. Egyszeri előfeltétel: flyctl belépés

A flyctl már fent van a gépeden (`fly version` mutatja). Egyszer be kell lépni:
```powershell
fly auth login
```

## 1. Bundle építése (minden telepítés előtt, ha változott a kód)

Dupla kattintás: `deploy\build_bundle.bat` — friss éles csomagot épít a `deploy\bundle\jordan.tar.gz` alá. (Most már kész van egy friss bundle, ezt a lépést első alkalommal átugorhatod.)

## 2. Egyszeri beállítás: MongoDB app

```powershell
cd C:\JORDANHAZKEZELO\jordan\deploy
fly apps create jordan-mongo
fly volumes create mongodata --region ams --size 3 -a jordan-mongo
fly deploy -c mongo-fly.toml --ha=false
```
A volume-létrehozás figyelmeztetést ír ki (egyetlen kötet = nincs redundancia) — teszthez ez vállalt, válaszolj `y`-t. A `--ha=false` fontos: enélkül a Fly 2 gépet csinálna, a mongónak pedig pont egy kell.

## 3. Egyszeri beállítás: az alkalmazás

```powershell
cd C:\JORDANHAZKEZELO\jordan\deploy
fly apps create jordan-hazkezelo
fly secrets set -a jordan-hazkezelo MONGO_URL=mongodb://jordan-mongo.internal:27017/meteor
```
A Meteor-beállítások (METEOR_SETTINGS) a `fly.toml`-ban vannak egy sorban — külön parancs nem kell hozzájuk.
Ha a `jordan-hazkezelo` név foglalt: válassz másikat, és írd át a `fly.toml`-ban az `app` és `ROOT_URL` sorokat + a fenti két parancsban a nevet.

## 4. Telepítés

```powershell
cd C:\JORDANHAZKEZELO\jordan\deploy
fly deploy --ha=false
```
Az első deploy 5–10 perc (a Fly távoli builderén épül a kép, a 108 MB-os bundle feltöltése is idő). Utána: **https://jordan-hazkezelo.fly.dev** — demó-belépés: `/demo?lang=hu`.
A `--ha=false` itt is kell (első alkalommal): 1 gép fusson, ne 2 — a Meteor websocket-kapcsolatai miatt is ez a jó felállás.

## Frissítés menete (összefoglalva)
1. `build_bundle.bat`  →  2. `fly deploy` (a deploy mappából). Ennyi.

## Hasznos parancsok
- `fly logs` / `fly logs -a jordan-mongo` — élő naplók (hibakereséshez ez az első)
- `fly status` — gépek állapota · `fly ssh console` — shell a gépen

## Későbbre (éles indulás előtt teendő)
- **Demó kikapcsolása**: a `fly.toml` METEOR_SETTINGS sorában `"enableDemo":false` + `fly deploy` (a settings-production.json csak referencia-másolat, a mérvadó a toml-sor).
- **MongoDB jelszavas védelem** (most a Fly privát belső hálózata védi — teszthez elég, éleshez legyen auth is; akkor a MONGO_URL secretet is frissíteni kell).
- **Mentések**: a Fly naponta automatikus snapshotot készít a kötetről (`fly volumes list -a jordan-mongo`, majd `fly volumes snapshots list <vol-id>`); éles előtt saját mongodump-mentést is beállítunk.
- **E-mail küldés**: `fly secrets set MAIL_URL=smtp://...` — enélkül az app fut, csak nem küld leveleket (regisztrációhoz most nem is kell megerősítő levél, mert demó-módban ez ki van kapcsolva).
- **Saját domain**: `fly certs add <domain>` + DNS-rekord + ROOT_URL átírása.
- Ha kevés az 1 GB RAM: `fly.toml`-ban `memory = "2gb"` + `fly deploy`.

## Költség (nagyságrend)
1 GB-os app-gép + 512 MB-os mongo-gép + 3 GB kötet: kb. **8–12 USD/hó**. A Fly használat alapján számláz.
