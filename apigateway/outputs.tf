output "api_gatewayv2_api_id" {
  value = aws_apigatewayv2_api.default.id
}

output "api_gatewayv2_api_execution_arn" {
  value = aws_apigatewayv2_api.default.execution_arn
}

output "aws_apigatewayv2_api_endpoint" {
  value = aws_apigatewayv2_api.default.api_endpoint
}