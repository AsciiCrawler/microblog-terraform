resource "aws_apigatewayv2_api" "default" {
  name          = "${var.api_gateway_name}-${random_id.default.hex}"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins     = ["http://localhost:4200", "http://localhost:8040", "https://microblog-portfolio.asciicrawler.com"]
    allow_methods     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers     = ["content-type"]
    allow_credentials = true
  }
}

resource "aws_cloudwatch_log_group" "default" {
  name              = "/aws/${var.api_gateway_name}-${random_id.default.hex}"
  retention_in_days = 3
}

resource "aws_apigatewayv2_stage" "v1" {
  api_id      = aws_apigatewayv2_api.default.id
  name        = "v1"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.default.arn
    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      protocol                = "$context.protocol"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
      }
    )
  }
}
