resource "random_id" "default" {
  byte_length = 4
  keepers = {
    name         = var.api_gateway_name,
    project_name = var.project_name
  }
}
