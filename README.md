<div align="center">
  <h2><b>Adonis Jobs</b></h2>
  <p>Job queues for your AdonisJS applications</p>
</div>


## **Pre-requisites**
The `@nemoengineering/jobs` package requires `@adonisjs/core >= 6.2.0`


## **Setup**

Install the package from the npm registry as follows.

```
npm i @nemoengineering/jobs
# or
yarn add @nemoengineering/jobs
```

Next, configure the package by running the following ace command.

```
node ace configure @nemoengineering/jobs
```

And then add the path to the `tsconfig.json`

```json
{
  "extends": "@adonisjs/tsconfig/tsconfig.app.json",
  "compilerOptions": {
    "resolveJsonModule": true,
    "rootDir": "./",
    "outDir": "./build",
    "paths": {
     ...
      "#jobs/*": ["./app/jobs/*.js"]
    }
  }
}
```

and `package.json`

```json
{
  "name": "adonis-app",
  "version": "0.0.0",
  "imports": {
    ...
    "#jobs/*": "./app/jobs/*.js"
  },
  ...
}
```


