output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.my_distribution.domain_name
}