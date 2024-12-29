output "region" {
  value = var.region
}

output "cloudfront_domain_name" {
  value = module.cloudfront_images.cloudfront_domain_name
}

output "api_gateway_endpoint" {
  value = module.default_api_gateway.aws_apigatewayv2_api_endpoint
}