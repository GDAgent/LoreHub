variable "name" {
  type = string
}

variable "region" {
  type = string
}

variable "api_instances" {
  type    = number
  default = 2
}

variable "web_instances" {
  type    = number
  default = 2
}

variable "worker_instances" {
  type    = number
  default = 1
}
