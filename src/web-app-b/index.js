require('dotenv').config();
const express = require('express');
const session = require('express-session');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const path = require('path');
const { createServer } = require('http');
const { auth, requiresAuth } = require('express-openid-connect');

const {
  checkUrl,
  APP_URL, // Public URL for this app
  API_URL, // URL for sales API
  ISSUER_BASE_URL, // Auth0 Tenant Url
  CLIENT_ID, // Auth0 Web App Client
  CLIENT_SECRET, // Auth0 Web App Client Secret
  SESSION_SECRET, // Cookie Encryption Key
  PORT,
} = require('./env-config');

const app = express();

app.use(checkUrl());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(
  auth({
    authorizationParams: {
      response_type: 'code',
    },
    secret: SESSION_SECRET,
    auth0Logout: true,
    baseURL: APP_URL,
    issuerBaseURL: ISSUER_BASE_URL,
    clientID: CLIENT_ID,
    authRequired: false,
  })
);

const sales = [
  {
    date: new Date(),
    description: 'Coding Dojo Basics.',
    value: 4000,
  },
  {
    date: new Date(),
    description: 'Coding Dojo Security Principles.',
    value: 2300,
  },

  {
    date: new Date(),
    description: 'Coding Dojo API Management.',
    value: 2000,
  },
];

app.get('/', async (req, res) => {
  res.render('home', {
    user: req.oidc && req.oidc.user,
    total: sales.reduce((accum, expense) => accum + expense.value, 0),
    count: sales.length,
  });
});

// 👇 add requiresAuth middlware to these private routes  👇

app.get('/user', requiresAuth(), async (req, res) => {
  res.render('user', {
    user: req.oidc && req.oidc.user,
    id_token: req.oidc && req.oidc.idToken,
    access_token: req.oidc && req.oidc.accessToken,
    refresh_token: req.oidc && req.oidc.refreshToken,
  });
});

app.get('/sales', requiresAuth(), async (req, res, next) => {
  res.render('sales', {
    user: req.oidc && req.oidc.user,
    sales,
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = err;

  // render the error page
  res.status(err.status || 500);
  res.render('error', {
    user: req.oidc && req.oidc.user,
  });
});

createServer(app).listen(PORT, () => {
  console.log(`WEB APP: ${APP_URL}`);
});
