resource "random_id" "default" {
  byte_length = 4
  keepers = {
    bucket_name  = var.bucket_name
    project_name = var.project_name
  }
}

variable "bucket_name" {
  type = string
}

variable "project_name" {
  type = string
}
