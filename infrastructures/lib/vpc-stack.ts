import * as ec2 from '@aws-cdk/aws-ec2'
import * as cdk from '@aws-cdk/core'

export class VpcStack extends cdk.Stack {
  readonly vpc: ec2.Vpc

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)
    /**
     * Create a new VPC with single NAT Gateway
     */
    this.vpc = new ec2.Vpc(this, 'picpic-ecs-cdk-vpc', {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'picpic-public-subnet-1',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 20,
        },
        {
          name: 'picpic-isolated-subnet-1',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
        {
          name: 'picpic-private-subnet-1',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 28,
        },
      ],
      natGateways: 1,
      gatewayEndpoints: {
        'vpc-gateway-endpoint': {
          service: ec2.GatewayVpcEndpointAwsService.S3,
          subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_NAT }],
        },
      },
    })

    this.vpc.addInterfaceEndpoint('vpc-endpoint-ecr-docker', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
    })

    this.vpc.addInterfaceEndpoint('vpc-endpoint-ecr', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
    })

    this.vpc.addInterfaceEndpoint('vpc-endpoint-secrets-manager', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    })

    this.vpc.addInterfaceEndpoint('vpc-endpoint-cloudwatch', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
    })
  }
}
