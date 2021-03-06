/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require, no-console */
import { setupHttpDevServer } from "./dev-http";
import { createServer } from "http";

const ck = require("chalker");
const optionalRequire = require("optional-require")(require);
const fastifyServer = optionalRequire("@xarc/fastify-server");
const electrodeServer = optionalRequire("electrode-server");
const Hapi = optionalRequire("@hapi/hapi");
const Koa = optionalRequire("koa");
const express = optionalRequire("express");

import { loadXarcOptions } from "../../lib/utils";

const xarcOptions = loadXarcOptions();

//
// indicate that app is running in webpack dev mode
// also set by @xarc/app/arch-clap.js
//
if (process.env.WEBPACK_DEV === undefined) {
  process.env.WEBPACK_DEV = "true";
}

if (createServer) {
  const devHttpServer = setupHttpDevServer({
    host: xarcOptions.webpack.devHostname,
    port: xarcOptions.webpack.devPort
  });
  devHttpServer.addListener("error", err => {
    console.error(ck`<red>HTTP webpack dev server having an error</>${err}`);
  });

  devHttpServer.addListener("listening", () =>
    console.log(
      ck`<green>Node.js webpack dev server listening on port ${xarcOptions.webpack.devPort}</>`
    )
  );
  devHttpServer.start();
} else if (fastifyServer) {
  fastifyServer({
    electrode: {
      logLevel: "warn",
      pinoOptions: false
    },
    connection: {
      host: xarcOptions.webpack.devHostname,
      port: xarcOptions.webpack.devPort
    },
    plugins: {
      webpackDevFastify: {
        module: "./dev-fastify",
        requireFromPath: __dirname
      }
    }
  });
} else if (electrodeServer) {
  electrodeServer({
    electrode: {
      logLevel: "warn"
    },
    connections: {
      default: { host: xarcOptions.webpack.devHostname, port: xarcOptions.webpack.devPort }
    },
    plugins: {
      webpackDevHapi: {
        module: "./dev-hapi.js",
        requireFromPath: __dirname
      }
    }
  });
} else if (Hapi) {
  const app = Hapi.server({
    port: xarcOptions.webpack.devPort,
    host: xarcOptions.webpack.devHostname
  });
  app
    .register(require("./dev-hapi"))
    .then(() => app.start())
    .then(() => {
      console.log(
        ck`<green>Hapi webpack dev server listening on port ${xarcOptions.webpack.devPort}</>`
      );
    })
    .catch(err => {
      console.error(ck`<red>Hapi webpack dev server failed</>${err}`);
    });
} else if (Koa) {
  const app = new Koa();
  const setup = require("./dev-koa");
  setup(app);
  app.listen(xarcOptions.webpack.devPort, err => {
    if (err) {
      console.error(ck`<red>koa webpack dev server failed</>${err}`);
    } else {
      console.log(
        ck`<green>koa webpack dev server listening on port ${xarcOptions.webpack.devPort}</>`
      );
    }
  });
} else if (express) {
  const app = express();
  const setup = require("./dev-express");
  setup(app);
  app.listen(xarcOptions.webpack.devPort, err => {
    if (err) {
      console.error(ck`<red>express webpack dev server failed</>${err}`);
    } else {
      console.log(
        ck`<green>express webpack dev server listening on port ${xarcOptions.webpack.devPort}</>`
      );
    }
  });
} else {
  console.error(
    ck(`<red>
ERROR: can't find a HTTP server to run dev-server.
Please install at least one of these dependencies:
  @xarc/fastify-server@1+, electrode-server@3+, @hapi/hapi@18+, express@4+, or koa

</red>`)
  );
}
