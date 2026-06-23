// PM2 config for DataGame cloudflared tunnel (same pattern as kapetein-tunnel).
// App runs in Docker on localhost:3020; Vercel proxies via vercel.json rewrites.
module.exports = {
  apps: [
    {
      name: "datagame-tunnel",
      script: "/usr/local/bin/cloudflared",
      args: "tunnel --url http://localhost:3020",
      autorestart: true,
      watch: false,
      log_file: "/home/choso/datagame-mvp/datagame-tunnel.log",
      error_file: "/home/choso/datagame-mvp/datagame-tunnel.err",
    },
  ],
};
