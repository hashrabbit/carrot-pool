## Carrot-Pool Installation

### Requirements
* Node version 14.x, or greater. We recommend `nvm` for handling Node versions, and the repo comes with a `.nvmrc`, with the version set to `v14.17.3`. Once you have `nvm` installed, run `nvm install 14.17.3`.

* Redis version 6.x, or greater. You can either install Redis on `localhost`, or use an external version. Make sure to change the `pool_config.json` settings, if using an external instance.

* Connection info to a SHA-256 daemon, for the coin you wish to host. We've tested `carrot-pool` with BTC, BSV, and BCH, but other derivatives should also work.

-------
### Install Pool Server
```
git clone https://github.com/hashrabbit/carrot-pool.git
cd carrot-pool
npm install
npm test
```

**Note:** If the test run fails, we strongly recommend not going any further. Please contact us, via the info on the README, for assistance.

-------
### Server Configuration

We recommend copying `server_config_sample.json` to `server_config.json` as your starting point.

Redis connection info goes here:
```
    "redis": {
        "host": "127.0.0.1",
        "port": 6379,
        "password": "",
        "cluster": false
    },
```

-------
### Pool Configuration
We recommend copying `pool_config_sample.json` to `pool_config.json` as your starting point.

Pool wallet address goes here:
```
    "addresses": {
        "address": "MMvdRHMDh128QgG2GebQhiUmiV8GCiiB5G",
        ...
    },
```

Coin details go here:
```
    "coin": {
        "name": "Bitcoin-SV",
        "symbol": "BSV",
        "algorithm": "sha256",
    ...
    }
```

Daemon connection info goes here:
```
    "daemons": [
        {
            "host": "127.0.0.1",
            "port": 26710,
            "user": "user",
            "password": "password"
        }
    ]
```

Multiple daemons are supported, in a primary-fallback(s) arrangement.

Processing of payouts are handled separately from work/share validation, so there is an additional daemon config. We recommend using your primary (or only) daemon connection info:

```
    "paymentProcessing": {
        ...
        "daemon": {
            "host": "127.0.0.1",
            "port": 26710,
            "user": "user",
            "password": "password"
        }
    },
```

Detailed information on all of the configuration fields is currently being produced.

-------
### Running the Pool
Use `npm start` to run the pool in the foreground, for local testing. Use `CTRL-C` to exit the foreground process.

Use `npm run prod:start` to run the pool as a "production" service.

Use `npm run prod:stop` to shutdown a "production" instance.

-------
### Upgrading From A NOMP-derived Pool
*If you are switching from a pool based on NOMP (ie. z-nomp or blinkhash), your existing Redis data structures are **incompatible** with carrot-pool.
You will need to run `redis-cli FLUSHALL` before you can successfully run a carrot-pool instance.*

**WARNING: This will destroy any existing statistics, history, and payout data.**
