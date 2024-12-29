locals {
  function_name = "${var.project_name}-${var.function_name}-${random_id.default.hex}"
}

resource "aws_lambda_function" "default" {
  function_name = local.function_name

  s3_bucket = var.bucket_id
  s3_key    = aws_s3_object.register_lambda_s3_object.key

  runtime          = "nodejs22.x"
  handler          = "index.handler"
  memory_size      = var.memory_size
  timeout          = var.timeout
  source_code_hash = data.archive_file.default_file.output_base64sha256
  role             = aws_iam_role.default.arn

  environment {
    variables = var.environment_variables
  }
}
