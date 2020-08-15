# Sola (Plexus)

This is a simple script to trigger a series of Home Assistant API calls based on the uid of an NFC tag. 

ContentId.json contains the details of the NFC IDs, along with which API calls to make. You can take a look at the examples to see the values each type of media requires (and yeah, Duggee and Cars is about the only thing I get to watch with a 2 year old).

It's fairly specific to my use case, but hopefully it's useful to someone, somewhere, someday.

## Install Sola
```
sudo apt-get install libpcsclite1 libpcsclite-dev pcscd
npm install
npm run
```

## Install as a service

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
