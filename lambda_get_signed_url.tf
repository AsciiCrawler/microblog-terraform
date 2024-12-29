module "lambda_get_signed_url" {
  source               = "./lambda"
  bucket_id            = module.s3.aws_s3_lambda_bucket_id
  region               = var.region
  function_folder_path = "services/getSignedUrl"
  function_name        = "getSignedUrl"
  project_name         = var.project_name
  environment_variables = {
    region : var.region,
    JWT_KEY : module.secretmanager.key,
    bucket_name : module.s3_temp_images.bucket_name
  }
  attach_policies = {
    upload_bucket      = module.s3_temp_images.policy_arn,
    jwt_secret_manager = module.secretmanager.policy_arm
  }
  api_gateway_integration = {
    api_id        = module.default_api_gateway.api_gatewayv2_api_id
    endpoint_path = "POST /get-signed-url"
    execution_arn = module.default_api_gateway.api_gatewayv2_api_execution_arn
  }
}