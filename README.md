<div align="center">
  <h2><b>Adonis Jobs</b></h2>
  <p>Job queues for your AdonisJS applications</p>
</div>


## **Pre-requisites**
The `@nemoengineering/workers` package requires `@adonisjs/core >= 6.2.0`


## **Setup**

Install the package from the npm registry as follows.

```
npm i @nemoengineering/workers
# or
yarn add @nemoengineering/workers
```

Next, configure the package by running the following ace command.

```
node ace configure @nemoengineering/workers
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
      "#workers/*": ["./app/workers/*.js"]
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
    "#workers/*": "./app/workers/*.js"
  },
  ...
}
```


