# Nasdaq Stock Price Checker
This app is build using Express, Helmet, body-parser, redis npm packages and is set up for deployment to Heroku. You need to ensure that `REDIS_URL` environment variable is set up correctly that would allow connection to your database.

## Get started
```
npm --version
npm init
npm install
node server.js or npm start
```

## Heroku deploy (if not using github)
Make sure you have Heroku CLI installed. Check using `heroku --version` command

```
heroku login
heroku create
git push heroku master
heroku ps:scale web=1
heroku open
heroku logs --tail --app ancient-springs-25222
```

## Heroku Automatic Deploys
This repo is automatically deployed to heroku (from master branch). The deployed app is available at https://ancient-springs-25222.herokuapp.com/



