module "lambda_process_image" {
  source               = "./lambda"
  bucket_id            = module.s3.aws_s3_lambda_bucket_id
  region               = var.region
  function_folder_path = "services/processImage"
  function_name        = "processImage"
  project_name         = var.project_name
  memory_size          = 2048
  timeout              = 10
  environment_variables = {
    temp_bucket_name : module.s3_temp_images.bucket_name,
    final_bucket_name : module.s3_images.bucket_name,
    JWT_KEY : module.secretmanager.key,
    region : var.region
  }
  attach_policies = {
    temp_bucket        = module.s3_temp_images.policy_arn
    final_bucket       = module.s3_images.policy_arn
    jwt_secret_manager = module.secretmanager.policy_arm
  }
  api_gateway_integration = {
    api_id        = module.default_api_gateway.api_gatewayv2_api_id
    endpoint_path = "POST /process-image"
    execution_arn = module.default_api_gateway.api_gatewayv2_api_execution_arn
  }
}