module "lambda_post_create" {
  source               = "./lambda"
  bucket_id            = module.s3.aws_s3_lambda_bucket_id
  region               = var.region
  function_folder_path = "services/post/create"
  function_name        = "services-post-create"
  project_name         = var.project_name
  environment_variables = {
    temp_bucket_name : module.s3_temp_images.bucket_name,
    final_bucket_name : module.s3_images.bucket_name,
    JWT_KEY : module.secretmanager.key,
    region : var.region,

    posts_table : module.dynamodb.aws_dynamodb_table_posts_name
    posts_global_table : module.dynamodb.aws_dynamodb_table_global_posts_name
  }
  attach_policies = {
    temp_bucket        = module.s3_temp_images.policy_arn
    final_bucket       = module.s3_images.policy_arn
    jwt_secret_manager = module.secretmanager.policy_arm,
    posts_table        = module.dynamodb.aws_iam_policy_posts_access_arn
    post_global_table  = module.dynamodb.aws_iam_policy_global_posts_access_arn
  }
  api_gateway_integration = {
    api_id        = module.default_api_gateway.api_gatewayv2_api_id
    endpoint_path = "POST /post/create"
    execution_arn = module.default_api_gateway.api_gatewayv2_api_execution_arn
  }
}

module "lambda_post_delete" {
  source               = "./lambda"
  bucket_id            = module.s3.aws_s3_lambda_bucket_id
  region               = var.region
  function_folder_path = "services/post/delete"
  function_name        = "services-post-delete"
  project_name         = var.project_name
  environment_variables = {
    temp_bucket_name : module.s3_temp_images.bucket_name,
    final_bucket_name : module.s3_images.bucket_name,
    JWT_KEY : module.secretmanager.key,
    region : var.region,

    posts_table : module.dynamodb.aws_dynamodb_table_posts_name
    posts_global_table : module.dynamodb.aws_dynamodb_table_global_posts_name
  }
  attach_policies = {
    temp_bucket        = module.s3_temp_images.policy_arn
    final_bucket       = module.s3_images.policy_arn
    jwt_secret_manager = module.secretmanager.policy_arm,
    posts_table        = module.dynamodb.aws_iam_policy_posts_access_arn
    post_global_table  = module.dynamodb.aws_iam_policy_global_posts_access_arn
  }
  api_gateway_integration = {
    api_id        = module.default_api_gateway.api_gatewayv2_api_id
    endpoint_path = "DELETE /post/delete/{uuid}"
    execution_arn = module.default_api_gateway.api_gatewayv2_api_execution_arn
  }
}

module "lambda_post_get_all" {
  source               = "./lambda"
  bucket_id            = module.s3.aws_s3_lambda_bucket_id
  region               = var.region
  function_folder_path = "services/post/getAll"
  function_name        = "services-post-getAll"
  project_name         = var.project_name
  environment_variables = {
    region : var.region,
    table_global_posts : module.dynamodb.aws_dynamodb_table_global_posts_name
    table_posts : module.dynamodb.aws_dynamodb_table_posts_name
    table_users : module.dynamodb.aws_dynamodb_table_users_name
  }
  attach_policies = {
    dynamo_global_posts = module.dynamodb.aws_iam_policy_global_posts_access_arn
    dynamo_posts        = module.dynamodb.aws_iam_policy_posts_access_arn
    dynamo_users        = module.dynamodb.aws_iam_policy_users_access_arn
  }
  api_gateway_integration = {
    api_id        = module.default_api_gateway.api_gatewayv2_api_id
    endpoint_path = "GET /post/get-all"
    execution_arn = module.default_api_gateway.api_gatewayv2_api_execution_arn
  }
}

module "lambda_post_get_all_with_user_param" {
  source               = "./lambda"
  bucket_id            = module.s3.aws_s3_lambda_bucket_id
  region               = var.region
  function_folder_path = "services/post/getAll"
  function_name        = "services-post-getAll-user"
  project_name         = var.project_name
  environment_variables = {
    region : var.region,
    table_global_posts : module.dynamodb.aws_dynamodb_table_global_posts_name
    table_posts : module.dynamodb.aws_dynamodb_table_posts_name
    table_users : module.dynamodb.aws_dynamodb_table_users_name
  }
  attach_policies = {
    dynamo_global_posts = module.dynamodb.aws_iam_policy_global_posts_access_arn
    dynamo_posts        = module.dynamodb.aws_iam_policy_posts_access_arn
    dynamo_users        = module.dynamodb.aws_iam_policy_users_access_arn
  }
  api_gateway_integration = {
    api_id        = module.default_api_gateway.api_gatewayv2_api_id
    endpoint_path = "GET /post/get-all/{user}"
    execution_arn = module.default_api_gateway.api_gatewayv2_api_execution_arn
  }
}
