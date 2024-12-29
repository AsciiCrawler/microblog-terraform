module "lambda_comment_create" {
  source               = "./lambda"
  bucket_id            = module.s3.aws_s3_lambda_bucket_id
  region               = var.region
  function_folder_path = "services/comment/create"
  function_name        = "services-comment-create"
  project_name         = var.project_name
  environment_variables = {
    JWT_KEY : module.secretmanager.key,
    region : var.region,
    comments_table : module.dynamodb.aws_dynamodb_table_comments_name
    global_posts_table : module.dynamodb.aws_dynamodb_table_global_posts_name
  }
  attach_policies = {
    jwt_secret_manager = module.secretmanager.policy_arm,
    post_global_table  = module.dynamodb.aws_iam_policy_global_posts_access_arn
    comments_table     = module.dynamodb.aws_iam_policy_comments_arn
  }
  api_gateway_integration = {
    api_id        = module.default_api_gateway.api_gatewayv2_api_id
    endpoint_path = "POST /comment/create"
    execution_arn = module.default_api_gateway.api_gatewayv2_api_execution_arn
  }
}

module "lambda_comment_get_all" {
  source               = "./lambda"
  bucket_id            = module.s3.aws_s3_lambda_bucket_id
  region               = var.region
  function_folder_path = "services/comment/getAll"
  function_name        = "services-comment-get-all"
  project_name         = var.project_name
  environment_variables = {
    JWT_KEY : module.secretmanager.key,
    region : var.region,
    comments_table : module.dynamodb.aws_dynamodb_table_comments_name
    users_table : module.dynamodb.aws_dynamodb_table_users_name
  }
  attach_policies = {
    jwt_secret_manager = module.secretmanager.policy_arm,
    comments_table     = module.dynamodb.aws_iam_policy_comments_arn
    dynamo_users       = module.dynamodb.aws_iam_policy_users_access_arn
  }
  api_gateway_integration = {
    api_id        = module.default_api_gateway.api_gatewayv2_api_id
    endpoint_path = "GET /comment/get-all/{uuid}"
    execution_arn = module.default_api_gateway.api_gatewayv2_api_execution_arn
  }
}

module "lambda_comment_delete" {
  source               = "./lambda"
  bucket_id            = module.s3.aws_s3_lambda_bucket_id
  region               = var.region
  function_folder_path = "services/comment/delete"
  function_name        = "services-comment-delete"
  project_name         = var.project_name
  environment_variables = {
    JWT_KEY : module.secretmanager.key,
    region : var.region,
    comments_table : module.dynamodb.aws_dynamodb_table_comments_name
  }
  attach_policies = {
    jwt_secret_manager = module.secretmanager.policy_arm,
    comments_table     = module.dynamodb.aws_iam_policy_comments_arn
  }
  api_gateway_integration = {
    api_id        = module.default_api_gateway.api_gatewayv2_api_id
    endpoint_path = "DELETE /comment/delete/{post_uuid}/{comment_uuid}"
    execution_arn = module.default_api_gateway.api_gatewayv2_api_execution_arn
  }
}
