## Introduction

PicPic backend repo

<br>

## Project Structure

I have applied DDD (Domain Driven Design) architecture. Divided packages in Domain level and divided Domains into Layers. Basic Package structure looks like

```
.
└── app
    ├── auth
    ├── post-images
    │   ├── application
    │   ├── domain
    │   ├── external_interface
    │   └── infra_structure
    ├── posts
    │   ├── application
    │   ├── domain
    │   ├── external_interface
    │   └── infra_structure
    ├── users
    │   ├── application
    │   ├── domain
    │   ├── external_interface
    │   └── infra_structure
    └── votes
        ├── application
        ├── domain
        ├── external_interface
        └── infra_structure
```

And here is example of how each layer looks like

```
.
├── use-cases
│   ├── error.ts
│   └── service.ts
├── domain
│   ├── entities.ts
│   └── value_objects.ts
├── mappers
│   └── mappers.ts
├── controllers
│   ├── dtos.ts
│   └── controller.ts
└── repositories
    ├── orm_repository.interface.ts
    └── orm_repository.ts
```

<br>

## How to Install

```
$ git clone https://github.com/sjunhong/senior_project_picpic.git
$ cd senior_project_picpic.git
$ yarn install
```

<br>

## How to Run or Deploy

Local Environment
To run, please set up environment variables

```
PORT=
JWT_SECRET=

DB_HOST=
DB_USER=
DB_NAME=
DB_PASS=
DB_PORT=

ACCESS_KEY_ID=
SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
```

<br>

## Docker

After docker build, use Docker Container to run.
$ docker-compose -f docker-compose.prod.yml start

to stop
$ docker-compose -f docker-compose.prod.yml stop

<br>

## Git Commit

follow Conventional Commits.

```
fix: A bug fix. Correlates with PATCH in SemVer
feat: A new feature. Correlates with MINOR in SemVer
docs: Documentation only changes
style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
refactor: A code change that neither fixes a bug nor adds a feature
perf: A code change that improves performance
test: Adding missing or correcting existing tests
build: Changes that affect the build system or external dependencies (example scopes: pip, docker, npm)
ci: Changes to our CI configuration files and scripts (example scopes: GitLabCI)
for commit, do not use git commit. Instead use commitizen.
``
```
