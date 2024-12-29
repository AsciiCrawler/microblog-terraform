resource "aws_apigatewayv2_integration" "default" {
  api_id                 = var.api_gateway_integration.api_id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.default.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "post_handler" {
  api_id    = var.api_gateway_integration.api_id
  route_key = var.api_gateway_integration.endpoint_path
  target = "integrations/${aws_apigatewayv2_integration.default.id}"
}

resource "aws_lambda_permission" "api_gw" {
  action        = "lambda:InvokeFunction"
  function_name = local.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn = "${var.api_gateway_integration.execution_arn}/*/*"
}
