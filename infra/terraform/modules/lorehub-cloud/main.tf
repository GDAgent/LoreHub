locals {
  deployment_summary = {
    name             = var.name
    region           = var.region
    api_instances    = var.api_instances
    web_instances    = var.web_instances
    worker_instances = var.worker_instances
  }
}
