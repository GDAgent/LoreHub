# Fly.io Deployment

Use the Terraform environment in `infra/terraform/envs/fly` for the first LoreHub Cloud deployment shape.

## Workflow

1. Configure Fly credentials and remote state.
2. Apply the environment to provision app containers, PostgreSQL, and Redis attachments.
3. Point the Helm values or image tags at the resulting public hostnames.

## Notes

- Fly is the lighter-weight default for the first managed cloud rollout.
- The environment is modeled to keep API, web, and worker services independently scalable.
