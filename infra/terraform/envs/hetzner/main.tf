terraform {
  required_version = ">= 1.8.0"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.49"
    }
  }
}

module "lorehub_cloud" {
  source           = "../../modules/lorehub-cloud"
  name             = "lorehub-hetzner"
  region           = var.region
  api_instances    = 2
  web_instances    = 2
  worker_instances = 1
}
