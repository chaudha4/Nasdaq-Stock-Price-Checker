# Nasdaq Stock Price Checker


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
heroku logs --tail
```

## Heroku Automatic Deploys
This repo is automatically deployed to heroku (from master branch). The deployed app is available at https://ancient-springs-25222.herokuapp.com/


