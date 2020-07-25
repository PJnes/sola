# Sola (Plexus)

```
sudo apt-get install libpcsclite1 libpcsclite-dev pcscd
npm install
npm run
```

### Install as a service

This assumes sola is cloned to `/home/pi/sola`, change WorkingDirectory if that is installed somewhere else.

```
sudo nano /etc/systemd/system/sola.service
```

```
[Unit]
Description=sola service

[Service]
ExecStart=npm start
WorkingDirectory=/home/pi/sola
Restart=always
RestartSec=10
User=pi

[Install]
WantedBy=multi-user.target
```

```
sudo systemctl enable sola.service
sudo sevice sola start
```
