import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecr from '@aws-cdk/aws-ecr'
import * as ecs from '@aws-cdk/aws-ecs'
import * as rds from '@aws-cdk/aws-rds'
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns'
import * as iam from '@aws-cdk/aws-iam'
import * as codebuild from '@aws-cdk/aws-codebuild'
import * as codepipeline from '@aws-cdk/aws-codepipeline'
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions'
import { AppCredentials, S3Credentials } from './credentials-stack'
import { DbCredentials } from './rds-stack'
import { Secret } from '@aws-cdk/aws-secretsmanager'

export interface BackendStackProps extends cdk.StackProps {
  vpc: ec2.Vpc
  dbInstance: rds.DatabaseInstance
  region: any
  account: any
  appCredentials: AppCredentials
  s3Credentials: S3Credentials
  dbCredentials: DbCredentials
}

export class InfrastructuresStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: BackendStackProps) {
    super(scope, id, props)

    const clusterAdmin = new iam.Role(this, 'picpic-admin-role', {
      assumedBy: new iam.AccountRootPrincipal(),
    })

    const cluster = new ecs.Cluster(this, 'picpic-ecs-cluster', {
      vpc: props.vpc,
    })

    const logging = new ecs.AwsLogDriver({
      streamPrefix: 'picpic-ecs-logs',
    })

    const taskRole = new iam.Role(
      this,
      `picpic-ecs-taskRole-${this.stackName}`,
      {
        roleName: `ecs-taskRole-${this.stackName}`,
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      }
    )

    // ECR - repo
    const ecrRepo = ecr.Repository.fromRepositoryName(
      this,
      'picpic-backend-ecr-repo',
      'picpic-backend-ecr-repo'
    )

