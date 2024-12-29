resource "random_id" "default" {
  byte_length = 4
  keepers = {
    function_folder_path = var.function_folder_path
  }
}