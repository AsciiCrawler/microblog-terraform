terraform {
  # cloud {
  #   organization = "AsciiCrawler"
  #   workspaces {
  #     name = "asciicrawler-workspace"
  #   }
  # }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.82.2"
    }
  }
}

provider "aws" {
  region = var.region
}

// Modules
module "dynamodb" {
  source       = "./dynamodb"
  project_name = var.project_name
}

module "secretmanager" {
  source = "./secretmanager"
  secret = var.JWT_SECRET
  key_data = {
    key          = "jwt"
    project_name = var.project_name
  }
}

module "s3" {
  source       = "./s3"
  bucket_name  = "microblog-lambdas"
  project_name = var.project_name
}

module "s3_temp_images" {
  source       = "./s3"
  bucket_name  = "microblog-temp-images"
  project_name = var.project_name
}

module "s3_images" {
  source       = "./s3"
  bucket_name  = "microblog-images"
  project_name = var.project_name
}

module "cloudfront_images" {
  source               = "./cloudfront"
  bucket_arn           = module.s3_images.bucket_arn
  regional_domain_name = module.s3_images.regional_domain_name
  bucket_id            = module.s3_images.aws_s3_lambda_bucket_id
  project_name         = var.project_name
  name                 = "cloudfront-s3"
}

module "default_api_gateway" {
  source           = "./apigateway"
  api_gateway_name = "microblog-api-gateway"
  project_name     = var.project_name
}