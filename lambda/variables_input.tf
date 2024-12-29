variable "function_folder_path" {
  type = string
}

variable "function_name" {
  type = string
}

variable "project_name" {
  type = string
}

variable "bucket_id" {
  type = string
}

variable "region" {
  type = string
}

variable "environment_variables" {
  type    = map(string)
  default = {}
}

variable "memory_size" {
  type    = number
  default = 512
}

variable "timeout" {
  type = number
  default = 3
}

/* ATTACH POLICY LIST */
variable "attach_policies" {
  type = map(string)
}

/* API GATEWAY INTEGRATION */
variable "api_gateway_integration" {
  type = object({
    api_id = string
    endpoint_path = string
    execution_arn = string
  })
}