    // ***ECS Contructs***
    const executionRolePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
        'ecr:GetAuthorizationToken',
        'ecr:BatchCheckLayerAvailability',
        'ecr:GetDownloadUrlForLayer',
        'ecr:BatchGetImage',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'secretsmanager:GetSecretValue',
      ],
    })

    const taskDef = new ecs.FargateTaskDefinition(this, 'picpic-ecs-taskdef', {
      taskRole: taskRole,
    })

    taskDef.addToExecutionRolePolicy(executionRolePolicy)

    const container = taskDef.addContainer('picpic-app', {
      // tag: latest
      image: ecs.ContainerImage.fromEcrRepository(ecrRepo),
      secrets: {
        JWT_SECRET: ecs.Secret.fromSecretsManager(
          Secret.fromSecretPartialArn(
            this,
            '/picpic/app/jwt_secret',
            'arn:aws:secretsmanager:us-east-2:969575637420:secret:/picpic/app-wnPU16'
          ),
          'jwt_secret'
        ),
        ACCESS_KEY_ID: ecs.Secret.fromSecretsManager(
          Secret.fromSecretPartialArn(
            this,
            '/picpic/s3/access_key_id',
            'arn:aws:secretsmanager:us-east-2:969575637420:secret:/picpic/s3-YU5NwA'
          ),
          'access_key_id'
        ),
        SECRET_ACCESS_KEY: ecs.Secret.fromSecretsManager(
          Secret.fromSecretPartialArn(
            this,
            '/picpic/s3/secret_access_key',
            'arn:aws:secretsmanager:us-east-2:969575637420:secret:/picpic/s3-YU5NwA'
          ),
          'secret_access_key'
        ),
        DB_USER: ecs.Secret.fromSecretsManager(
          Secret.fromSecretPartialArn(
            this,
            'db-secrets/username',
            'arn:aws:secretsmanager:us-east-2:969575637420:secret:/db-credentials-a6HmeY'
          ),
          'username'
        ),
        DB_PASS: ecs.Secret.fromSecretsManager(
          Secret.fromSecretPartialArn(
            this,
            'db-secrets/password',
            'arn:aws:secretsmanager:us-east-2:969575637420:secret:/db-credentials-a6HmeY'
          ),
          'password'
        ),
        // JWT_SECRET: props.appCredentials.JWT_SECRET,
        // ACCESS_KEY_ID: props.s3Credentials.ACCESS_KEY_ID,
        // SECRET_ACCESS_KEY: props.s3Credentials.SECRET_ACCESS_KEY,
        // DB_USER: props.dbCredentials.DB_USER,
        // DB_PASS: props.dbCredentials.DB_PASS,
      },
      environment: {
        NODE_ENV: 'production',
        PORT: props.appCredentials.PORT,
        S3_BUCKET_NAME: props.s3Credentials.S3_BUCKET_NAME,
        DB_HOST: props.dbCredentials.DB_HOST,
        DB_PORT: props.dbCredentials.DB_PORT,
        DB_NAME: props.dbCredentials.DB_NAME,
      },
      logging,
    })

    container.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    })

    const fargateService =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        'picpic-ecs-service',
        {
          cluster: cluster,
          taskDefinition: taskDef,
          publicLoadBalancer: true,
          desiredCount: 1,
          listenerPort: 80,
        }
      )

    const scaling = fargateService.service.autoScaleTaskCount({
      maxCapacity: 2,
    })

    // ***PIPELINE CONSTRUCTS***

    const gitHubSource = codebuild.Source.gitHub({
      owner: 'sjunhong',
      repo: 'senior_project_picpic',
      webhook: true, // optional, default: true if `webhookFilteres` were provided, false otherwise
      webhookFilters: [
        codebuild.FilterGroup.inEventOf(
          codebuild.EventAction.PULL_REQUEST_MERGED
        ).andBranchIs('master'),
      ], // optional, by default all pushes and Pull Requests will trigger a build
    })

    // CODEBUILD - project
    const project = new codebuild.Project(this, 'picpic-codebuild-project', {
      projectName: `${this.stackName}`,
      source: gitHubSource,
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_2,
        privileged: true,
      },
      environmentVariables: {
        CLUSTER_NAME: {
          value: `${cluster.clusterName}`,
        },
        ECR_REPO_URI: {
          value: `${ecrRepo.repositoryUri}`,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'env',
              'export TAG=${CODEBUILD_RESOLVED_SOURCE_VERSION}',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              `docker build -t $ECR_REPO_URI:$TAG .`,
              '$(aws ecr get-login --no-include-email)',
              'docker push $ECR_REPO_URI:$TAG',
            ],
          },
          post_build: {
            commands: [
              'echo "In Post-Build Stage"',
              'printf \'[{"name":"picpic-app","imageUri":"%s"}]\' $ECR_REPO_URI:$TAG > imagedefinitions.json',
              'pwd; ls -al; cat imagedefinitions.json',
              'echo Build completed on `date`',
            ],
          },
        },
        artifacts: {
          files: ['imagedefinitions.json'],
        },
      }),
    })

    // ***PIPELINE ACTIONS***

    const sourceOutput = new codepipeline.Artifact()
    const buildOutput = new codepipeline.Artifact()

    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: 'sjunhong',
      repo: 'senior_project_picpic',
      branch: 'master',
      oauthToken: cdk.SecretValue.secretsManager('github-token'),
      output: sourceOutput,
    })

    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'CodeBuild',
      project: project,
      input: sourceOutput,
      outputs: [buildOutput], // optional
    })

    const manualApprovalAction = new codepipeline_actions.ManualApprovalAction({
      actionName: 'Approve',
    })

    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'DeployAction',
      service: fargateService.service,
      imageFile: new codepipeline.ArtifactPath(
        buildOutput,
        `imagedefinitions.json`
      ),
    })

    // PIPELINE STAGES
    new codepipeline.Pipeline(this, 'picpic-ecs-pipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction],
        },
        {
          stageName: 'Build',
          actions: [buildAction],
        },
        {
          stageName: 'Approve',
          actions: [manualApprovalAction],
        },
        {
          stageName: 'Deploy-to-ECS',
          actions: [deployAction],
        },
      ],
    })

    ecrRepo.grantPullPush(project.role!)
    project.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'ecs:DescribeCluster',
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:BatchGetImage',
          'ecr:GetDownloadUrlForLayer',
        ],
        resources: [`${cluster.clusterArn}`],
      })
    )

    //OUTPUT

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
    })
  }
}
