output "lambda_arn" {
  value = aws_lambda_function.default.arn
}

output "lambda_id" {
  value = aws_lambda_function.default.id
}

output "function_name" {
  value = local.function_name
}

output "lambda_role_name" {
  value = aws_iam_role.default.name
}

output "lambda_invoke_arn" {
  value = aws_lambda_function.default.invoke_arn
}
