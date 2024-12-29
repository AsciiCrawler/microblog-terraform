variable "secret" {
  type = string
}

variable "key_data" {
  type = object({
    key  = string
    project_name = string
  })
}