#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import { InfrastructuresStack } from '../lib/infrastructures-stack'
import { CredentialsStack } from '../lib/credentials-stack'
import { VpcStack } from '../lib/vpc-stack'
import { RdsStack } from '../lib/rds-stack'

const app = new cdk.App()

const credentialsStackEntity = new CredentialsStack(app, 'CredentialsStack')

const vpcStackEntity = new VpcStack(app, 'VpcStack')

const rdsStackEntity = new RdsStack(app, 'RdsStack', {
  vpc: vpcStackEntity.vpc,
})

new InfrastructuresStack(app, 'InfrastructuresStack', {
  vpc: vpcStackEntity.vpc,
  dbInstance: rdsStackEntity.dbInstance,
  region: 'us-east-2',
  account:
    app.node.tryGetContext('account') ||
    process.env.CDK_INTEG_ACCOUNT ||
    process.env.CDK_DEFAULT_ACCOUNT,
  appCredentials: credentialsStackEntity.picpicCredentials.appCredentials,
  s3Credentials: credentialsStackEntity.picpicCredentials.s3Credentials,
  dbCredentials: rdsStackEntity.dbCredentials,
})
