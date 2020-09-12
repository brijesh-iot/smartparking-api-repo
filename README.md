# SmartParking IoT APIs Repo

This is the repository for the code going to be deployed for IoT Web APIs.

#### Useful GitHub commands

```bash
git clone git@github.com:awssmartparking/edge-repo.git

git init
git add -A
git commit -m "Initial Load"
git remote add origin git@github.com-awssmartparking:awssmartparking/edge-repo.git
git push -u origin master
```

#### Note

- Make sure you provide the proper value of CoreName in smartparking-api-repo -> configuration.json (Same value provided in CloudFormation Template)
- Modify file smartparking-api-repo -> parking_nodejs -> config.json