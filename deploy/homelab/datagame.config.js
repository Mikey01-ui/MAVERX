// PM2 config for DataGame Cloudflare tunnel → localhost:3020
// Quick tunnel:  cloudflared tunnel --url http://localhost:3020
// Production:    run setup-cloudflare-tunnel.sh (named tunnel + omni.miltomy.com)
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
