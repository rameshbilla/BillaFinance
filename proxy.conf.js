const PROXY_CONFIG = {
  "/api/tspdcl": {
    "target": "https://www.tgsouthernpower.org",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/api/tspdcl": ""
    },
    "logLevel": "debug",
    "onProxyReq": (proxyReq, req, res) => {
      proxyReq.setHeader('Referer', 'https://www.tgsouthernpower.org/');
      proxyReq.setHeader('Origin', 'https://www.tgsouthernpower.org');
    }
  },
  "/api/hmwssb": {
    "target": "https://www.hyderabadwater.gov.in",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/api/hmwssb": ""
    },
    "logLevel": "debug",
    "onProxyReq": (proxyReq, req, res) => {
      proxyReq.setHeader('Referer', 'https://www.hyderabadwater.gov.in/en/index.php/services/customers-services/pay-your-bill-online1');
      proxyReq.setHeader('Origin', 'https://www.hyderabadwater.gov.in');
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    }
  },
  "/api/hmwssb-erp": {
    "target": "https://erp.hyderabadwater.gov.in",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/api/hmwssb-erp": ""
    },
    "logLevel": "debug",
    "onProxyReq": (proxyReq, req, res) => {
      proxyReq.setHeader('Referer', 'https://erp.hyderabadwater.gov.in/HmwssbOnlineNew/');
      proxyReq.setHeader('Origin', 'https://erp.hyderabadwater.gov.in');
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    }
  }
};

module.exports = PROXY_CONFIG;
