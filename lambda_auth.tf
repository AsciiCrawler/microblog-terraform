module "lambda_auth_check" {
  source               = "./lambda"
  bucket_id            = module.s3.aws_s3_lambda_bucket_id
  region               = var.region
  function_folder_path = "services/auth/check"
  function_name        = "services-auth-check"
  project_name         = var.project_name
  environment_variables = {
    SECRET_MANAGER_REGION : var.region,
    JWT_KEY : module.secretmanager.key
    TABLE_NAME : module.dynamodb.aws_dynamodb_table_users_name
  }
  attach_policies = {
    dynamo             = module.dynamodb.aws_iam_policy_users_access_arn,
    jwt_secret_manager = module.secretmanager.policy_arm
  }
  api_gateway_integration = {
    api_id        = module.default_api_gateway.api_gatewayv2_api_id
    endpoint_path = "GET /auth/check"
    execution_arn = module.default_api_gateway.api_gatewayv2_api_execution_arn
  }
}

module "lambda_auth_edit" {
  source               = "./lambda"
  bucket_id            = module.s3.aws_s3_lambda_bucket_id
  region               = var.region
  function_folder_path = "services/auth/edit"
  function_name        = "services-auth-edit"
  project_name         = var.project_name
  environment_variables = {
    SECRET_MANAGER_REGION : var.region,
    JWT_KEY : module.secretmanager.key,

    region : var.region,
    users_table : module.dynamodb.aws_dynamodb_table_users_name,
    final_bucket_name : module.s3_images.bucket_name
  }
  attach_policies = {
    dynamo             = module.dynamodb.aws_iam_policy_users_access_arn,
    final_bucket       = module.s3_images.policy_arn
    jwt_secret_manager = module.secretmanager.policy_arm
  }
  api_gateway_integration = {
    api_id        = module.default_api_gateway.api_gatewayv2_api_id
    endpoint_path = "POST /auth/edit"
    execution_arn = module.default_api_gateway.api_gatewayv2_api_execution_arn
  }
}

module "lambda_auth_login" {
  source               = "./lambda"
  bucket_id            = module.s3.aws_s3_lambda_bucket_id
  region               = var.region
  function_folder_path = "services/auth/login"
  function_name        = "services-auth-login"
  project_name         = var.project_name
  environment_variables = {
    SECRET_MANAGER_REGION : var.region,
    JWT_KEY : module.secretmanager.key
    TABLE_NAME : module.dynamodb.aws_dynamodb_table_users_name
  }
  attach_policies = {
    dynamo             = module.dynamodb.aws_iam_policy_users_access_arn,
    jwt_secret_manager = module.secretmanager.policy_arm
  }
  api_gateway_integration = {
    api_id        = module.default_api_gateway.api_gatewayv2_api_id
    endpoint_path = "POST /auth/login"
    execution_arn = module.default_api_gateway.api_gatewayv2_api_execution_arn
  }
}

module "lambda_get_profile" {
  source               = "./lambda"
  bucket_id            = module.s3.aws_s3_lambda_bucket_id
  region               = var.region
  function_folder_path = "services/auth/profile"
  function_name        = "auth-profile"
  project_name         = var.project_name
  environment_variables = {
    region : var.region,
    table_users : module.dynamodb.aws_dynamodb_table_users_name
  }
  attach_policies = {
    dynamo = module.dynamodb.aws_iam_policy_users_access_arn
  }
  api_gateway_integration = {
    api_id        = module.default_api_gateway.api_gatewayv2_api_id
    endpoint_path = "GET /auth/profile/{user}"
    execution_arn = module.default_api_gateway.api_gatewayv2_api_execution_arn
  }
}

module "lambda_auth_register" {
  source               = "./lambda"
  bucket_id            = module.s3.aws_s3_lambda_bucket_id
  region               = var.region
  function_folder_path = "services/auth/register"
  function_name        = "services-auth-register"
  project_name         = var.project_name
  environment_variables = {
    SECRET_MANAGER_REGION : var.region,
    JWT_KEY : module.secretmanager.key
    TABLE_NAME : module.dynamodb.aws_dynamodb_table_users_name
  }
  attach_policies = {
    dynamo             = module.dynamodb.aws_iam_policy_users_access_arn,
    jwt_secret_manager = module.secretmanager.policy_arm
  }
  api_gateway_integration = {
    api_id        = module.default_api_gateway.api_gatewayv2_api_id
    endpoint_path = "POST /auth/register"
    execution_arn = module.default_api_gateway.api_gatewayv2_api_execution_arn
  }
}