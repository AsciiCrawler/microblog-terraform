resource "random_id" "default" {
  byte_length = 5
  keepers = {
    project_name = var.project_name
  }
}