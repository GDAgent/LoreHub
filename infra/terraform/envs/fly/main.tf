terraform {
  required_version = ">= 1.8.0"

  required_providers {
    fly = {
      source  = "fly-apps/fly"
      version = "~> 0.2"
    }
  }
}

module "lorehub_cloud" {
  source           = "../../modules/lorehub-cloud"
  name             = "lorehub-fly"
  region           = var.region
  api_instances    = 2
  web_instances    = 2
  worker_instances = 1
}
