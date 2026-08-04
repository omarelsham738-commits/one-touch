{
  "version": 2,
  "builds": [
    {
      "src": "process.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/process",
      "dest": "/process.js"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
