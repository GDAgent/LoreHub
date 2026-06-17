# Hetzner Deployment

Use the Terraform environment in `infra/terraform/envs/hetzner` for the lower-cost VM-oriented LoreHub Cloud footprint.

## Workflow

1. Provide Hetzner Cloud credentials and SSH keys.
2. Apply the environment to provision the API, web, and worker nodes plus managed networking.
3. Layer the Helm chart or Compose automation on top of the provisioned hosts.

## Notes

- Hetzner is optimized for cost-sensitive self-hosted or hosted-community deployments.
- The environment assumes external object storage and a managed or separately provisioned PostgreSQL tier.
