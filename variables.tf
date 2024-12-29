variable "region" {
  type    = string
  default = "us-east-2"
}

variable "project_name" {
  type    = string
  default = "microblog-asciicrawler-v2"
}

/* ENVIRONMENT VARIABLES */
variable "AWS_ACCESS_KEY_ID" {
  description = "AWS_ACCESS_KEY_ID"
  type        = string
  sensitive   = true
  default     = "CHANGE_ON_DASHBOARD"
}

/* ENVIRONMENT VARIABLES */
variable "AWS_SECRET_ACCESS_KEY" {
  description = "AWS_SECRET_ACCESS_KEY"
  type        = string
  sensitive   = true
  default     = "CHANGE_ON_DASHBOARD"
}

/* ENVIRONMENT VARIABLES */
variable "JWT_SECRET" {
  description = "JWT_SECRET"
  type        = string
  sensitive   = true
  default     = "CHANGE_ON_DASHBOARD"
}